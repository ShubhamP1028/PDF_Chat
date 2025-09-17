# 🚀 PDF Chat Application - Free Deployment Guide

## 🆓 **Free Deployment Options**

### 1. **Oracle Cloud Always Free** (Recommended)
- **2 ARM VMs** with 1GB RAM each
- **Completely free forever**
- **No credit card required**

#### Steps:
1. **Sign up** at [cloud.oracle.com](https://cloud.oracle.com)
2. **Create Always Free Instance**
3. **Choose Ubuntu 20.04/22.04**
4. **SSH into your instance**
5. **Run the deployment script**

### 2. **Google Cloud Free Tier**
- **$300 credit** for 90 days
- **Always free e2-micro** (1GB RAM)
- **Good for testing**

### 3. **AWS Free Tier**
- **12 months free** for new accounts
- **t2.micro instance** (1GB RAM)

## 🛠️ **Quick Deployment Steps**

### Step 1: Get a Free Server
1. **Oracle Cloud** (recommended)
2. **Google Cloud** 
3. **AWS Free Tier**

### Step 2: Deploy Your Application

```bash
# 1. SSH into your server
ssh username@your-server-ip

# 2. Clone your repository
git clone https://github.com/yourusername/PDF_Chat.git
cd PDF_Chat

# 3. Make deployment script executable
chmod +x deploy.sh

# 4. Run deployment script
./deploy.sh
```

### Step 3: Configure Domain (Optional)
1. **Buy a domain** from Namecheap, GoDaddy, etc.
2. **Point DNS** to your server IP
3. **Update Nginx config** with your domain

## 🔧 **Manual Deployment (Alternative)**

If the script doesn't work, follow these steps:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y python3 python3-pip python3-venv nginx gcc g++ curl

# 3. Create app directory
sudo mkdir -p /var/www/pdfchat
sudo chown $USER:$USER /var/www/pdfchat
cd /var/www/pdfchat

# 4. Copy your application files
# (Copy all your project files here)

# 5. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 6. Install Python packages
pip install -r requirements.txt

# 7. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/pdfchat
sudo ln -s /etc/nginx/sites-available/pdfchat /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 8. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 9. Create systemd service
sudo nano /etc/systemd/system/pdfchat.service
# (Add the service configuration)

# 10. Start your application
sudo systemctl daemon-reload
sudo systemctl start pdfchat
sudo systemctl enable pdfchat
```

## 🌐 **Access Your Application**

- **Local access:** `http://your-server-ip`
- **With domain:** `http://yourdomain.com`

## 📊 **Monitoring & Management**

```bash
# Check application status
sudo systemctl status pdfchat

# View application logs
sudo journalctl -u pdfchat -f

# Restart application
sudo systemctl restart pdfchat

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 **Security Considerations**

1. **Configure firewall:**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Set up SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

3. **Update regularly:**
```bash
sudo apt update && sudo apt upgrade -y
```

## 💰 **Cost Breakdown**

- **Oracle Cloud:** $0/month (Always Free)
- **Google Cloud:** $0/month (with free tier)
- **AWS:** $0/month (first 12 months)
- **Domain:** $10-15/year (optional)

## 🆘 **Troubleshooting**

### Common Issues:
1. **Port 5000 not accessible:** Check firewall settings
2. **Application not starting:** Check logs with `sudo journalctl -u pdfchat -f`
3. **Nginx not working:** Check config with `sudo nginx -t`
4. **Memory issues:** Use swap file or upgrade instance

### Getting Help:
- Check application logs
- Verify all dependencies are installed
- Ensure ports are open
- Check system resources

## 🎯 **Next Steps**

1. **Deploy to Oracle Cloud** (recommended)
2. **Set up domain** (optional)
3. **Configure SSL** (for production)
4. **Monitor performance**
5. **Share with users!**

Your PDF Chat application will be accessible to anyone on the internet! 🌐
