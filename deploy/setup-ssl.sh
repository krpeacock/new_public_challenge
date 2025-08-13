#!/bin/bash

# Setup SSL certificates for moderation.peacock.dev
# This script should be run on the server

set -e

DOMAIN="moderation.peacock.dev"
EMAIL="your-email@example.com"  # Replace with your email

echo "Setting up SSL certificates for $DOMAIN..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot
fi

# Create SSL directory
mkdir -p ssl

# Stop nginx temporarily to free up port 80
echo "Stopping nginx to free up port 80..."
docker-compose stop nginx || true

# Get certificate using standalone mode
echo "Obtaining SSL certificate..."
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Copy certificates to the ssl directory
echo "Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem

# Set proper permissions
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

echo "SSL certificates set up successfully!"
echo "You can now start the services with: docker-compose up -d"

# Optional: Set up auto-renewal
echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/new_public/deploy/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/new_public/deploy/ssl/key.pem && docker-compose restart nginx") | crontab -

echo "Auto-renewal configured. Certificates will be renewed automatically."
