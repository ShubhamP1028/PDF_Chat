#!/bin/bash

# PDF Chat Application - Oracle Cloud Always Free Deployment
# Run this script on your Oracle Cloud instance

echo "🚀 Starting PDF Chat Application Deployment on Oracle Cloud..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv nginx

# Install system dependencies for ML packages
sudo apt install -y gcc g++ curl git

# Create application directory
sudo mkdir -p /var/www/pdfchat
sudo chown $USER:$USER /var/www/pdfchat
cd /var/www/pdfchat

# Clone your repository (replace with your actual repo URL)
echo "📥 Cloning repository..."
git clone https://github.com/ShubhamP1028/PDF_Chat.git .

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy Nginx configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/pdfchat > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # Increase client body size for file uploads
    client_max_body_size 16M;
    
    # Proxy to Flask application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /static/ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/pdfchat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create systemd service for your app
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/pdfchat.service > /dev/null <<EOF
[Unit]
Description=PDF Chat Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/pdfchat
Environment=PATH=/var/www/pdfchat/venv/bin
Environment=PYTHONPATH=/var/www/pdfchat
ExecStart=/var/www/pdfchat/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start and enable the service
sudo systemctl daemon-reload
sudo systemctl start pdfchat
sudo systemctl enable pdfchat

# Wait a moment for the service to start
sleep 5

# Check status
echo "📊 Checking service status..."
sudo systemctl status pdfchat --no-pager

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your application is accessible at: http://$SERVER_IP"
echo "📊 Check logs with: sudo journalctl -u pdfchat -f"
echo "🔄 Restart app with: sudo systemctl restart pdfchat"
echo "🛑 Stop app with: sudo systemctl stop pdfchat"
echo ""
echo "🔧 Useful commands:"
echo "  - View app logs: sudo journalctl -u pdfchat -f"
echo "  - Restart app: sudo systemctl restart pdfchat"
echo "  - Check status: sudo systemctl status pdfchat"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🎉 Your PDF Chat application is now live and accessible to everyone!"
