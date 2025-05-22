# Pussco.com Deployment Guide

This guide provides step-by-step instructions for deploying the Pussco.com application to a VPS.

## System Requirements

- Ubuntu/Debian-based VPS
- Domain name (pussco.com)
- VPS IP: 62.72.0.185
- Root or sudo access

## Initial VPS Setup

1. Update system and install required packages:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

2. Create necessary directories:
```bash
mkdir -p /home/alanp/web/nginx/ssl
mkdir -p /home/alanp/web/nginx/conf.d
```

## DNS Configuration

Configure your domain's DNS records at your domain registrar:

```
Type: A
Name: @
Value: 62.72.0.185

Type: A
Name: www
Value: 62.72.0.185
```

## Project Setup

1. Transfer project files to VPS:
```bash
# On your local machine
scp -r /home/alanp/web/* user@62.72.0.185:/home/alanp/web/
```

2. Create backend environment file:
```bash
# Create .env file in backend directory
cat > /home/alanp/web/backend/.env << EOL
DEBUG=False
SECRET_KEY=django-insecure-$(openssl rand -hex 32)
ALLOWED_HOSTS=pussco.com,www.pussco.com,62.72.0.185,localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
STATIC_URL=/static/
MEDIA_URL=/media/
CSRF_TRUSTED_ORIGINS=https://pussco.com,https://www.pussco.com
EOL
```

## SSL Certificate Setup

1. Stop nginx container:
```bash
cd /home/alanp/web
docker-compose stop nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot certonly --standalone -d pussco.com -d www.pussco.com
```

3. Copy certificates:
```bash
sudo cp -r /etc/letsencrypt/live/pussco.com /var/www/web/nginx/ssl/
sudo cp -r /etc/letsencrypt/archive/pussco.com /var/www/web/nginx/ssl/
```

4. Start nginx:
```bash
docker-compose start nginx
```

## Automatic SSL Renewal

Create a renewal script:
```bash
# Create renewal script
sudo nano /etc/cron.d/certbot-renew

# Add this content:
0 0 * * * root certbot renew --quiet --post-hook "docker-compose -f /home/alanp/web/docker-compose.yml restart nginx"
```

## Firewall Configuration

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Backup Setup

1. Create backup script:
```bash
# Create backup script
sudo nano /home/alanp/web/backup.sh

# Add this content:
#!/bin/bash
BACKUP_DIR="/home/alanp/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mkdir -p $BACKUP_DIR

# Backup database
cp /home/alanp/web/backend/db.sqlite3 $BACKUP_DIR/db_$DATE.sqlite3

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /home/alanp/web/backend/media

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

2. Make script executable and add to crontab:
```bash
chmod +x /home/alanp/web/backup.sh
crontab -e
# Add this line:
0 0 * * * /home/alanp/web/backup.sh
```

## Starting the Application

1. Start all services:
```bash
cd /home/alanp/web
docker-compose up -d
```

2. Monitor the application:
```bash
# View logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart services if needed
docker-compose restart
```

## Accessing the Application

The application will be available at:
- https://pussco.com
- https://www.pussco.com

## Maintenance Commands

```bash
# View logs
docker-compose logs -f

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Rebuild and start services
docker-compose up -d --build
```

## Troubleshooting

1. If SSL certificate renewal fails:
```bash
sudo certbot renew --force-renewal
```

2. If nginx fails to start:
```bash
docker-compose logs nginx
```

3. If backend fails to start:
```bash
docker-compose logs backend
```

4. If frontend fails to start:
```bash
docker-compose logs frontend
```

## Security Notes

1. Keep your system updated:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Regularly check Docker logs for suspicious activity:
```bash
docker-compose logs | grep -i "error"
```

3. Monitor system resources:
```bash
docker stats
```

## Backup and Restore

To restore from a backup:
```bash
# Restore database
cp /home/alanp/backups/db_[DATE].sqlite3 /home/alanp/web/backend/db.sqlite3

# Restore media files
tar -xzf /home/alanp/backups/media_[DATE].tar.gz -C /home/alanp/web/backend/
```

## Support

For any issues or questions, please contact the system administrator.