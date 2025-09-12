// Handle file upload
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Ensure only single file is processed
    if (e.target.file.files.length > 1) {
        alert('Please select only one file at a time.');
        e.target.file.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', e.target.file.files[0]);
    
    const statusDiv = document.getElementById('upload-status');
    statusDiv.textContent = 'Processing your PDF...';
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            statusDiv.textContent = 'PDF processed successfully!';
            document.getElementById('current-filename').textContent = data.filename;
            document.getElementById('upload-section').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            
            // Update documents list
            updateDocumentsList(data.documents || [data.filename]);
        } else {
            statusDiv.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        statusDiv.textContent = 'Error uploading file';
    }
});

// Handle chat messages
document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    const chatMessages = document.getElementById('chat-messages');
    
    if (!message) return;
    
    // Add user message to chat
    chatMessages.innerHTML += `<div class="message user-message">${message}</div>`;
    input.value = '';
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        if (data.answer) {
            // Render markdown with DOMPurify sanitization
            const markdownHtml = marked.parse(data.answer);
            const sanitizedHtml = DOMPurify.sanitize(markdownHtml);
            
            // Create response container
            let responseHtml = `
                <div class="message bot-message">
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
            
            responseHtml += `</div>`;
            chatMessages.innerHTML += responseHtml;
        } else {
            chatMessages.innerHTML += `<div class="message error-message">Error: ${data.error}</div>`;
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (error) {
        chatMessages.innerHTML += `<div class="message error-message">Network error</div>`;
    }
});

// Function to update documents list
function updateDocumentsList(documents) {
    const documentsList = document.getElementById('current-documents');
    if (documents && documents.length > 0) {
        documentsList.innerHTML = `
            <h4>Current Documents (${documents.length}):</h4>
            ${documents.map((doc, index) => 
                `<span class="document-item">${doc}</span>`
            ).join('')}
        `;
    } else {
        documentsList.innerHTML = '';
    }
}

// Add document functionality
document.getElementById('add-document-btn').addEventListener('click', () => {
    document.getElementById('add-document-input').click();
});

document.getElementById('add-document-input').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        // Ensure only single file is processed
        if (e.target.files.length > 1) {
            alert('Please select only one file at a time.');
            e.target.value = '';
            return;
        }
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        
        try {
            const response = await fetch('/add_document', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update documents list
                updateDocumentsList(data.documents);
                
                // Show success message
                const chatMessages = document.getElementById('chat-messages');
                chatMessages.innerHTML += `<div class="message bot-message">✅ Document "${data.filename}" added successfully!</div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                alert('Error adding document: ' + data.error);
            }
        } catch (error) {
            alert('Error adding document');
        }
        
        // Reset file input
        e.target.value = '';
    }
});

// New session functionality
document.getElementById('new-session-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to start a new session? This will clear the current chat and documents.')) {
        document.getElementById('new-session-input').click();
    }
});

document.getElementById('new-session-input').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        // Ensure only single file is processed
        if (e.target.files.length > 1) {
            alert('Please select only one file at a time.');
            e.target.value = '';
            return;
        }
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear chat messages
                document.getElementById('chat-messages').innerHTML = '';
                
                // Update UI
                document.getElementById('current-filename').textContent = data.filename;
                updateDocumentsList(data.documents || [data.filename]);
                
                // Show success message
                const chatMessages = document.getElementById('chat-messages');
                chatMessages.innerHTML += `<div class="message bot-message">🆕 New session started with "${data.filename}"!</div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                alert('Error starting new session: ' + data.error);
            }
        } catch (error) {
            alert('Error starting new session');
        }
        
        // Reset file input
        e.target.value = '';
    }
});