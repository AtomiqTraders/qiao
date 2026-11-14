'use strict';
// Qiao - a small private chat. One process, one dependency (ws), data in ./data.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const webpush = require('web-push');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UP = path.join(DATA, 'uploads');
const PUB = path.join(__dirname, 'public');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
// A fingerprint of the page files: when an update changes them, open pages see a new value and refresh.
const VERSION = (() => {
  const h = crypto.createHash('sha256');
  for (const f of fs.readdirSync(PUB).sort()) { const fp = path.join(PUB, f); if (fs.statSync(fp).isFile()) h.update(f).update(fs.readFileSync(fp)); }
  return h.digest('hex').slice(0, 12);
})();
const DB_FILE = path.join(DATA, 'db.json');
const MSG_FILE = path.join(DATA, 'messages.jsonl');
const COOKIE = 'qiao_sid';
const INVITE_TTL = 7 * 24 * 3600 * 1000;
const SESSION_TTL = 180 * 24 * 3600 * 1000;
const MAX_UPLOAD = 6 * 1024 * 1024;
const TR_FILE = path.join(DATA, 'translations.json');
const TR_LANGS = { en: 'en', zh: 'zh-CN', hi: 'hi', vi: 'vi', ja: 'ja', ko: 'ko' }; // our code -> translator's code
const TR_ENDPOINT = process.env.TRANSLATE_ENDPOINT || 'https://translate.googleapis.com/translate_a/single';
const COLORS = ['#f2b950', '#7fd1ae', '#f08a6b', '#8fb8f0', '#d9a0e8', '#b9d86a', '#f0a3b5', '#6fd3d8'];

fs.mkdirSync(UP, { recursive: true });

