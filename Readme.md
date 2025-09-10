# PDF Chat Application

A Flask-based web application that allows you to upload PDF documents and chat with them using Google's Gemini AI. The application uses LangChain for document processing and ChromaDB for vector storage.

## Features

- Upload PDF documents
- Chat with your PDF using natural language
- Beautiful, responsive UI
- Vector-based document search
- Powered by Google Gemini AI

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
GOOGLE_API_KEY=your_actual_api_key_here
FLASK_ENV=development
```

### 4. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Usage

1. Open your browser and go to `http://localhost:5000`
2. Upload a PDF file using the upload form
3. Wait for the PDF to be processed (this may take a few moments)
4. Start chatting with your PDF by asking questions about its content

## Technical Details

- **Backend**: Flask
- **AI Model**: Google Gemini 1.5 Flash
- **Vector Database**: ChromaDB
- **Document Processing**: LangChain
- **Embeddings**: HuggingFace sentence-transformers

## File Structure

```
PDF_Chat/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (create this)
├── static/
│   ├── style.css      # CSS styles
│   └── script.js      # Frontend JavaScript
├── templates/
│   └── index.html     # Main HTML template
├── data/              # Uploaded PDF files (created automatically)
└── vectorstores/      # Vector database storage (created automatically)
```

## Troubleshooting

- **API Key Error**: Make sure you've set the `GOOGLE_API_KEY` in your `.env` file
- **PDF Processing Error**: Ensure the PDF is not password-protected and contains extractable text
- **Memory Issues**: Large PDFs may require more memory. Consider using smaller chunk sizes in the code

## License

This project is for educational purposes.