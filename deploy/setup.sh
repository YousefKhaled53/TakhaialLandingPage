#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Takhaial Landing Page — Server Setup Script
# Target: Amazon Linux 2023 (t3.small)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="https://github.com/YousefKhaled53/TakhaialLandingPage.git"
APP_DIR="/opt/takhaial"
DOMAIN="takhaial.com"

echo "═══════════════════════════════════════════════════"
echo "  TAKHAIAL · Server Provisioning"
echo "═══════════════════════════════════════════════════"

# ── 1. System packages ───────────────────────────────────────
echo "[1/8] Installing system packages..."
sudo dnf update -y
sudo dnf install -y git nginx python3.11 python3.11-pip gcc

# ── 2. Node.js 20 via NodeSource ─────────────────────────────
echo "[2/8] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi
echo "Node $(node --version) · npm $(npm --version)"

# ── 3. Clone repository ─────────────────────────────────────
echo "[3/8] Cloning repository..."
sudo mkdir -p "$APP_DIR"
sudo chown ec2-user:ec2-user "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo already exists, pulling latest..."
    cd "$APP_DIR" && git pull
else
    git clone "$REPO_URL" "$APP_DIR"
fi

# ── 4. Copy the video asset if present locally ───────────────
# The .mp4 is gitignored; if you uploaded it to /tmp, copy it in
if [ -f "/tmp/Digital_Eye_Animation_Generated.mp4" ]; then
    echo "[3b] Copying video asset..."
    cp /tmp/Digital_Eye_Animation_Generated.mp4 "$APP_DIR/frontend/public/"
fi

# ── 5. Backend setup ────────────────────────────────────────
echo "[4/8] Setting up backend..."
cd "$APP_DIR/backend"
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# ── 6. Frontend setup & build ────────────────────────────────
echo "[5/8] Building frontend (this may take 2-3 minutes)..."
cd "$APP_DIR/frontend"
npm ci
NEXT_PUBLIC_API_URL="https://$DOMAIN" npm run build

# Copy standalone + static + public for production
cp -r .next/standalone/ "$APP_DIR/frontend/standalone/"
cp -r .next/static "$APP_DIR/frontend/standalone/.next/static"
cp -r public "$APP_DIR/frontend/standalone/public"

# ── 7. Systemd services ─────────────────────────────────────
echo "[6/8] Creating systemd services..."

# Backend service
sudo tee /etc/systemd/system/takhaial-backend.service > /dev/null <<'EOF'
[Unit]
Description=Takhaial FastAPI Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/takhaial/backend
Environment="CORS_ORIGINS=https://takhaial.com,https://www.takhaial.com"
ExecStart=/opt/takhaial/backend/.venv/bin/gunicorn main:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile - \
    --error-logfile -
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
sudo tee /etc/systemd/system/takhaial-frontend.service > /dev/null <<EOF
[Unit]
Description=Takhaial Next.js Frontend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/takhaial/frontend/standalone
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="HOSTNAME=0.0.0.0"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable takhaial-backend takhaial-frontend
sudo systemctl start takhaial-backend takhaial-frontend

# ── 8. Nginx configuration ──────────────────────────────────
echo "[7/8] Configuring Nginx..."
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/takhaial.conf

# Remove default server block if it exists
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# ── 9. SSL via Certbot (optional — run after DNS propagation)
echo "[8/8] Installing Certbot..."
sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || {
    sudo pip3 install certbot certbot-nginx
}

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✓ SETUP COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Backend:   http://localhost:8000/health"
echo "  Frontend:  http://localhost:3000"
echo "  Nginx:     http://$DOMAIN (after DNS)"
echo ""
echo "  To enable SSL (after DNS points to this server):"
echo "    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  Service management:"
echo "    sudo systemctl status takhaial-backend"
echo "    sudo systemctl status takhaial-frontend"
echo "    sudo journalctl -u takhaial-backend -f"
echo "    sudo journalctl -u takhaial-frontend -f"
echo "═══════════════════════════════════════════════════"