// ---------- storage ----------
let db = { users: {}, sessions: {}, invites: {} };
if (fs.existsSync(DB_FILE)) db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
for (const k of ['users', 'sessions', 'invites']) db[k] = Object.assign(Object.create(null), db[k]);
db.settings = Object.assign({ invites: 'all' }, db.settings);
db.themes = Object.assign(Object.create(null), db.themes); // chat id -> theme, shared by everyone in that chat
const THEMES = ['forest', 'sakura', 'ocean', 'sunset', 'lavender', 'midnight', 'matcha', 'candy'];
// the first account is the admin; sites created before admins existed promote their oldest account
if (Object.keys(db.users).length && !Object.values(db.users).some(u => u.admin)) {
  Object.values(db.users).sort((a, b) => a.ts - b.ts)[0].admin = true;
}
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
    try { const m = JSON.parse(line); if (m.op) applyOp(m); else list(m.conv).push(m); } catch { /* skip a torn line */ }
  }
}
function list(conv) { let a = convs.get(conv); if (!a) convs.set(conv, a = []); return a; }
// Edits and deletes are stored as extra lines in the same file and replayed in order on start.
// A reply keeps a short copy of the message it answers (re), kept in step here.
function snippet(m) { const r = { id: m.id, from: m.from, text: [...(m.text || (m.ann && m.ann.en) || '')].slice(0, 140).join(''), img: !!m.img }; if (m.game) r.game = m.game.kind; return r; }
const REACTS = ['❤️', '😂', '😮', '😢', '😡', '👍'];
// one reaction per person per message; e === null takes theirs away
function setReaction(m, uid, e) {
  const rx = m.rx || {};
  for (const k of Object.keys(rx)) { rx[k] = rx[k].filter(x => x !== uid); if (!rx[k].length) delete rx[k]; }
  if (e) (rx[e] = rx[e] || []).push(uid);
  if (Object.keys(rx).length) m.rx = rx; else delete m.rx;
}
function applyOp(o) {
  const a = convs.get(o.conv); if (!a) return null;
  const i = a.findIndex(x => x.id === o.id); if (i < 0) return null;
  const m = a[i];
  if (o.op === 'edit') { m.text = o.text; m.edited = o.ts; }
  else if (o.op === 'del') a.splice(i, 1);
  else if (o.op === 'react') { setReaction(m, o.uid, o.e); return m; }
  else if (o.op === 'game') { m.game = o.game; return m; }
  for (const x of a) if (x.re && x.re.id === o.id) x.re = o.op === 'del' ? { id: o.id, gone: true } : snippet(m);
  return m;
}

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
// Which languages a message is written in, judged by its writing system. Guessing the language
// of short text is unreliable ("Hii" came back as "This"), scripts are not. Latin script counts as
// English unless it carries Vietnamese letters. Keep in sync with detectLangs in public/app.js.
const VI_LETTER = /[ăâđêôơưĂÂĐÊÔƠƯ\u1EA0-\u1EF9]/;
function detectLangs(text) {
  const n = { en: 0, zh: 0, hi: 0, vi: 0, ja: 0, ko: 0, other: 0 };
  let total = 0, vi = false, kana = false;
  for (const ch of text.normalize('NFC')) {
    if (!/\p{L}/u.test(ch)) continue;
    total++;
    if (/\p{Script=Han}/u.test(ch)) n.zh++;
    else if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(ch)) { n.ja++; kana = true; }
    else if (/\p{Script=Hangul}/u.test(ch)) n.ko++;
    else if (/\p{Script=Devanagari}/u.test(ch)) n.hi++;
    else if (/\p{Script=Latin}/u.test(ch)) { n.en++; if (VI_LETTER.test(ch)) vi = true; }
    else n.other++;
  }
  if (!total) return [];
  if (kana) { n.ja += n.zh; n.zh = 0; }
  if (vi) { n.vi = n.en; n.en = 0; }
  return Object.keys(n).filter(k => n[k] / total >= 0.25);
}
function cleanPrefs(lang, reads) {
  if (!Object.prototype.hasOwnProperty.call(TR_LANGS, lang)) return null;
  const set = new Set([lang]);
  if (Array.isArray(reads)) for (const r of reads.slice(0, 12)) if (Object.prototype.hasOwnProperty.call(TR_LANGS, r)) set.add(r);
  return { lang, reads: [...set] };
}
async function translateText(text, target) {
  text = text.replace(/(\p{L})\1{2,}/gu, '$1$1'); // "heyyyy" -> "heyy", easier on the translator
  const found = detectLangs(text);
  const from = found.length === 1 && TR_LANGS[found[0]] && found[0] !== 'en' ? TR_LANGS[found[0]]
    : (/\s/.test(text.trim()) ? 'auto' : 'en'); // a lone Latin word is too short to auto-detect
  try {
    const d = await getJson(TR_ENDPOINT + '?client=gtx&dt=t&sl=' + from + '&tl=' + target + '&q=' + encodeURIComponent(text));
    const out = d[0].map(seg => seg[0] || '').join('');
    if (out) return { text: out, src: String(d[2] || from) };
  } catch { /* fall through to the backup service */ }
  const src = from === 'auto' ? 'en' : from;
  if (src.slice(0, 2) === target.slice(0, 2)) return { text, src };
  const d = await getJson('https://api.mymemory.translated.net/get?langpair=' + src + '|' + target + '&q=' + encodeURIComponent(text.slice(0, 480)));
  if (!d.responseData || !d.responseData.translatedText || d.responseStatus !== 200) throw new Error('no translation');
  return { text: d.responseData.translatedText, src };
}
const trPending = new Map();
// Translate message m for reader u. Resolves to the translation, or null when u can read it as is.
function translateFor(u, m, askedLang) {
  const to = u.lang || (Object.prototype.hasOwnProperty.call(TR_LANGS, askedLang) ? askedLang : null);
  if (!to) return Promise.reject(new Error('no language'));
  const target = TR_LANGS[to], reads = u.lang ? u.reads || [to] : [to];
  if (!m.text || !detectLangs(m.text).some(l => !reads.includes(l))) return Promise.resolve(null);
  const key = m.id + '|' + to;
  if (key in tr) return Promise.resolve(tr[key]);
  let job = trPending.get(key);
  if (!job) {
    job = translateText(m.text, target).then(r => {
      const same = r.src.slice(0, 2).toLowerCase() === target.slice(0, 2) || r.text.trim().toLowerCase() === m.text.trim().toLowerCase();
      tr[key] = same ? null : r.text.slice(0, 8000); saveTr();
      return tr[key];
    }).finally(() => trPending.delete(key));
    trPending.set(key, job);
  }
  return job;
}

