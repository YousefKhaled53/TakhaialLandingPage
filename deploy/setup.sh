#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Takhaial Landing Page — Docker Swarm Setup Script
# Target: Amazon Linux 2023 (t3.small)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="https://github.com/YousefKhaled53/TakhaialLandingPage.git"
APP_DIR="/opt/takhaial"
DOMAIN="takhaial.com"
STACK_NAME="takhaial"

echo "═══════════════════════════════════════════════════"
echo "  TAKHAIAL · Docker Swarm Provisioning"
echo "═══════════════════════════════════════════════════"

# ── 1. System packages ───────────────────────────────────────
echo "[1/7] Installing system packages..."
sudo dnf update -y
sudo dnf install -y git

# ── 2. Docker Engine ─────────────────────────────────────────
echo "[2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo dnf install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user
    echo "  Docker installed. You may need to re-login for group changes."
fi
echo "  Docker $(docker --version)"

# ── 3. Initialize Docker Swarm ───────────────────────────────
echo "[3/7] Initializing Docker Swarm..."
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    # Get the private IP for swarm advertise
    PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || hostname -I | awk '{print $1}')
    sudo docker swarm init --advertise-addr "$PRIVATE_IP" 2>/dev/null || echo "  Swarm already initialized"
fi
echo "  ✓ Swarm mode active"

# ── 4. Clone repository ─────────────────────────────────────
echo "[4/7] Cloning repository..."
sudo mkdir -p "$APP_DIR"
sudo chown ec2-user:ec2-user "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo exists, pulling latest..."
    cd "$APP_DIR" && git pull
else
    git clone "$REPO_URL" "$APP_DIR"
fi

# Copy the video asset if uploaded to /tmp
if [ -f "/tmp/Digital_Eye_Animation_Generated.mp4" ]; then
    echo "  Copying video asset..."
    cp /tmp/Digital_Eye_Animation_Generated.mp4 "$APP_DIR/frontend/public/"
fi

# ── 5. Build Docker images ──────────────────────────────────
echo "[5/7] Building Docker images (this takes 3-5 minutes)..."
cd "$APP_DIR"

echo "  Building frontend image..."
sudo docker build -t takhaial-frontend:latest \
    --build-arg NEXT_PUBLIC_API_URL="https://$DOMAIN" \
    ./frontend

echo "  Building backend image..."
sudo docker build -t takhaial-backend:latest ./backend

echo "  ✓ Images built"
sudo docker images | grep takhaial

# ── 6. Deploy Swarm Stack ───────────────────────────────────
echo "[6/7] Deploying Swarm stack..."
cd "$APP_DIR"

# Remove existing stack if present
sudo docker stack rm "$STACK_NAME" 2>/dev/null || true
sleep 5

# Deploy the stack
sudo docker stack deploy -c docker-compose.yml "$STACK_NAME"

echo "  ✓ Stack deployed"
echo "  Waiting 20s for services to start..."
sleep 20

# Show service status
echo ""
echo "  Service status:"
sudo docker stack services "$STACK_NAME"

# ── 7. SSL via Certbot ──────────────────────────────────────
echo ""
echo "[7/7] SSL Setup..."
echo "  To enable SSL after DNS propagation, run:"
echo ""
echo "  # 1. Get certificate:"
echo "  sudo docker run --rm -v takhaial_certbot-etc:/etc/letsencrypt \\"
echo "    -v takhaial_certbot-var:/var/lib/letsencrypt \\"
echo "    -v takhaial_certbot-webroot:/var/www/certbot \\"
echo "    certbot/certbot certonly --webroot -w /var/www/certbot \\"
echo "    -d $DOMAIN -d www.$DOMAIN --agree-tos -m admin@$DOMAIN --non-interactive"
echo ""
echo "  # 2. Update nginx config to use SSL, then:"
echo "  sudo docker service update --force ${STACK_NAME}_nginx"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✓ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Stack:       $STACK_NAME"
echo "  Services:    sudo docker stack services $STACK_NAME"
echo "  Logs:        sudo docker service logs ${STACK_NAME}_frontend -f"
echo "               sudo docker service logs ${STACK_NAME}_backend -f"
echo "               sudo docker service logs ${STACK_NAME}_nginx -f"
echo "               sudo docker service logs ${STACK_NAME}_autoscaler -f"
echo ""
echo "  Scaling:     sudo docker service scale ${STACK_NAME}_frontend=3"
echo "               sudo docker service scale ${STACK_NAME}_backend=3"
echo ""
echo "  Auto-scaler: Monitors CPU every 30s"
echo "               Scale up  > 70% CPU → max 5 replicas"
echo "               Scale down < 20% CPU → min 1 replica"
echo ""
echo "  Site:        http://$DOMAIN (SSL pending)"
echo "═══════════════════════════════════════════════════"
