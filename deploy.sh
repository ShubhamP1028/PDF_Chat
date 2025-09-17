#!/bin/bash

# PDF Chat Application Deployment Script
# For Ubuntu/Debian systems

echo "🚀 Starting PDF Chat Application Deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv nginx

# Install system dependencies for ML packages
sudo apt install -y gcc g++ curl

# Create application directory
sudo mkdir -p /var/www/pdfchat
sudo chown $USER:$USER /var/www/pdfchat
cd /var/www/pdfchat

# Clone or copy your application
# git clone https://github.com/yourusername/PDF_Chat.git .
# OR copy your files here

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/pdfchat
sudo ln -s /etc/nginx/sites-available/pdfchat /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create systemd service for your app
sudo tee /etc/systemd/system/pdfchat.service > /dev/null <<EOF
[Unit]
Description=PDF Chat Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/pdfchat
Environment=PATH=/var/www/pdfchat/venv/bin
ExecStart=/var/www/pdfchat/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start and enable the service
sudo systemctl daemon-reload
sudo systemctl start pdfchat
sudo systemctl enable pdfchat

# Check status
sudo systemctl status pdfchat

echo "✅ Deployment completed!"
echo "🌐 Your application should be accessible at: http://your-server-ip"
echo "📊 Check logs with: sudo journalctl -u pdfchat -f"
echo "🔄 Restart app with: sudo systemctl restart pdfchat"
