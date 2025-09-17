from flask import Flask, render_template, request, jsonify, session
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI
import logging
import threading
import time
import shutil
from datetime import datetime, timedelta

# Load environment variables (for Gemini API key)
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Needed for session

# Configuration
app.config['UPLOAD_FOLDER'] = './data'
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize global variables (for simplicity, better to use Redis in production)
qa_chain = None
current_vector_db = None
current_documents = []  # Store list of current documents
session_api_keys = {}  # Store API keys per session

# Check for required environment variables
def check_environment():
    """Check if required environment variables are set."""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key or api_key == 'your_google_api_key_here':
        logger.warning("GOOGLE_API_KEY not set. Please set it in your .env file.")
        return False
    return True

def get_session_api_key():
    """Get API key for current session."""
    session_id = session.get('session_id')
    if session_id and session_id in session_api_keys:
        return session_api_keys[session_id]
    return os.getenv('GOOGLE_API_KEY')

def cleanup_old_files():
    """Clean up old uploads and vector stores every 2 hours."""
    while True:
        try:
            # Clean up files older than 24 hours
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(hours=24)
            
            # Clean up data directory
            data_dir = app.config['UPLOAD_FOLDER']
            if os.path.exists(data_dir):
                for filename in os.listdir(data_dir):
                    filepath = os.path.join(data_dir, filename)
                    if os.path.isfile(filepath):
                        file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
                        if file_time < cutoff_time:
                            os.remove(filepath)
                            logger.info(f"Cleaned up old file: {filename}")
            
            # Clean up old vector stores
            vectorstores_dir = './vectorstores'
            if os.path.exists(vectorstores_dir):
                for session_dir in os.listdir(vectorstores_dir):
                    session_path = os.path.join(vectorstores_dir, session_dir)
                    if os.path.isdir(session_path):
                        dir_time = datetime.fromtimestamp(os.path.getmtime(session_path))
                        if dir_time < cutoff_time:
                            shutil.rmtree(session_path)
                            logger.info(f"Cleaned up old vector store: {session_dir}")
            
            logger.info("Cleanup completed successfully")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
        
        # Wait 2 hours before next cleanup
        time.sleep(2 * 60 * 60)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def process_document(filepath, filename, is_new_session=True):
    """Process a PDF document and return chunks and vector store."""
    global current_vector_db, current_documents
    
    # Load and split the PDF
    loader = PyPDFLoader(filepath)
    documents = loader.load()
    
    if not documents:
        raise ValueError('Could not extract text from PDF. The file might be corrupted or password-protected.')
    
    # Add metadata to documents before splitting
    for i, doc in enumerate(documents):
        # Extract page number from source
        page_number = i + 1
        doc.metadata['page_number'] = page_number
        doc.metadata['snippet'] = doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
        doc.metadata['filename'] = filename  # Add filename to metadata
        doc.metadata['session_id'] = session.get('session_id', 'unknown')  # Add session ID
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_documents(documents)
    
    # Preserve metadata in chunks
    for chunk in chunks:
        if 'page_number' not in chunk.metadata:
            chunk.metadata['page_number'] = 1  # Default page number
        if 'snippet' not in chunk.metadata:
            chunk.metadata['snippet'] = chunk.page_content[:200] + "..." if len(chunk.page_content) > 200 else chunk.page_content
        if 'filename' not in chunk.metadata:
            chunk.metadata['filename'] = filename
        if 'session_id' not in chunk.metadata:
            chunk.metadata['session_id'] = session.get('session_id', 'unknown')
    
    # Create or update vector store
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    # Get session ID for vector store directory
    session_id = session.get('session_id', str(int(time.time())))
    vector_store_path = f"./vectorstores/session_{session_id}"
    
    if is_new_session or current_vector_db is None:
        # Clear any existing vector store for this session
        if os.path.exists(vector_store_path):
            shutil.rmtree(vector_store_path)
            logger.info(f"Cleared existing vector store for session {session_id}")
        
        # Create new vector store
        current_vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=vector_store_path
        )
        current_documents = [filename]
        logger.info(f"Created new vector store for session {session_id} with document: {filename}")
    else:
        # Add to existing vector store
        current_vector_db.add_documents(chunks)
        current_documents.append(filename)
        logger.info(f"Added document {filename} to existing vector store for session {session_id}")
    
    current_vector_db.persist()
    
    return chunks, current_vector_db

@app.route('/')
def index():
    """Render the main page with upload form."""
    # Generate session ID if not exists
    if 'session_id' not in session:
        session['session_id'] = str(int(time.time()))
    return render_template('index.html')

