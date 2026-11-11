'use strict';
/* Qiao client. No libraries, nothing loaded from other sites. */
(function () {
  const $ = s => document.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
  };

  // ---------- words ----------
  const T = {
    en: {
      tagline: 'A small bridge for friends far apart.',
      tab_login: 'Log in', tab_join: 'Join with invite',
      f_invite: 'Invite code', f_name: 'Name', f_password: 'Password',
      go_login: 'Log in', go_join: 'Create account',
      join_hint: 'You need an invite from someone already here.',
      invited_by: '{0} invited you.',
      invite_btn: 'Invite a friend', logout: 'Log out',
      pick_chat: 'Pick a conversation to start talking.',
      lobby: 'Lobby', lobby_sub: 'Everyone here', people: 'People',
      nobody: 'Nobody else is here yet. Invite a friend.',
      online: 'Here now', offline: 'Away',
      older: 'Show earlier messages', send: 'Send', send_photo: 'Send a photo',
      type_here: 'Write a message', empty_chat: 'No messages yet. Say hi.',
      typing: '{0} is typing…', photo: 'Photo', you: 'You',
      today: 'Today', yesterday: 'Yesterday',
      invite_title: 'Invite a friend',
      invite_body: 'Send this link. It works once and lasts 7 days.',
      copy: 'Copy link', copied: 'Link copied', share: 'Share', close: 'Close',
      f_lang: 'Your language (messages get translated into it)', f_reads: 'Other languages you can read',
      admin: 'Admin', removed_user: 'Removed member', err_forbidden: 'Only the admin can do that.',
      langs_btn: 'Languages', langs_title: 'Which languages can you read?',
      langs_body: 'Messages in any other language are translated for you.', save: 'Save',
      translate: 'Translate', auto_tr_on: 'Auto-translate: on', auto_tr_off: 'Auto-translate: off',
      err_translate_failed: 'Could not translate that message. Try again.',
      reconnecting: 'Reconnecting…', not_sent: 'Not connected. Your message was not sent.',
      err_bad_invite: 'That invite code is wrong, used, or expired.',
      err_bad_name: 'Pick a name between 2 and 20 characters.',
      err_bad_password: 'Use a password with at least 6 characters.',
      err_name_taken: 'Someone already uses that name. Pick another.',
      err_bad_login: 'Wrong name or password.',
      err_slow_down: 'Too many tries. Wait a few minutes.',
      err_too_big: 'That photo is too large. The limit is 6 MB.',
      err_bad_image: 'Only JPG, PNG, GIF and WebP photos can be sent.',
      err_network: 'Could not reach the server. Check your connection.',
      err_server: 'Something went wrong on the server. Try again.'
    },
    zh: {
      tagline: '给远方朋友的一座小桥。',
      tab_login: '登录', tab_join: '用邀请码加入',
      f_invite: '邀请码', f_name: '名字', f_password: '密码',
      go_login: '登录', go_join: '创建账号',
      join_hint: '需要已有成员发给你的邀请。',
      invited_by: '{0} 邀请了你。',
      invite_btn: '邀请朋友', logout: '退出登录',
      pick_chat: '选择一个对话开始聊天。',
      lobby: '大厅', lobby_sub: '所有人', people: '朋友',
      nobody: '这里还没有其他人，邀请一位朋友吧。',
      online: '在线', offline: '离开',
      older: '查看更早的消息', send: '发送', send_photo: '发送图片',
      type_here: '写消息', empty_chat: '还没有消息，打个招呼吧。',
      typing: '{0} 正在输入…', photo: '图片', you: '你',
      today: '今天', yesterday: '昨天',
      invite_title: '邀请朋友',
      invite_body: '把这个链接发给朋友。只能用一次，7 天内有效。',
      copy: '复制链接', copied: '链接已复制', share: '分享', close: '关闭',
      f_lang: '你的语言（消息会翻译成这种语言）', f_reads: '你还能看懂的其他语言',
      admin: '管理', removed_user: '已移除的成员', err_forbidden: '只有管理员可以这样做。',
      langs_btn: '语言设置', langs_title: '你能看懂哪些语言？',
      langs_body: '其他语言的消息会自动为你翻译。', save: '保存',
      translate: '翻译', auto_tr_on: '自动翻译：开', auto_tr_off: '自动翻译：关',
      err_translate_failed: '翻译失败，请再试一次。',
      reconnecting: '正在重新连接…', not_sent: '未连接，消息没有发出。',
      err_bad_invite: '邀请码不对、已被使用或已过期。',
      err_bad_name: '名字需要 2 到 20 个字符。',
      err_bad_password: '密码至少 6 个字符。',
      err_name_taken: '这个名字已经有人用了，换一个吧。',
      err_bad_login: '名字或密码不对。',
      err_slow_down: '尝试次数太多，请等几分钟。',
      err_too_big: '图片太大，上限是 6 MB。',
      err_bad_image: '只能发送 JPG、PNG、GIF 和 WebP 图片。',
      err_network: '连接不上服务器，请检查网络。',
      err_server: '服务器出了点问题，请再试一次。'
    }
  };
  let lang = store.get('qiao_lang') || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  function t(k, ...a) {
    let s = T[lang][k] != null ? T[lang][k] : (T.en[k] != null ? T.en[k] : k);
    a.forEach((v, i) => { s = s.replace('{' + i + '}', v); });
    return s;
  }
  const errText = code => T.en['err_' + code] ? t('err_' + code) : t('err_server');

  // ---------- state ----------
  let me = null, users = new Map(), online = new Set(), convs = {};
  let current = null, mode = 'login', ws = null, retry = 0, wantSocket = false;
  const cache = {};   // conv -> { list, more }
  const typers = {};  // conv -> { uid: timeout }
  const narrow = () => matchMedia('(max-width: 760px)').matches;
  const dmId = id => 'dm:' + [me.id, id].sort().join(':');
  const otherOf = conv => conv === 'lobby' ? null : users.get(conv.split(':').slice(1).find(id => id !== me.id));

  async function api(path, opts) {
    let res;
    try { res = await fetch(path, Object.assign({ credentials: 'same-origin' }, opts)); }
    catch { const e = new Error('network'); e.code = 'network'; throw e; }
    let body = {};
    try { body = await res.json(); } catch { /* not json */ }
    if (!res.ok) { const e = new Error(body.error || 'server'); e.code = body.error || 'server'; e.status = res.status; throw e; }
    return body;
  }
  const post = (path, data) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });

  let toastTimer;
  function toast(text, ms) {
    const b = $('#toast'); b.textContent = text; b.hidden = false;
    clearTimeout(toastTimer);
    if (ms !== 0) toastTimer = setTimeout(() => { b.hidden = true; }, ms || 3200);
  }

  // ---------- language ----------
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-lang]').forEach(n => { n.textContent = lang === 'zh' ? 'English' : '中文'; });
    $('#input').placeholder = t('type_here');
    showAutoTr();
    if (mode === 'join' && !$('#auth').hidden) drawJoinPicker();
    if ($('#langDlg').open) openLangs();
    $('#authGo').textContent = t(mode === 'login' ? 'go_login' : 'go_join');
    if (me) { renderSide(); if (current) { renderHead(); renderMsgs(true); } }
    showInvitedBy();
  }
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh'; store.set('qiao_lang', lang); applyLang();
  }));

  // ---------- language choice ----------
  const LANGS = { en: 'English', zh: '中文', hi: 'हिन्दी', vi: 'Tiếng Việt', ja: '日本語', ko: '한국어' };
  function langPicker(box, startLang, startReads) {
    box.textContent = '';
    const sel = el('select');
    for (const k of Object.keys(LANGS)) { const o = el('option', null, LANGS[k]); o.value = k; sel.append(o); }
    sel.value = startLang;
    const chips = el('div', 'chips');
    const drawChips = () => {
      const on = new Set([...chips.querySelectorAll('input:checked')].map(i => i.value));
      chips.textContent = '';
      for (const k of Object.keys(LANGS)) {
        if (k === sel.value) continue;
        const lab = el('label', 'chip'), cb = el('input'); cb.type = 'checkbox'; cb.value = k; cb.checked = on.has(k);
        lab.append(cb, el('span', null, LANGS[k])); chips.append(lab);
      }
    };
    for (const k of startReads || []) { const cb = el('input'); cb.type = 'checkbox'; cb.value = k; cb.checked = true; chips.append(cb); }
    drawChips(); sel.addEventListener('change', drawChips);
    const l1 = el('label'); l1.append(el('span', null, t('f_lang')), sel);
    const l2 = el('div', 'field'); l2.append(el('span', null, t('f_reads')), chips);
    box.append(l1, l2);
    return () => ({ lang: sel.value, reads: [sel.value, ...[...chips.querySelectorAll('input:checked')].map(i => i.value)] });
  }
  const guessLang = () => { const b = (navigator.language || '').toLowerCase().slice(0, 2); return lang === 'zh' ? 'zh' : (LANGS[b] && b !== 'zh' ? b : 'en'); };
  let pickJoin = null, pickDlg = null;
  function drawJoinPicker() { const cur = pickJoin ? pickJoin() : { lang: guessLang(), reads: [] }; pickJoin = langPicker($('#joinLangs'), cur.lang, cur.reads); }
  function openLangs() { pickDlg = langPicker($('#dlgLangs'), me.lang || guessLang(), me.reads || []); $('#closeLangs').hidden = !me.lang; if (!$('#langDlg').open) $('#langDlg').showModal(); }
  $('#langsBtn').addEventListener('click', openLangs);
  $('#closeLangs').addEventListener('click', () => $('#langDlg').close());
  $('#langDlg').addEventListener('cancel', ev => { if (!me || !me.lang) ev.preventDefault(); });
  $('#saveLangs').addEventListener('click', async () => {
    try {
      const r = await post('/api/prefs', pickDlg());
      me.lang = r.me.lang; me.reads = r.me.reads; trCache.clear();
      $('#langDlg').close(); if (current) renderMsgs(true);
    } catch (e) { toast(errText(e.code)); }
  });

  // ---------- sign in ----------
  let invitedBy = null;
  function showInvitedBy() {
    const n = $('#inviteBy');
    n.hidden = !(mode === 'join' && invitedBy);
    if (invitedBy) n.textContent = t('invited_by', invitedBy);
  }
  function setMode(m) {
    mode = m;
    $('#tabLogin').setAttribute('aria-selected', m === 'login');
    $('#tabJoin').setAttribute('aria-selected', m === 'join');
    $('#inviteField').hidden = m !== 'join';
    $('#joinLangs').hidden = m !== 'join';
    if (m === 'join') drawJoinPicker();
    $('#joinHint').hidden = m !== 'join' || !!invitedBy;
    $('#fPass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('#authGo').textContent = t(m === 'login' ? 'go_login' : 'go_join');
    $('#authErr').hidden = true;
    showInvitedBy();
  }
  $('#tabLogin').addEventListener('click', () => setMode('login'));
  $('#tabJoin').addEventListener('click', () => setMode('join'));
  $('#authForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('#authGo'); btn.disabled = true; $('#authErr').hidden = true;
    try {
      const body = { name: $('#fName').value, password: $('#fPass').value };
      if (mode === 'join') { body.invite = $('#fInvite').value.trim(); Object.assign(body, pickJoin()); }
      await post(mode === 'join' ? '/api/signup' : '/api/login', body);
      history.replaceState(null, '', '/');
      $('#fPass').value = '';
      await boot();
    } catch (e) {
      const n = $('#authErr'); n.textContent = errText(e.code); n.hidden = false;
    } finally { btn.disabled = false; }
  });
  function showAuth() {
    me = null; wantSocket = false; if (ws) ws.close();
    document.body.classList.remove('in-chat');
    $('#app').hidden = true; $('#auth').hidden = false;
    const code = new URLSearchParams(location.search).get('invite');
    if (code) {
      $('#fInvite').value = code;
      api('/api/invite-check?code=' + encodeURIComponent(code)).then(r => { invitedBy = r.ok ? r.by : null; setMode('join'); }).catch(() => {});
    }
    setMode(code ? 'join' : 'login');
  }
  $('#logoutBtn').addEventListener('click', async () => { try { await post('/api/logout'); } catch { /* signed out anyway */ } current = null; showAuth(); });

  // ---------- conversation list ----------
  function preview(m) {
    if (!m) return '';
    const who = m.from === me.id ? t('you') + ': ' : (m.conv === 'lobby' && users.get(m.from) ? users.get(m.from).name + ': ' : '');
    return who + (m.text || t('photo'));
  }
  function roomRow(conv, title, sub, user) {
    const b = el('button', 'room'); b.type = 'button';
    if (conv === current) b.setAttribute('aria-current', 'true');
    const av = el('span', 'avatar' + (user ? '' : ' lobby'), user ? [...user.name][0].toUpperCase() : '桥');
    if (user) { av.style.background = user.color; av.append(el('span', 'flame' + (online.has(user.id) ? ' lit' : ''))); }
    const text = el('span', 'text');
    text.append(el('div', 'who', title), el('div', 'last', sub));
    b.append(av, text);
    const c = convs[conv];
    if (c && c.unread) b.append(el('span', 'badge', c.unread > 99 ? '99+' : String(c.unread)));
    b.addEventListener('click', () => openConv(conv, true));
    return b;
  }
  function renderSide() {
    const box = $('#rooms'); box.textContent = '';
    box.append(roomRow('lobby', t('lobby'), preview(convs.lobby && convs.lobby.last) || t('lobby_sub'), null));
    box.append(el('div', 'group-label', t('people')));
    const others = [...users.values()].filter(u => u.id !== me.id);
    const lastTs = u => { const c = convs[dmId(u.id)]; return c && c.last ? c.last.ts : 0; };
    others.sort((a, b) => lastTs(b) - lastTs(a) || a.name.localeCompare(b.name));
    if (!others.length) box.append(el('p', 'note group-label', t('nobody')));
    for (const u of others) {
      const c = convs[dmId(u.id)];
      box.append(roomRow(dmId(u.id), u.name, preview(c && c.last) || t(online.has(u.id) ? 'online' : 'offline'), u));
    }
    $('#meName').textContent = me.name;
    $('#adminLink').hidden = !me.admin; $('#inviteBtn').hidden = !me.canInvite;
    const total = Object.values(convs).reduce((n, c) => n + (c.unread || 0), 0);
    document.title = (total ? '(' + total + ') ' : '') + 'Qiao 桥';
  }

  // ---------- messages ----------
  function renderHead() {
    const u = otherOf(current);
    $('#chatTitle').textContent = u ? u.name : t('lobby');
    $('#chatSub').textContent = u ? t(online.has(u.id) ? 'online' : 'offline') : t('lobby_sub');
  }
  function dayLabel(ts) {
    const d = new Date(ts), now = new Date();
    const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (days === 0) return t('today');
    if (days === 1) return t('yesterday');
    return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
  }
  const clock = ts => new Date(ts).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  function fillText(node, text) {
    const re = /https?:\/\/[^\s<>"']+/g; let i = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > i) node.append(text.slice(i, m.index));
      const a = el('a', null, m[0]); a.href = m[0]; a.target = '_blank'; a.rel = 'noopener noreferrer';
      node.append(a); i = m.index + m[0].length;
    }
    if (i < text.length) node.append(text.slice(i));
  }
  function msgNode(m, prev) {
    const mine = m.from === me.id;
    const wrap = el('div', 'msg' + (mine ? ' mine' : ''));
    const u = users.get(m.from);
    const newRun = !prev || prev.from !== m.from || m.ts - prev.ts > 5 * 60000 || dayLabel(prev.ts) !== dayLabel(m.ts);
    if (current === 'lobby' && !mine && newRun) {
      const f = el('div', 'from', u ? u.name : t('removed_user')); if (u) f.style.color = u.color; wrap.append(f);
    }
    const b = el('div', 'bubble');
    if (m.img) {
      const img = el('img'); img.src = '/u/' + m.img; img.alt = t('photo'); img.loading = 'lazy';
      img.addEventListener('click', () => { $('#photoBig').src = img.src; $('#photoDlg').showModal(); });
      img.addEventListener('load', () => { if (stick) toBottom(); });
      b.append(img);
    }
    if (m.text) { const s = el('span'); fillText(s, m.text); b.append(s); addTranslation(m, b); }
    const tm = el('time', null, clock(m.ts)); tm.dateTime = new Date(m.ts).toISOString();
    wrap.append(b, tm);
    return wrap;
  }
  // Translation of other people's messages into the reader's language:
  // automatic when the switch is on, otherwise a "Translate" button under each message.
  let autoTr = store.get('qiao_autotr') !== '0';
  const trCache = new Map(); // "id|lang" -> text, null (nothing to translate) or a pending promise
  // Languages are told apart by writing system; keep in sync with detectLangs in server.js.
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
  const myLang = () => me.lang || lang;
  function needsTr(text) {
    const reads = me.lang ? me.reads : [lang];
    return detectLangs(text).some(l => !reads.includes(l));
  }
  function fetchTr(m) {
    const key = m.id + '|' + myLang(), hit = trCache.get(key);
    if (hit !== undefined && typeof hit !== 'string' && hit !== null) return hit;
    if (hit !== undefined) return Promise.resolve(hit);
    const job = post('/api/translate', { conv: m.conv, id: m.id, to: myLang() })
      .then(r => { trCache.set(key, r.text); return r.text; })
      .catch(e => { trCache.delete(key); throw e; });
    trCache.set(key, job);
    return job;
  }
  function addTranslation(m, bubble) {
    if (!m.text || m.from === me.id || !needsTr(m.text)) return;
    const show = text => {
      if (!text) return;
      const wasStuck = stick;
      bubble.append(el('span', 'tr', text));
      if (wasStuck) toBottom();
    };
    const hit = trCache.get(m.id + '|' + myLang());
    if (typeof hit === 'string') return show(hit);
    if (hit === null) return;
    if (autoTr) { fetchTr(m).then(show).catch(() => {}); return; }
    const btn = el('button', 'tr trbtn', t('translate')); btn.type = 'button';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { const text = await fetchTr(m); btn.remove(); show(text); }
      catch (e) { btn.disabled = false; toast(errText(e.code === 'slow_down' ? e.code : 'translate_failed')); }
    });
    bubble.append(btn);
  }
  function showAutoTr() { $('#trToggle').textContent = t(autoTr ? 'auto_tr_on' : 'auto_tr_off'); $('#trToggle').setAttribute('aria-pressed', autoTr); }
  $('#trToggle').addEventListener('click', () => {
    autoTr = !autoTr; store.set('qiao_autotr', autoTr ? '1' : '0'); showAutoTr();
    if (current) renderMsgs(true);
  });
  let stick = true;
  const box = $('#msgs');
  const toBottom = () => { box.scrollTop = box.scrollHeight; };
  box.addEventListener('scroll', () => { stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80; });
  function renderMsgs(keepPlace) {
    const c = cache[current]; if (!c) return;
    const listEl = $('#msgList'), before = box.scrollHeight, top = box.scrollTop;
    listEl.textContent = '';
    $('#olderBtn').hidden = !c.more;
    if (!c.list.length) listEl.append(el('p', 'empty', t('empty_chat')));
    let prev = null;
    for (const m of c.list) {
      if (!prev || dayLabel(prev.ts) !== dayLabel(m.ts)) listEl.append(el('div', 'day', dayLabel(m.ts)));
      listEl.append(msgNode(m, prev)); prev = m;
    }
    if (keepPlace && !stick) box.scrollTop = top + (box.scrollHeight - before); else toBottom();
  }
  async function loadMsgs(conv, older) {
    const c = cache[conv] || (cache[conv] = { list: [], more: false });
    const q = '/api/messages?conv=' + encodeURIComponent(conv) + (older && c.list[0] ? '&before=' + c.list[0].id : '');
    const r = await api(q);
    c.list = older ? r.messages.concat(c.list) : r.messages;
    c.more = r.more;
  }
  async function openConv(conv, pushHistory) {
    current = conv; stick = true;
    $('#noChat').hidden = true; $('#pane').hidden = false;
    if (narrow() && pushHistory && !document.body.classList.contains('in-chat')) history.pushState({ chat: 1 }, '');
    document.body.classList.add('in-chat');
    renderHead(); renderSide(); showTyping();
    $('#msgList').textContent = ''; $('#olderBtn').hidden = true;
    try { await loadMsgs(conv, false); } catch (e) { if (e.status === 401) return showAuth(); toast(errText(e.code)); }
    if (current !== conv) return;
    renderMsgs(false); markRead();
    if (!narrow()) $('#input').focus();
  }
  function closeChat() { document.body.classList.remove('in-chat'); if (narrow()) { current = null; renderSide(); } }
  $('#backBtn').addEventListener('click', () => { if (history.state && history.state.chat) history.back(); else closeChat(); });
  addEventListener('popstate', closeChat);
  $('#olderBtn').addEventListener('click', async () => {
    const conv = current; stick = false;
    try { await loadMsgs(conv, true); } catch (e) { return toast(errText(e.code)); }
    if (conv === current) renderMsgs(true);
  });
  function markRead() {
    const c = convs[current];
    if (!current || document.hidden || !c || !c.unread) return;
    c.unread = 0; send({ t: 'read', conv: current }); renderSide();
  }
  document.addEventListener('visibilitychange', markRead);

  function showTyping() {
    const ids = Object.keys(typers[current] || {});
    const names = ids.map(id => users.get(id)).filter(Boolean).map(u => u.name);
    $('#typing').textContent = names.length ? t('typing', names.join(', ')) : '';
  }

  // ---------- socket ----------
  function send(obj) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
    return false;
  }
  function connect() {
    if (!wantSocket) return;
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = async () => {
      const again = retry > 0; retry = 0; $('#toast').hidden = true;
      if (again) { try { await refresh(); if (current) { await loadMsgs(current, false); renderMsgs(false); markRead(); } } catch { /* next reconnect will retry */ } }
    };
    ws.onmessage = ev => { let d; try { d = JSON.parse(ev.data); } catch { return; } onEvent(d); };
    ws.onclose = () => {
      if (!wantSocket) return;
      retry++; if (retry > 1) toast(t('reconnecting'), 0);
      api('/api/me').catch(e => { if (e.status === 401) { $('#toast').hidden = true; current = null; showAuth(); } }); // signed out or removed
      setTimeout(connect, Math.min(1000 * 2 ** (retry - 1), 15000));
    };
  }
  function onEvent(d) {
    if (d.t === 'msg') {
      const m = d.m, c = convs[m.conv] || (convs[m.conv] = { last: null, unread: 0 });
      c.last = m;
      if (cache[m.conv] && !cache[m.conv].list.some(x => x.id === m.id)) cache[m.conv].list.push(m);
      if (typers[m.conv] && typers[m.conv][m.from]) { clearTimeout(typers[m.conv][m.from]); delete typers[m.conv][m.from]; }
      if (m.conv === current) {
        const wasStuck = stick || m.from === me.id;
        renderMsgs(true); if (wasStuck) toBottom();
        showTyping();
        if (m.from !== me.id) { c.unread++; markRead(); }
      } else if (m.from !== me.id) c.unread++;
      renderSide();
    } else if (d.t === 'typing') {
      const map = typers[d.conv] || (typers[d.conv] = {});
      clearTimeout(map[d.from]);
      map[d.from] = setTimeout(() => { delete map[d.from]; if (d.conv === current) showTyping(); }, 4000);
      if (d.conv === current) showTyping();
    } else if (d.t === 'presence') {
      online = new Set(d.online); renderSide(); if (current) renderHead();
    } else if (d.t === 'gone') {
      const dm = me && d.id !== me.id ? dmId(d.id) : null;
      users.delete(d.id);
      if (dm && current === dm) { current = null; document.body.classList.remove('in-chat'); $('#pane').hidden = true; $('#noChat').hidden = false; }
      renderSide(); if (current) renderMsgs(true);
    } else if (d.t === 'user') {
      users.set(d.user.id, d.user); renderSide();
    } else if (d.t === 'read') {
      if (convs[d.conv]) { convs[d.conv].unread = 0; renderSide(); }
    } else if (d.t === 'error') {
      toast(errText(d.error));
    }
  }

  // ---------- composer ----------
  const input = $('#input');
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight + 2, 132) + 'px'; }
  let lastTyping = 0;
  input.addEventListener('input', () => {
    grow();
    if (current && input.value && Date.now() - lastTyping > 2500) { lastTyping = Date.now(); send({ t: 'typing', conv: current }); }
  });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing && !narrow()) { ev.preventDefault(); $('#composer').requestSubmit(); }
  });
  $('#composer').addEventListener('submit', ev => {
    ev.preventDefault();
    const text = input.value.trim(); if (!text || !current) return;
    if (!send({ t: 'send', conv: current, text })) return toast(t('not_sent'));
    input.value = ''; lastTyping = 0; grow(); stick = true; input.focus();
  });

  // photos are redrawn in the browser before upload: smaller files, and hidden location data is dropped
  function shrink(file) {
    return new Promise(resolve => {
      if (file.type === 'image/gif' || !/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => resolve(b || file), 'image/jpeg', scale === 1 ? 0.9 : 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  $('#file').addEventListener('change', async ev => {
    const file = ev.target.files[0]; ev.target.value = '';
    const conv = current; if (!file || !conv) return;
    const btn = $('#attachBtn'); btn.classList.add('busy');
    try {
      const blob = await shrink(file);
      if (blob.size > 6 * 1024 * 1024) { const e = new Error('too_big'); e.code = 'too_big'; throw e; }
      const r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
      if (!send({ t: 'send', conv, img: r.name, text: '' })) toast(t('not_sent')); else stick = true;
    } catch (e) { toast(errText(e.code)); }
    finally { btn.classList.remove('busy'); }
  });
  $('#photoDlg').addEventListener('click', () => $('#photoDlg').close());

  // ---------- invites ----------
  $('#inviteBtn').addEventListener('click', async () => {
    try {
      const r = await post('/api/invite');
      $('#inviteLink').value = location.origin + '/?invite=' + r.code;
      $('#shareBtn').hidden = !navigator.share;
      $('#inviteDlg').showModal();
    } catch (e) { toast(errText(e.code)); }
  });
  $('#copyBtn').addEventListener('click', async () => {
    const f = $('#inviteLink');
    try { await navigator.clipboard.writeText(f.value); }
    catch { f.select(); document.execCommand('copy'); }
    toast(t('copied'));
  });
  $('#shareBtn').addEventListener('click', () => { navigator.share({ title: 'Qiao 桥', url: $('#inviteLink').value }).catch(() => {}); });
  $('#closeInvite').addEventListener('click', () => $('#inviteDlg').close());

  // ---------- start ----------
  async function refresh() {
    const d = await api('/api/me');
    me = d.me; users = new Map(d.users.map(u => [u.id, u])); online = new Set(d.online); convs = d.convs;
    renderSide();
  }
  async function boot() {
    try { await refresh(); }
    catch (e) {
      if (e.status === 401) return showAuth();
      toast(errText(e.code), 0); return setTimeout(boot, 4000);
    }
    $('#toast').hidden = true;
    $('#auth').hidden = true; $('#app').hidden = false;
    if (!wantSocket) { wantSocket = true; retry = 0; connect(); }
    if (!narrow()) openConv('lobby', false);
    if (!me.lang) openLangs(); // accounts made before language choice existed
  }
  applyLang();
  boot();
})();
