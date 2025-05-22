#!/bin/bash

# Exit on error
set -e

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt install -y docker.io docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Please log out and log back in for Docker group changes to take effect"
    exit 1
fi

# Create project directory if it doesn't exist
echo "Setting up project directory..."
sudo mkdir -p /var/www/web
sudo chown -R $USER:$USER /var/www/web

# Copy project files
echo "Copying project files..."
cp -r ./* /var/www/web/

# Set up environment variables
echo "Setting up environment variables..."
cat > /var/www/web/backend/.env << EOL
DEBUG=False
SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_HOSTS=pussco.com,www.pussco.com,62.72.0.185,localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
STATIC_URL=/static/
MEDIA_URL=/media/
CSRF_TRUSTED_ORIGINS=https://pussco.com,https://www.pussco.com
EOL

# Set up SSL certificates
echo "Setting up SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx

# Create nginx directories
echo "Setting up nginx directories..."
sudo mkdir -p /var/www/web/nginx/ssl
sudo mkdir -p /var/www/web/nginx/conf.d

# Set proper permissions
echo "Setting permissions..."
sudo chown -R $USER:$USER /var/www/web
sudo chmod -R 755 /var/www/web

# Build and start containers
echo "Building and starting containers..."
cd /var/www/web
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Set up SSL
echo "Setting up SSL certificates..."
sudo certbot certonly --standalone -d pussco.com -d www.pussco.com

# Copy certificates
echo "Copying SSL certificates..."
sudo cp -r /etc/letsencrypt/live/pussco.com /var/www/web/nginx/ssl/
sudo cp -r /etc/letsencrypt/archive/pussco.com /var/www/web/nginx/ssl/

# Set up automatic renewal
echo "Setting up SSL renewal..."
sudo bash -c 'cat > /etc/cron.d/certbot-renew << EOL
0 0 * * * root certbot renew --quiet --post-hook "docker-compose -f /var/www/web/docker-compose.yml restart nginx"
EOL'

# Set up firewall
echo "Setting up firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# Create backup script
echo "Setting up backup script..."
cat > /var/www/web/backup.sh << EOL
#!/bin/bash
BACKUP_DIR="/var/www/web/backups"
DATE=\$(date +%Y-%m-%d_%H-%M-%S)
mkdir -p \$BACKUP_DIR

# Backup database
cp /var/www/web/backend/db.sqlite3 \$BACKUP_DIR/db_\$DATE.sqlite3

# Backup media files
tar -czf \$BACKUP_DIR/media_\$DATE.tar.gz /var/www/web/backend/media

# Keep only last 7 days of backups
find \$BACKUP_DIR -type f -mtime +7 -delete
EOL

chmod +x /var/www/web/backup.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 0 * * * /var/www/web/backup.sh") | crontab -

echo "Deployment completed successfully!"
echo "Please check the logs with: docker-compose logs -f" 