# Qiao 桥

A small private chat for friends in different countries. It runs in the browser,
so nobody needs an app store, a phone number, or a VPN.

- Invite-only accounts (name + password)
- Lobby for everyone, plus one-to-one chats
- Photos, typing and "here now" indicators, unread counts
- Translation: each person says which languages they read (English, 中文, हिन्दी, Tiếng Việt,
  日本語, 한국어). Messages in any other language are translated for them, automatically or
  with a Translate button
- English and 中文, switchable on every screen
- Nothing is loaded from outside sites (no Google fonts or CDNs), so pages load the same everywhere
- "Add to Home screen" in the browser menu makes it open like an app

## Run it on your own computer first

    npm install
    npm start

The terminal prints a first-account link such as `/?invite=AbC123`.
Open `http://localhost:3000/?invite=AbC123`, create your account, then use
**Invite a friend** to make a link for each person. Each link works once and lasts 7 days.

## Put it online

Your friend's network decides which host works, so test before paying for anything.

### Option A: Railway (fastest way to try)

1. Push this folder to a GitHub repo and create a Railway project from it.
2. Add a **Volume** mounted at `/data`.
3. Add variables: `DATA_DIR=/data`, `TRUST_PROXY=1`, `FIRST_INVITE=pick-your-own-code`.
4. Generate a domain, then open `https://your-app.up.railway.app/?invite=pick-your-own-code`.
5. Create your account, make an invite link, and ask your friend whether it loads.

Railway addresses are not always reachable from mainland China. If the page
does not load for your friend, use option B.

### Option B: a small VPS in Hong Kong, Singapore or Tokyo

The quick way, on a fresh Amazon Linux 2023 or Ubuntu server with ports 80 and 443 open:

    curl -fsSL https://raw.githubusercontent.com/AtomiqTraders/qiao/main/install.sh | sudo bash

It installs everything, switches on HTTPS, and prints your first-account link.
The manual steps, if you prefer them, on a 1 GB Ubuntu server:

    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
    sudo apt install -y nodejs unzip
    unzip qiao.zip -d /opt && cd /opt/qiao && npm install

Create `/etc/systemd/system/qiao.service`:

    [Unit]
    Description=Qiao chat
    After=network.target

    [Service]
    WorkingDirectory=/opt/qiao
    Environment=PORT=3000 HOST=127.0.0.1 TRUST_PROXY=1 FIRST_INVITE=pick-your-own-code
    ExecStart=/usr/bin/node server.js
    Restart=always

    [Install]
    WantedBy=multi-user.target

Then `sudo systemctl enable --now qiao`.

For HTTPS without buying a domain, install Caddy (`sudo apt install -y caddy`)
and put this in `/etc/caddy/Caddyfile`, replacing the numbers with your server's IP
(dots become dashes):

    203-0-113-7.sslip.io {
        reverse_proxy localhost:3000
    }

Run `sudo systemctl reload caddy`, then open
`https://203-0-113-7.sslip.io/?invite=pick-your-own-code`.

If that sslip.io name does not resolve for your friend, drop Caddy, change the
service file to `PORT=80` with `HOST` and `TRUST_PROXY` removed, and use `http://YOUR.SERVER.IP/` directly. That works but is
not encrypted, so treat it as a stopgap.

## Settings

| Variable | What it does | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | `3000` |
| `DATA_DIR` | Where accounts, messages and photos are kept | `./data` |
| `HOST` | Address to listen on; `127.0.0.1` hides the app behind Caddy | `0.0.0.0` |
| `TRUST_PROXY` | Set to `1` only behind Railway, Caddy or nginx | off |
| `FIRST_INVITE` | Code for the very first account | random, printed at start |

## Good to know

- Back up the `data` folder; it holds everything.
- With HTTPS, messages are encrypted between each phone and your server. They are
  not end-to-end encrypted: they sit on the server as plain text, so anyone with
  access to the server can read them.
- To translate, the server sends message text to Google Translate's free endpoint
  (MyMemory as backup). Set `TRANSLATE_ENDPOINT` to use a different compatible service.
- The first account is the admin. The **Admin** link in the chat list opens a page to remove
  members, reset a forgotten password, cancel invites, and choose who may invite.
  The admin cannot read other people's private chats there.
