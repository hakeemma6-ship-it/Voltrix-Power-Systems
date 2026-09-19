#!/bin/bash
# Voltrix Let's Encrypt SSL Automated Renewal Script
# Scheduled in crontab: 0 3 * * * /app/infrastructure/renew-certs.sh
set -e

echo "[ Running Certbot SSL renewal check at $(date) ]"

# Renew certificates
certbot renew --non-interactive --agree-tos

# Reload proxy configuration to bind new certificates without downtime
if nginx -t; then
    echo "Reloading Nginx service..."
    systemctl reload nginx
else
    echo "Error: Nginx configuration test failed, skipping reload."
    exit 1
fi

echo "[ SSL Certificate check complete. ]"
