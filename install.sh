#!/bin/bash
# Qiao installer for a fresh Amazon Linux 2023 or Ubuntu server.
# Run:  curl -fsSL https://raw.githubusercontent.com/AtomiqTraders/qiao/main/install.sh | sudo bash
# Safe to run again: it updates the code and restarts the services.
set -euo pipefail

REPO=https://github.com/AtomiqTraders/qiao
DIR=/opt/qiao

if [ "$(id -u)" != 0 ]; then echo "Run this with sudo."; exit 1; fi

echo "==> Finding this server's public address"
IP="${1:-$(curl -fsS --max-time 10 https://checkip.amazonaws.com | tr -d '[:space:]')}"
if ! echo "$IP" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Could not detect the public IP. Run again as: sudo bash install.sh YOUR.SERVER.IP"; exit 1
fi
HOST="$(echo "$IP" | tr . -).sslip.io"

echo "==> Adding swap space (small servers need it for installs)"
if [ "$(swapon --noheadings | wc -l)" = 0 ] && [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Installing Node.js and git"
if command -v dnf >/dev/null; then
  dnf install -y -q nodejs git tar || true
  command -v npm >/dev/null || dnf install -y -q npm || dnf install -y -q nodejs-npm
elif command -v apt-get >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq nodejs npm git curl
else
  echo "Unsupported system: need dnf or apt."; exit 1
fi
command -v node >/dev/null && command -v npm >/dev/null || { echo "Node.js did not install."; exit 1; }
echo "    node $(node -v)"

echo "==> Getting the Qiao code"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull -q --ff-only; else git clone -q --depth 1 "$REPO" "$DIR"; fi
(cd "$DIR" && npm install --omit=dev --no-audit --no-fund --silent)

id qiao >/dev/null 2>&1 || useradd --system --home-dir "$DIR" --shell /sbin/nologin qiao
mkdir -p "$DIR/data" && chown -R qiao:qiao "$DIR/data"

if [ ! -f /etc/qiao.env ]; then
  printf 'PORT=3000\nHOST=127.0.0.1\nTRUST_PROXY=1\nFIRST_INVITE=%s\n' "$(head -c 9 /dev/urandom | od -An -tx1 | tr -d ' \n')" > /etc/qiao.env
  chmod 600 /etc/qiao.env
fi
CODE="$(grep '^FIRST_INVITE=' /etc/qiao.env | cut -d= -f2)"

cat > /etc/systemd/system/qiao.service <<EOF
[Unit]
Description=Qiao chat
After=network.target

[Service]
User=qiao
WorkingDirectory=$DIR
EnvironmentFile=/etc/qiao.env
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=2
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "==> Installing Caddy (HTTPS)"
if [ ! -x /usr/local/bin/caddy ]; then
  case "$(uname -m)" in x86_64) ARCH=amd64 ;; aarch64) ARCH=arm64 ;; *) echo "Unsupported CPU: $(uname -m)"; exit 1 ;; esac
  curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=$ARCH" -o /usr/local/bin/caddy
  chmod 755 /usr/local/bin/caddy
fi
/usr/local/bin/caddy version >/dev/null
id caddy >/dev/null 2>&1 || useradd --system --home-dir /var/lib/caddy --create-home --shell /sbin/nologin caddy
mkdir -p /etc/caddy /var/lib/caddy && chown -R caddy:caddy /var/lib/caddy
cat > /etc/caddy/Caddyfile <<EOF
$HOST {
	encode gzip
	reverse_proxy 127.0.0.1:3000
}
EOF
cat > /etc/systemd/system/caddy.service <<'EOF'
[Unit]
Description=Caddy web server
After=network-online.target
Wants=network-online.target

[Service]
User=caddy
Group=caddy
Environment=XDG_DATA_HOME=/var/lib/caddy XDG_CONFIG_HOME=/var/lib/caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
AmbientCapabilities=CAP_NET_BIND_SERVICE
LimitNOFILE=1048576
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

echo "==> Starting services"
systemctl daemon-reload
systemctl enable -q qiao caddy
systemctl restart qiao caddy
sleep 3
systemctl is-active -q qiao  || { echo "Qiao failed to start:";  journalctl -u qiao  -n 20 --no-pager; exit 1; }
systemctl is-active -q caddy || { echo "Caddy failed to start:"; journalctl -u caddy -n 20 --no-pager; exit 1; }
curl -fsS --max-time 5 http://127.0.0.1:3000/ >/dev/null || { echo "Qiao is not answering on port 3000."; exit 1; }

if curl -fsS --max-time 8 "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=hello" | grep -q '\[\[\["'; then
  TR="working"
else
  TR="NOT reachable from this server (chat still works, without translations)"
fi

echo
echo "============================================================"
echo " Qiao is running."
echo " Translation: $TR"
echo " Create your account here (first one only):"
echo "   https://$HOST/?invite=$CODE"
echo " After that, your site is:  https://$HOST"
echo " HTTPS can take up to a minute to switch on the first time."
echo "============================================================"
