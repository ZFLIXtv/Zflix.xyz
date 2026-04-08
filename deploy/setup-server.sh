#!/bin/bash
# =============================================================================
# ZFlix - VPS Initial Setup Script
# =============================================================================
# Run as root on a fresh Ubuntu 22.04 / Debian 12 VPS.
# Usage: bash setup-server.sh
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration — edit before running
# -----------------------------------------------------------------------------
DEPLOY_USER="deploy"
APP_DIR="/opt/zflix"
BACKUP_DIR="${APP_DIR}/backups"
CADDY_CONFIG_DIR="/etc/caddy"
LOGROTATE_CONF="/etc/logrotate.d/zflix"
BACKUP_CRON="0 3 * * *"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
section() { echo ""; echo "==> $*"; }

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "[ERROR] This script must be run as root." >&2
    exit 1
  fi
}

require_root

# -----------------------------------------------------------------------------
# 1. System update
# -----------------------------------------------------------------------------
section "Updating system packages"
apt-get update -y
apt-get upgrade -y
apt-get autoremove -y
success "System updated."

# -----------------------------------------------------------------------------
# 2. Install base utilities
# -----------------------------------------------------------------------------
section "Installing base utilities"
apt-get install -y \
  curl \
  wget \
  gnupg \
  ca-certificates \
  lsb-release \
  apt-transport-https \
  software-properties-common \
  ufw \
  fail2ban \
  logrotate \
  unzip \
  git \
  jq
success "Base utilities installed."

# -----------------------------------------------------------------------------
# 3. Create deploy user with sudo privileges
# -----------------------------------------------------------------------------
section "Creating deploy user: ${DEPLOY_USER}"
if id "${DEPLOY_USER}" &>/dev/null; then
  info "User '${DEPLOY_USER}' already exists — skipping creation."
else
  useradd -m -s /bin/bash -G sudo "${DEPLOY_USER}"
  success "User '${DEPLOY_USER}' created."
fi

# Create .ssh directory for the deploy user
DEPLOY_HOME="$(getent passwd "${DEPLOY_USER}" | cut -d: -f6)"
mkdir -p "${DEPLOY_HOME}/.ssh"
chmod 700 "${DEPLOY_HOME}/.ssh"
touch "${DEPLOY_HOME}/.ssh/authorized_keys"
chmod 600 "${DEPLOY_HOME}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_HOME}/.ssh"
success "SSH directory configured for '${DEPLOY_USER}'."

info "ACTION REQUIRED: Add your deploy public key to ${DEPLOY_HOME}/.ssh/authorized_keys"

# -----------------------------------------------------------------------------
# 4. SSH hardening
# -----------------------------------------------------------------------------
section "Hardening SSH configuration"
SSHD_CONFIG="/etc/ssh/sshd_config"
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.bak.$(date +%Y%m%d)"

# Apply hardening settings
declare -A SSH_SETTINGS=(
  ["PermitRootLogin"]="no"
  ["PasswordAuthentication"]="no"
  ["PubkeyAuthentication"]="yes"
  ["AuthorizedKeysFile"]=".ssh/authorized_keys"
  ["X11Forwarding"]="no"
  ["AllowAgentForwarding"]="no"
  ["AllowTcpForwarding"]="no"
  ["MaxAuthTries"]="3"
  ["ClientAliveInterval"]="300"
  ["ClientAliveCountMax"]="2"
)

for KEY in "${!SSH_SETTINGS[@]}"; do
  VALUE="${SSH_SETTINGS[$KEY]}"
  if grep -qE "^#?${KEY}" "${SSHD_CONFIG}"; then
    sed -i "s|^#\?${KEY}.*|${KEY} ${VALUE}|" "${SSHD_CONFIG}"
  else
    echo "${KEY} ${VALUE}" >> "${SSHD_CONFIG}"
  fi
done

systemctl reload sshd
success "SSH hardened."

# -----------------------------------------------------------------------------
# 5. UFW Firewall
# -----------------------------------------------------------------------------
section "Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
ufw status verbose
success "UFW configured."

# -----------------------------------------------------------------------------
# 6. Fail2ban
# -----------------------------------------------------------------------------
section "Configuring fail2ban"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban
success "fail2ban configured and running."

# -----------------------------------------------------------------------------
# 7. Docker
# -----------------------------------------------------------------------------
section "Installing Docker"
if command -v docker &>/dev/null; then
  info "Docker already installed: $(docker --version)"
else
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  success "Docker installed: $(docker --version)"
fi

# Add deploy user to docker group
usermod -aG docker "${DEPLOY_USER}"
success "User '${DEPLOY_USER}' added to docker group."

# -----------------------------------------------------------------------------
# 8. Caddy
# -----------------------------------------------------------------------------
section "Installing Caddy"
if command -v caddy &>/dev/null; then
  info "Caddy already installed: $(caddy version)"
else
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list

  apt-get update -y
  apt-get install -y caddy
  systemctl enable caddy
  success "Caddy installed: $(caddy version)"
fi

# Create Caddy log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy
success "Caddy log directory created."

# -----------------------------------------------------------------------------
# 9. Application directories
# -----------------------------------------------------------------------------
section "Creating application directories"
mkdir -p "${APP_DIR}"
mkdir -p "${BACKUP_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
success "Directories created: ${APP_DIR}, ${BACKUP_DIR}"

# -----------------------------------------------------------------------------
# 10. Logrotate for application logs
# -----------------------------------------------------------------------------
section "Configuring logrotate"
cat > "${LOGROTATE_CONF}" <<EOF
/var/log/caddy/zflix.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload caddy > /dev/null 2>&1 || true
    endscript
}

${BACKUP_DIR}/*.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
}
EOF
success "logrotate configured at ${LOGROTATE_CONF}"

# -----------------------------------------------------------------------------
# 11. Cron jobs
# -----------------------------------------------------------------------------
section "Configuring cron jobs"
# Backup cron for deploy user
CRON_CMD="${BACKUP_CRON} ${APP_DIR}/deploy/backup-db.sh >> ${BACKUP_DIR}/backup.log 2>&1"
# Install cron job if not already present
(crontab -u "${DEPLOY_USER}" -l 2>/dev/null | grep -qF "backup-db.sh") \
  || (crontab -u "${DEPLOY_USER}" -l 2>/dev/null; echo "${CRON_CMD}") \
    | crontab -u "${DEPLOY_USER}" -
success "Daily backup cron installed for user '${DEPLOY_USER}' at 03:00."

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ZFlix VPS Setup Complete"
echo "============================================================"
echo ""
echo "  Next steps:"
echo "  1. Add your deploy SSH public key to:"
echo "       ${DEPLOY_HOME}/.ssh/authorized_keys"
echo ""
echo "  2. Copy your Caddyfile to ${CADDY_CONFIG_DIR}/Caddyfile"
echo "     then run: systemctl reload caddy"
echo ""
echo "  3. Copy docker-compose.yml and .env to ${APP_DIR}/"
echo ""
echo "  4. Log in as '${DEPLOY_USER}' and run:"
echo "       cd ${APP_DIR} && docker compose up -d"
echo ""
echo "  5. Set GITHUB_USERNAME in ${APP_DIR}/.env"
echo ""
echo "  IMPORTANT: Test SSH login as '${DEPLOY_USER}' BEFORE"
echo "  closing this session (PasswordAuthentication is now OFF)."
echo ""
