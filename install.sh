#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── helpers ────────────────────────────────────────────────────────────────────
info()    { echo -e "\e[34m[INFO]\e[0m  $*"; }
success() { echo -e "\e[32m[OK]\e[0m    $*"; }
warn()    { echo -e "\e[33m[WARN]\e[0m  $*"; }
die()     { echo -e "\e[31m[ERROR]\e[0m $*"; exit 1; }

require_sudo() {
  if [ "$EUID" -ne 0 ]; then
    warn "Some steps require sudo — you may be prompted for your password."
  fi
}

# ── Docker ─────────────────────────────────────────────────────────────────────
install_docker() {
  if command -v docker &>/dev/null; then
    success "Docker already installed ($(docker --version))"
    return
  fi
  info "Installing Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  success "Docker installed. Log out and back in for group changes to take effect."
}

# ── Java 17 ────────────────────────────────────────────────────────────────────
install_java() {
  if java -version 2>&1 | grep -q "17\|21"; then
    success "Java already installed ($(java -version 2>&1 | head -1))"
    return
  fi
  info "Installing Java 17..."
  sudo apt-get update -qq
  sudo apt-get install -y openjdk-17-jdk
  success "Java 17 installed."
}

# ── Maven ──────────────────────────────────────────────────────────────────────
install_maven() {
  if command -v mvn &>/dev/null; then
    success "Maven already installed ($(mvn -v | head -1))"
    return
  fi
  info "Installing Maven..."
  sudo apt-get update -qq
  sudo apt-get install -y maven
  success "Maven installed."
}

# ── Node.js 20 (via NodeSource) ────────────────────────────────────────────────
install_node() {
  if command -v node &>/dev/null; then
    success "Node.js already installed ($(node --version))"
    return
  fi
  info "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  success "Node.js installed ($(node --version))."
}

# ── Project dependencies ────────────────────────────────────────────────────────
install_project_deps() {
  info "Resolving backend Maven dependencies..."
  cd "$PROJECT_DIR/backend"
  mvn dependency:resolve -q
  success "Backend dependencies ready."

  info "Installing frontend npm dependencies..."
  cd "$PROJECT_DIR/frontend"
  npm install
  success "Frontend dependencies ready."
}

# ── Main ───────────────────────────────────────────────────────────────────────
require_sudo
install_docker
install_java
install_maven
install_node
install_project_deps

echo ""
success "All done! Run ./start.sh to start the project."