// ---------- phone notifications (Web Push) ----------
// Keys are made once and kept in the data folder. The message is encrypted for the phone,
// so the browser's push service (Google for Chrome) only passes it along.
const VAPID_FILE = path.join(DATA, 'vapid.json');
let vapid;
try { vapid = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8')); } catch { vapid = webpush.generateVAPIDKeys(); fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid), { mode: 0o600 }); }
webpush.setVapidDetails(process.env.PUSH_CONTACT || 'mailto:admin@qiao.invalid', vapid.publicKey, vapid.privateKey);
const PUSH_WORDS = { news: { en: 'Announcements', zh: '公告', hi: 'घोषणाएँ', vi: 'Thông báo', ja: 'お知らせ', ko: '공지' }, game: { en: 'Wants to play', zh: '邀请你玩游戏', hi: 'खेलना चाहते हैं', vi: 'Muốn chơi cùng bạn', ja: 'ゲームに誘っています', ko: '게임을 하자고 해요' }, turn: { en: 'Your turn', zh: '轮到你了', hi: 'आपकी बारी', vi: 'Đến lượt bạn', ja: 'あなたの番です', ko: '내 차례' }, photo: { en: 'Photo', zh: '图片', hi: 'फ़ोटो', vi: 'Ảnh', ja: '写真', ko: '사진' }, lobby: { en: 'Lobby', zh: '大厅', hi: 'लॉबी', vi: 'Sảnh chung', ja: 'ロビー', ko: '로비' } };
function validSub(x) {
  if (!x || typeof x !== 'object' || typeof x.endpoint !== 'string' || x.endpoint.length > 1000 || !x.keys || typeof x.keys !== 'object') return null;
  let u; try { u = new URL(x.endpoint); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const { p256dh, auth } = x.keys;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[\w-]{20,200}$/.test(p256dh) || !/^[\w-]{8,100}$/.test(auth)) return null;
  return { endpoint: x.endpoint, keys: { p256dh, auth } };
}
async function pushTo(u, m, override) {
  if (!u.push || !u.push.length) return;
  const lang = u.lang || 'en';
  const sender = db.users[m.from];
  const grp = m.conv.startsWith('th:') ? 'news' : m.conv;
  const title = (sender ? sender.name : 'Qiao 桥') + (grp === 'lobby' || grp === 'news' ? ' · ' + PUSH_WORDS[grp][lang] : '');
  let body = m.ann ? m.ann[lang] || m.ann.en : override ? '🎮 ' + PUSH_WORDS[override][lang] : m.text || (m.game ? '🎮 ' + PUSH_WORDS.game[lang] : PUSH_WORDS.photo[lang]);
  if (m.text && !override && !m.ann) { try { const t = await Promise.race([translateFor(u, m), new Promise(r => setTimeout(() => r(null), 4000))]); if (t) body = t; } catch { /* send the original */ } }
  const payload = JSON.stringify({ title, body: [...body].slice(0, 180).join(''), conv: m.conv });
  for (const sub of [...u.push]) {
    webpush.sendNotification(sub, payload, { TTL: 86400, urgency: 'high', topic: m.conv.replace(/[^\w-]/g, '').slice(-32) }).catch(e => {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { u.push = (u.push || []).filter(x => x.endpoint !== sub.endpoint); save(); } // phone unsubscribed
      else console.error('push failed', e && e.statusCode);
    });
  }
}
// someone is "looking" when one of their open Qiao pages is visible on screen
function looking(uid) { for (const ws of sockets.get(uid) || []) if (ws.visible) return true; return false; }

// ---------- helpers ----------
const rid = (n = 9) => crypto.randomBytes(n).toString('base64url');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const pub = u => ({ id: u.id, name: u.name, color: u.color });
const own = u => ({ ...pub(u), lang: u.lang || null, reads: u.reads || [], admin: !!u.admin, canInvite: !!u.admin || db.settings.invites === 'all' });
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
  if (conv === 'lobby' || conv === 'news') return Object.keys(db.users); // news = Announcements: everyone reads, the admin posts
  if (threadRoot(conv)) return Object.keys(db.users); // th:<post id> = the comment thread under one announcement
  const m = /^dm:([\w-]+):([\w-]+)$/.exec(String(conv)); if (!m) return null;
  const [, a, b] = m;
  if (a === b || (a !== uid && b !== uid) || !db.users[a] || !db.users[b] || dmId(a, b) !== conv) return null;
  return [a, b];
}
function threadRoot(conv) {
  const t = /^th:([\w-]+)$/.exec(String(conv)); if (!t) return null;
  return (convs.get('news') || []).find(x => x.id === t[1]) || null;
}
function threadInfo(u, rootId) {
  const conv = 'th:' + rootId, a = convs.get(conv) || [];
  return { n: a.length, last: a.length ? a[a.length - 1].ts : 0, unread: summary(u, conv).unread };
}
function viewMsg(m, uid) {
  if (!m || !m.game || m.game.kind !== 'rps' || m.game.done) return m;
  const picks = {};
  for (const k of Object.keys(m.game.picks)) picks[k] = k === uid ? m.game.picks[k] : '?';
  return { ...m, game: { ...m.game, picks } };
}
function sendEach(uids, make) {
  for (const uid of uids) { const s = JSON.stringify(make(uid)); for (const ws of sockets.get(uid) || []) if (ws.readyState === 1) ws.send(s); }
}
// ---- games ----
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const BEATS = { r: 's', p: 'r', s: 'p' };
function newGame(kind, me, other) {
  if (kind === 'ttt') return { kind, x: me, o: other, board: '.........', turn: me, winner: null, line: null };
  if (kind === 'rps') return { kind, players: [me, other], picks: {}, done: false, winner: null };
  return null;
}
function playMove(g, uid, d) { // returns the new state, or null if the move is not allowed
  if (g.kind === 'ttt') {
    const cell = d.cell;
    if (g.winner || g.turn !== uid || !Number.isInteger(cell) || cell < 0 || cell > 8 || g.board[cell] !== '.') return null;
    const mark = uid === g.x ? 'X' : 'O';
    const n = { ...g, board: g.board.slice(0, cell) + mark + g.board.slice(cell + 1), turn: uid === g.x ? g.o : g.x };
    const line = LINES.find(l => l.every(i => n.board[i] === mark));
    if (line) { n.winner = uid; n.line = line; n.turn = null; }
    else if (!n.board.includes('.')) { n.winner = 'draw'; n.turn = null; }
    return n;
  }
  if (g.kind === 'rps') {
    if (g.done || !g.players.includes(uid) || g.picks[uid] || !Object.prototype.hasOwnProperty.call(BEATS, d.pick)) return null;
    const n = { ...g, picks: { ...g.picks, [uid]: d.pick } };
    if (Object.keys(n.picks).length === 2) {
      const [a, b] = n.players, pa = n.picks[a], pb = n.picks[b];
      n.done = true; n.winner = pa === pb ? 'draw' : BEATS[pa] === pb ? a : b;
    }
    return n;
  }
  return null;
}

