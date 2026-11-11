'use strict';
// Qiao - a small private chat. One process, one dependency (ws), data in ./data.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UP = path.join(DATA, 'uploads');
const PUB = path.join(__dirname, 'public');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const DB_FILE = path.join(DATA, 'db.json');
const MSG_FILE = path.join(DATA, 'messages.jsonl');
const COOKIE = 'qiao_sid';
const INVITE_TTL = 7 * 24 * 3600 * 1000;
const SESSION_TTL = 180 * 24 * 3600 * 1000;
const MAX_UPLOAD = 6 * 1024 * 1024;
const TR_FILE = path.join(DATA, 'translations.json');
const TR_LANGS = { en: 'en', zh: 'zh-CN' };
const TR_ENDPOINT = process.env.TRANSLATE_ENDPOINT || 'https://translate.googleapis.com/translate_a/single';
const COLORS = ['#f2b950', '#7fd1ae', '#f08a6b', '#8fb8f0', '#d9a0e8', '#b9d86a', '#f0a3b5', '#6fd3d8'];

fs.mkdirSync(UP, { recursive: true });

// ---------- storage ----------
let db = { users: {}, sessions: {}, invites: {} };
if (fs.existsSync(DB_FILE)) db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
for (const k of ['users', 'sessions', 'invites']) db[k] = Object.assign(Object.create(null), db[k]);
let saveTimer = null;
function flush() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
function save() { if (!saveTimer) saveTimer = setTimeout(flush, 200); }

const convs = new Map(); // conv id -> messages, oldest first
if (fs.existsSync(MSG_FILE)) {
  for (const line of fs.readFileSync(MSG_FILE, 'utf8').split('\n')) {
    if (!line) continue;
    try { const m = JSON.parse(line); list(m.conv).push(m); } catch { /* skip a torn line */ }
  }
}
function list(conv) { let a = convs.get(conv); if (!a) convs.set(conv, a = []); return a; }

// ---------- translation ----------
// Done by the server (not the reader's phone), so it works the same in every country.
// Results are cached on disk; each message is translated once per language.
let tr = Object.create(null); // "msgId|lang" -> translated text, or null when no translation is needed
if (fs.existsSync(TR_FILE)) { try { tr = Object.assign(tr, JSON.parse(fs.readFileSync(TR_FILE, 'utf8'))); } catch { /* start fresh */ } }
let trTimer = null;
function saveTr() {
  if (trTimer) return;
  trTimer = setTimeout(() => { trTimer = null; fs.writeFile(TR_FILE + '.tmp', JSON.stringify(tr), err => { if (!err) fs.rename(TR_FILE + '.tmp', TR_FILE, () => {}); }); }, 1000);
}
async function getJson(url) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 7000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('http ' + r.status); return await r.json(); }
  finally { clearTimeout(timer); }
}
// Decide by the writing system, not by guessing the language: short greetings like "Hii"
// get misidentified by automatic detection and come back as nonsense.
const HAN = /[\u3400-\u9fff]/;
const NON_LATIN_LETTER = /(?=\p{L})[^\p{Script=Latin}]/u;
function needsTranslation(text, to) {
  if (!/\p{L}/u.test(text)) return false;        // only emoji, numbers or punctuation
  if (to === 'zh') return !HAN.test(text);       // already has Chinese characters
  return NON_LATIN_LETTER.test(text);            // English reader: Latin-script text is shown as written
}
async function translateText(text, target) {
  text = text.replace(/(\p{L})\1{2,}/gu, '$1$1'); // "heyyyy" -> "heyy", easier on the translator
  const from = HAN.test(text) ? 'zh-CN' : (/\s/.test(text.trim()) ? 'auto' : 'en'); // a lone word is too short to auto-detect
  try {
    const d = await getJson(TR_ENDPOINT + '?client=gtx&dt=t&sl=' + from + '&tl=' + target + '&q=' + encodeURIComponent(text));
    const out = d[0].map(seg => seg[0] || '').join('');
    if (out) return { text: out, src: String(d[2] || from) };
  } catch { /* fall through to the backup service */ }
  const src = /[\u3400-\u9fff]/.test(text) ? 'zh-CN' : 'en';
  if (src.slice(0, 2) === target.slice(0, 2)) return { text, src };
  const d = await getJson('https://api.mymemory.translated.net/get?langpair=' + src + '|' + target + '&q=' + encodeURIComponent(text.slice(0, 480)));
  if (!d.responseData || !d.responseData.translatedText || d.responseStatus !== 200) throw new Error('no translation');
  return { text: d.responseData.translatedText, src };
}
const trPending = new Map();

