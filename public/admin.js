'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const LANGS = { en: 'English', zh: '中文', hi: 'हिन्दी', vi: 'Tiếng Việt', ja: '日本語', ko: '한국어' };
  const ERR = { forbidden: 'Only the admin can open this page.', signed_out: 'Log in first, then open this page again.', network: 'Could not reach the server. Check your connection.' };

  async function api(path, body) {
    let res;
    try { res = await fetch(path, body === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch { const e = new Error('network'); e.code = 'network'; throw e; }
    let data = {}; try { data = await res.json(); } catch { /* not json */ }
    if (!res.ok) { const e = new Error(data.error || 'server'); e.code = data.error || 'server'; throw e; }
    return data;
  }
  let toastTimer;
  function toast(text) { const b = $('#toast'); b.textContent = text; b.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { b.hidden = true; }, 3200); }
  const problem = e => toast(ERR[e.code] || 'That did not work. Try again.');
  const day = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const size = n => n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB';

  // a destructive button asks for a second tap instead of acting at once
  function confirmButton(label, armedLabel, action) {
    const b = el('button', 'sbtn danger', label); b.type = 'button'; let timer;
    b.addEventListener('click', async () => {
      if (!b.classList.contains('armed')) {
        b.classList.add('armed'); b.textContent = armedLabel;
        timer = setTimeout(() => { b.classList.remove('armed'); b.textContent = label; }, 4000);
        return;
      }
      clearTimeout(timer); b.disabled = true;
      try { await action(); } catch (e) { problem(e); b.disabled = false; b.classList.remove('armed'); b.textContent = label; }
    });
    return b;
  }

  const shownPasswords = new Map(); // user id -> one-time password just created
  function render(d) {
    const stats = $('#stats'); stats.textContent = '';
    for (const [n, label] of [[d.users.length, 'members'], [d.stats.messages, 'messages'], [size(d.stats.photoBytes), 'of photos']]) {
      const c = el('div', 'stat'); c.append(el('b', null, String(n)), el('span', null, label)); stats.append(c);
    }
    const box = $('#members'); box.textContent = '';
    for (const u of d.users) {
      const card = el('div', 'card'), head = el('div', 'head');
      const av = el('span', 'avatar', [...u.name][0].toUpperCase()); av.style.background = u.color;
      av.append(el('span', 'flame' + (u.online ? ' lit' : '')));
      const text = el('div'), who = el('div', 'who', u.name);
      if (u.admin) who.append(el('span', 'tag', 'admin'));
      if (u.me) who.append(el('span', 'tag', 'you'));
      const bits = ['Joined ' + day(u.ts)];
      if (u.by) bits.push('invited by ' + u.by);
      bits.push(u.messages + (u.messages === 1 ? ' message' : ' messages'));
      bits.push(u.lang ? LANGS[u.lang] || u.lang : 'no language chosen');
      if (!u.me) bits.push(u.online ? 'here now' : 'away');
      text.append(who, el('div', 'meta', bits.join(', ')));
      head.append(av, text); card.append(head);
      if (!u.me && !u.admin) {
        const acts = el('div', 'acts');
        acts.append(
          confirmButton('Reset password', 'Tap again to reset', async () => { const r = await api('/api/admin/reset', { id: u.id }); shownPasswords.set(u.id, r.password); await load(); }),
          confirmButton('Remove member', 'Tap again to remove', async () => { await api('/api/admin/remove', { id: u.id }); toast(u.name + ' was removed'); await load(); })
        );
        card.append(acts);
      }
      if (shownPasswords.has(u.id)) {
        const np = el('div', 'newpass');
        np.append('New password for ' + u.name + ': ', el('code', null, shownPasswords.get(u.id)), el('div', 'meta', 'Send it to them now. It is shown only once, and they have been logged out everywhere.'));
        card.append(np);
      }
      box.append(card);
    }
    for (const b of document.querySelectorAll('#inviteMode button')) b.setAttribute('aria-pressed', String(b.dataset.mode === d.settings.invites));
    const inv = $('#invites'); inv.textContent = '';
    if (!d.invites.length) inv.append(el('p', 'empty-note', 'No unused invites.'));
    for (const i of d.invites) {
      const card = el('div', 'card');
      const link = location.origin + '/?invite=' + i.code;
      card.append(el('div', 'who', i.code), el('div', 'meta', (i.by ? 'Made by ' + i.by : 'First-account invite') + ', expires ' + day(i.expires)));
      const acts = el('div', 'acts'), copy = el('button', 'sbtn', 'Copy link'); copy.type = 'button';
      copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(link); toast('Link copied'); } catch { toast(link); } });
      acts.append(copy, confirmButton('Cancel invite', 'Tap again to cancel', async () => { await api('/api/admin/revoke', { code: i.code }); await load(); }));
      card.append(acts); inv.append(card);
    }
  }
  async function load() { render(await api('/api/admin')); $('#adminBody').hidden = false; }

  for (const b of document.querySelectorAll('#inviteMode button')) b.addEventListener('click', async () => {
    try { await api('/api/admin/settings', { invites: b.dataset.mode }); await load(); } catch (e) { problem(e); }
  });
  $('#newInvite').addEventListener('click', async () => { try { await api('/api/invite', {}); await load(); } catch (e) { problem(e); } });

  load().catch(e => { const n = $('#adminErr'); n.textContent = ERR[e.code] || 'Could not load the admin page. Try again.'; n.hidden = false; });
})();
