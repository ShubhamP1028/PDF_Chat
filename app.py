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

# Check for required environment variables
def check_environment():
    """Check if required environment variables are set."""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key or api_key == 'your_google_api_key_here':
        logger.warning("GOOGLE_API_KEY not set. Please set it in your .env file.")
        return False
    return True

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
    
    # Create or update vector store
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    if is_new_session or current_vector_db is None:
        # Create new vector store
        current_vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=f"./vectorstores/session_{len(current_documents)}"
        )
        current_documents = [filename]
    else:
        # Add to existing vector store
        current_vector_db.add_documents(chunks)
        current_documents.append(filename)
    
    current_vector_db.persist()
    
    return chunks, current_vector_db

@app.route('/')
def index():
    """Render the main page with upload form."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle PDF upload and processing (new session)."""
    global qa_chain, current_vector_db, current_documents
    
    # Check if API key is configured
    if not check_environment():
        return jsonify({'error': 'Google API key not configured. Please set GOOGLE_API_KEY in your .env file.'}), 500
    
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
            
            # Create QA chain
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
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

@app.route('/add_document', methods=['POST'])
def add_document():
    """Add a document to the current session."""
    global qa_chain, current_vector_db, current_documents
    
    # Check if API key is configured
    if not check_environment():
        return jsonify({'error': 'Google API key not configured. Please set GOOGLE_API_KEY in your .env file.'}), 500
    
    if not qa_chain:
        return jsonify({'error': 'Please start a session first by uploading a document'}), 400
    
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
            logger.info(f"Adding document to current session: {filename}")
            
            # Process document (add to existing session)
            chunks, vector_db = process_document(filepath, filename, is_new_session=False)
            
            # Update QA chain with new vector store
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=current_vector_db.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            
            # Update session
            session['current_documents'] = current_documents
            logger.info(f"Successfully added document: {filename}")
            return jsonify({
                'success': True, 
                'filename': filename,
                'documents': current_documents,
                'is_new_session': False
            })
            
        except Exception as e:
            logger.error(f"Error adding document {filename}: {str(e)}")
            return jsonify({'error': f'Failed to add document: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Please upload a PDF file.'}), 400

@app.route('/get_documents', methods=['GET'])
def get_documents():
    """Get list of current documents."""
    return jsonify({
        'documents': current_documents,
        'total_documents': len(current_documents)
    })

@app.route('/clear', methods=['POST'])
def clear_chat():
    """Clear chat history (frontend only)."""
    # For now, just return success - the frontend handles clearing
    # In a more advanced implementation, you might want to clear backend state
    return jsonify({'success': True, 'message': 'Chat cleared'})

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
        
        # Extract source documents and calculate confidence
        source_documents = result.get('source_documents', [])
        page_numbers = set()  # Use set to get unique page numbers
        confidence_scores = []
        
        for doc in source_documents:
            # Extract page number
            page_number = doc.metadata.get('page_number', 1)
            page_numbers.add(page_number)
            
            # Calculate confidence based on similarity score if available
            if hasattr(doc, 'score') and doc.score is not None:
                # Normalize similarity score to 0-1 range
                confidence = max(0, min(1, 1 - doc.score))
                confidence_scores.append(confidence)
        
        # Convert set to sorted list for consistent ordering
        unique_pages = sorted(list(page_numbers))
        
        # Calculate average confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.8
        
        # Get filename from first source document if available
        source_filename = source_documents[0].metadata.get('filename', 'Unknown') if source_documents else 'Unknown'
        
        # Create structured response
        response_data = {
            'answer': result['result'],
            'page_number': unique_pages[0] if unique_pages else 1,  # Return only the first page
            'filename': source_filename,
            'confidence': round(avg_confidence, 2),
            'metadata': {
                'total_pages': len(unique_pages),
                'query': user_message
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
    app.run(debug=True)