// ---------- helpers ----------
const rid = (n = 9) => crypto.randomBytes(n).toString('base64url');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const pub = u => ({ id: u.id, name: u.name, color: u.color });
const dmId = (a, b) => 'dm:' + [a, b].sort().join(':');
function parseUrl(req) { try { return new URL(req.url, 'http://x'); } catch { return null; } }

function fail(status, code) { const e = new Error(code); e.status = status; e.code = code; throw e; }

const hits = new Map();
function limited(key, max, windowMs) {
  key = String(key).slice(0, 80);
  const now = Date.now();
  const a = (hits.get(key) || []).filter(t => now - t < windowMs);
  a.push(now); hits.set(key, a);
  return a.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.length || now - a[a.length - 1] > 900000) hits.delete(k); }, 600000).unref();

function ip(req) {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
  return req.socket.remoteAddress || '';
}
function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
function authed(req) {
  const tok = cookies(req)[COOKIE]; if (!tok) return null;
  const key = sha(tok), s = db.sessions[key]; if (!s) return null;
  if (Date.now() - s.ts > SESSION_TTL) { delete db.sessions[key]; save(); return null; }
  return db.users[s.uid] || null;
}
function startSession(req, res, uid) {
  const tok = rid(32);
  db.sessions[sha(tok)] = { uid, ts: Date.now() }; save();
  const secure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
  res.setHeader('Set-Cookie', `${COOKIE}=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${secure ? '; Secure' : ''}`);
}
function sameOrigin(req) {
  const o = req.headers.origin; if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > limit) { const e = new Error('too_big'); e.status = 413; e.code = 'too_big'; reject(e); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'bad_request');
  try { const v = JSON.parse((await readBody(req, 16384)).toString('utf8')); if (v && typeof v === 'object') return v; } catch (e) { if (e.status) throw e; }
  fail(400, 'bad_request');
}
const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' blob: data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};
function secureHeaders(req, res) {
  if (req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
}
function json(res, status, body) {
  res.writeHead(status, { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

// which conversations a user may touch, and who is in them
function members(uid, conv) {
  if (conv === 'lobby') return Object.keys(db.users);
  const m = /^dm:([\w-]+):([\w-]+)$/.exec(String(conv)); if (!m) return null;
  const [, a, b] = m;
  if (a === b || (a !== uid && b !== uid) || !db.users[a] || !db.users[b] || dmId(a, b) !== conv) return null;
  return [a, b];
}
function summary(u, conv) {
  const a = convs.get(conv) || [];
  const read = (u.read && u.read[conv]) || 0;
  let unread = 0;
  for (let i = a.length - 1; i >= 0 && a[i].ts > read; i--) if (a[i].from !== u.id) unread++;
  return { last: a[a.length - 1] || null, unread };
}
function validInvite(code) {
  const inv = db.invites[String(code || '')];
  return inv && !inv.used && Date.now() - inv.ts < INVITE_TTL ? inv : null;
}

// ---------- static files ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
function sendFile(res, file, cache) {
  fs.readFile(file, (err, buf) => {
    if (err) return json(res, 404, { error: 'not_found' });
    res.writeHead(200, { ...HEADERS, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': cache });
    res.end(buf);
  });
}
function imageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.readUInt32BE(0) === 0x89504e47) return 'png';
  if (buf.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}
const UPLOAD_RE = /^[\w-]{16}\.(jpg|png|gif|webp)$/;

// ---------- http routes ----------
async function route(req, res) {
  const url = parseUrl(req); if (!url) fail(400, 'bad_request');
  const p = url.pathname;
  if (req.method === 'POST' && !sameOrigin(req)) fail(403, 'forbidden');

  if (req.method === 'GET' && !p.startsWith('/api/') && !p.startsWith('/u/')) {
    const name = p === '/' ? 'index.html' : p.slice(1);
    if (!/^[\w.-]+$/.test(name)) return json(res, 404, { error: 'not_found' });
    return sendFile(res, path.join(PUB, name), 'no-cache');
  }

  if (p === '/api/invite-check' && req.method === 'GET') {
    if (limited('ic:' + ip(req), 40, 600000)) fail(429, 'slow_down');
    const inv = validInvite(url.searchParams.get('code'));
    return json(res, 200, { ok: !!inv, by: inv && inv.by && db.users[inv.by] ? db.users[inv.by].name : null });
  }

  if (p === '/api/signup' && req.method === 'POST') {
    if (limited('su:' + ip(req), 20, 600000)) fail(429, 'slow_down');
    const b = await readJson(req);
    const inv = validInvite(b.invite); if (!inv) fail(400, 'bad_invite');
    const name = String(b.name || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    const pw = String(b.password || '');
    if ([...name].length < 2 || [...name].length > 20 || /[\u0000-\u001f\u007f<>]/.test(name)) fail(400, 'bad_name');
    if (pw.length < 6 || pw.length > 200) fail(400, 'bad_password');
    const key = name.toLowerCase();
    if (Object.values(db.users).some(u => u.key === key)) fail(409, 'name_taken');
    const id = rid(8), salt = rid(12), n = Object.keys(db.users).length;
    const user = db.users[id] = { id, name, key, salt, pass: hashPw(pw, salt), color: COLORS[n % COLORS.length], ts: Date.now(), read: {} };
    inv.used = id; save();
    startSession(req, res, id);
    broadcast({ t: 'user', user: pub(user) });
    return json(res, 200, { ok: true });
  }

  if (p === '/api/login' && req.method === 'POST') {
    const b = await readJson(req);
    const key = String(b.name || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
    if (limited('li:' + ip(req), 40, 600000) || limited('ln:' + key, 10, 600000)) fail(429, 'slow_down');
    const user = Object.values(db.users).find(u => u.key === key);
    const given = Buffer.from(hashPw(String(b.password || ''), user ? user.salt : 'x'), 'hex');
    if (!user || !crypto.timingSafeEqual(given, Buffer.from(user.pass, 'hex'))) fail(401, 'bad_login');
    startSession(req, res, user.id);
    return json(res, 200, { ok: true });
  }

  const me = authed(req);
  if (!me) fail(401, 'signed_out');

  if (p === '/api/logout' && req.method === 'POST') {
    delete db.sessions[sha(cookies(req)[COOKIE])]; save();
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/me' && req.method === 'GET') {
    const out = { lobby: summary(me, 'lobby') };
    for (const id of Object.keys(db.users)) if (id !== me.id) { const c = dmId(me.id, id); out[c] = summary(me, c); }
    return json(res, 200, { me: pub(me), users: Object.values(db.users).map(pub), online: [...sockets.keys()], convs: out });
  }

  if (p === '/api/invite' && req.method === 'POST') {
    if (limited('iv:' + me.id, 20, 3600000)) fail(429, 'slow_down');
    const code = rid(8);
    db.invites[code] = { by: me.id, ts: Date.now(), used: null }; save();
    return json(res, 200, { code });
  }

  if (p === '/api/messages' && req.method === 'GET') {
    const conv = url.searchParams.get('conv');
    if (!members(me.id, conv)) fail(404, 'not_found');
    const a = convs.get(conv) || [];
    const before = url.searchParams.get('before');
    let end = a.length;
    if (before) { const i = a.findIndex(m => m.id === before); if (i >= 0) end = i; }
    const start = Math.max(0, end - 50);
    return json(res, 200, { messages: a.slice(start, end), more: start > 0 });
  }

  if (p === '/api/translate' && req.method === 'POST') {
    const b = await readJson(req);
    const target = Object.prototype.hasOwnProperty.call(TR_LANGS, b.to) ? TR_LANGS[b.to] : null;
    if (!target || !members(me.id, b.conv)) fail(400, 'bad_request');
    const m = (convs.get(b.conv) || []).find(x => x.id === b.id);
    if (!m) fail(404, 'not_found');
    const key = m.id + '|' + b.to;
    if (!m.text || !needsTranslation(m.text, b.to)) return json(res, 200, { text: null });
    if (key in tr) return json(res, 200, { text: tr[key] });
    if (limited('tr:' + me.id, 120, 60000)) fail(429, 'slow_down');
    let job = trPending.get(key);
    if (!job) {
      job = translateText(m.text, target).then(r => {
        const same = r.src.slice(0, 2).toLowerCase() === target.slice(0, 2) || r.text.trim().toLowerCase() === m.text.trim().toLowerCase();
        tr[key] = same ? null : r.text.slice(0, 8000); saveTr();
        return tr[key];
      }).finally(() => trPending.delete(key));
      trPending.set(key, job);
    }
    try { return json(res, 200, { text: await job }); } catch { fail(502, 'translate_failed'); }
  }

  if (p === '/api/upload' && req.method === 'POST') {
    if (limited('up:' + me.id, 30, 600000)) fail(429, 'slow_down');
    const buf = await readBody(req, MAX_UPLOAD);
    const ext = imageExt(buf); if (!ext) fail(400, 'bad_image');
    const name = rid(12) + '.' + ext;
    await fs.promises.writeFile(path.join(UP, name), buf);
    return json(res, 200, { name });
  }

  if (p.startsWith('/u/') && req.method === 'GET') {
    const name = p.slice(3);
    if (!UPLOAD_RE.test(name)) fail(404, 'not_found');
    return sendFile(res, path.join(UP, name), 'private, max-age=31536000, immutable');
  }

  fail(404, 'not_found');
}

const server = http.createServer((req, res) => {
  secureHeaders(req, res);
  route(req, res).catch(e => {
    if (!e.status) console.error(e);
    if (!res.headersSent) json(res, e.status || 500, { error: e.code || 'server' });
  });
});

// ---------- realtime ----------
const sockets = new Map(); // uid -> Set<ws>
const wss = new WebSocketServer({ noServer: true, maxPayload: 16384 });

function sendTo(uids, obj, exceptWs) {
  const s = JSON.stringify(obj);
  for (const uid of uids) for (const ws of sockets.get(uid) || []) if (ws !== exceptWs && ws.readyState === 1) ws.send(s);
}
function broadcast(obj) { sendTo([...sockets.keys()], obj); }

server.on('upgrade', (req, socket, head) => {
  const url = parseUrl(req);
  const user = url && url.pathname === '/ws' && sameOrigin(req) ? authed(req) : null;
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => {
    ws.uid = user.id; ws.alive = true;
    let set = sockets.get(user.id);
    const first = !set;
    if (first) sockets.set(user.id, set = new Set());
    set.add(ws);
    if (first) broadcast({ t: 'presence', online: [...sockets.keys()] });
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', data => { try { onMessage(ws, JSON.parse(data.toString('utf8'))); } catch (e) { console.error(e); } });
    ws.on('close', () => {
      set.delete(ws);
      if (!set.size && sockets.get(user.id) === set) { sockets.delete(user.id); broadcast({ t: 'presence', online: [...sockets.keys()] }); }
    });
    ws.on('error', () => {});
  });
});
// keep connections alive through proxies and drop dead ones
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
}, 25000).unref();

function onMessage(ws, d) {
  const me = db.users[ws.uid]; if (!me || !d || typeof d !== 'object') return;
  const who = members(me.id, d.conv); if (!who) return;

  if (d.t === 'send') {
    if (limited('ms:' + me.id, 25, 10000)) return ws.send(JSON.stringify({ t: 'error', error: 'slow_down', cid: d.cid }));
    const text = typeof d.text === 'string' ? d.text.replace(/\u0000/g, '').trim().slice(0, 4000) : '';
    const img = typeof d.img === 'string' && UPLOAD_RE.test(d.img) && fs.existsSync(path.join(UP, d.img)) ? d.img : null;
    if (!text && !img) return;
    const m = { id: rid(9), conv: d.conv, from: me.id, text, ts: Date.now() };
    if (img) m.img = img;
    list(d.conv).push(m);
    fs.appendFile(MSG_FILE, JSON.stringify(m) + '\n', err => { if (err) console.error('could not save message', err); });
    (me.read = me.read || {})[d.conv] = m.ts; save();
    sendTo(who, { t: 'msg', m, cid: typeof d.cid === 'string' ? d.cid.slice(0, 40) : undefined });
  } else if (d.t === 'typing') {
    if (!limited('ty:' + me.id, 10, 10000)) sendTo(who, { t: 'typing', conv: d.conv, from: me.id }, ws);
  } else if (d.t === 'read') {
    const a = convs.get(d.conv); if (!a || !a.length) return;
    (me.read = me.read || {})[d.conv] = a[a.length - 1].ts; save();
    sendTo([me.id], { t: 'read', conv: d.conv }, ws);
  }
}

// ---------- start ----------
function firstInvite() {
  if (Object.keys(db.users).length) return;
  let code = Object.keys(db.invites).find(c => !db.invites[c].by && !db.invites[c].used);
  if (!code || (process.env.FIRST_INVITE && code !== process.env.FIRST_INVITE)) {
    if (code) delete db.invites[code];
    code = /^[\w-]{6,40}$/.test(process.env.FIRST_INVITE || '') ? process.env.FIRST_INVITE : rid(8);
  }
  db.invites[code] = { by: null, ts: Date.now(), used: null }; flush();
  console.log('\nNo accounts yet. Create yours by opening:\n  /?invite=' + code + '\n(add that to the end of your site address)\n');
}
process.on('uncaughtException', e => { console.error('unexpected error', e); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flush(); process.exit(0); });
server.listen(PORT, HOST, () => { console.log('Qiao is running on port ' + PORT); firstInvite(); });
