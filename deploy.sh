#!/bin/bash
set -e

# Umiri.me deployment script for Hetzner VPS
# Run from /opt/umiri/ on the server

DOMAIN="umiri.me"
PICKME_DIR="/opt/pickme"
UMIRI_DIR="/opt/umiri"

echo "=== Umiri.me Deployment ==="

# 1. Clean up Docker to free disk space
echo "[1/6] Cleaning up Docker..."
docker system prune -f

# 2. Copy nginx config to pickme nginx conf.d
echo "[2/6] Installing nginx config..."
cp "$UMIRI_DIR/nginx/umiri.conf" "$PICKME_DIR/infrastructure/nginx/conf.d/umiri.conf"

# 3. Check if volume mount exists in pickme docker-compose.yml
if ! grep -q "umiri.conf" "$PICKME_DIR/docker-compose.yml"; then
    echo ""
    echo "WARNING: Add this volume mount to $PICKME_DIR/docker-compose.yml under nginx service volumes:"
    echo "  - ./infrastructure/nginx/conf.d/umiri.conf:/etc/nginx/conf.d/umiri.conf:ro"
    echo ""
    echo "Then run: cd $PICKME_DIR && docker compose up -d nginx"
    echo ""
fi

# 4. Get SSL certificate (first time only)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "[3/6] Getting SSL certificate for $DOMAIN..."
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/lib/docker/volumes/pickme_certbot-webroot/_data:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "rile86s@gmail.com" \
        --agree-tos \
        --no-eff-email
    echo "SSL certificate obtained!"
else
    echo "[3/6] SSL certificate already exists, skipping..."
fi

# 5. Pull and start umiri containers
echo "[4/6] Pulling and starting umiri containers..."
cd "$UMIRI_DIR"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 6. Restart pickme-nginx to load new config
echo "[5/6] Restarting nginx..."
cd "$PICKME_DIR"
docker compose restart nginx

# 7. Verify
echo "[6/6] Verifying..."
sleep 3
docker ps --filter "name=umiri" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Deployment complete! ==="
echo "Site: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  docker logs umiri-backend -f     # Backend logs"
echo "  docker logs umiri-frontend -f    # Frontend logs"
echo "  cd $UMIRI_DIR && docker compose -f docker-compose.prod.yml restart  # Restart"