@app.route('/set_api_key', methods=['POST'])
def set_api_key():
    """Set API key for current session."""
    data = request.get_json()
    api_key = data.get('api_key', '').strip()
    
    if not api_key:
        return jsonify({'error': 'API key is required'}), 400
    
    session_id = session.get('session_id')
    if session_id:
        session_api_keys[session_id] = api_key
        logger.info(f"API key set for session {session_id}")
        return jsonify({'success': True, 'message': 'API key set successfully'})
    
    return jsonify({'error': 'Session not found'}), 400

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle PDF upload and processing (new session)."""
    global qa_chain, current_vector_db, current_documents
    
    # Get API key for this session
    api_key = get_session_api_key()
    if not api_key or api_key == 'your_google_api_key_here':
        return jsonify({'error': 'Please set your Gemini API key first.'}), 400
    
    # Clear any existing session data for a fresh start
    qa_chain = None
    current_vector_db = None
    current_documents = []
    logger.info(f"Starting fresh session for user: {session.get('session_id', 'unknown')}")
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            logger.info(f"Processing PDF (new session): {filename}")
            
            # Process document (new session)
            chunks, vector_db = process_document(filepath, filename, is_new_session=True)
            
            # Create QA chain with session API key
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            
            # Create retriever with better search configuration
            retriever = vector_db.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}  # Get more documents for better context
            )
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True
            )
            
            # Store filename in session
            session['current_file'] = filename
            session['current_documents'] = current_documents
            logger.info(f"Successfully processed PDF: {filename}")
            return jsonify({
                'success': True, 
                'filename': filename,
                'documents': current_documents,
                'is_new_session': True
            })
            
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Please upload a PDF file.'}), 400

# Removed add_document endpoint as requested

@app.route('/get_documents', methods=['GET'])
def get_documents():
    """Get list of current documents."""
    return jsonify({
        'documents': current_documents,
        'total_documents': len(current_documents)
    })

@app.route('/clear', methods=['POST'])
def clear_chat():
    """Clear chat history and session data."""
    global qa_chain, current_vector_db, current_documents
    
    # Clear global variables
    qa_chain = None
    current_vector_db = None
    current_documents = []
    
    # Clear session data
    session.pop('current_file', None)
    session.pop('current_documents', None)
    
    logger.info(f"Cleared session data for session {session.get('session_id', 'unknown')}")
    return jsonify({'success': True, 'message': 'Chat and session cleared'})

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages."""
    global qa_chain
    
    if not qa_chain:
        return jsonify({'error': 'Please upload a PDF first'}), 400
    
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        logger.info(f"Processing chat message: {user_message[:50]}...")
        result = qa_chain.invoke({"query": user_message})
        
        # Extract source documents
        source_documents = result.get('source_documents', [])
        page_numbers = set()  # Use set to get unique page numbers
        filenames = set()  # Track all filenames from source documents
        current_session_id = session.get('session_id', 'unknown')
        
        logger.info(f"Found {len(source_documents)} source documents for session {current_session_id}")
        
        # Filter source documents to only include those from current session
        current_session_docs = []
        for doc in source_documents:
            doc_session_id = doc.metadata.get('session_id', 'unknown')
            if doc_session_id == current_session_id:
                current_session_docs.append(doc)
                # Extract page number
                page_number = doc.metadata.get('page_number', 1)
                page_numbers.add(page_number)
                
                # Extract filename and log for debugging
                filename = doc.metadata.get('filename', 'Unknown')
                filenames.add(filename)
                logger.info(f"Current session source doc - Page: {page_number}, Filename: {filename}")
            else:
                logger.warning(f"Filtered out document from different session: {doc_session_id} vs {current_session_id}")
        
        # Use only current session documents
        source_documents = current_session_docs
        
        # Convert set to sorted list for consistent ordering
        unique_pages = sorted(list(page_numbers))
        
        # Get the most relevant filename from current session documents
        source_filename = 'Unknown'
        if source_documents:
            source_filename = source_documents[0].metadata.get('filename', 'Unknown')
        elif current_documents:
            source_filename = current_documents[0]  # Fallback to current session documents
        
        logger.info(f"Selected source filename: {source_filename} from {len(source_documents)} current session documents")
        
        # Create structured response (removed confidence)
        response_data = {
            'answer': result['result'],
            'page_number': unique_pages[0] if unique_pages else 1,  # Return only the first page
            'filename': source_filename,
            'metadata': {
                'total_pages': len(unique_pages),
                'query': user_message,
                'all_filenames': list(filenames)  # Debug info
            }
        }
        
        logger.info("Chat response generated successfully")
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({'error': f'Error processing your question: {str(e)}'}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs('./vectorstores', exist_ok=True)
    
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
    cleanup_thread.start()
    
    # Get port from environment variable
    port = int(os.environ.get('PORT', 5000))
    
    # Run the application
    app.run(host='0.0.0.0', port=port, debug=False)