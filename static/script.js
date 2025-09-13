// PDF Chat Application - Professional Template Integration
// DOM elements
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadArea = document.getElementById('uploadArea');
const uploadedPdf = document.getElementById('uploadedPdf');
const pdfFileName = document.getElementById('pdfFileName');
const pdfUploadTime = document.getElementById('pdfUploadTime');
const currentPdfName = document.getElementById('currentPdfName');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const clearChatBtn = document.getElementById('clearChatBtn');
const documentControls = document.getElementById('documentControls');
const documentsList = document.getElementById('documentsList');
const documentsContainer = document.getElementById('documentsContainer');
const addDocumentBtn = document.getElementById('addDocumentBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const addDocumentInput = document.getElementById('addDocumentInput');
const newSessionInput = document.getElementById('newSessionInput');

// State management
let currentDocuments = [];
let isSessionActive = false;

// Event listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
clearChatBtn.addEventListener('click', clearChat);
addDocumentBtn.addEventListener('click', () => addDocumentInput.click());
newSessionBtn.addEventListener('click', () => newSessionInput.click());
addDocumentInput.addEventListener('change', handleAddDocument);
newSessionInput.addEventListener('change', handleNewSession);

// Upload area drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#4299e1';
    uploadArea.style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#4a5568';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#4a5568';
    uploadArea.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length) {
        // Ensure only single file is processed
        if (e.dataTransfer.files.length > 1) {
            alert('Please select only one file at a time.');
            return;
        }
        fileInput.files = e.dataTransfer.files;
        handleFileUpload();
    }
});

// Handle file upload (new session)
function handleFileUpload() {
    if (!fileInput.files.length) return;
    
    // Ensure only single file is processed
    if (fileInput.files.length > 1) {
        alert('Please select only one file at a time.');
        fileInput.value = '';
        return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Show loading state
    const uploadText = uploadArea.querySelector('p');
    const originalText = uploadText.innerHTML;
    uploadText.innerHTML = '<div class="loading"></div> Uploading...';
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI with uploaded file info
            pdfFileName.textContent = file.name;
            pdfUploadTime.textContent = `Uploaded just now`;
            uploadedPdf.style.display = 'flex';
            currentPdfName.textContent = file.name;
            
            // Update documents list
            currentDocuments = data.documents || [file.name];
            updateDocumentsList();
            
            // Show document controls
            documentControls.style.display = 'flex';
            documentsList.style.display = 'block';
            
            // Enable chat input
            messageInput.disabled = false;
            messageInput.placeholder = "Ask something about your PDF...";
            isSessionActive = true;
            
            // Add success message
            addMessage('PDF uploaded successfully! You can now ask questions about this document.', 'bot');
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        alert('Error uploading file: ' + error.message);
    })
    .finally(() => {
        uploadText.innerHTML = originalText;
    });
}

// Handle add document
function handleAddDocument(e) {
    if (e.target.files.length > 0) {
        // Ensure only single file is processed
        if (e.target.files.length > 1) {
            alert('Please select only one file at a time.');
            e.target.value = '';
            return;
        }
        
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            e.target.value = '';
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Show loading in add button
        const originalText = addDocumentBtn.innerHTML;
        addDocumentBtn.innerHTML = '<div class="loading"></div> Adding...';
        addDocumentBtn.disabled = true;
        
        fetch('/add_document', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update documents list
                currentDocuments = data.documents;
                updateDocumentsList();
                
                // Show success message
                addMessage(`✅ Document "${data.filename}" added successfully!`, 'bot');
            } else {
                throw new Error(data.error || 'Failed to add document');
            }
        })
        .catch(error => {
            alert('Error adding document: ' + error.message);
        })
        .finally(() => {
            addDocumentBtn.innerHTML = originalText;
            addDocumentBtn.disabled = false;
            e.target.value = '';
        });
    }
}

