// Handle file upload
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
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
        
        if (data.response) {
            chatMessages.innerHTML += `<div class="message bot-message">${data.response}</div>`;
        } else {
            chatMessages.innerHTML += `<div class="message error-message">Error: ${data.error}</div>`;
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (error) {
        chatMessages.innerHTML += `<div class="message error-message">Network error</div>`;
    }
});