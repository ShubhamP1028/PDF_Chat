# 🚀 Oracle Cloud Always Free - Complete Setup Guide

## 📋 **Step-by-Step Instructions**

### **Step 1: Create Oracle Cloud Account**
1. Go to [cloud.oracle.com](https://cloud.oracle.com)
2. Click "Start for Free"
3. Fill in your details
4. **No credit card required!**
5. Verify your email

### **Step 2: Create Always Free Instance**
1. **Login** to Oracle Cloud Console
2. **Navigate to:** Compute → Instances
3. **Click:** "Create Instance"
4. **Configure:**
   - **Name:** `pdfchat-server`
   - **Image:** Ubuntu 22.04 LTS
   - **Shape:** VM.Standard.A1.Flex (ARM-based)
   - **OCPU Count:** 1
   - **Memory:** 6 GB
   - **Boot Volume:** 50 GB
   - **SSH Keys:** Generate new key pair

### **Step 3: Configure Security Rules**
1. **Go to:** Networking → Virtual Cloud Networks
2. **Click** on your VCN
3. **Go to:** Security Lists → Default Security List
4. **Add Ingress Rules:**
   ```
   Source: 0.0.0.0/0, Port: 22 (SSH)
   Source: 0.0.0.0/0, Port: 80 (HTTP)
   Source: 0.0.0.0/0, Port: 443 (HTTPS)
   ```

### **Step 4: Connect to Your Instance**
```bash
# Download your private key from Oracle Cloud
# Make it executable
chmod 400 your-private-key.pem

# Connect to your instance
ssh -i your-private-key.pem ubuntu@YOUR_PUBLIC_IP
```

### **Step 5: Deploy Your Application**

```bash
# 1. Download the deployment script
wget https://raw.githubusercontent.com/ShubhamP1028/PDF_Chat/main/oracle-deploy.sh

# 2. Make it executable
chmod +x oracle-deploy.sh

# 3. Run the deployment
./oracle-deploy.sh
```

### **Step 6: Access Your Application**
- **URL:** `http://YOUR_PUBLIC_IP`
- **Your app is now live!** 🎉

## 🔧 **Manual Deployment (Alternative)**

If the script doesn't work, follow these steps:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y python3 python3-pip python3-venv nginx gcc g++ curl git

# 3. Clone your repository
git clone https://github.com/ShubhamP1028/PDF_Chat.git
cd PDF_Chat

# 4. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 5. Install Python packages
pip install -r requirements.txt

# 6. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/pdfchat
sudo ln -s /etc/nginx/sites-available/pdfchat /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 7. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 8. Create systemd service
sudo nano /etc/systemd/system/pdfchat.service
# (Add the service configuration from oracle-deploy.sh)

# 9. Start your application
sudo systemctl daemon-reload
sudo systemctl start pdfchat
sudo systemctl enable pdfchat
```

## 📊 **Monitoring Your Application**

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

## 🔒 **Security Setup**

```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Set up SSL (optional)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 💰 **Cost: $0/month!**

- **Server:** Free (Always Free Tier)
- **Storage:** Free (50GB)
- **Bandwidth:** Free (10TB/month)
- **Domain:** $10-15/year (optional)

## 🆘 **Troubleshooting**

### Common Issues:
1. **Can't connect via SSH:** Check security rules
2. **App not starting:** Check logs with `sudo journalctl -u pdfchat -f`
3. **Nginx not working:** Check config with `sudo nginx -t`
4. **Port not accessible:** Check firewall and security rules

### Getting Help:
- Check application logs
- Verify all dependencies are installed
- Ensure security rules are correct
- Check system resources

## 🎯 **Next Steps**

1. **Deploy your app** using the script
2. **Test the application** in your browser
3. **Set up a domain** (optional)
4. **Configure SSL** (optional)
5. **Share with users!**

Your PDF Chat application will be accessible to anyone on the internet! 🌐
