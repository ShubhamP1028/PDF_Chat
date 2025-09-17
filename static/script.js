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
const newSessionBtn = document.getElementById('newSessionBtn');
const newSessionInput = document.getElementById('newSessionInput');
const apiKeyBtn = document.getElementById('apiKeyBtn');
const apiKeyModal = document.getElementById('apiKeyModal');
const closeModal = document.getElementById('closeModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKey = document.getElementById('saveApiKey');
const cancelApiKey = document.getElementById('cancelApiKey');

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
newSessionBtn.addEventListener('click', () => newSessionInput.click());
newSessionInput.addEventListener('change', handleNewSession);
apiKeyBtn.addEventListener('click', () => showApiKeyModal());
saveApiKey.addEventListener('click', handleSaveApiKey);

// Prevent modal from being closed by clicking outside or escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && apiKeyModal.style.display === 'block') {
        e.preventDefault();
        e.stopPropagation();
    }
});

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

// Removed handleAddDocument function as requested

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
            
            // Create response container (removed confidence)
            let responseHtml = `
                <div class="answer">${sanitizedHtml}</div>
            `;
            
            // Add page number and filename if available
            if (data.page_number) {
                const sourceText = data.filename && data.filename !== 'Unknown' ? 
                    `📄 Source: ${data.filename} - Page ${data.page_number}` : 
                    `📄 Source: Page ${data.page_number}`;
                responseHtml += `<div class="source-page">${sourceText}</div>`;
            }
            
            // Debug: Log source information
            console.log('Response source info:', {
                filename: data.filename,
                page_number: data.page_number,
                all_filenames: data.metadata?.all_filenames,
                current_documents: currentDocuments
            });
            
            // Show warning if filename doesn't match current documents
            if (data.filename !== 'Unknown' && currentDocuments.length > 0 && !currentDocuments.includes(data.filename)) {
                console.warn('WARNING: Source filename does not match current session documents!', {
                    source_filename: data.filename,
                    current_documents: currentDocuments
                });
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

// Show API key modal with blur effect
function showApiKeyModal() {
    apiKeyModal.style.display = 'block';
    document.body.classList.add('modal-open');
    apiKeyInput.focus();
}

// Hide API key modal and remove blur effect
function hideApiKeyModal() {
    apiKeyModal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Handle API key management
function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter a valid API key');
        return;
    }
    
    fetch('/set_api_key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideApiKeyModal();
            apiKeyInput.value = '';
            addMessage('✅ API key set successfully! You can now upload documents.', 'bot');
        } else {
            alert('Error setting API key: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error setting API key: ' + error.message);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show API key modal on first load with blur effect
    showApiKeyModal();
    
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
                // Hide API key modal if session is active
                hideApiKeyModal();
            }
        })
        .catch(error => {
            console.log('No existing session found');
        });
});