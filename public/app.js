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
      theme_btn: 'Chat theme', theme_body: 'Everyone in this chat sees it.', theme_changed: '{0} changed the theme to {1}',
      th_custom: 'a photo', th_upload: 'Your photo',
      th_forest: 'Forest', th_sakura: 'Sakura', th_ocean: 'Ocean', th_sunset: 'Sunset', th_lavender: 'Lavender', th_midnight: 'Midnight', th_matcha: 'Matcha', th_candy: 'Candy',
      news: 'Announcements', news_sub: 'Updates and news', news_readonly: 'Only the admin can post here',
      news_hint: 'Tap a post to open its thread.', thread_start: 'Reply in thread', replies_one: '1 reply', replies_n: '{0} replies', replies_head: 'Replies',
      nobody: 'Nobody else is here yet. Invite a friend.',
      online: 'Here now', offline: 'Away',
      older: 'Show earlier messages', send: 'Send', send_photo: 'Send photos or videos',
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
      game_btn: 'Play a game', ttt: 'Tic-tac-toe', rps: 'Rock paper scissors', your_turn: 'Your turn', their_turn: "{0}'s turn",
      you_won: 'You won!', they_won: '{0} won', draw: "It's a draw", play_again: 'Play again', pick_one: 'Pick one',
      waiting_pick: 'Waiting for {0} to pick', they_picked: '{0} has picked. Your move',
      sent: 'Sent', seen: 'Seen', seen_by: 'Seen by {0}', seen_all: 'Seen by everyone',
      upd_title: 'Qiao was updated 🎉', upd_body: 'Refreshing in {0}…', upd_now: 'Refresh now',
      reply: 'Reply', copy_text: 'Copy', edit: 'Edit', delete: 'Delete', delete_confirm: 'Tap again to delete', cancel: 'Cancel',
      replying_to: 'Replying to {0}', replying_self: 'Replying to yourself', editing: 'Editing message', edited: 'edited', copied_text: 'Copied', msg_deleted: 'Message was deleted',
      notif_on: '🔔 Notifications: on', notif_off: '🔕 Notifications: off', notif_blocked: '🔕 Notifications: blocked',
      notif_unsupported: 'This browser cannot show notifications. On iPhone, add Qiao to the Home Screen first.',
      notif_blocked_help: 'Notifications are blocked. Allow them for this site in your browser settings, then try again.',
      translate: 'Translate', auto_tr_on: 'Auto-translate: on', auto_tr_off: 'Auto-translate: off',
      err_translate_failed: 'Could not translate that message. Try again.',
      reconnecting: 'Reconnecting…', not_sent: 'Not connected. Your message was not sent.',
      err_bad_invite: 'That invite code is wrong, used, or expired.',
      err_bad_name: 'Pick a name between 2 and 20 characters.',
      err_bad_password: 'Use a password with at least 6 characters.',
      err_name_taken: 'Someone already uses that name. Pick another.',
      err_bad_login: 'Wrong name or password.',
      err_slow_down: 'Too many tries. Wait a few minutes.',
      err_too_big: 'That file is too large. Photos can be up to 15 MB and videos up to 40 MB.',
      err_bad_image: 'Only photos (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) can be sent.',
      profile: 'Profile', edit_profile: 'Edit profile', message_btn: 'Message', change_photo: 'Change photo', remove_photo: 'Remove', p_name: 'Name', p_mood: 'Mood', p_mood_ph: 'What are you up to?', p_bio: 'Bio', p_bio_ph: 'A few words about you', p_color: 'Colour (when there is no photo)', p_signin: 'You can sign in with “{0}” or your new name.', p_joined: 'Joined {0}', p_reads: 'Reads {0}', st_msgs: 'messages', st_media: 'photos & videos', st_days: 'days chatting', st_days_me: 'days on Qiao', st_sent: 'sent', p_shared: 'Shared between you', p_none_shared: 'No photos or videos yet', p_saved: 'Profile saved ✨', p_no_bio: 'Add a bio so friends get to know you.', p_clear: 'Clear', err_too_long: 'That is too long.',
      video: 'Video', photos_n: '{0} photos', uploading: 'Uploading {0}/{1}… {2}%', too_many: 'You can send up to 10 at once.',
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
      theme_btn: '聊天主题', theme_body: '聊天里的每个人都会看到。', theme_changed: '{0} 把主题换成了{1}',
      th_custom: '一张照片', th_upload: '自己的照片',
      th_forest: '森林', th_sakura: '樱花', th_ocean: '海洋', th_sunset: '日落', th_lavender: '薰衣草', th_midnight: '午夜', th_matcha: '抹茶', th_candy: '糖果',
      news: '公告', news_sub: '更新和消息', news_readonly: '只有管理员可以在这里发言',
      news_hint: '点一条公告就能打开它的讨论。', thread_start: '在讨论里回复', replies_one: '1 条回复', replies_n: '{0} 条回复', replies_head: '回复',
      nobody: '这里还没有其他人，邀请一位朋友吧。',
      online: '在线', offline: '离开',
      older: '查看更早的消息', send: '发送', send_photo: '发送照片或视频',
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
      game_btn: '玩游戏', ttt: '井字棋', rps: '石头剪刀布', your_turn: '轮到你了', their_turn: '轮到 {0}',
      you_won: '你赢了！', they_won: '{0} 赢了', draw: '平局', play_again: '再来一局', pick_one: '选一个',
      waiting_pick: '等 {0} 出拳', they_picked: '{0} 已经出了，轮到你',
      sent: '已发送', seen: '已读', seen_by: '{0} 已读', seen_all: '所有人已读',
      upd_title: 'Qiao 更新了 🎉', upd_body: '{0} 秒后自动刷新…', upd_now: '立即刷新',
      reply: '回复', copy_text: '复制', edit: '编辑', delete: '删除', delete_confirm: '再点一次删除', cancel: '取消',
      replying_to: '回复 {0}', replying_self: '回复自己的消息', editing: '正在编辑消息', edited: '已编辑', copied_text: '已复制', msg_deleted: '消息已被删除',
      notif_on: '🔔 消息通知：开', notif_off: '🔕 消息通知：关', notif_blocked: '🔕 消息通知：被阻止',
      notif_unsupported: '这个浏览器不能显示通知。iPhone 需要先把 Qiao 添加到主屏幕。',
      notif_blocked_help: '通知被阻止了。请在浏览器设置里允许这个网站发送通知，然后再试一次。',
      translate: '翻译', auto_tr_on: '自动翻译：开', auto_tr_off: '自动翻译：关',
      err_translate_failed: '翻译失败，请再试一次。',
      reconnecting: '正在重新连接…', not_sent: '未连接，消息没有发出。',
      err_bad_invite: '邀请码不对、已被使用或已过期。',
      err_bad_name: '名字需要 2 到 20 个字符。',
      err_bad_password: '密码至少 6 个字符。',
      err_name_taken: '这个名字已经有人用了，换一个吧。',
      err_bad_login: '名字或密码不对。',
      err_slow_down: '尝试次数太多，请等几分钟。',
      err_too_big: '文件太大了。照片最大 15 MB，视频最大 40 MB。',
      err_bad_image: '只能发送照片（JPG、PNG、GIF、WebP）和视频（MP4、WebM、MOV）。',
      profile: '个人主页', edit_profile: '编辑资料', message_btn: '发消息', change_photo: '换头像', remove_photo: '删除', p_name: '名字', p_mood: '心情', p_mood_ph: '你在做什么？', p_bio: '简介', p_bio_ph: '介绍一下自己吧', p_color: '颜色（没有头像时显示）', p_signin: '登录时可以用“{0}”或新名字。', p_joined: '{0} 加入', p_reads: '看得懂 {0}', st_msgs: '条消息', st_media: '照片和视频', st_days: '天聊天', st_days_me: '天在桥上', st_sent: '已发送', p_shared: '你们分享过的', p_none_shared: '还没有照片或视频', p_saved: '资料已保存 ✨', p_no_bio: '写个简介，让朋友更了解你。', p_clear: '清除', err_too_long: '太长了。',
      video: '视频', photos_n: '{0} 张照片', uploading: '正在上传 {0}/{1}… {2}%', too_many: '一次最多发送 10 个。',
      err_network: '连接不上服务器，请检查网络。',
      err_server: '服务器出了点问题，请再试一次。'
    }
  };
  Object.assign(T, window.QIAO_I18N || {});
  const LANGS = { en: 'English', zh: '中文', hi: 'हिन्दी', vi: 'Tiếng Việt', ja: '日本語', ko: '한국어' };
  const LOCALE = { en: 'en-GB', zh: 'zh-CN', hi: 'hi-IN', vi: 'vi-VN', ja: 'ja-JP', ko: 'ko-KR' };
  const known = k => Object.prototype.hasOwnProperty.call(LANGS, k);
  let lang = store.get('qiao_lang');
  if (!known(lang)) { lang = (navigator.language || '').toLowerCase().slice(0, 2); if (!known(lang)) lang = 'en'; }
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
  const otherOf = conv => !conv.startsWith('dm:') ? null : users.get(conv.split(':').slice(1).find(id => id !== me.id));

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
    document.documentElement.lang = LOCALE[lang];
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-label]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nLabel)); n.title = t(n.dataset.i18nLabel); });
    document.querySelectorAll('[data-lang]').forEach(n => { n.textContent = '🌐 ' + LANGS[lang]; });
    $('#input').placeholder = t('type_here');
    showAutoTr(); showNotif();
    if (mode === 'join' && !$('#auth').hidden) drawJoinPicker();
    if ($('#langDlg').open) openLangs(true);
    $('#authGo').textContent = t(mode === 'login' ? 'go_login' : 'go_join');
    if (me) { renderSide(); if (current) { renderHead(); renderMsgs(true); } }
    showInvitedBy();
  }
  function setUiLang(k) { if (!known(k) || k === lang) return; lang = k; store.set('qiao_lang', k); applyLang(); }
  // The globe button: logged in it opens the full language settings, logged out a plain list.
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    if (me) return openLangs();
    const box = $('#uiLangs'); box.textContent = '';
    for (const k of Object.keys(LANGS)) {
      const c = el('button', 'pick' + (k === lang ? ' on' : ''), LANGS[k]); c.type = 'button'; c.lang = LOCALE[k];
      c.addEventListener('click', () => { pickJoin = null; setUiLang(k); $('#uiLangDlg').close(); });
      box.append(c);
    }
    $('#uiLangDlg').showModal();
  }));
  $('#uiLangDlg').addEventListener('click', ev => { if (ev.target === $('#uiLangDlg')) $('#uiLangDlg').close(); });

  // ---------- language choice ----------
  // One main language per person: the app is shown in it and messages are translated into it.
  // Language names are always written in their own script, and picking one switches the whole
  // screen at once, so nobody has to read a language they do not know to get through this.
  function langPicker(box, startLang, startReads, onMain) {
    box.textContent = '';
    let main = known(startLang) ? startLang : 'en';
    const on = new Set((startReads || []).filter(k => known(k) && k !== main));
    const mains = el('div', 'chips'), others = el('div', 'chips');
    const chip = (type, k, checked, change) => {
      const lab = el('label', 'chip'), inp = el('input'); inp.type = type; inp.value = k; inp.checked = checked;
      if (type === 'radio') inp.name = 'main-' + box.id;
      inp.addEventListener('change', () => change(inp.checked));
      const name = el('span', null, LANGS[k]); name.lang = LOCALE[k];
      lab.append(inp, name); return lab;
    };
    const draw = () => {
      mains.textContent = ''; others.textContent = '';
      for (const k of Object.keys(LANGS)) {
        mains.append(chip('radio', k, k === main, () => { main = k; draw(); onMain(k); }));
        if (k !== main) others.append(chip('checkbox', k, on.has(k), c => { if (c) on.add(k); else on.delete(k); }));
      }
    };
    draw();
    const f1 = el('div', 'field'); f1.append(el('span', null, t('f_lang')), mains);
    const f2 = el('div', 'field'); f2.append(el('span', null, t('f_reads')), others);
    box.append(f1, f2);
    return () => ({ lang: main, reads: [main, ...[...on].filter(k => k !== main)] });
  }
  let pickJoin = null, pickDlg = null;
  function drawJoinPicker() { const cur = pickJoin ? pickJoin() : { lang, reads: [] }; pickJoin = langPicker($('#joinLangs'), cur.lang, cur.reads, setUiLang); }
  function openLangs(redraw) {
    const cur = redraw === true && pickDlg ? pickDlg() : { lang: me.lang || lang, reads: me.reads || [] };
    pickDlg = langPicker($('#dlgLangs'), cur.lang, cur.reads, setUiLang);
    $('#closeLangs').hidden = !me.lang;
    if (!$('#langDlg').open) $('#langDlg').showModal();
  }
  $('#langsBtn').addEventListener('click', () => openLangs());
  $('#closeLangs').addEventListener('click', () => $('#langDlg').close());
  $('#langDlg').addEventListener('cancel', ev => { if (!me || !me.lang) ev.preventDefault(); });
  $('#langDlg').addEventListener('close', () => { pickDlg = null; if (me && me.lang) setUiLang(me.lang); }); // closed without saving: back to the saved language
  $('#saveLangs').addEventListener('click', async () => {
    try {
      const r = await post('/api/prefs', pickDlg());
      me.lang = r.me.lang; me.reads = r.me.reads; trCache.clear();
      $('#langDlg').close(); setUiLang(me.lang); if (current) renderMsgs(true);
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
  $('#logoutBtn').addEventListener('click', async () => { try { if (pushSub) { await post('/api/push/unsubscribe', { endpoint: pushSub.endpoint }); await pushSub.unsubscribe(); pushSub = null; } await post('/api/logout'); } catch { /* signed out anyway */ } current = null; showAuth(); });

  // ---------- conversation list ----------
  function preview(m) {
    if (!m) return '';
    const who = m.sys ? '' : m.from === me.id ? t('you') + ': ' : (m.conv === 'lobby' && users.get(m.from) ? users.get(m.from).name + ': ' : '');
    return who + msgLabel(m);
  }
  const THEMES = { forest: '🌲', sakura: '🌸', ocean: '🌊', sunset: '🌅', lavender: '💜', midnight: '🌙', matcha: '🍵', candy: '🍬' };
  const themeLabel = k => k === 'custom' ? '🖼️ ' + t('th_custom') : (THEMES[k] || '') + ' ' + t('th_' + k);
  const themeOf = v => typeof v === 'string' ? { key: v } : (v && v.key ? v : { key: 'forest' });
  // a custom photo theme: the photo is the background, bubbles take a colour from it
  function applyTheme(v) {
    const th = themeOf(v), pane = $('#pane');
    pane.dataset.theme = th.key;
    const props = ['--c-bg', '--c-mine', '--c-mine-ink', '--c-accent', '--c-accent-ink'];
    if (th.key !== 'custom') { for (const p of props) pane.style.removeProperty(p); return; }
    const ink = inkFor(th.accent);
    pane.style.setProperty('--c-bg', 'linear-gradient(rgb(0 0 0 / .16), rgb(0 0 0 / .16)), url("/u/' + th.img + '") center / cover no-repeat');
    pane.style.setProperty('--c-mine', th.accent); pane.style.setProperty('--c-mine-ink', ink);
    pane.style.setProperty('--c-accent', th.accent); pane.style.setProperty('--c-accent-ink', ink);
  }
  function inkFor(hex) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] > .45 ? '#1d1d1f' : '#ffffff';
  }
  // pick a lively colour from the photo: its average hue, made saturated enough to stand out
  function accentFrom(blob) {
    return new Promise(resolve => {
      const img = new Image(), url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const cv = document.createElement('canvas'); cv.width = cv.height = 24;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 24, 24);
        const px = cx.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < px.length; i += 4) {
          const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]);
          const wt = 1 + (mx - mn) / 32; // colourful pixels count more than grey ones
          r += px[i] * wt; g += px[i + 1] * wt; b += px[i + 2] * wt; w += wt;
        }
        r /= w * 255; g /= w * 255; b /= w * 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let h = 0;
        if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        const sat = d ? Math.max(.5, Math.min(.85, d / (1 - Math.abs(mx + mn - 1)) + .2)) : 0, lig = .56;
        const k = n => (n + h / 30) % 12, a = sat * Math.min(lig, 1 - lig);
        const f = n => Math.round(255 * (lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
        resolve('#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join(''));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve('#f2b950'); };
      img.src = url;
    });
  }
  const fresh = new Set(); // messages that just arrived, to animate once
  const annText = m => m.ann ? m.ann[lang] || m.ann.en || '' : '';
  function msgLabel(m) { if (m.sys) return t('theme_changed', nameOf(m.from), themeLabel(m.sys.theme)); return m.text || annText(m) || (m.game ? '🎮 ' + t(m.game.kind || m.game) : mediaLabel(m)); }
  const isVideo = n => /\.(mp4|webm|mov)$/.test(n);
  const mediaOf = m => m.media || (m.img ? [m.img] : []);
  function mediaLabel(m) { const f = mediaOf(m); if (f.some(isVideo)) return '🎬 ' + t('video'); return f.length > 1 ? '📷 ' + t('photos_n', f.length) : t('photo'); }
  function roomRow(conv, title, sub, user) {
    const b = el('button', 'room'); b.type = 'button';
    if (conv === current || (conv === 'news' && current && current.startsWith('th:'))) b.setAttribute('aria-current', 'true');
    const av = user ? avatarEl(user) : el('span', 'avatar lobby', conv === 'news' ? '📣' : '桥');
    if (user) av.append(el('span', 'flame' + (online.has(user.id) ? ' lit' : '')));
    const text = el('span', 'text'), who = el('div', 'who');
    who.append(el('span', 'who-name', title));
    if (user && user.mood) who.append(el('span', 'mood-chip', user.mood));
    text.append(who, el('div', 'last', sub));
    b.append(av, text);
    let n = (convs[conv] && convs[conv].unread) || 0;
    if (conv === 'news') for (const k of Object.keys(convs)) if (k.startsWith('th:')) n += convs[k].unread || 0;
    if (n) b.append(el('span', 'badge', n > 99 ? '99+' : String(n)));
    b.addEventListener('click', () => openConv(conv, true));
    return b;
  }
  function renderSide() {
    const box = $('#rooms'); box.textContent = '';
    box.append(roomRow('news', t('news'), preview(convs.news && convs.news.last) || t('news_sub'), null));
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
    $('#meName').textContent = me.name; $('#meMood').textContent = me.mood || t('edit_profile');
    $('#meAv').replaceChildren(avatarEl(me, 'sm'));
    $('#adminLink').hidden = !me.admin; $('#inviteBtn').hidden = !me.canInvite;
    const total = Object.values(convs).reduce((n, c) => n + (c.unread || 0), 0);
    document.title = (total ? '(' + total + ') ' : '') + 'Qiao 桥';
  }

  // ---------- profiles ----------
  // a round picture: their photo, or their first letter on their colour
  function avatarEl(u, size) {
    const a = el('span', 'avatar' + (size ? ' ' + size : ''));
    a.style.background = u.color;
    if (u.avatar) { const img = el('img'); img.src = '/u/' + u.avatar; img.alt = ''; img.draggable = false; a.append(img); a.classList.add('has-photo'); }
    else a.textContent = [...(u.name || '?')][0].toUpperCase();
    return a;
  }
  const fmtN = n => Number(n || 0).toLocaleString(LOCALE[lang]);
  const daysSince = ts => ts ? Math.max(1, Math.ceil((Date.now() - ts) / 864e5)) : 0;
  let profId = null, profData = null;
  async function openProfile(id) {
    const u = users.get(id); if (!u) return;
    profId = id; profData = null; drawProfile(u, null);
    if (!$('#profDlg').open) $('#profDlg').showModal();
    try {
      const d = await api('/api/profile?id=' + encodeURIComponent(id));
      if (profId === id && $('#profDlg').open) { profData = d; drawProfile(users.get(id) || d.user, d); }
    } catch (e) { toast(errText(e.code)); }
  }
  function drawProfile(u, d) {
    const self = u.id === me.id;
    const note = $('#profNote'); note.hidden = !u.mood; note.textContent = u.mood || '';
    if (d && d.moodTr) note.append(el('span', 'note-tr', d.moodTr));
    const av = avatarEl(u, 'xl'); if (!self) av.append(el('span', 'flame' + (online.has(u.id) ? ' lit' : '')));
    $('#profAv').replaceChildren(av); $('#profAv').classList.toggle('lit', self || online.has(u.id));
    $('#profAv').onclick = () => { if (u.avatar) openViewer([u.avatar], 0); else if (self) openEdit(); };
    $('#profName').textContent = u.name;
    const bio = d ? d.bio : '';
    $('#profBio').textContent = bio || (self && d ? t('p_no_bio') : '');
    $('#profBio').classList.toggle('blank', !bio);
    $('#profBioTr').hidden = !(d && d.bioTr); $('#profBioTr').textContent = (d && d.bioTr) || '';
    const stats = $('#profStats'); stats.textContent = '';
    const nums = !d ? [['–', 'st_msgs'], ['–', 'st_media'], ['–', self ? 'st_days_me' : 'st_days']]
      : self ? [[fmtN(d.sent), 'st_sent'], [fmtN(d.mediaCount), 'st_media'], [fmtN(daysSince(d.ts)), 'st_days_me']]
      : [[fmtN(d.count), 'st_msgs'], [fmtN(d.mediaCount), 'st_media'], [fmtN(daysSince(d.since)), 'st_days']];
    for (const [n, k] of nums) { const c = el('div', 'stat'); c.append(el('b', null, n), el('span', null, t(k))); stats.append(c); }
    const chips = $('#profChips'); chips.textContent = '';
    if (d) {
      chips.append(el('span', 'pchip', '🗓 ' + t('p_joined', new Date(d.ts).toLocaleDateString(LOCALE[lang], { month: 'long', year: 'numeric' }))));
      const reads = (d.reads && d.reads.length ? d.reads : d.lang ? [d.lang] : []).map(l => LANGS[l]).filter(Boolean);
      if (reads.length) chips.append(el('span', 'pchip', '🌐 ' + t('p_reads', reads.join(' · '))));
    }
    const act = $('#profAct');
    act.textContent = t(self ? 'edit_profile' : 'message_btn');
    act.onclick = () => { if (self) openEdit(); else { $('#profDlg').close(); openConv(dmId(u.id), true); } };
    const sh = $('#profShared'); sh.textContent = '';
    if (!self && d) {
      sh.append(el('h3', 'prof-h', t('p_shared')));
      if (!d.media.length) sh.append(el('p', 'prof-none', t('p_none_shared')));
      const grid = el('div', 'prof-grid');
      d.media.forEach((f, i) => {
        const cell = el('button', 'pcell'); cell.type = 'button';
        if (isVideo(f)) { const v = el('video'); v.src = '/u/' + f + '#t=0.1'; v.muted = true; v.preload = 'metadata'; v.playsInline = true; cell.append(v, el('span', 'play')); }
        else { const img = el('img'); img.src = '/u/' + f; img.alt = t('photo'); img.loading = 'lazy'; img.draggable = false; cell.append(img); }
        cell.addEventListener('click', () => openViewer(d.media, i));
        grid.append(cell);
      });
      sh.append(grid);
    }
  }
  $('#profClose').addEventListener('click', () => $('#profDlg').close());
  $('#profDlg').addEventListener('click', ev => { if (ev.target === $('#profDlg')) $('#profDlg').close(); });
  $('#profDlg').addEventListener('close', () => { profId = null; });
  $('#meBtn').addEventListener('click', () => openProfile(me.id));
  $('#headInfo').addEventListener('click', () => { const u = otherOf(current); if (u) openProfile(u.id); });

  // editing your own profile
  const MOODS = ['😊', '😴', '🎮', '📚', '🎵', '☕', '🍜', '🌙', '💪', '✈️', '🤒', '❤️'];
  const COLORS = ['#f2b950', '#7fd1ae', '#f08a6b', '#8fb8f0', '#d9a0e8', '#b9d86a', '#f0a3b5', '#6fd3d8'];
  const LEAD_EMOJI = /^(\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*\s*)+/u;
  let edAvatar, edColor;
  function drawEdit() {
    const name = $('#edName').value.trim() || me.name;
    const u = { ...me, name, color: edColor, avatar: edAvatar === undefined ? me.avatar : edAvatar };
    $('#edAv').replaceChildren(avatarEl(u, 'lg')); $('#edNoPhoto').hidden = !u.avatar;
    const handle = me.handle || me.name;
    $('#edSignin').hidden = name === handle; $('#edSignin').textContent = t('p_signin', handle);
    $('#edCount').textContent = [...$('#edBio').value].length + ' / 150';
    for (const b of $('#edColors').children) b.setAttribute('aria-pressed', String(b.dataset.c === edColor));
    for (const b of $('#moodPicks').children) b.setAttribute('aria-pressed', String($('#edMood').value.startsWith(b.textContent)));
  }
  function openEdit() {
    edAvatar = undefined; edColor = me.color;
    $('#edName').value = me.name; $('#edMood').value = me.mood || ''; $('#edBio').value = me.bio || '';
    $('#edMood').placeholder = t('p_mood_ph'); $('#edBio').placeholder = t('p_bio_ph');
    const cs = $('#edColors'); cs.textContent = '';
    for (const c of COLORS) { const b = el('button', 'ed-color'); b.type = 'button'; b.dataset.c = c; b.style.background = c; b.setAttribute('aria-label', c); b.addEventListener('click', () => { edColor = c; drawEdit(); }); cs.append(b); }
    const mp = $('#moodPicks'); mp.textContent = '';
    for (const e of MOODS) {
      const b = el('button', 'mood-pick', e); b.type = 'button';
      b.addEventListener('click', () => { const rest = $('#edMood').value.replace(LEAD_EMOJI, '').trim(); $('#edMood').value = (e + ' ' + rest).slice(0, 40); drawEdit(); $('#edMood').focus(); });
      mp.append(b);
    }
    drawEdit();
    if (!$('#editDlg').open) $('#editDlg').showModal();
  }
  for (const id of ['#edName', '#edMood', '#edBio']) $(id).addEventListener('input', drawEdit);
  $('#edMoodClear').addEventListener('click', () => { $('#edMood').value = ''; drawEdit(); });
  $('#edPhoto').addEventListener('click', () => $('#edFile').click());
  $('#edNoPhoto').addEventListener('click', () => { edAvatar = null; drawEdit(); });
  $('#edCancel').addEventListener('click', () => $('#editDlg').close());
  $('#editDlg').addEventListener('click', ev => { if (ev.target === $('#editDlg')) $('#editDlg').close(); });
  // profile photos are cut to a centred square, which also drops hidden location data
  function squareCrop(file, size) {
    return new Promise(resolve => {
      if (file.type === 'image/gif') return resolve(file); // keep GIFs moving
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const side = Math.min(img.width, img.height), out = Math.min(size, side);
        const cv = document.createElement('canvas'); cv.width = cv.height = out;
        cv.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
        cv.toBlob(b => resolve(b || file), 'image/jpeg', 0.88);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  $('#edFile').addEventListener('change', async ev => {
    const file = ev.target.files[0]; ev.target.value = ''; if (!file) return;
    const box = $('#edAv'); box.classList.add('busy');
    try {
      const blob = await squareCrop(file, 640);
      if (blob.size > 6 * 1024 * 1024) { const e = new Error('too_big'); e.code = 'too_big'; throw e; }
      const r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
      if (r.video) { const e = new Error('bad_image'); e.code = 'bad_image'; throw e; }
      edAvatar = r.name; drawEdit();
    } catch (e) { toast(errText(e.code)); }
    finally { box.classList.remove('busy'); }
  });
  $('#edSave').addEventListener('click', async () => {
    const btn = $('#edSave'); if (btn.disabled) return; btn.disabled = true;
    const body = { name: $('#edName').value, mood: $('#edMood').value, bio: $('#edBio').value, color: edColor };
    if (edAvatar !== undefined) body.avatar = edAvatar;
    try {
      const d = await post('/api/profile', body);
      me = d.me; users.set(me.id, { ...users.get(me.id), ...me });
      $('#editDlg').close(); toast(t('p_saved'));
      renderSide(); if (current) renderHead();
      if ($('#profDlg').open && profId === me.id) openProfile(me.id);
    } catch (e) { toast(errText(e.code)); }
    finally { btn.disabled = false; }
  });

  // ---------- messages ----------
  $('#gameBtn').addEventListener('click', () => { if ($('#gameDlg').open) return; $('#gameDlg').showModal(); });
  for (const b of document.querySelectorAll('#gameDlg [data-game]')) b.addEventListener('click', () => { $('#gameDlg').close(); startGame(b.dataset.game); });
  $('#gameDlg').addEventListener('click', ev => { if (ev.target === $('#gameDlg')) $('#gameDlg').close(); });
  $('#themeBtn').addEventListener('click', () => {
    const box = $('#swatches'); box.textContent = '';
    const curTheme = themeOf(cache[current] && cache[current].theme), cur = curTheme.key;
    // first tile: upload your own photo (shows the current one if the chat already uses a photo)
    const up = el('button', 'swatch upload'); up.type = 'button'; up.setAttribute('aria-pressed', String(cur === 'custom'));
    const upArt = el('span', 'sw-art');
    if (cur === 'custom') upArt.style.background = 'url("/u/' + curTheme.img + '") center / cover'; else upArt.textContent = '+';
    up.append(upArt, el('span', null, '🖼️ ' + t('th_upload')));
    up.addEventListener('click', () => $('#themeFile').click());
    box.append(up);
    for (const k of Object.keys(THEMES)) {
      const b = el('button', 'swatch'); b.type = 'button'; b.dataset.theme = k; b.setAttribute('aria-pressed', String(k === cur));
      const art = el('span', 'sw-art'); art.append(el('span', 'sw-a'), el('span', 'sw-b'), el('span', 'sw-c'));
      b.append(art, el('span', null, themeLabel(k)));
      b.addEventListener('click', () => { $('#themeDlg').close(); if (k !== cur && !send({ t: 'theme', conv: current, key: k })) toast(t('not_sent')); });
      box.append(b);
    }
    $('#themeDlg').showModal();
  });
  $('#closeTheme').addEventListener('click', () => $('#themeDlg').close());
  $('#themeFile').addEventListener('change', async ev => {
    const file = ev.target.files[0]; ev.target.value = '';
    const conv = current; if (!file || !conv) return;
    const tile = document.querySelector('.swatch.upload'); if (tile) tile.classList.add('busy');
    try {
      const blob = await shrink(file);
      if (blob.size > 6 * 1024 * 1024) { const e = new Error('too_big'); e.code = 'too_big'; throw e; }
      const accent = await accentFrom(blob);
      const r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
      $('#themeDlg').close();
      if (!send({ t: 'theme', conv, key: 'custom', img: r.name, accent })) toast(t('not_sent'));
    } catch (e) { toast(errText(e.code)); }
    finally { if (tile) tile.classList.remove('busy'); }
  });
  $('#themeDlg').addEventListener('click', ev => { if (ev.target === $('#themeDlg')) $('#themeDlg').close(); });
  function renderHead() {
    $('#gameBtn').hidden = !current.startsWith('dm:');
    const thread = current.startsWith('th:');
    $('#themeBtn').hidden = current === 'news' || thread;
    const readOnly = current === 'news' && !me.admin; // only the admin posts announcements; everyone can reply in threads
    $('#composer').hidden = readOnly; $('#newsNote').hidden = !readOnly;
    $('#newsNote').textContent = t('news_readonly'); $('#newsNote').append(el('span', 'hint-line', t('news_hint')));
    const hu = otherOf(current);
    const hav = hu ? avatarEl(hu, 'md') : el('span', 'avatar md lobby', current === 'lobby' ? '桥' : '📣');
    if (hu) hav.append(el('span', 'flame' + (online.has(hu.id) ? ' lit' : '')));
    $('#headAv').replaceChildren(hav); $('#headInfo').disabled = !hu;
    if (thread) {
      const root = cache[current] && cache[current].root;
      $('#chatTitle').textContent = root ? postTitle(root) : t('news');
      $('#chatSub').textContent = t('news');
      return;
    }
    const u = otherOf(current), group = current === 'news' ? 'news' : 'lobby';
    $('#chatTitle').textContent = u ? u.name : t(group);
    $('#chatSub').textContent = u ? t(online.has(u.id) ? 'online' : 'offline') + (u.mood ? ' · ' + u.mood : '') : t(group + '_sub');
  }
  function dayLabel(ts) {
    const d = new Date(ts), now = new Date();
    const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (days === 0) return t('today');
    if (days === 1) return t('yesterday');
    return d.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
  }
  const clock = ts => new Date(ts).toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit' });
  function fillText(node, text) {
    const re = /https?:\/\/[^\s<>"']+/g; let i = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > i) node.append(text.slice(i, m.index));
      const a = el('a', null, m[0]); a.href = m[0]; a.target = '_blank'; a.rel = 'noopener noreferrer';
      node.append(a); i = m.index + m[0].length;
    }
    if (i < text.length) node.append(text.slice(i));
  }
  const sameRun = (a, b) => a && b && !a.sys && !b.sys && a.from === b.from && Math.abs(b.ts - a.ts) <= 5 * 60000 && dayLabel(a.ts) === dayLabel(b.ts);
  const nameOf = id => id === me.id ? t('you') : id === 'qiao' ? 'Qiao 桥' : (users.get(id) ? users.get(id).name : t('removed_user'));
  function quoteNode(re) {
    const q = el('button', 'quote'); q.type = 'button';
    if (re.gone) q.append(el('span', 'qtext', t('msg_deleted')));
    else q.append(el('span', 'qwho', nameOf(re.from)), el('span', 'qtext', re.text || (re.game ? '🎮 ' + t(re.game) : t('photo'))));
    q.addEventListener('click', () => jumpTo(re.id));
    return q;
  }
  function msgNode(m, prev, next) {
    if (m.sys) { const n = el('div', 'sysline', msgLabel(m)); n.dataset.id = m.id; return n; }
    const mine = m.from === me.id;
    const wrap = el('div', 'msg' + (mine ? ' mine' : '') + (sameRun(prev, m) ? ' cont has-prev' : '') + (sameRun(m, next) ? ' has-next' : ''));
    if (fresh.delete(m.id)) wrap.classList.add('pop');
    wrap.dataset.id = m.id;
    const u = users.get(m.from);
    if (!current.startsWith('dm:') && !mine && !sameRun(prev, m)) {
      const f = el('div', 'from'); if (u) { f.style.color = u.color; f.append(avatarEl(u, 'xs')); } else if (m.from === 'qiao') f.style.color = 'var(--candle)';
      f.append(nameOf(m.from));
      if (u) { f.classList.add('tap'); f.addEventListener('click', () => openProfile(u.id)); }
      wrap.append(f);
    }
    const b = el('div', 'bubble');
    if (m.re) b.append(quoteNode(m.re));
    if (mediaOf(m).length) { b.append(mediaGrid(m)); if (!m.text && !m.re) b.classList.add('media-only'); }
    if (m.text) { const s = el('span', 'body'); fillText(s, m.text); b.append(s); addTranslation(m, b); }
    if (m.ann) { b.classList.add('ann'); const s = el('span', 'body'); fillText(s, annText(m)); b.append(s); }
    if (m.game) { b.classList.add('game-b'); b.append(gameNode(m)); }
    const hint = el('span', 'reply-hint'); hint.innerHTML = ICON.reply; hint.setAttribute('aria-hidden', 'true');
    wrap.append(hint, b);
    if (m.rx && Object.keys(m.rx).length) wrap.append(rxNode(m));
    // the time shows once, under the last message of a run from the same person
    if (!sameRun(m, next) || m.edited) {
      const tm = el('time', null, sameRun(m, next) ? t('edited') : clock(m.ts) + (m.edited ? ' ' + t('edited') : ''));
      tm.dateTime = new Date(m.ts).toISOString(); wrap.append(tm);
    }
    bindGestures(wrap, m);
    return wrap;
  }
  // ---------- reactions ----------
  const REACTS = ['❤️', '😂', '😮', '😢', '😡', '👍'];
  const myReaction = m => (m.rx && Object.keys(m.rx).find(k => m.rx[k].includes(me.id))) || null;
  function react(m, e) { if (!send({ t: 'react', conv: m.conv, id: m.id, e })) toast(t('not_sent')); }
  function rxNode(m) {
    const keys = Object.keys(m.rx).sort((a, b) => m.rx[b].length - m.rx[a].length);
    const total = keys.reduce((n, k) => n + m.rx[k].length, 0);
    const pill = el('button', 'rx' + (myReaction(m) ? ' mine-rx' : ''), keys.slice(0, 3).join('') + (total > 1 ? ' ' + total : ''));
    pill.type = 'button';
    pill.setAttribute('aria-label', keys.map(k => k + ' ' + m.rx[k].map(nameOf).join(', ')).join('; '));
    pill.addEventListener('click', () => toast(keys.map(k => m.rx[k].map(nameOf).join(', ') + ' ' + k).join('   '), 4000));
    return pill;
  }

  // ---------- games ----------
  const RPS = { r: '✊', p: '✋', s: '✌️' };
  function gameNode(m) {
    const g = m.game, box = el('div', 'game'), other = id => nameOf(id);
    box.append(el('div', 'game-title', '🎮 ' + t(g.kind)));
    let status = '', done = false;
    if (g.kind === 'ttt') {
      const grid = el('div', 'ttt');
      const myTurn = g.turn === me.id && !g.winner;
      for (let i = 0; i < 9; i++) {
        const c = g.board[i], cell = el('button', 'cell' + (c === 'X' ? ' x' : c === 'O' ? ' o' : '') + (g.line && g.line.includes(i) ? ' win' : ''), c === 'X' ? '✕' : c === 'O' ? '◯' : '');
        cell.type = 'button'; cell.disabled = !myTurn || c !== '.';
        cell.setAttribute('aria-label', String(i + 1) + (c === '.' ? '' : ' ' + c));
        cell.addEventListener('click', () => { if (!send({ t: 'move', conv: m.conv, id: m.id, cell: i })) toast(t('not_sent')); });
        grid.append(cell);
      }
      box.append(grid);
      done = !!g.winner;
      if (g.winner === 'draw') status = t('draw');
      else if (g.winner) status = g.winner === me.id ? t('you_won') : t('they_won', other(g.winner));
      else status = g.turn === me.id ? t('your_turn') : t('their_turn', other(g.turn));
    } else if (g.kind === 'rps') {
      const opp = g.players.find(x => x !== me.id), mine = g.picks[me.id], theirs = g.picks[opp];
      done = g.done;
      if (g.done) {
        box.append(el('div', 'rps-result', RPS[mine] + '  vs  ' + RPS[theirs]));
        status = g.winner === 'draw' ? t('draw') : g.winner === me.id ? t('you_won') : t('they_won', other(g.winner));
      } else if (mine) {
        box.append(el('div', 'rps-result', RPS[mine]));
        status = t('waiting_pick', other(opp));
      } else {
        const row = el('div', 'rps');
        for (const k of Object.keys(RPS)) {
          const b = el('button', 'rps-pick', RPS[k]); b.type = 'button';
          b.addEventListener('click', () => { if (!send({ t: 'move', conv: m.conv, id: m.id, pick: k })) toast(t('not_sent')); });
          row.append(b);
        }
        box.append(row);
        status = theirs ? t('they_picked', other(opp)) : t('pick_one');
      }
    }
    box.append(el('div', 'game-status' + (status === t('your_turn') || status === t('you_won') ? ' hot' : ''), status));
    if (done) {
      const again = el('button', 'sbtn again', t('play_again')); again.type = 'button';
      again.addEventListener('click', () => startGame(g.kind, m.conv));
      box.append(again);
    }
    return box;
  }
  function startGame(kind, conv) { if (!send({ t: 'send', conv: conv || current, game: kind })) toast(t('not_sent')); else stick = true; }

  // ---------- photos and videos ----------
  function mediaGrid(m) {
    const files = mediaOf(m), shown = files.slice(0, 4);
    const grid = el('div', 'media n' + Math.min(files.length, 4));
    shown.forEach((f, i) => {
      const cell = el('button', 'mcell'); cell.type = 'button';
      if (isVideo(f)) {
        const v = el('video'); v.src = '/u/' + f + '#t=0.1'; v.preload = 'metadata'; v.muted = true; v.playsInline = true;
        v.addEventListener('loadedmetadata', () => { if (stick) toBottom(); });
        cell.append(v, el('span', 'play'));
        cell.setAttribute('aria-label', t('video'));
      } else {
        const img = el('img'); img.src = '/u/' + f; img.alt = t('photo'); img.loading = 'lazy'; img.draggable = false;
        img.addEventListener('load', () => { if (stick) toBottom(); });
        cell.append(img);
      }
      if (i === 3 && files.length > 4) cell.append(el('span', 'more', '+' + (files.length - 4)));
      cell.addEventListener('click', () => openViewer(files, i));
      grid.append(cell);
    });
    return grid;
  }
  // full screen viewer: swipe or use the arrows to go through everything in the message
  let vFiles = [], vIndex = 0;
  function openViewer(files, i) { vFiles = files; vIndex = i; drawViewer(); if (!$('#viewer').open) $('#viewer').showModal(); }
  function drawViewer() {
    const stage = $('#vStage'); stage.textContent = '';
    const f = vFiles[vIndex];
    if (isVideo(f)) { const v = el('video'); v.src = '/u/' + f; v.controls = true; v.autoplay = true; v.playsInline = true; stage.append(v); }
    else { const img = el('img'); img.src = '/u/' + f; img.alt = t('photo'); stage.append(img); }
    $('#vCount').textContent = vFiles.length > 1 ? (vIndex + 1) + ' / ' + vFiles.length : '';
    $('#vPrev').hidden = vIndex === 0; $('#vNext').hidden = vIndex >= vFiles.length - 1;
  }
  const vStep = d => { const n = vIndex + d; if (n < 0 || n >= vFiles.length) return; vIndex = n; drawViewer(); };
  $('#vPrev').addEventListener('click', () => vStep(-1));
  $('#vNext').addEventListener('click', () => vStep(1));
  $('#vClose').addEventListener('click', () => $('#viewer').close());
  $('#viewer').addEventListener('close', () => { $('#vStage').textContent = ''; }); // stops a playing video
  $('#viewer').addEventListener('keydown', ev => { if (ev.key === 'ArrowLeft') vStep(-1); if (ev.key === 'ArrowRight') vStep(1); });
  $('#vStage').addEventListener('click', ev => { if (ev.target === $('#vStage')) $('#viewer').close(); });
  { let x0 = null; const st = $('#vStage');
    st.addEventListener('pointerdown', ev => { if (ev.target.tagName !== 'VIDEO') x0 = ev.clientX; });
    st.addEventListener('pointerup', ev => { if (x0 === null) return; const dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 50) vStep(dx < 0 ? 1 : -1); });
  }
  // upload with progress, so a slow video shows how far it got
  function uploadFile(blob, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest(); x.open('POST', '/api/upload');
      x.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
      x.upload.onprogress = ev => { if (ev.lengthComputable) onProgress(ev.loaded / ev.total); };
      x.onload = () => { let b = {}; try { b = JSON.parse(x.responseText); } catch { /* not json */ } if (x.status === 200) resolve(b); else { const e = new Error(b.error || 'server'); e.code = b.error || (x.status === 413 ? 'too_big' : 'server'); reject(e); } };
      x.onerror = () => { const e = new Error('network'); e.code = 'network'; reject(e); };
      x.send(blob);
    });
  }

  function jumpTo(id) {
    const n = document.querySelector('#msgList .msg[data-id="' + CSS.escape(id) + '"]'); if (!n) return;
    n.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash');
  }

  // Swipe a message toward the middle to reply; hold it (or right-click with a mouse) for the menu.
  const SWIPE = 56;
  let lastHeart = 0;
  function bindGestures(node, m) {
    const dir = m.from === me.id ? -1 : 1;
    let sx = 0, sy = 0, dx = 0, pid = null, mode = null, timer = null;
    const hint = node.querySelector('.reply-hint');
    const reset = () => { clearTimeout(timer); timer = null; node.classList.remove('dragging', 'armed'); node.style.transform = ''; hint.style.opacity = ''; };
    node.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' || pid !== null) return;
      sx = ev.clientX; sy = ev.clientY; dx = 0; pid = ev.pointerId; mode = null;
      timer = setTimeout(() => { timer = null; if (mode === null) { mode = 'hold'; node.dataset.suppress = '1'; if (navigator.vibrate) navigator.vibrate(12); openSheet(m); } }, 460);
    });
    node.addEventListener('pointermove', ev => {
      if (ev.pointerId !== pid || mode === 'hold' || mode === 'scroll') return;
      const x = (ev.clientX - sx) * dir, y = ev.clientY - sy;
      if (mode === null) {
        if (Math.abs(y) > 10 || x < -10) { clearTimeout(timer); timer = null; mode = 'scroll'; return; }
        if (x > 12 && x > Math.abs(y) * 1.4) { clearTimeout(timer); timer = null; mode = 'swipe'; node.classList.add('dragging'); try { node.setPointerCapture(pid); } catch { /* fine */ } }
        else return;
      }
      dx = Math.max(0, Math.min(x, 84));
      node.style.transform = 'translateX(' + (dx * dir) + 'px)';
      hint.style.opacity = String(Math.min(1, dx / SWIPE));
      const armed = dx >= SWIPE;
      if (armed && !node.classList.contains('armed') && navigator.vibrate) navigator.vibrate(8);
      node.classList.toggle('armed', armed);
    });
    const interactive = target => target.closest && target.closest('img, video, button, a, .game');
    const end = ev => {
      if (ev.pointerId !== pid) return;
      if (mode === 'swipe') { node.dataset.suppress = '1'; if (dx >= SWIPE) startReply(m); }
      if (mode === null && ev.type === 'pointerup' && !interactive(ev.target)) { // double tap = ❤️
        const now = Date.now();
        if (now - (node._tap || 0) < 320) { node._tap = 0; heart(); } else node._tap = now;
      }
      reset(); pid = null; mode = null;
    };
    const heart = () => { lastHeart = Date.now(); if (myReaction(m) !== '❤️') react(m, '❤️'); else react(m, null); if (navigator.vibrate) navigator.vibrate(10); };
    node.addEventListener('dblclick', ev => { if (Date.now() - lastHeart < 700 || interactive(ev.target)) return; ev.preventDefault(); heart(); });
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('contextmenu', ev => { ev.preventDefault(); clearTimeout(timer); timer = null; if (mode !== 'swipe') { mode = 'hold'; openSheet(m); } });
    // a hold or swipe must not also count as a tap on a photo or a quote
    node.addEventListener('click', ev => { if (node.dataset.suppress) { ev.stopPropagation(); ev.preventDefault(); delete node.dataset.suppress; } }, true);
  }

  // ---------- message menu ----------
  const ICON = {
    reply: '<svg viewBox="0 0 24 24"><path d="M10 8L5 12l5 4"/><path d="M5 12h9a5 5 0 0 1 5 5v1"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5A2 2 0 0 0 13.5 4.5H6.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M10 7V5h4v2"/><path d="M7 7l1 12h8l1-12"/></svg>'
  };
  let sheetAt = 0;
  function openSheet(m) {
    const dlg = $('#msgSheet'); if (dlg.open) return;
    const box = $('#sheetActs'); box.textContent = '';
    $('#sheetPreview').textContent = msgLabel(m);
    const act = (icon, label, fn, cls) => {
      const b = el('button', 'sheet-act' + (cls ? ' ' + cls : '')); b.type = 'button';
      const ic = el('span'); ic.innerHTML = icon; ic.setAttribute('aria-hidden', 'true');
      const lab = el('span', null, label); b.append(ic, lab);
      b.addEventListener('click', () => { if (Date.now() - sheetAt < 450) return; fn(b, lab); }); // ignore the lift of the finger that opened it
      box.append(b);
    };
    const mine = m.from === me.id;
    const row = el('div', 'rx-row'), cur = myReaction(m);
    for (const e of REACTS) {
      const b = el('button', 'rx-pick' + (e === cur ? ' on' : ''), e); b.type = 'button';
      b.addEventListener('click', () => { if (Date.now() - sheetAt < 450) return; dlg.close(); react(m, e); });
      row.append(b);
    }
    box.append(row);
    if (canPost()) act(ICON.reply, t('reply'), () => { dlg.close(); startReply(m); });
    const copyText = m.text || annText(m);
    if (copyText) act(ICON.copy, t('copy_text'), async () => {
      dlg.close();
      try { await navigator.clipboard.writeText(copyText); }
      catch { const ta = el('textarea'); ta.value = copyText; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      toast(t('copied_text'));
    });
    if (mine && m.text) act(ICON.edit, t('edit'), () => { dlg.close(); startEdit(m); });
    if (mine || (me.admin && (m.conv === 'lobby' || m.conv === 'news'))) act(ICON.del, t('delete'), (b, lab) => {
      if (!b.classList.contains('armed')) { b.classList.add('armed'); lab.textContent = t('delete_confirm'); return; }
      dlg.close();
      if (!send({ t: 'del', conv: m.conv, id: m.id })) toast(t('not_sent'));
    }, 'danger');
    sheetAt = Date.now();
    dlg.showModal();
  }
  $('#msgSheet').addEventListener('click', ev => { if (ev.target === $('#msgSheet') && Date.now() - sheetAt > 450) $('#msgSheet').close(); });

  // ---------- reply / edit bar above the composer ----------
  let replyTo = null, editing = null;
  function showCtx() {
    const bar = $('#ctxBar'), on = replyTo || editing;
    bar.hidden = !on;
    const btn = $('#sendBtn'); btn.dataset.i18n = editing ? 'save' : 'send'; btn.textContent = t(btn.dataset.i18n);
    if (!on) return;
    $('#ctxLabel').textContent = editing ? t('editing') : (replyTo.from === me.id ? t('replying_self') : t('replying_to', nameOf(replyTo.from)));
    $('#ctxSnip').textContent = msgLabel(editing || replyTo);
  }
  const canPost = () => current !== 'news' || me.admin;
  function startReply(m) {
    if (!canPost() || current === 'news' || m.conv !== current) return; /* in the channel you reply inside the post's thread */ if (editing) input.value = ''; editing = null; replyTo = m; showCtx(); grow(); input.focus(); }
  function startEdit(m) { replyTo = null; editing = m; input.value = m.text; showCtx(); grow(); input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  function cancelCtx() { if (editing) input.value = ''; replyTo = null; editing = null; showCtx(); grow(); }
  $('#ctxClose').addEventListener('click', () => { cancelCtx(); input.focus(); });

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
  const postText = m => m.text || annText(m) || '';
  const postTitle = m => postText(m).split('\n')[0].slice(0, 80) || msgLabel(m);
  function newsNode(m) {
    const wrap = el('div', 'msg newsmsg'); wrap.dataset.id = m.id;
    const hint = el('span', 'reply-hint'); hint.hidden = true; wrap.append(hint);
    const card = el('div', 'newscard'); card.tabIndex = 0; card.setAttribute('role', 'button');
    const head = el('div', 'nc-head');
    head.append(el('span', 'nc-from', nameOf(m.from)), el('time', null, dayLabel(m.ts) + ' ' + clock(m.ts)));
    const lines = postText(m).split('\n');
    const title = el('div', 'nc-title', lines[0]), body = el('div', 'nc-body', lines.slice(1).join('\n'));
    card.append(head, title);
    if (body.textContent) card.append(body);
    const pic = mediaOf(m).find(f => !isVideo(f));
    if (pic) { const img = el('img', 'nc-img'); img.src = '/u/' + pic; img.alt = ''; img.loading = 'lazy'; card.append(img); }
    if (m.text && needsTr(m.text)) fetchTr(m).then(tx => { if (!tx) return; const l = tx.split('\n'); title.textContent = l[0]; body.textContent = l.slice(1).join('\n'); if (body.textContent && !body.parentNode) title.after(body); }).catch(() => {});
    const info = (cache.news && cache.news.threads && cache.news.threads[m.id]) || { n: 0 };
    const unread = (convs['th:' + m.id] && convs['th:' + m.id].unread) || 0;
    const foot = el('div', 'nc-foot' + (unread ? ' new' : ''));
    foot.append(el('span', null, '💬 ' + (info.n ? (info.n === 1 ? t('replies_one') : t('replies_n', info.n)) : t('thread_start'))));
    if (unread) foot.append(el('span', 'badge', String(unread)));
    card.append(foot);
    const open = () => openConv('th:' + m.id, false);
    card.addEventListener('click', open);
    card.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
    wrap.append(card);
    if (m.rx && Object.keys(m.rx).length) wrap.append(rxNode(m));
    bindGestures(wrap, m);
    return wrap;
  }
  function renderMsgs(keepPlace) {
    const c = cache[current]; if (!c) return;
    const listEl = $('#msgList'), before = box.scrollHeight, top = box.scrollTop;
    listEl.textContent = '';
    $('#olderBtn').hidden = !c.more;
    if (current === 'news') { // the channel: one card per announcement, newest at the bottom
      applyTheme('forest');
      if (!c.list.length) listEl.append(el('p', 'empty', t('news_sub')));
      for (const m of c.list) listEl.append(newsNode(m));
      if (keepPlace && !stick) box.scrollTop = top + (box.scrollHeight - before); else toBottom();
      return;
    }
    if (c.root) { // a thread: the announcement first, then the replies
      $('#chatTitle').textContent = postTitle(c.root);
      const r = msgNode(c.root, null, null); r.classList.add('thread-root'); listEl.append(r);
      listEl.append(el('div', 'day thread-div', t('replies_head')));
    }
    if (!c.list.length) listEl.append(el('p', 'empty', c.root ? t('thread_start') : t('empty_chat')));
    c.list.forEach((m, i) => {
      const prev = c.list[i - 1] || null;
      if (!prev || dayLabel(prev.ts) !== dayLabel(m.ts)) listEl.append(el('div', 'day', dayLabel(m.ts)));
      listEl.append(msgNode(m, prev, c.list[i + 1] || null));
    });
    applyTheme(c.theme);
    const last = c.list[c.list.length - 1];
    if (last && last.from === me.id && !last.sys && !c.root) {
      const seen = c.seen || {};
      const who = Object.keys(seen).filter(uid => users.has(uid) && seen[uid] >= last.ts);
      let text;
      if (current.startsWith('dm:')) text = t(who.length ? 'seen' : 'sent');
      else if (!who.length) text = t('sent');
      else if (who.length === Object.keys(seen).filter(uid => users.has(uid)).length) text = t('seen_all');
      else {
        const names = who.map(uid => users.get(uid).name);
        const shown = names.length > 3 ? names.slice(0, 3).concat('+' + (names.length - 3)) : names;
        let joined; try { joined = new Intl.ListFormat(LOCALE[lang], { type: 'conjunction' }).format(shown); } catch { joined = shown.join(', '); }
        text = t('seen_by', joined);
      }
      const st = el('div', 'status' + (text === t('sent') ? '' : ' seen'), text);
      listEl.lastElementChild.append(st);
    }
    if (keepPlace && !stick) box.scrollTop = top + (box.scrollHeight - before); else toBottom();
  }
  async function loadMsgs(conv, older) {
    const c = cache[conv] || (cache[conv] = { list: [], more: false });
    const q = '/api/messages?conv=' + encodeURIComponent(conv) + (older && c.list[0] ? '&before=' + c.list[0].id : '');
    const r = await api(q);
    c.list = older ? r.messages.concat(c.list) : r.messages;
    c.more = r.more; c.theme = r.theme || c.theme; if (r.threads) c.threads = Object.assign(c.threads || {}, r.threads); if (r.root) c.root = r.root; c.seen = Object.assign(c.seen || {}, r.seen || {});
  }
  async function openConv(conv, pushHistory) {
    if (conv !== current && (replyTo || editing)) cancelCtx();
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
  $('#backBtn').addEventListener('click', () => { if (current && current.startsWith('th:')) return openConv('news', false); if (history.state && history.state.chat) history.back(); else closeChat(); });
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
    const box = $('#typing'); box.textContent = '';
    if (names.length) {
      const dots = el('span', 'dots'); dots.append(el('i'), el('i'), el('i'));
      box.append(dots, el('span', null, t('typing', names.join(', '))));
    }
    if (stick) toBottom();
  }

  // ---------- socket ----------
  // ---------- phone notifications ----------
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
  let swReg = null, pushSub = null;
  function showNotif() {
    const b = $('#notifBtn'); if (!b) return;
    const blocked = pushOk && Notification.permission === 'denied';
    b.textContent = t(pushSub ? 'notif_on' : blocked ? 'notif_blocked' : 'notif_off');
    b.setAttribute('aria-pressed', String(!!pushSub));
  }
  const keyBytes = k => { const b = atob((k + '='.repeat((4 - k.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  async function setupPush() {
    if (!pushOk) return;
    try {
      swReg = await navigator.serviceWorker.register('/sw.js');
      pushSub = await swReg.pushManager.getSubscription();
      if (pushSub && Notification.permission === 'granted') await post('/api/push/subscribe', { sub: pushSub.toJSON() }); // keep the server in step with this phone
      else if (pushSub) pushSub = null;
    } catch { /* notifications stay off */ }
    showNotif();
  }
  $('#notifBtn').addEventListener('click', async () => {
    if (!pushOk) return toast(t('notif_unsupported'), 6000);
    const b = $('#notifBtn'); b.disabled = true;
    try {
      if (pushSub) {
        const ep = pushSub.endpoint; await pushSub.unsubscribe().catch(() => {}); pushSub = null;
        await post('/api/push/unsubscribe', { endpoint: ep }).catch(() => {});
      } else {
        if (Notification.permission === 'denied' || (await Notification.requestPermission()) !== 'granted') { toast(t('notif_blocked_help'), 7000); return; }
        swReg = swReg || await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const { key } = await api('/api/push/key');
        pushSub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
        await post('/api/push/subscribe', { sub: pushSub.toJSON() });
      }
    } catch (e) { toast(errText(e.code || 'server')); }
    finally { b.disabled = false; showNotif(); }
  });
  // tapping a notification opens that chat
  if (pushOk) navigator.serviceWorker.addEventListener('message', ev => { if (me && ev.data && typeof ev.data.open === 'string') openConv(ev.data.open, true); });
  // tell the server whether this page is on screen, so it only notifies when you are not looking
  const sendVis = () => send({ t: 'vis', v: !document.hidden });
  document.addEventListener('visibilitychange', sendVis);
  addEventListener('pagehide', () => send({ t: 'vis', v: false }));

  function send(obj) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
    return false;
  }
  function connect() {
    if (!wantSocket) return;
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = async () => {
      sendVis();
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
      if (cache[m.conv] && m.from !== me.id) { const sc = cache[m.conv].seen = cache[m.conv].seen || {}; if ((sc[m.from] || 0) < m.ts) sc[m.from] = m.ts; }
      if (cache[m.conv] && !cache[m.conv].list.some(x => x.id === m.id)) { cache[m.conv].list.push(m); fresh.add(m.id); }
      if (m.conv.startsWith('th:') && cache.news) { // keep the reply count on the channel card current
        const th = (cache.news.threads = cache.news.threads || {}), k = m.conv.slice(3);
        th[k] = { n: ((th[k] && th[k].n) || 0) + 1, last: m.ts };
        if (current === 'news') renderMsgs(true);
      }
      if (typers[m.conv] && typers[m.conv][m.from]) { clearTimeout(typers[m.conv][m.from]); delete typers[m.conv][m.from]; }
      if (m.conv === current) {
        const wasStuck = stick || m.from === me.id;
        renderMsgs(true); if (wasStuck) toBottom();
        showTyping();
        if (m.from !== me.id) { c.unread++; markRead(); }
      } else if (m.from !== me.id) c.unread++;
      renderSide();
    } else if (d.t === 'edit' || d.t === 'del') {
      const conv = d.t === 'edit' ? d.m.conv : d.conv, id = d.t === 'edit' ? d.m.id : d.id;
      const c = cache[conv], i = c ? c.list.findIndex(x => x.id === id) : -1;
      for (const k of [...trCache.keys()]) if (k.startsWith(id + '|')) trCache.delete(k);
      if (d.t === 'edit') {
        if (i >= 0) c.list[i] = d.m;
        if (c) for (const x of c.list) if (x.re && x.re.id === id) x.re = { id, from: d.m.from, text: [...(d.m.text || '')].slice(0, 140).join(''), img: !!d.m.img };
        if (convs[conv] && convs[conv].last && convs[conv].last.id === id) convs[conv].last = d.m;
      } else {
        if (i >= 0) c.list.splice(i, 1);
        if (c) for (const x of c.list) if (x.re && x.re.id === id) x.re = { id, gone: true };
        if (convs[conv]) convs[conv].last = d.last;
      }
      if ((replyTo && replyTo.id === id) || (editing && editing.id === id && d.t === 'del')) cancelCtx();
      const tc = cache['th:' + id];
      if (tc && tc.root) { if (d.t === 'edit') tc.root = d.m; else if (current === 'th:' + id) { delete cache['th:' + id]; return openConv('news', false); } }
      if (current === 'th:' + id) { renderHead(); renderMsgs(true); }
      if (conv === current) renderMsgs(true);
      renderSide();
    } else if (d.t === 'rx' || d.t === 'game') {
      const c = cache[d.conv], x = c && c.list.find(y => y.id === d.id);
      const setRx = y => { if (Object.keys(d.rx).length) y.rx = d.rx; else delete y.rx; };
      if (x) { if (d.t === 'rx') setRx(x); else x.game = d.game; }
      const tc = d.t === 'rx' && cache['th:' + d.id]; // a reaction on a post also shows at the top of its thread
      if (tc && tc.root) { setRx(tc.root); if (current === 'th:' + d.id) renderMsgs(true); }
      if (d.t === 'game' && convs[d.conv] && convs[d.conv].last && convs[d.conv].last.id === d.id) convs[d.conv].last.game = d.game;
      if (d.conv === current) renderMsgs(true);
    } else if (d.t === 'theme') {
      if (cache[d.conv]) cache[d.conv].theme = d.theme;
      if (d.conv === current) renderMsgs(true);
    } else if (d.t === 'seen') {
      const c = cache[d.conv]; if (!c) return;
      c.seen = c.seen || {}; if ((c.seen[d.uid] || 0) < d.ts) c.seen[d.uid] = d.ts;
      if (d.conv === current) renderMsgs(true);
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
      const old = users.get(d.user.id);
      users.set(d.user.id, d.user);
      if (me && d.user.id === me.id) Object.assign(me, d.user);
      renderSide();
      if (current) { renderHead(); if (!old || old.name !== d.user.name || old.avatar !== d.user.avatar || old.color !== d.user.color) renderMsgs(true); }
      if ($('#profDlg').open && profId === d.user.id) drawProfile(d.user, profData);
    } else if (d.t === 'read') {
      if (convs[d.conv]) { convs[d.conv].unread = 0; renderSide(); }
    } else if (d.t === 'hello') {
      if (!appVersion) appVersion = d.v;
      else if (d.v !== appVersion) showUpdate(); // the server came back with new page files
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
    else if (ev.key === 'Escape' && (replyTo || editing)) { ev.preventDefault(); cancelCtx(); }
  });
  $('#composer').addEventListener('submit', ev => {
    ev.preventDefault();
    const text = input.value.trim(); if (!text || !current) return;
    if (editing) {
      if (text !== editing.text && !send({ t: 'edit', conv: current, id: editing.id, text })) return toast(t('not_sent'));
      cancelCtx(); input.focus(); return;
    }
    if (!send({ t: 'send', conv: current, text, reply: replyTo ? replyTo.id : undefined })) return toast(t('not_sent'));
    input.value = ''; lastTyping = 0; replyTo = null; showCtx(); grow(); stick = true; input.focus();
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
    let files = [...ev.target.files]; ev.target.value = '';
    const conv = current; if (!files.length || !conv) return;
    if (files.length > 10) { toast(t('too_many')); files = files.slice(0, 10); }
    const btn = $('#attachBtn'); btn.classList.add('busy');
    const names = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i], video = f.type.startsWith('video/');
        const blob = video ? f : await shrink(f); // photos are made smaller first; videos are sent as they are
        if (blob.size > (video ? 40 : 15) * 1024 * 1024) { const e = new Error('too_big'); e.code = 'too_big'; throw e; }
        const show = p => toast(t('uploading', i + 1, files.length, Math.round(p * 100)), 0);
        show(0);
        const r = await uploadFile(blob, show);
        names.push(r.name);
      }
      $('#toast').hidden = true;
      if (!send({ t: 'send', conv, media: names, text: '', reply: replyTo && replyTo.conv === conv ? replyTo.id : undefined })) toast(t('not_sent'));
      else { stick = true; if (replyTo) { replyTo = null; showCtx(); } }
    } catch (e) { toast(errText(e.code)); }
    finally { btn.classList.remove('busy'); }
  });

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
  // ---------- updates ----------
  let appVersion = null, updTimer = null;
  function showUpdate() {
    if (updTimer) return;
    let n = 5;
    const dlg = $('#updDlg'), body = $('#updBody');
    const go = () => {
      try { sessionStorage.setItem('qiao_resume', JSON.stringify({ conv: current, text: input.value })); } catch { /* fine */ }
      location.reload();
    };
    $('#updTitle').textContent = t('upd_title'); $('#updNow').textContent = t('upd_now');
    body.textContent = t('upd_body', n);
    $('#updNow').onclick = go;
    dlg.addEventListener('cancel', ev => ev.preventDefault());
    if (!dlg.open) dlg.showModal();
    updTimer = setInterval(() => { n--; if (n <= 0) { clearInterval(updTimer); go(); } else body.textContent = t('upd_body', n); }, 1000);
  }
  async function refresh() {
    const d = await api('/api/me');
    me = d.me; users = new Map(d.users.map(u => [u.id, u])); online = new Set(d.online); convs = d.convs;
    if (!appVersion) appVersion = d.v;
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
    if (me.lang) setUiLang(me.lang); // the app follows the language saved on the account
    if (!me.lang) openLangs(); // accounts made before language choice existed
    setupPush();
    const want = new URLSearchParams(location.search).get('c'); // opened from a notification
    if (want) { history.replaceState(null, '', '/'); openConv(want, true); }
    let resume = null; // back from an automatic refresh: same chat, unsent text kept
    try { resume = JSON.parse(sessionStorage.getItem('qiao_resume') || 'null'); sessionStorage.removeItem('qiao_resume'); } catch { /* fine */ }
    if (resume && resume.conv && !want) { await openConv(resume.conv, true); if (resume.text) { input.value = resume.text; grow(); } }
  }
  applyLang();
  boot();
})();