// Handle new session
function handleNewSession(e) {
    if (e.target.files.length > 0) {
        // Ensure only single file is processed
        if (e.target.files.length > 1) {
            alert('Please select only one file at a time.');
            e.target.value = '';
            return;
        }
        
        if (confirm('Are you sure you want to start a new session? This will clear the current chat and documents.')) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file');
                e.target.value = '';
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Show loading in new session button
            const originalText = newSessionBtn.innerHTML;
            newSessionBtn.innerHTML = '<div class="loading"></div> Starting...';
            newSessionBtn.disabled = true;
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear chat messages
                    while (chatMessages.children.length > 1) {
                        chatMessages.removeChild(chatMessages.lastChild);
                    }
                    
                    // Update UI
                    pdfFileName.textContent = file.name;
                    pdfUploadTime.textContent = `Uploaded just now`;
                    currentPdfName.textContent = file.name;
                    
                    // Update documents list
                    currentDocuments = data.documents || [file.name];
                    updateDocumentsList();
                    
                    // Show success message
                    addMessage(`🆕 New session started with "${file.name}"!`, 'bot');
                } else {
                    throw new Error(data.error || 'Failed to start new session');
                }
            })
            .catch(error => {
                alert('Error starting new session: ' + error.message);
            })
            .finally(() => {
                newSessionBtn.innerHTML = originalText;
                newSessionBtn.disabled = false;
                e.target.value = '';
            });
        } else {
            e.target.value = '';
        }
    }
}

// Send chat message
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Show loading indicator in chat
    const loadingMsg = addMessage('Thinking...', 'bot', true);
    
    // Send question to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        // Remove loading indicator
        chatMessages.removeChild(loadingMsg);
        
        if (data.answer) {
            // Render markdown with DOMPurify sanitization
            const markdownHtml = marked.parse(data.answer);
            const sanitizedHtml = DOMPurify.sanitize(markdownHtml);
            
            // Create response container
            let responseHtml = `
                <div class="answer">${sanitizedHtml}</div>
                <div class="confidence">Confidence: ${(data.confidence * 100).toFixed(1)}%</div>
            `;
            
            // Add page number and filename if available
            if (data.page_number) {
                const sourceText = data.filename ? 
                    `Source: ${data.filename} - Page ${data.page_number}` : 
                    `Source: Page ${data.page_number}`;
                responseHtml += `<div class="source-page">${sourceText}</div>`;
            }
            
            // Add bot response
            addMessage(responseHtml, 'bot', false, true);
        } else {
            addMessage('Error: ' + (data.error || 'Failed to get response'), 'bot');
        }
    })
    .catch(error => {
        chatMessages.removeChild(loadingMsg);
        addMessage('Error: Could not connect to the server', 'bot');
    });
}

// Add message to chat
function addMessage(text, sender, isLoading = false, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');
    
    const icon = document.createElement('i');
    icon.classList.add('fas', sender === 'user' ? 'fa-user' : 'fa-robot');
    
    const strong = document.createElement('strong');
    strong.textContent = sender === 'user' ? 'You' : 'PDF Assistant';
    
    messageInfo.appendChild(icon);
    messageInfo.appendChild(strong);
    
    const paragraph = document.createElement('div');
    
    if (isLoading) {
        const loadingSpan = document.createElement('span');
        loadingSpan.classList.add('loading');
        paragraph.appendChild(loadingSpan);
        paragraph.appendChild(document.createTextNode(' ' + text));
    } else if (isHtml) {
        paragraph.innerHTML = text;
    } else {
        paragraph.textContent = text;
    }
    
    messageContent.appendChild(messageInfo);
    messageContent.appendChild(paragraph);
    
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Update documents list
function updateDocumentsList() {
    if (currentDocuments && currentDocuments.length > 0) {
        documentsContainer.innerHTML = currentDocuments.map((doc, index) => 
            `<div class="document-item">
                <i class="fas fa-file-pdf"></i>
                <span>${doc}</span>
            </div>`
        ).join('');
        documentsList.style.display = 'block';
    } else {
        documentsList.style.display = 'none';
    }
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        // Clear frontend chat
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Add welcome message back
        addMessage('Chat cleared. You can continue asking questions about your PDF.', 'bot');
        
        // Call backend to clear chat history if needed
        fetch('/clear', {
            method: 'POST'
        })
        .catch(error => {
            console.error('Error clearing chat history:', error);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if there are any existing documents on page load
    fetch('/get_documents')
        .then(response => response.json())
        .then(data => {
            if (data.documents && data.documents.length > 0) {
                currentDocuments = data.documents;
                updateDocumentsList();
                documentControls.style.display = 'flex';
                documentsList.style.display = 'block';
                messageInput.disabled = false;
                isSessionActive = true;
            }
        })
        .catch(error => {
            console.log('No existing session found');
        });
});