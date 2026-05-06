#!/usr/bin/env bash
# ec2-setup.sh — One-time bootstrap for the Hoopoe ERP EC2 Ubuntu instance.
# Run as root: sudo bash ec2-setup.sh
# Tested on: Ubuntu 22.04 LTS / 24.04 LTS

set -euo pipefail

DEPLOY_USER="ubuntu"
APP_DIR="/opt/hoopoe-erp"

info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
die()     { echo "[ERROR] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Must be run as root: sudo bash ec2-setup.sh"

# ── 1. System update ──────────────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
success "System updated."

# ── 2. Install Docker via official convenience script ─────────────────
if command -v docker &>/dev/null; then
  success "Docker already installed: $(docker --version)"
else
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  success "Docker installed: $(docker --version)"
fi

# ── 3. Add deploy user to docker group ───────────────────────────────
usermod -aG docker "${DEPLOY_USER}"
success "User '${DEPLOY_USER}' added to docker group."

# ── 4. Ensure docker-compose plugin (V2) is available ─────────────────
if docker compose version &>/dev/null 2>&1; then
  success "docker compose plugin already available: $(docker compose version)"
else
  info "Installing docker-compose-plugin..."
  apt-get install -y -qq docker-compose-plugin
  success "docker compose plugin installed: $(docker compose version)"
fi

# ── 5. Create application directory ──────────────────────────────────
info "Creating application directory ${APP_DIR}..."
mkdir -p "${APP_DIR}"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
chmod 750 "${APP_DIR}"
success "Directory ${APP_DIR} created, owned by ${DEPLOY_USER}."

# ── 6. Enable Docker to start on boot ────────────────────────────────
systemctl enable docker
systemctl start docker
success "Docker service enabled and started."

echo ""
echo "============================================="
echo "  EC2 bootstrap complete!"
echo ""
echo "  Next steps:"
echo "  1. Add all GitHub Secrets in your repo settings"
echo "  2. Push to the 'dev' branch to trigger the pipeline"
echo "  3. Verify with: docker compose -f ${APP_DIR}/docker-compose.prod.yml ps"
echo ""
echo "  NOTE: The '${DEPLOY_USER}' docker group membership"
echo "  takes effect on next login. SSH sessions from"
echo "  GitHub Actions get a fresh login shell automatically."
echo "============================================="