function summary(u, conv) {
  const a = convs.get(conv) || [];
  const read = (u.read && u.read[conv]) || 0;
  let unread = 0;
  for (let i = a.length - 1; i >= 0 && a[i].ts > read; i--) if (a[i].from !== u.id) unread++;
  return { last: viewMsg(a[a.length - 1] || null, u.id), unread };
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
    Object.assign(user, cleanPrefs(b.lang, b.reads) || {});
    if (inv.by) user.by = inv.by; else if (n === 0) user.admin = true;
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
    const out = { lobby: summary(me, 'lobby'), news: summary(me, 'news') };
    for (const k of convs.keys()) if (k.startsWith('th:') && threadRoot(k)) out[k] = summary(me, k);
    for (const id of Object.keys(db.users)) if (id !== me.id) { const c = dmId(me.id, id); out[c] = summary(me, c); }
    return json(res, 200, { me: own(me), users: Object.values(db.users).map(pub), online: [...sockets.keys()], convs: out, v: VERSION });
  }

  if (p === '/api/prefs' && req.method === 'POST') {
    const b = await readJson(req);
    const prefs = cleanPrefs(b.lang, b.reads); if (!prefs) fail(400, 'bad_request');
    Object.assign(me, prefs); save();
    return json(res, 200, { me: own(me) });
  }

  // ---- admin: manage members and invites. Admins cannot read other people's private chats. ----
  if (p.startsWith('/api/admin')) {
    if (!me.admin) fail(403, 'forbidden');
    const nameOf = id => (id && db.users[id] ? db.users[id].name : null);
    if (p === '/api/admin' && req.method === 'GET') {
      const count = Object.create(null); let messages = 0;
      for (const a of convs.values()) for (const m of a) { count[m.from] = (count[m.from] || 0) + 1; messages++; }
      let photoBytes = 0;
      for (const f of await fs.promises.readdir(UP)) photoBytes += (await fs.promises.stat(path.join(UP, f))).size;
      return json(res, 200, {
        users: Object.values(db.users).sort((a, b) => a.ts - b.ts).map(u => ({ ...pub(u), ts: u.ts, admin: !!u.admin, lang: u.lang || null,
          by: nameOf(u.by), online: sockets.has(u.id), messages: count[u.id] || 0, me: u.id === me.id })),
        invites: Object.keys(db.invites).filter(c => validInvite(c)).map(c => ({ code: c, by: nameOf(db.invites[c].by), ts: db.invites[c].ts, expires: db.invites[c].ts + INVITE_TTL })),
        settings: db.settings, stats: { messages, photoBytes }
      });
    }
    if (req.method !== 'POST') fail(404, 'not_found');
    const b = await readJson(req);
    if (p === '/api/admin/settings') {
      if (b.invites !== 'all' && b.invites !== 'admin') fail(400, 'bad_request');
      db.settings.invites = b.invites; save();
      return json(res, 200, { settings: db.settings });
    }
    if (p === '/api/admin/revoke') {
      if (!validInvite(b.code)) fail(404, 'not_found');
      delete db.invites[b.code]; save();
      return json(res, 200, { ok: true });
    }
    const target = typeof b.id === 'string' && Object.prototype.hasOwnProperty.call(db.users, b.id) ? db.users[b.id] : null;
    if (!target) fail(404, 'not_found');
    if (target.id === me.id || target.admin) fail(400, 'bad_request');
    const signOut = () => {
      target.push = []; // their phones stop getting notifications too
      for (const k of Object.keys(db.sessions)) if (db.sessions[k].uid === target.id) delete db.sessions[k];
      for (const ws of [...(sockets.get(target.id) || [])]) ws.close();
    };
    if (p === '/api/admin/reset') { // new one-time password for someone who forgot theirs
      const password = rid(6);
      target.salt = rid(12); target.pass = hashPw(password, target.salt);
      signOut(); save();
      return json(res, 200, { password });
    }
    if (p === '/api/admin/remove') {
      signOut(); delete db.users[target.id];
      for (const c of Object.keys(db.invites)) if (db.invites[c].by === target.id && !db.invites[c].used) delete db.invites[c];
      save(); broadcast({ t: 'gone', id: target.id });
      return json(res, 200, { ok: true });
    }
    fail(404, 'not_found');
  }

  if (p === '/api/invite' && req.method === 'POST') {
    if (!me.admin && db.settings.invites !== 'all') fail(403, 'forbidden');
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
    // how far each other member has read this chat, for "Seen"
    const seen = {};
    for (const uid of members(me.id, conv)) if (uid !== me.id && db.users[uid]) seen[uid] = (db.users[uid].read && db.users[uid].read[conv]) || 0;
    const out = { messages: a.slice(start, end).map(m => viewMsg(m, me.id)), more: start > 0, seen, theme: db.themes[conv] || 'forest' };
    if (conv === 'news') { out.threads = {}; for (const m of out.messages) out.threads[m.id] = threadInfo(me, m.id); }
    const root = threadRoot(conv); if (root) out.root = root;
    return json(res, 200, out);
  }

  if (p === '/api/translate' && req.method === 'POST') {
    const b = await readJson(req);
    if (!members(me.id, b.conv)) fail(400, 'bad_request');
    if (!me.lang && !Object.prototype.hasOwnProperty.call(TR_LANGS, b.to)) fail(400, 'bad_request');
    const m = (convs.get(b.conv) || []).find(x => x.id === b.id);
    if (!m) fail(404, 'not_found');
    const to = me.lang || b.to;
    if (!((m.id + '|' + to) in tr) && limited('tr:' + me.id, 120, 60000)) fail(429, 'slow_down');
    const job = translateFor(me, m, b.to);
    try { return json(res, 200, { text: await job }); } catch { fail(502, 'translate_failed'); }
  }

  if (p === '/api/push/key' && req.method === 'GET') return json(res, 200, { key: vapid.publicKey });
  if (p === '/api/push/subscribe' && req.method === 'POST') {
    const sub = validSub((await readJson(req)).sub); if (!sub) fail(400, 'bad_request');
    me.push = (me.push || []).filter(x => x.endpoint !== sub.endpoint);
    me.push.push(sub); me.push = me.push.slice(-5); save(); // up to 5 phones or browsers
    return json(res, 200, { ok: true });
  }
  if (p === '/api/push/unsubscribe' && req.method === 'POST') {
    const b = await readJson(req);
    me.push = (me.push || []).filter(x => x.endpoint !== b.endpoint); save();
    return json(res, 200, { ok: true });
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
    ws.uid = user.id; ws.alive = true; ws.visible = true;
    ws.send(JSON.stringify({ t: 'hello', v: VERSION }));
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
  if (d.t === 'vis') { ws.visible = d.v === true; return; }
  const who = members(me.id, d.conv); if (!who) return;

  if (d.t === 'send') {
    if (d.conv === 'news' && !me.admin) return ws.send(JSON.stringify({ t: 'error', error: 'forbidden' }));
    if (limited('ms:' + me.id, 25, 10000)) return ws.send(JSON.stringify({ t: 'error', error: 'slow_down', cid: d.cid }));
    const text = typeof d.text === 'string' ? d.text.replace(/\u0000/g, '').trim().slice(0, 4000) : '';
    const img = typeof d.img === 'string' && UPLOAD_RE.test(d.img) && fs.existsSync(path.join(UP, d.img)) ? d.img : null;
    const game = d.game && d.conv.startsWith('dm:') ? newGame(d.game, me.id, who.find(x => x !== me.id)) : null; // games are for one-to-one chats
    if (!text && !img && !game) return;
    const m = { id: rid(9), conv: d.conv, from: me.id, text: game ? '' : text, ts: Date.now() };
    if (img && !game) m.img = img;
    if (game) m.game = game;
    if (typeof d.reply === 'string') { const o = (convs.get(d.conv) || []).find(x => x.id === d.reply); if (o) m.re = snippet(o); }
    list(d.conv).push(m);
    fs.appendFile(MSG_FILE, JSON.stringify(m) + '\n', err => { if (err) console.error('could not save message', err); });
    (me.read = me.read || {})[d.conv] = m.ts; save();
    sendTo(who, { t: 'msg', m, cid: typeof d.cid === 'string' ? d.cid.slice(0, 40) : undefined });
    let notify = who;
    const root = threadRoot(d.conv);
    if (root) notify = [...new Set([root.from, ...(convs.get(d.conv) || []).map(x => x.from), ...Object.values(db.users).filter(u => u.admin).map(u => u.id)])];
    for (const uid of notify) if (uid !== me.id && db.users[uid] && !looking(uid)) pushTo(db.users[uid], m).catch(() => {});
  } else if (d.t === 'edit' || d.t === 'del') {
    if (limited('ed:' + me.id, 30, 60000)) return ws.send(JSON.stringify({ t: 'error', error: 'slow_down' }));
    const m = (convs.get(d.conv) || []).find(x => x.id === d.id); if (!m) return;
    // your own messages; the admin may also remove anything in the lobby
    if (m.from !== me.id && !(d.t === 'del' && me.admin && (d.conv === 'lobby' || d.conv === 'news'))) return ws.send(JSON.stringify({ t: 'error', error: 'forbidden' }));
    let o;
    if (d.t === 'edit') {
      const text = typeof d.text === 'string' ? d.text.replace(/\u0000/g, '').trim().slice(0, 4000) : '';
      if (m.game || m.sys || (!text && !m.img) || text === m.text) return;
      o = { op: 'edit', conv: d.conv, id: m.id, text, ts: Date.now() };
      for (const k of Object.keys(TR_LANGS)) delete tr[m.id + '|' + k]; saveTr(); // translate the new text afresh
    } else {
      o = { op: 'del', conv: d.conv, id: m.id };
      if (m.img) fs.unlink(path.join(UP, m.img), () => {});
      for (const k of Object.keys(TR_LANGS)) delete tr[m.id + '|' + k]; saveTr();
    }
    applyOp(o);
    fs.appendFile(MSG_FILE, JSON.stringify(o) + '\n', err => { if (err) console.error('could not save change', err); });
    const a = convs.get(d.conv) || [];
    sendEach(who, uid => d.t === 'edit' ? { t: 'edit', m: viewMsg(m, uid) } : { t: 'del', conv: d.conv, id: m.id, last: viewMsg(a[a.length - 1] || null, uid) });
  } else if (d.t === 'theme') {
    if (d.conv === 'news' || d.conv.startsWith('th:')) return;
    let val; // a built-in theme name, or { key: 'custom', img, accent } for a photo someone uploaded
    if (d.key === 'custom') {
      if (typeof d.img !== 'string' || !UPLOAD_RE.test(d.img) || !fs.existsSync(path.join(UP, d.img)) || !/^#[0-9a-f]{6}$/i.test(d.accent || '')) return;
      val = { key: 'custom', img: d.img, accent: d.accent.toLowerCase() };
    } else {
      if (!THEMES.includes(d.key) || (db.themes[d.conv] || 'forest') === d.key) return;
      val = d.key;
    }
    if (limited('th:' + me.id, 10, 60000)) return ws.send(JSON.stringify({ t: 'error', error: 'slow_down' }));
    const old = db.themes[d.conv];
    if (old && old.img && old.img !== val.img) fs.unlink(path.join(UP, old.img), () => {}); // the replaced photo is no longer used
    db.themes[d.conv] = val; save();
    // a small line in the chat says who changed it, like Instagram
    const m = { id: rid(9), conv: d.conv, from: me.id, text: '', ts: Date.now(), sys: { theme: d.key } };
    list(d.conv).push(m);
    fs.appendFile(MSG_FILE, JSON.stringify(m) + '\n', err => { if (err) console.error('could not save theme change', err); });
    (me.read = me.read || {})[d.conv] = m.ts; save();
    sendTo(who, { t: 'theme', conv: d.conv, theme: val });
    sendTo(who, { t: 'msg', m });
  } else if (d.t === 'react') {
    if (limited('rx:' + me.id, 40, 60000)) return;
    const m = (convs.get(d.conv) || []).find(x => x.id === d.id); if (!m) return;
    if (d.e !== null && !REACTS.includes(d.e)) return;
    const had = m.rx && Object.keys(m.rx).find(k => m.rx[k].includes(me.id));
    const e = d.e && d.e !== had ? d.e : null; // tapping the same reaction again takes it away
    const o = { op: 'react', conv: d.conv, id: m.id, uid: me.id, e };
    applyOp(o);
    fs.appendFile(MSG_FILE, JSON.stringify(o) + '\n', err => { if (err) console.error('could not save reaction', err); });
    sendTo(who, { t: 'rx', conv: d.conv, id: m.id, rx: m.rx || {} });
  } else if (d.t === 'move') {
    if (limited('mv:' + me.id, 60, 60000)) return;
    const m = (convs.get(d.conv) || []).find(x => x.id === d.id); if (!m || !m.game) return;
    const g = playMove(m.game, me.id, d); if (!g) return;
    const o = { op: 'game', conv: d.conv, id: m.id, game: g };
    applyOp(o);
    fs.appendFile(MSG_FILE, JSON.stringify(o) + '\n', err => { if (err) console.error('could not save move', err); });
    sendEach(who, uid => ({ t: 'game', conv: d.conv, id: m.id, game: viewMsg(m, uid).game }));
    const other = who.find(x => x !== me.id);
    const waiting = g.kind === 'ttt' ? g.turn === other : !g.done && !g.picks[other];
    if (other && db.users[other] && waiting && !looking(other)) pushTo(db.users[other], m, 'turn').catch(() => {});
  } else if (d.t === 'typing') {
    if (!limited('ty:' + me.id, 10, 10000)) sendTo(who, { t: 'typing', conv: d.conv, from: me.id }, ws);
  } else if (d.t === 'read') {
    const a = convs.get(d.conv); if (!a || !a.length) return;
    const ts = a[a.length - 1].ts;
    (me.read = me.read || {})[d.conv] = ts; save();
    sendTo([me.id], { t: 'read', conv: d.conv }, ws);
    sendTo(who.filter(uid => uid !== me.id), { t: 'seen', conv: d.conv, uid: me.id, ts });
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
// Every entry in updates.json is posted once to Announcements, from "Qiao", in each reader's language.
// Installing an update restarts the server, so new entries go out (and notify everyone) right away.
function postUpdates() {
  let entries;
  try { entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'updates.json'), 'utf8')); } catch { return; }
  const done = new Set(db.settings.posted || []);
  const fresh = entries.filter(e => e && typeof e.id === 'string' && e.en && !done.has(e.id));
  if (!fresh.length) return;
  let m;
  for (const e of fresh) {
    const ann = {}; for (const k of Object.keys(TR_LANGS)) if (typeof e[k] === 'string') ann[k] = e[k];
    m = { id: rid(9), conv: 'news', from: 'qiao', text: '', ann, ts: Date.now(), upd: e.id };
    list('news').push(m);
    fs.appendFileSync(MSG_FILE, JSON.stringify(m) + '\n');
    done.add(e.id);
  }
  db.settings.posted = [...done]; flush();
  console.log('Posted ' + fresh.length + ' update(s) to Announcements');
  for (const u of Object.values(db.users)) pushTo(u, m).catch(() => {}); // one ping, for the newest
}
server.listen(PORT, HOST, () => { console.log('Qiao is running on port ' + PORT); firstInvite(); postUpdates(); });
