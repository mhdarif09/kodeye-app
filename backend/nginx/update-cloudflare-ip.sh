#!/bin/sh
# Update Cloudflare IP ranges for Nginx
# Run this script periodically via cron to keep IPs current
# curl -s https://www.cloudflare.com/ips-v4 > /etc/nginx/cloudflare-ip.conf

set -e

CF_IP_FILE="/etc/nginx/cloudflare-ip.conf"

# IPv4
curl -s https://www.cloudflare.com/ips-v4 | while read -r ip; do
  echo "allow $ip;" >> "$CF_IP_FILE"
done

# IPv6
curl -s https://www.cloudflare.com/ips-v6 | while read -r ip; do
  echo "allow $ip;" >> "$CF_IP_FILE"
done

echo "# Cloudflare IPs updated on $(date)" >> "$CF_IP_FILE"

nginx -s reload
