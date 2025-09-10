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

@app.route('/')
def index():
    """Render the main page with upload form."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle PDF upload and processing."""
    global qa_chain
    
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
            logger.info(f"Processing PDF: {filename}")
            
            # 1. Load and split the PDF
            loader = PyPDFLoader(filepath)
            documents = loader.load()
            
            if not documents:
                return jsonify({'error': 'Could not extract text from PDF. The file might be corrupted or password-protected.'}), 400
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = text_splitter.split_documents(documents)
            
            logger.info(f"Created {len(chunks)} text chunks")
            
            # 2. Create vector store
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            
            # Create a unique namespace for this document
            vectorstore_path = f"./vectorstores/{os.path.splitext(filename)[0]}"
            vector_db = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=vectorstore_path
            )
            vector_db.persist()
            
            # 3. Create QA chain
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=False
            )
            
            # Store filename in session
            session['current_file'] = filename
            logger.info(f"Successfully processed PDF: {filename}")
            return jsonify({'success': True, 'filename': filename})
            
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Please upload a PDF file.'}), 400

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
        logger.info("Chat response generated successfully")
        return jsonify({'response': result['result']})
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({'error': f'Error processing your question: {str(e)}'}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs('./vectorstores', exist_ok=True)
    app.run(debug=True)