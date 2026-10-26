// Online play: Supabase sign-in (Google or guest), unique usernames, cloud saves, shared admin settings,
// and the live West region on the Cloudflare server (other players, proximity chat, mute and report).
// Does nothing until js/online-config.js is filled in.
window.__ibOnlineV = '2.03.00';
window.BBFeatures.push(function (bb) {
  window.__ibOnlineStage = 'started';
  // Beta v2.03.00: Badshah story mode is strictly single player: no server, no chat, no cloud save (the story has its own save)
  if (window.IB_STORY) { const no = () => false, none = () => Promise.resolve({ error: { message: 'Story mode is offline' }, data: null });
    bb.ONLINE = { story: true, report: no, chatR: 0, client: null, uid: null, username: '', signOut: no, status: 'story', remotes: new Map(), profile: null, myId: null, connect: no, disconnect: no, bubble: no, send: no, silencedUntil: 0, silenceNote: () => '', banned: false, isMuted: no, openChat: () => bb.toast('Chat is off in story mode', '#d6c8e4'), rpc: none, signedIn: false, isTester: false, isAdmin: false, guest: false };
    window.__ibOnlineStage = 'story'; return; }
  const C = window.ONLINE || {};
  if (!C.supabaseUrl || !C.supabaseKey) {   // this copy has no online settings (for example the Claude preview): say so instead of showing nothing
    const lc = document.querySelector('#top .lcol'); if (lc) { const c = document.createElement('button'); c.id = 'chat'; c.className = 'pill'; c.type = 'button'; c.hidden = true; c.innerHTML = '<i class="dot"></i><b>Offline</b> <small>online play is on indiabaygame.com</small>'; lc.appendChild(c);
      c.onclick = () => bb.toast('This copy of the game has no online settings, so it plays offline. Play on indiabaygame.com to meet other players.', '#ffc93c'); bb.onStart(() => { c.hidden = false; }); }
    return; }
  window.__ibOnlineStage = 'config ok';
  const THREE = bb.THREE;
  const SB_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js';
  const REGION = 'west', IDLE_MIN = 10;
  let priv = null, googleOn = true, sb = null, session = null, profile = null, isAdmin = false, isTester = false, offline = false, passed = false, next = null;
  let cityN = null; let lastErr = '', lastErrAt = 0; const noteErr = m => { lastErr = String(m || ''); lastErrAt = Date.now(); };
  let authRetry = false, ws = null, myId = null, online = 0, status = 'off', kicked = false, idleOff = false, retry = 0, lastInput = Date.now(), lastSent = null;
  const remotes = new Map();
  const U = bb.USAGE = bb.USAGE || { n: {}, add(k, v) { this.n[k] = (this.n[k] || 0) + (v == null ? 1 : v); } };
  let banned = false, silencedUntil = 0, seenBefore = null;
  // players you muted (Beta v1.01.15: own key; 'ib.muted' is the sound on/off switch, which broke online when it held true/false)
  const muted = new Set((() => { try { let L = JSON.parse(localStorage.getItem('ib.mutedPlayers') || 'null'); if (!Array.isArray(L)) { const old = JSON.parse(localStorage.getItem('ib.muted') || 'null'); L = Array.isArray(old) ? old : []; if (Array.isArray(old)) localStorage.setItem('ib.muted', 'false'); }
    return L.filter(x => typeof x === 'string'); } catch (e) { return []; } })());
  const lastChat = {};
  const mats = {}; const mat = c => (mats[c] = mats[c] || bb.LMat(c));
  const $ = q => document.querySelector(q);
  const isAnon = () => !!(session && session.user && session.user.is_anonymous);
  const here = () => location.origin + location.pathname;
  window.__ibOnlineStage = 'setup 1';

  /* ---------- page elements ---------- */
  const lcol = $('#top .lcol') || document.body;
  const chip = document.createElement('button'); chip.id = 'chat'; chip.className = 'pill'; chip.type = 'button'; chip.hidden = true; lcol.appendChild(chip);
  const log = document.createElement('div'); log.id = 'chatlog'; lcol.appendChild(log);
  const bar = document.createElement('form'); bar.id = 'chatbar'; bar.hidden = true; bar.setAttribute('novalidate', '');
  let chatR = (() => { try { return localStorage.getItem('ib.chatR') || 'close'; } catch (e) { return 'close'; } })();
  bar.innerHTML = '<button class="buy ghost crng" type="button" data-r title="Who hears you"></button><input maxlength="120" placeholder="Say something to players nearby" enterkeyhint="send" aria-label="Chat message"><button class="go" type="submit">Send</button><button class="buy ghost" type="button" data-x>✕</button>';
  const rngLabel = () => { const b = bar.querySelector('[data-r]'); if (b) b.textContent = chatR === 'close' ? '📍 50 m' : '🏙 Area'; };
  bar.addEventListener('click', e => { if (!e.target.closest('[data-r]')) return; chatR = chatR === 'close' ? 'area' : 'close'; try { localStorage.setItem('ib.chatR', chatR); } catch (er) {} rngLabel(); bb.toast(chatR === 'close' ? '📍 Chat and voice reach players within 50 m' : '🏙 Chat and voice reach the whole area around you (about 600 m)', '#d6c8e4'); });
  setTimeout(rngLabel, 0);
  document.body.appendChild(bar);
  const inp = bar.querySelector('input');
  window.__ibOnlineStage = 'setup 2';
  const introLine = document.createElement('div'); introLine.id = 'onl'; const cities = $('#cities'); if (cities && cities.parentNode) cities.parentNode.insertBefore(introLine, cities.nextSibling);
  window.__ibOnlineStage = 'setup 3';

  /* ---------- Supabase ---------- */
  function loadScript() { return new Promise((res, rej) => { if (window.supabase && window.supabase.createClient) return res(); const s = document.createElement('script'); s.src = SB_JS; s.onload = res; s.onerror = () => rej(new Error('sign-in library did not load')); document.head.appendChild(s); }); }
  function niceErr(e) {
    const m = String(e && e.message || e || '');
    if (/anonymous sign-ins are disabled/i.test(m)) return 'Guest play is not switched on yet. In Supabase: Authentication → Sign In / Providers → allow anonymous sign-ins.';
    if (/provider is not enabled|unsupported provider/i.test(m)) return 'Google sign-in is not set up yet. Use guest play for now.';
    if (/manual linking is disabled/i.test(m)) return 'Linking is not switched on yet. In Supabase: Authentication → Sign In / Providers → allow manual linking.';
    if (/already linked|identity_already_exists/i.test(m)) return 'That Google account already has its own India Bay profile. Sign out and sign in with Google instead.';
    if (/failed to fetch|network/i.test(m)) return 'No connection to the server. Check your internet and try again.';
    return m || 'Something went wrong. Try again.';
  }
  const backend = admin => ({
    admin,
    async save(c) { const { error } = await sb.from('game_config').upsert({ id: 1, data: c, updated_at: new Date().toISOString() }); if (error) throw error; },
    async suggest(row) { const { error } = await sb.from('suggestions').insert({ name: row.name, region: row.region, text: row.text }); if (error) throw error; },
    async support(row) { const { error } = await sb.from('support_messages').insert(row); if (error) throw error; },
    async listSuggestions() { const { data, error } = await sb.from('suggestions').select('name,region,text,created_at').order('created_at', { ascending: false }).limit(50); if (error) throw error; return data.map(r => ({ name: r.name, region: r.region, text: r.text, date: String(r.created_at).slice(0, 10) })); }
  });
  async function loadConfig() { try { const { data } = await sb.from('game_config').select('data').eq('id', 1).maybeSingle(); if (data && data.data) bb.cloudConfig(data.data); } catch (e) {} }
  async function afterSignIn() {
    const uid = session.user.id;
    // Beta v1.01.21: a banned email cannot play online
    try { const b = await sb.rpc('am_i_banned'); if (!b.error && b.data === true) { banned = true; bannedSheet(); throw new Error('This account is banned'); } } catch (e) { if (banned) throw e; }
    let pr = await sb.from('profiles').select('username,is_guest,last_seen').eq('id', uid).maybeSingle();
    if (pr.error && /last_seen/.test(pr.error.message || '')) pr = await sb.from('profiles').select('username,is_guest').eq('id', uid).maybeSingle();
    if (pr.error) throw pr.error;
    profile = pr.data || null; if (profile && profile.last_seen) seenBefore = new Date(profile.last_seen).getTime(); touch();
    const ad = await sb.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
    isAdmin = !!(ad.data);
    let known = false; try { const ts = await sb.rpc('is_tester'); if (!ts.error) { known = true; isTester = isAdmin || ts.data === true; } else isTester = isAdmin; } catch (e) { isTester = isAdmin; }
    if (bb.testMode && known && !isTester && !(bb.canTestPlay && bb.canTestPlay())) { bb.toast('Test play is only for testers · ask the admin to add you in Admin → Testers', '#ff8b8b'); setTimeout(() => bb.setTestMode(false), 2500); }
    bb.setCfgBackend(backend(false));   // admin settings live on the /admin page only
    const pv = await sb.from('profile_private').select('full_name,dob,parent_ok').eq('user_id', uid).maybeSingle();
    priv = pv.data || null;
    if (priv) { bb.P.fullName = priv.full_name; bb.P.dob = priv.dob; bb.P.age18 = (bb.ageFromDob(priv.dob) || 0) >= 18; bb.refreshBillboards(); }
    if (profile && profile.is_guest && !isAnon()) { await sb.from('profiles').update({ is_guest: false }).eq('id', uid); profile.is_guest = false; }
    renderIntro(); bb.setAvatar();
  }
  const ready = (async () => {
    try {
      window.__ibOnlineStage = 'loading sign-in library'; await loadScript(); window.__ibOnlineStage = 'sign-in library loaded';
      sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
      const q = new URLSearchParams(location.search);
      try { const st = await fetch(C.supabaseUrl.replace(/\/$/, '') + '/auth/v1/settings', { headers: { apikey: C.supabaseKey } }); if (st.ok) { const j = await st.json(); googleOn = !!(j.external && j.external.google); } } catch (e) {}
      const { data } = await sb.auth.getSession(); session = data.session;
      if (!session && q.get('code')) { try { const ex = await sb.auth.exchangeCodeForSession(q.get('code')); if (ex.error) { noteErr('Google sign-in did not finish: ' + ex.error.message); setTimeout(() => bb.toast('Google sign-in did not finish · ' + bb.esc(ex.error.message) + ' · try Sign in with Google again', '#ff8b8b'), 900); } else session = ex.data.session; } catch (e) { noteErr('Google sign-in did not finish: ' + e.message); } }
      if (q.has('code') || q.has('error')) { if (q.get('error_description')) setTimeout(() => bb.toast(q.get('error_description'), '#ff8b8b'), 800); history.replaceState(null, '', location.pathname + location.hash); }
      sb.auth.onAuthStateChange((ev, s) => { session = s; if (ev === 'SIGNED_OUT') { profile = null; priv = null; disconnect(true); } });
      loadConfig(); setInterval(loadConfig, 60 * 1000);
      if (session) await afterSignIn();
      if (sessionStorage.getItem('ib.cloudLoaded')) { sessionStorage.removeItem('ib.cloudLoaded'); setTimeout(() => bb.toast('☁ Loaded your cloud save', '#3ddc97'), 600); }
      if (session && !isAnon() && !bb.hadSave) sb.from('saves').select('user_id').eq('user_id', session.user.id).maybeSingle().then(r => { bb.cloudHas = !!(r && r.data); renderIntro(); }, () => {});
      renderIntro(); serverStatus(); window.__ibOnlineStage = 'ready' + (session ? (isAnon() ? ' · guest' : ' · google') : ' · not signed in');
      return true;
    } catch (e) { console.warn('Online unavailable', e); window.__ibOnlineStage = 'failed: ' + (e && e.message || e); noteErr('Could not start online: ' + (e && e.message || e)); status = 'error'; renderIntro(); return false; }
  })();

  // banned (Admin → Players → Ban): the account cannot play online; offline play still works
  function bannedSheet() { offline = true; bb.openSheet('⛔ Account banned', 'This account cannot play online', '<p class="note">The India Bay admin has banned this account. You can still play offline on this device. If you think this is a mistake, write to support@indiabaygame.com.</p><div class="btnrow"><button class="go" data-id="off">Play offline</button><button class="buy ghost" data-id="out">Sign out</button></div>',
      s => s.onclick = async e => { const id = e.target.dataset.id; if (id === 'off') { bb.closeSheet(); if (next) next(); } if (id === 'out') { try { await sb.auth.signOut(); } catch (er) {} location.reload(); } }); }
  // last time you played (unused accounts are removed: guests after 14 days, Google after 60), and whether you are silenced
  async function touch() { if (!sb || !session) return; try { const r = await sb.rpc('touch_seen'); if (r.error) return; const o = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; if (o) { if (o.banned && !banned) { banned = true; disconnect(true); bannedSheet(); } silencedUntil = o.silenced ? Date.parse(o.silenced) || 0 : 0; } } catch (e) {} }
  setInterval(() => { if (session && passed) touch(); }, 5 * 60 * 1000);
  bb.onStart(() => setTimeout(() => { if (!session || !seenBefore) return; const days = (Date.now() - seenBefore) / 864e5; const lim = isAnon() ? 14 : 60;
    if (days > lim * .6) bb.toast(`Welcome back! ${isAnon() ? 'Guest accounts' : 'Accounts'} are kept while you play at least once every ${lim} days`, '#ffc93c'); }, 5000));
  const silenceNote = until => `🔇 Chat, voice and calls are off for you until ${new Date(until).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}, after reports from several players`;

  /* ---------- Sign in with Google on the start screen (Beta v1.01.05) ----------
     Shown when you are not on a Google account yet: no account, or a guest account in this browser.
     A guest is linked to Google (same player, same progress). If linking is switched off in Supabase
     (Authentication → Sign In / Providers → "Allow manual linking"), you can sign in with Google as a fresh player. */
  async function googleIn(fromSheet) { const ok = await ready; if (!ok) return bb.toast('Online is unavailable right now', '#ff9f1c');
    if (!googleOn) return bb.toast('Google sign-in is switched off on the server (Supabase → Authentication → Sign In / Providers → Google)', '#ff9f1c');
    bb.toast('Opening Google…', '#d6c8e4');
    if (session && isAnon()) { const { error } = await sb.auth.linkIdentity({ provider: 'google', options: { redirectTo: here() } }); if (!error) return;
      const off = /manual linking|linking is disabled|identity.*already/i.test(error.message || '');
      bb.openSheet('Sign in with Google', off ? 'Linking a guest to Google is switched off' : 'Could not link Google', `<p class="note">${bb.esc(niceErr(error))}</p><p class="note">${off ? 'Admin: Supabase → Authentication → Sign In / Providers → turn on <b>Allow manual linking</b>, then try again to keep this guest player. Or sign in with Google as a new player now (this guest stays in this browser).' : 'You can sign in with Google as a new player instead.'}</p><div class="stack"><button class="go gbtn" data-id="fresh"><b>G</b> Sign in with Google</button><button class="buy ghost" data-id="no">Not now</button></div>`,
        s2 => s2.onclick = async e => { const id = e.target.dataset.id; if (id === 'no') return bb.closeSheet(); if (id !== 'fresh') return; await sb.auth.signOut(); const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } }); if (r.error) bb.toast(niceErr(r.error), '#ff8b8b'); });
      return; }
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } }); if (error) bb.toast(niceErr(error), '#ff8b8b'); }
  bb.googleIn = googleIn;
  function introGoogle() { const b = $('#iGoogle'); if (!b) return; b.hidden = !(googleOn && (!session || isAnon())); b.onclick = () => googleIn(); }
  ready.then(introGoogle); setInterval(introGoogle, 4000);

  /* ---------- start screen gate ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#go,#newGame');
    if (!t) return;
    if (t.id === 'newGame') { if (t.dataset.sure) sessionStorage.setItem('ib.reset', '1'); return; }
    if (passed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    next = pass; flow();
  }, true);
  let guestOk = false;
  const NOTE = '<p class="stnote">☁ <b>Continue with Google</b> to save your gameplay and continue where you left off, on any device.</p>';
  function pass() { passed = true; $('#go').click(); }
  const startTitle = () => { const n = bb.startName ? bb.startName() : ''; return n ? 'Start at ' + n : 'Start'; };
  async function flow() {
    const ok = await ready;
    if (!ok) { bb.toast('Online is unavailable right now · playing offline', '#ffc93c'); offline = true; return next(); }
    if (offline) return next();
    if (!session) return signInSheet();
    if (isAnon() && !guestOk) return guestSheet();
    if (banned) return bannedSheet();
    if (!profile || !priv) return nameSheet();
    if (await syncSave()) return;
    offline = false; next();
  }

  function signInSheet() {
    bb.openSheet(startTitle(), 'How do you want to play?', `<div class="stack">${passed ? '' : '<button class="buy ghost" data-id="offline">1 · Continue offline</button>'}<button class="go gbtn" data-id="google"><b>G</b> ${passed ? '' : '2 · '}Continue with Google</button><button class="go alt" data-id="guest">${passed ? '' : '3 · '}Continue as guest</button></div>
      ${NOTE}<p class="note">A guest player lives in this browser only (you can link Google later from 👤 Profile). Offline play has no other players. Accounts nobody plays are removed: guests after 14 days, Google accounts after 60 days.</p><p class="note">By continuing you agree to our <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a>.</p><p class="note" id="si_msg" aria-live="polite"></p>`, s => {
      s.onclick = async e => {
        const b = e.target.closest('[data-id]'); const id = b && b.dataset.id; if (!id) return; const msg = s.querySelector('#si_msg');
        const bad = t => { msg.textContent = t; msg.className = 'note bad'; };
        if (id === 'offline') { offline = true; bb.closeSheet(); return next(); }
        if (id === 'google') { if (!googleOn) return bad('Google sign-in is switched off on the server. Admin: Supabase → Authentication → Providers → Google → Enable, then add the Client ID and secret.'); msg.textContent = 'Opening Google…'; msg.className = 'note'; const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } }); if (error) bad(niceErr(error)); return; }
        if (id === 'guest') {
          msg.textContent = 'Creating your guest account…'; msg.className = 'note';
          const { data, error } = await sb.auth.signInAnonymously(); if (error) return bad(niceErr(error));
          session = data.session; guestOk = true; try { await afterSignIn(); } catch (err) { return bad(niceErr(err)); }
          bb.closeSheet(); flow();
        }
      };
    });
  }
  // a returning guest: keep going as the guest, or move this player to Google
  function guestSheet() {
    bb.openSheet(startTitle(), profile ? 'Welcome back, ' + bb.esc(profile.username) : 'Welcome back', `<div class="stack"><button class="go alt" data-id="guest">1 · Continue as guest</button><button class="go gbtn" data-id="google"><b>G</b> 2 · Continue with Google</button></div>${NOTE}<p class="note">Your guest player moves to Google with all its progress.</p>`,
      s => s.onclick = e => { const b = e.target.closest('[data-id]'); const id = b && b.dataset.id; if (id === 'guest') { guestOk = true; bb.closeSheet(); flow(); } else if (id === 'google') googleIn(); });
  }
  // Create (or finish) the player: username for everyone to see, name and date of birth kept private.
  function nameSheet(editing) {
    const has = !!profile, P = bb.P;
    const low = v => String(v || '').toLowerCase();
    const sug = has ? low(profile.username) : (P.name && !bb.nameOk(low(P.name)) ? low(P.name) : '');
    // Beta v1.01.18 order: 1 Name · 2 Username · 3 Date of birth · 4 Male / Female (for the look)
    const known = has || (P.extra && P.extra.sexSet);
    const pre = Object.assign(priv ? { fullName: priv.full_name, dob: priv.dob } : { fullName: P.fullName, dob: P.dob }, { sexAsk: true, female: known ? !!(P.look && P.look.female) : null });
    bb.openSheet(editing ? 'Edit profile' : has ? 'Finish your profile' : 'Create your player', editing ? 'Name, username, date of birth and look' : 'Takes a few seconds', `<form class="form" id="un" novalidate>
      ${bb.personFields(pre, bb.unameField(sug))}<label class="ck" id="un_pw" hidden><input type="checkbox" id="un_par"${priv && priv.parent_ok ? ' checked' : ''}> My parent or guardian agrees to me playing online</label>
      <p class="note bad" id="un_err" aria-live="polite"></p><div class="btnrow"><button class="go" type="submit">${editing ? 'Save' : 'Continue'}</button></div></form>`, s => {
      const f = s.querySelector('#un'), n = s.querySelector('#pf_name'), m = s.querySelector('#pf_msg'), er = s.querySelector('#un_err'), dobI = s.querySelector('#pf_dob'), pw = s.querySelector('#un_pw');
      const minor = () => { const a = bb.ageFromDob(dobI.value); return a != null && a < 18; };
      const showPw = () => { pw.hidden = !minor(); }; dobI.oninput = showPw; showPw(); bb.sexWire(s);
      const same = () => has && n.value === low(profile.username);
      n.oninput = () => { bb.unameIn(n); const e2 = same() ? '' : bb.nameOk(n.value); m.textContent = e2 || 'Looks good.'; m.className = 'note ' + (e2 ? 'bad' : 'ok'); };
      f.onsubmit = async e => {
        e.preventDefault(); er.textContent = '';
        const full = s.querySelector('#pf_full').value.trim(); if (full.length < 2) { er.textContent = 'Please type your name.'; return; }
        bb.unameIn(n); const name = n.value, e1 = same() ? '' : bb.nameOk(name); if (e1) { m.textContent = e1; m.className = 'note bad'; return; }
        const dob = (priv && priv.dob) || dobI.value, pe = bb.personErr(full, dob); if (pe) { er.textContent = pe; return; }
        const sx = bb.sexGet(s); if (sx == null) { er.textContent = 'Pick Male or Female for your look.'; return; }
        const parentOk = s.querySelector('#un_par').checked; if (minor() && !parentOk) { er.textContent = 'Players under 18 need a parent or guardian to agree before playing online.'; return; }
        m.textContent = 'Saving…'; m.className = 'note';
        const bad = error => { m.textContent = error.code === '23505' ? `${name} is taken. Try another.` : error.code === '23514' ? 'That name is not allowed. Try another.' : niceErr(error); m.className = 'note bad'; };
        if (!has) { const { error } = await sb.from('profiles').insert({ id: session.user.id, username: name, is_guest: isAnon() }); if (error) return bad(error); profile = { username: name, is_guest: isAnon() }; }
        else if (name !== profile.username) { const { error } = await sb.from('profiles').update({ username: name }).eq('id', session.user.id); if (error) return bad(error); profile.username = name; if (ws) { disconnect(true); setTimeout(connect, 300); } }
        const { error: pe2 } = await sb.from('profile_private').upsert({ user_id: session.user.id, full_name: full, dob, parent_ok: minor() ? parentOk : null, updated_at: new Date().toISOString() });
        if (pe2) { er.textContent = niceErr(pe2); return; }
        priv = { full_name: full, dob, parent_ok: minor() ? parentOk : null };
        P.name = name; P.fullName = full; P.dob = dob; P.age18 = !minor(); bb.setSex(sx); bb.setDirty(); bb.refreshBillboards(); bb.setAvatar(); renderIntro(); bb.closeSheet();
        if (editing) { bb.save(); bb.toast('Profile saved', '#3ddc97'); } else flow();
      };
    });
  }

  /* ---------- cloud save ---------- */
  function claim() { bb.P.extra.uid = session.user.id; bb.P.name = profile.username; bb.setDirty(); }
  async function syncSave() {
    const uid = session.user.id, P = bb.P;
    if (bb.testMode) { claim(); return false; }   // test play never touches the cloud save
    if (sessionStorage.getItem('ib.reset')) { sessionStorage.removeItem('ib.reset'); claim(); upload(true); return false; }
    const { data, error } = await sb.from('saves').select('data').eq('user_id', uid).maybeSingle();
    if (error) { bb.toast('Could not reach your cloud save · using this device', '#ffc93c'); claim(); return false; }
    const cloud = data && data.data; const mine = P.extra && P.extra.uid === uid;
    if (cloud && (!mine || (cloud.savedAt || 0) > (P.savedAt || 0))) {
      cloud.extra = cloud.extra || {}; cloud.extra.uid = uid; cloud.name = profile.username;
      localStorage.setItem('ib.save.v3', JSON.stringify(cloud)); sessionStorage.setItem('ib.cloudLoaded', '1'); location.reload(); return true;
    }
    claim(); return false;
  }
  let upAt = 0, upBusy = false, upLater = false;
  async function upload(force) {
    if (!sb || !session || !profile || !passed && !force || bb.testMode) return;
    if (!force && Date.now() - upAt < 20000) { upLater = true; return; }
    if (upBusy) { upLater = true; return; }
    upBusy = true; upLater = false; upAt = Date.now();
    try { const { error } = await sb.from('saves').upsert({ user_id: session.user.id, data: bb.P, updated_at: new Date().toISOString() }); if (error) { console.warn(error); upLater = true; } } catch (e) { upLater = true; }
    upBusy = false;
  }
  bb.on('save', () => upload(false));
  setInterval(() => { if (upLater) upload(true); }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && passed && session) { bb.save(); upload(true); } });
  bb.on('toMenu', () => { if (passed && session) upload(true); });

  /* ---------- server connection ---------- */
  function wsUrl() { return String(C.serverUrl).replace(/^http/, 'ws').replace(/\/$/, '') + '/ws?region=' + REGION + '&token=' + encodeURIComponent(session.access_token); }
  function connect() {
    if (!C.serverUrl || !session || !profile || ws || offline) return;
    kicked = false; idleOff = false; status = 'connecting'; renderChip();
    try { ws = new WebSocket(wsUrl()); } catch (e) { ws = null; return later(); }
    const me = ws;
    me.onmessage = ev => { if (ws !== me) return; U.add('ws_in'); let d; try { d = JSON.parse(ev.data); } catch (e) { return; } handle(d); };
    me.onerror = () => noteErr('Could not reach the game server');
    me.onclose = ev => { if (ws === me && ev && ev.reason) noteErr('Server closed the connection: ' + ev.reason); if (ws !== me) return; ws = null; myId = null; clearRemotes(); status = kicked ? 'off' : 'retry'; renderChip(); if (!kicked) later(); };
  }
  function later() { retry = Math.min(retry + 1, 6); setTimeout(() => { if (!ws && !kicked && !offline && bb.started) connect(); }, 1000 * Math.pow(2, retry)); }
  function disconnect(silent) { kicked = true; if (ws) { const w = ws; ws = null; try { w.close(); } catch (e) {} } myId = null; clearRemotes(); status = 'off'; renderChip(); if (!silent) bb.toast('Offline', '#d6c8e4'); }
  async function handle(d) {
    if (d.t === 'hello') { authRetry = false; myId = d.id; online = d.online; setTimeout(() => { if (ws && ws.readyState === 1) ws.send('{"t":"ping"}'); }, 1500); status = 'on'; retry = 0; lastSent = null; renderChip(); bb.toast(`🌐 Online in India as ${d.name}`, '#3ddc97'); }
    else if (d.t === 'snap') { online = d.online; for (const p of d.list) upsert(p); renderChip(); }
    else if (d.t === 'p') { upsert(d); }
    else if (d.t === 'leave') { drop(d.id); renderChip(); }
    else if (d.t === 'pong') { online = d.online; if (d.city != null) cityN = d.city; if (d.ts) { const off = d.ts - Date.now(); window.__ibClockOff = window.__ibClockOff == null ? off : window.__ibClockOff * .7 + off * .3; } renderChip(); }
    else if (d.t === 'mg') bb.emit('mg', d);
    else if (d.t === 'tr') bb.emit('tr', d);
    else if (d.t === 'vcguest') bb.toast('🎙 Hold to talk is for Google accounts · sign in with Google in ⚙ Settings → Online status', '#ffc93c');
    else if (d.t === 'slow') bb.toast('Wait a moment before sending again', '#ffc93c');
    else if (d.t === 'chatoff') bb.toast('💬 ' + bb.esc(d.msg || 'Chat is paused by the admin right now'), '#ffc93c');
    else if (d.t === 'chat') chat(d);
    else if (d.t === 'v') onV(d);
    else if (d.t === 'call') bb.emit('call', d);
    else if (d.t === 'vc' || d.t === 'vcoff') bb.emit('voice', Object.assign({ self: d.id === myId }, d));
    else if (d.t === 'vs') { U.add('voice_in'); bb.emit('voicestream', d); }
    else if (d.t === 'gc') bb.emit('gc', d);
    else if (d.t === 'ev') bb.emit('ev', d);
    else if (d.t === 'loot') bb.emit('loot', d);
    else if (d.t === 'silenced') { silencedUntil = d.until || silencedUntil; if (Date.now() - (handle._sil || 0) > 8000) { handle._sil = Date.now(); bb.toast(silenceNote(silencedUntil), '#ff8b8b'); } bb.emit('silenced', silencedUntil); }
    else if (d.t === 'kick') { noteErr(d.msg); if (/somewhere else/i.test(d.msg)) d.msg = 'This account is playing in another window or device, so this one went offline. Each player needs their own account (another Google account, or a guest)'; kicked = true; if (/idle/i.test(d.msg)) idleOff = true; bb.toast(d.msg + (idleOff ? ' · press any key to rejoin' : ''), '#ffc93c'); }
    else if (d.t === 'err' && d.code === 'banned') { banned = true; kicked = true; bannedSheet(); }
    else if (d.t === 'err') {
      if (d.code === 'auth' && !authRetry) { authRetry = true; try { const r = await sb.auth.refreshSession(); if (r.data && r.data.session) { session = r.data.session; return; } } catch (e) {} kicked = true; bb.toast(d.msg, '#ff8b8b'); }
      else { noteErr(d.msg); kicked = true; bb.toast(d.msg, '#ff8b8b'); }
    }
  }
  function input() { lastInput = Date.now(); if (idleOff && !ws && bb.started) { idleOff = false; connect(); } }
  ['keydown', 'pointerdown', 'touchstart'].forEach(ev => addEventListener(ev, input, { passive: true }));
  setInterval(() => { if (ws && Date.now() - lastInput > IDLE_MIN * 60000) { disconnect(true); idleOff = true; bb.toast(`Went offline after ${IDLE_MIN} idle minutes · press any key to rejoin`, '#ffc93c'); } }, 30000);
  setInterval(() => { if (ws && ws.readyState === 1) ws.send('{"t":"ping"}'); }, 10000);
  // Keep others seeing you while a menu is open (the game loop pauses then).
  setInterval(() => { if (ws && ws.readyState === 1 && myId && bb.started && (!lastSent || Date.now() - lastSent.at > 3500)) { const st = state(); ws.send(JSON.stringify(st)); st.at = Date.now(); lastSent = st; } }, 2000);
  bb.onStart(() => { if (session && profile && !offline) connect(); renderChip(); });

  /* ---------- other players ---------- */
  function tag0(text, chatty) {
    const c = document.createElement('canvas'), x = c.getContext('2d'); const fs = chatty ? 30 : 28; x.font = `700 ${fs}px "Baloo 2", sans-serif`;
    const w = Math.min(640, Math.ceil(x.measureText(text).width) + 30), h = fs + 22; c.width = w; c.height = h + (chatty ? 12 : 0);
    x.font = `700 ${fs}px "Baloo 2", sans-serif`; x.fillStyle = chatty ? 'rgba(255,255,255,.96)' : 'rgba(20,16,40,.78)';
    const r = h / 2; x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.fill();
    if (chatty) { x.beginPath(); x.moveTo(w / 2 - 10, h - 1); x.lineTo(w / 2, h + 11); x.lineTo(w / 2 + 10, h - 1); x.fill(); }
    x.fillStyle = chatty ? '#1a1430' : '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 1);
    const t = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    const sc = chatty ? .8 : .55; sp.scale.set(sc * c.width / c.height, sc, 1); sp.renderOrder = 999; return sp;
  }
  function tag(text, chatty) { const sp = tag0(text, chatty); setTimeout(() => bb.sizeLabel && bb.sizeLabel(sp, chatty ? 10 : 12), 0); return sp;
  }
  function freeSprite(sp) { if (!sp) return; sp.parent && sp.parent.remove(sp); sp.material.map.dispose(); sp.material.dispose(); }
  const TALL = { bus: 4.4, truck: 4.2 };
  // other players look the way they set themselves up in Settings → My look
  // what you wear goes with your look (Beta v1.01.16): top (shirt, kurta or saree), trouser colour, glasses and cap
  const wear = () => { const o = bb.P.outfit || {}; const top = ['shirt', 'kurta', 'saree'].includes(o.top) ? o.top : 'shirt'; const b = /^#[0-9a-fA-F]{6}$/.test(o.botCol || '') ? o.botCol.slice(1).toLowerCase() : '2d3142'; return top + b + (o.glasses ? 'g' : '') + (o.cap ? 'c' : ''); };
  const clothesOf = d => { const m = /^(shirt|kurta|saree)([0-9a-f]{6})([gc]{0,2})$/.exec(d.w || ''); const top = d.c || '#e8573e'; if (!m) return { dress: 'shirt', shirt: top, pants: '#2d3142' }; return m[1] === 'saree' ? { dress: 'saree', shirt: top, pants: top } : { dress: m[1], shirt: top, pants: '#' + m[2] }; };
  const lookOpts = d => { const L = d.l && bb.decodeLook ? bb.decodeLook(d.l) : null; const c = clothesOf(d); return L ? { look: L, female: L.female, skin: L.skin, clothes: c } : { female: false, clothes: c }; };
  function rebuild(r, d, kind) {
    if (r.body) r.g.remove(r.body);
    r.kind = kind;
    if (d.m === 'd') {
      r.body = bb.buildVeh(d.v); if (d.pl && bb.setPlate) bb.setPlate(r.body, d.pl); const sp = bb.SPEC[d.v] || {};
      if (sp.two || sp.pedal) { const rider = bb.buildPerson(mat(d.c || '#e8573e'), Object.assign(lookOpts(d), { seated: true })); const st = sp.seat || [0, .95, -.2]; rider.position.set(0, st[1] - .6, st[2]); const U = rider.userData; U.legs.forEach(l => l.rotation.x = -1.2); U.arms.forEach(a => a.rotation.x = -.95); r.body.add(rider); r.body.userData.rider = rider; }
      r.tagY = TALL[d.v] || 2.9;
    } else if (d.m === 'r') { r.body = new THREE.Group(); const sit = bb.buildPerson(mat(d.c || '#e8573e'), Object.assign(lookOpts(d), { seated: true })); const U = sit.userData; U.legs.forEach(l => l.rotation.x = -1.3); U.arms.forEach(a => a.rotation.x = -.45); sit.position.y = -.6; r.body.add(sit); r.tagY = 2.1; }
    else { r.body = bb.buildPerson(mat(d.c || '#e8573e'), lookOpts(d)); r.tagY = 2.45; }
    r.g.add(r.body); r.tag.position.y = r.tagY; if (r.bub) r.bub.position.y = r.tagY + 1.1;
  }
  function upsert(d) {
    if (d.id === myId) return;
    let r = remotes.get(d.id);
    const kind = (d.m === 'd' ? 'd:' + d.v : d.m === 'i' ? 'i' : d.m === 'r' ? 'r:' + (d.c || '') : 'f:' + (d.c || '')) + (d.l || '') + (d.w || '');
    if (!r) { r = { id: d.id, n: d.n, g: new THREE.Group(), body: null, kind: '', x: d.x, z: d.z, y: d.y || 0, h: d.h, walk: 0, tagY: 2.4 }; r.tag = tag(d.n, false); r.g.add(r.tag); bb.scene.add(r.g); remotes.set(d.id, r); renderChip(); }
    if (r.kind !== kind && kind !== 'i') rebuild(r, d, kind); else if (kind === 'i') r.kind = 'i';
    r.tx = d.x; r.tz = d.z; r.ty = d.y || 0; r.th = d.h; r.s = d.s || 0; r.seen = performance.now(); r.n = d.n; r.m = d.m; r.v = d.v || ''; r.rid = d.r || ''; r.rs = d.rs || 0; r.o = d.o || 0;
    if (Math.hypot(r.tx - r.x, r.tz - r.z) > 60) { r.x = r.tx; r.z = r.tz; r.h = r.th; }
    if (d.pl && r.pl !== d.pl && bb.setPlate) { r.pl = d.pl; if (r.body) bb.setPlate(r.body, d.pl); if (r.park) bb.setPlate(r.park, d.pl); }
    // Their parked vehicle
    let pk = d.m !== 'd' && d.pv ? d.pv : '';
    if (r.parkTaken) { if (pk !== r.parkTaken) r.parkTaken = null; else pk = ''; }
    if (r.pkType !== pk) { if (r.park) { bb.scene.remove(r.park); r.park = null; } if (pk) { r.park = bb.buildVeh(pk); if (d.pl && bb.setPlate) bb.setPlate(r.park, d.pl); bb.scene.add(r.park); } r.pkType = pk; }
    if (r.park) { r.park.position.set(d.px, d.py || 0, d.pz); r.park.rotation.y = d.ph; } r.pkLock = !!d.lk;
  }
  function drop(id) { const r = remotes.get(id); if (!r) return; bb.scene.remove(r.g); if (r.park) bb.scene.remove(r.park); freeSprite(r.tag); freeSprite(r.bub); remotes.delete(id); }
  function clearRemotes() { for (const id of [...remotes.keys()]) drop(id); }
  const selfG = new THREE.Group(); bb.scene.add(selfG); let selfBub = null, selfBubT = 0;

  let lastVeh = null;
  function state() {
    const pl = bb.player, drive = pl.mode === 'drive' && pl.veh, p = bb.ppos();
    if (drive) lastVeh = pl.veh;
    const lv = !drive && lastVeh && !lastVeh.dead && bb.vehicles.includes(lastVeh) && Math.hypot(lastVeh.pos.x - p.x, lastVeh.pos.z - p.z) < 600 ? lastVeh : null;
    const park = lv ? { pv: lv.type, px: +lv.pos.x.toFixed(1), pz: +lv.pos.z.toFixed(1), py: +(lv.pos.y || 0).toFixed(1), ph: +lv.h.toFixed(2), lk: lv.locked ? 1 : 0 } : {};
    if (ride) return { zn: (bb.zoneAt(p.x, p.z, 40) || {}).id || '', t: 'p', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: 0, h: +pl.h.toFixed(3), s: 0, m: 'r', v: '', c: bb.P.outfit.topCol || '', l: bb.lookCode ? bb.lookCode() : '', w: wear(), r: ride.id, rs: ride.s };
    const zq = bb.zoneAt(p.x, p.z, 40); const zn = zq ? zq.id : '';
    return { ...park, ...(drive && riders.size ? { o: riders.size } : {}), zn, t: 'p', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +(p.y || 0).toFixed(2), h: +(drive ? pl.veh.h : pl.h).toFixed(3), s: +((drive ? pl.veh.v : pl.v) || 0).toFixed(1), m: bb.inside ? 'i' : drive ? 'd' : 'f', v: drive ? pl.veh.type : '', c: bb.P.outfit.topCol || '', l: bb.lookCode ? bb.lookCode() : '', w: wear(), pl: (bb.P.extra && bb.P.extra.plate) || '' };
  }
  bb.onUpdate(dt => {
    const now = performance.now(), k = 1 - Math.exp(-8 * Math.min(dt, .2)), hide = bb.inside;
    for (const r of [...remotes.values()]) {
      if (now - r.seen > 9000) { drop(r.id); renderChip(); continue; }
      r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k; r.y += (r.ty - r.y) * k;
      let dh = r.th - r.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); r.h += dh * k;
      r.g.position.set(r.x, r.y + (r.kind[0] === 'f' ? .3 : 0), r.z); if (r.body) r.body.rotation.y = r.h; r.g.visible = !hide && r.kind !== 'i'; if (r.park) r.park.visible = !hide;
      if (r.kind[0] === 'f' && r.body && r.body.userData.legs) { const mv = Math.hypot(r.tx - r.x, r.tz - r.z) > .05 || Math.abs(r.s) > .3; r.walk += Math.min(dt, .2) * (mv ? 9 : 0); const a = mv ? Math.sin(r.walk) * .6 : 0; const U = r.body.userData; U.legs[0].rotation.x = a; U.legs[1].rotation.x = -a; U.arms[0].rotation.x = -a; U.arms[1].rotation.x = a; }
      if (r.bub && now > r.bubT) { freeSprite(r.bub); r.bub = null; }
    }
    const p = bb.ppos(); selfG.position.set(p.x, p.y || 0, p.z); selfG.visible = !hide;
    if (selfBub && now > selfBubT) { freeSprite(selfBub); selfBub = null; }
    if (ws && ws.readyState === 1 && myId && bb.started) {
      const st = state(), t = Date.now(), L = lastSent;
      const moved = ride ? (!L || L.m !== 'r' || L.r !== st.r) : !L || L.o !== st.o || Math.hypot(st.x - L.x, st.z - L.z) > .4 || Math.abs(st.h - L.h) > .05 || st.m !== L.m || st.v !== L.v || st.c !== L.c || st.pv !== L.pv || st.lk !== L.lk || (st.pv && Math.hypot(st.px - L.px, st.pz - L.pz) > .5);
      const gap = L ? t - L.at : 1e9;
      if ((moved && gap > (riders.size ? 120 : 300)) || gap > (ride ? 2500 : 4000)) { ws.send(JSON.stringify(st)); st.at = t; lastSent = st; }
    }
  });


  /* ---------- sharing vehicles: ride along with a driver, or take a parked vehicle ---------- */
  const CAP = { cycle: 1, skycar: 2, rickshaw: 3, bike: 2, sportsbike: 2, auto: 4, taxi: 5, car: 5, sedan: 5, suv: 7, sports: 2, police: 5, bus: 30, truck: 3, mpv: 7, van: 8, coupe: 2, convertible: 4, limo: 6, ambulance: 3, camper: 4, pickup: 3, lorry: 3, tanker: 2, towtruck: 2, firetruck: 4, tractor: 1, scooter: 2, atv: 2, golfcart: 4, erickshaw: 4 };
  function seatOff(type, i) { const sp = bb.SPEC[type] || {};
    if (type === 'bike' || type === 'sportsbike') return [0, .95, -.62];
    if (sp.two || sp.pedal) { const st = sp.seat || [0, .95, -.2]; return [0, st[1] + .05, st[2] - .45]; }
    if (type === 'erickshaw' || type === 'golfcart') return [[-.35, .6, -.4], [.35, .6, -.4], [0, .6, -.4]][i % 3];
    if (type === 'tractor') return [.35, 1.1, -.3];
    if (type === 'rickshaw') return [i ? .36 : -.36, 1, -.45];
    if (type === 'auto') return [(i - 1) * .45, .65, -.55];
    if (type === 'bus') { const row = Math.floor(i / 2); return [(i % 2 ? .7 : -.7) + (row > 13 ? 0 : 0), 1.35, 3.6 - row * .55]; }
    if (type === 'truck') return [.6 - i * .5, 1.4, (sp.fp || [0, 0, 2.9])[2]];
    const fz = (sp.fp || [0, 0, .15])[2]; const seats = [[.4, .55, fz], [-.4, .55, fz - 1], [.4, .55, fz - 1], [0, .55, fz - 1], [-.4, .7, fz - 1.75], [.4, .7, fz - 1.75]]; return seats[i] || seats[0]; }
  const riders = new Map(); // when I drive: rider id -> { s, at }
  let ride = null, asked = null; // when I ride: { id, s, n, type }
  let allowRiders = (() => { try { return localStorage.getItem('ib.riders') !== '0'; } catch (e) { return true; } })();
  function vsend(a, to, s) { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: 'v', a, to, s: s || 0 })); }
  function freeSeat(type) { const cap = (CAP[type] || 2) - 1; const used = new Set([...riders.values()].map(q => q.s)); for (let i = 0; i < cap; i++) if (!used.has(i)) return i; return -1; }
  function seatWorld(x, z, h, type, i) { const o = seatOff(type, i); const c = Math.cos(h), s = Math.sin(h); return [x + o[0] * c + o[2] * s, o[1], z - o[0] * s + o[2] * c]; }
  function startRide(r, s, n) { if (bb.player.mode !== 'foot' || bb.inside) return; ride = { id: r.id, s, n: n || r.n, type: r.v }; bb.avatar.visible = false; lastSent = null; bb.toast(`Riding with ${bb.esc(ride.n)} · press E to get off`, '#3ddc97'); }
  function endRide(msg, jumped) { if (!ride) return; const r = remotes.get(ride.id); const pl = bb.player;
    if (r) { const sp = bb.SPEC[r.v || ride.type] || { wid: 2 }; const sx = Math.cos(r.h), sz = -Math.sin(r.h); let px = r.x + sx * (sp.wid / 2 + 1), pz = r.z + sz * (sp.wid / 2 + 1); if (!bb.drivable(px, pz)) { px = r.x - sx * (sp.wid / 2 + 1); pz = r.z - sz * (sp.wid / 2 + 1); } pl.pos.set(px, 0, pz); }
    const spd = Math.abs((r && r.s) || 0); if (bb.avatar.userData) bb.avatar.userData.sitK = 0; ride = null; bb.avatar.visible = true; lastSent = null; const U = bb.avatar.userData; if (U.legs) U.legs.forEach(l => l.rotation.z = 0); if (bb.seatAvatar) bb.seatAvatar(false);
    if (jumped && spd > 2) { const kmh = Math.round(spd * 3.6); const hurt = Math.min(85, spd * 2.6) * (bb.P.helmet ? .5 : 1); bb.player.knock = 1.4 + Math.min(1.5, spd / 10); bb.damage(hurt, 'Jumped off a moving vehicle'); bb.toast(`🤕 You jumped off at ${kmh} km/h · -${Math.round(hurt)} health`, '#ff5d73'); if (bb.sfx) bb.sfx('hit'); return; }
    if (msg) bb.toast(msg, '#d6c8e4'); }
  function takeParked(r) { const pk = r.park; if (!pk) return; const type = r.pkType; const v = bb.makeVeh(type, pk.position.x, pk.position.z, pk.rotation.y, 'parked'); bb.scene.remove(pk); r.park = null; r.parkTaken = type;
    vsend('take', r.id); bb.enterVehicle(v); bb.toast(`You took ${bb.esc(r.n)}'s ${(bb.SPEC[type] || {}).label || 'vehicle'}`, '#ffc93c'); }
  function onV(d) { const r = remotes.get(d.id), pl = bb.player; const nm = bb.esc(d.n || 'A player');
    if (d.a === 'ride') {
      if (!(pl.mode === 'drive' && pl.veh) || !allowRiders) return vsend('no', d.id); if (Math.abs(pl.veh.v) > 3) return vsend('slow', d.id);
      if (riders.has(d.id)) return vsend('seat', d.id, riders.get(d.id).s);
      const s = freeSeat(pl.veh.type); if (s < 0) return vsend('full', d.id); riders.set(d.id, { s, at: performance.now() }); vsend('seat', d.id, s); lastSent = null;
      bb.toast(`${nm} hopped in · ${riders.size} rider${riders.size > 1 ? 's' : ''} on board`, '#3ddc97'); }
    else if (d.a === 'seat') { if (!asked || asked.id !== d.id || !r) return; asked = null; startRide(r, d.s | 0, d.n); }
    else if (d.a === 'full') { asked = null; bb.toast(`${nm}'s vehicle is full`, '#ff9f1c'); }
    else if (d.a === 'slow') { asked = null; bb.toast(`${nm} has to stop first`, '#ff9f1c'); }
    else if (d.a === 'no') { asked = null; bb.toast(`${nm} isn't taking riders right now`, '#ff9f1c'); }
    else if (d.a === 'leave') { if (riders.delete(d.id)) { lastSent = null; bb.toast(`${nm} got off`, '#d6c8e4'); } }
    else if (d.a === 'drop') { if (ride && ride.id === d.id) endRide(`${nm} dropped you off`); }
    else if (d.a === 'take') { const v = lastVeh; if (!v || pl.veh === v || !bb.vehicles.includes(v)) return; const label = v.spec.label;
      if (v.owned) { const i = v.ownedIdx; bb.removeVeh(v); if (bb.ownedVeh[i] === v) bb.ownedVeh[i] = null; const c = bb.P.cars[i]; if (c) c.x = null; bb.setDirty(); } else bb.removeVeh(v);
      lastVeh = null; lastSent = null; bb.toast(`${nm} drove off in your ${label}! Call it back from Menu → Garage`, '#ff9f1c'); }
  }
  bb.on('exitVehicle', () => { for (const id of riders.keys()) vsend('drop', id); riders.clear(); lastSent = null; });
  bb.on('teleport', () => { if (ride) { vsend('leave', ride.id); ride = null; bb.avatar.visible = true; } });
  bb.addFirstPrompt(() => {
    if (ride) return { text: Math.abs(ride.spd || 0) > 2 ? `Jump off · ${ride.n} is moving!` : `Get off · riding with ${ride.n}`, fn: () => { vsend('leave', ride.id); endRide(null, true); } };
    if (status !== 'on' || bb.player.mode !== 'foot') return null;
    const p = bb.ppos(); let best = null, bd = 1e9, kind = '';
    for (const r of remotes.values()) {
      if (r.m === 'd' && r.v && (CAP[r.v] || 2) > 1) { const sp = bb.SPEC[r.v] || {}; const d = Math.hypot(r.x - p.x, r.z - p.z); if (d < (sp.len || 4) / 2 + 2 && d < bd) { bd = d; best = r; kind = 'ride'; } }
      if (r.park) { const sp = bb.SPEC[r.pkType] || {}; const d = Math.hypot(r.park.position.x - p.x, r.park.position.z - p.z); if (d < (sp.len || 4) / 2 + 1.4 && d < bd) { bd = d; best = r; kind = 'take'; } }
    }
    if (!best) return null; const r = best;
    if (kind === 'ride') { const lab = (bb.SPEC[r.v] || {}).label || 'vehicle', free = Math.max(0, (CAP[r.v] || 2) - 1 - (r.o || 0));
      return { text: free ? `Ride with ${r.n} · ${free} seat${free > 1 ? 's' : ''} free` : `${r.n}'s ${lab} is full`, fn: () => {
        if (!free) return bb.toast('No free seats', '#ff9f1c'); if (Math.abs(r.s) > 3) return bb.toast(`Wait for ${bb.esc(r.n)} to stop`, '#ff9f1c');
        asked = { id: r.id }; vsend('ride', r.id); bb.toast(`Asking ${bb.esc(r.n)} for a ride…`, '#5fb4ff'); setTimeout(() => { if (asked && asked.id === r.id) { asked = null; bb.toast('No answer · try again', '#ff9f1c'); } }, 5000); } }; }
    if (r.pkLock) return { text: `🔒 ${r.n}'s ${(bb.SPEC[r.pkType] || {}).label || 'vehicle'} is locked`, fn: () => bb.toast(`🔒 Locked · only ${bb.esc(r.n)} can open it`, '#ff9f1c') };
    return { text: `Take ${r.n}'s ${(bb.SPEC[r.pkType] || {}).label || 'vehicle'}`, fn: () => takeParked(r) };
  });
  bb.onUpdate(() => {
    const pl = bb.player, now = performance.now();
    if (ride) { const r = remotes.get(ride.id);
      if (!r || r.m !== 'd' || !ws) endRide('The driver got out · you are on foot');
      else { const [x, y, z] = seatWorld(r.x, r.z, r.h, r.v || ride.type, ride.s); pl.pos.set(x, 0, z); pl.h = r.h; pl.v = 0; ride.spd = r.s || 0;
        // you are seen sitting behind the driver (Beta v1.01.25), not hidden
        const A = bb.avatar, U = A.userData; const two = (bb.SPEC[r.v || ride.type] || {}).two; A.visible = bb.camMode !== 2 || !two ? true : false; const low = !two && !['auto', 'rickshaw', 'erickshaw', 'golfcart', 'tractor', 'bus', 'truck'].includes(r.v || ride.type); U.sitK = low ? -.85 : 0; A.position.set(x, y - (low ? .92 : .6), z); A.rotation.set(0, r.h, 0); if (bb.seatAvatar) bb.seatAvatar(true);
        if (U.legs) U.legs.forEach((l, i) => { l.rotation.x = two ? -1.25 : -1.5; l.rotation.z = (i ? 1 : -1) * (two ? .12 : .05); }); if (U.arms) U.arms.forEach(a => a.rotation.x = two ? -.45 : -.4); } }
    for (const r of remotes.values()) { if (r.m !== 'r' || !r.body) continue; let vx, vz, vh, vt;
      if (r.rid === myId && pl.mode === 'drive' && pl.veh) { const v = pl.veh; vx = v.pos.x; vz = v.pos.z; vh = v.h; vt = v.type; }
      else { const d = remotes.get(r.rid); if (!d || d.m !== 'd') { r.g.visible = false; continue; } vx = d.x; vz = d.z; vh = d.h; vt = d.v; }
      const [x, y, z] = seatWorld(vx, vz, vh, vt, r.rs); r.x = r.tx = x; r.z = r.tz = z; r.h = r.th = vh; r.g.position.set(x, y, z); r.body.rotation.y = vh; { const sp2 = bb.SPEC[vt] || {}; const low = !(sp2.two || sp2.pedal) && !['auto', 'rickshaw', 'erickshaw', 'golfcart', 'tractor', 'bus', 'truck'].includes(vt); const sit = r.body.children[0]; if (sit) { sit.position.y = low ? -.92 : -.6; const U = sit.userData; U.sitK = low ? -.85 : 0; if (U.legs) U.legs.forEach(l => l.rotation.x = low ? -1.5 : -1.3); } } r.g.visible = !bb.inside; }
    if (riders.size) { if (pl.mode !== 'drive') { for (const id of riders.keys()) vsend('drop', id); riders.clear(); }
      else for (const [id, q] of [...riders]) { const r = remotes.get(id); if ((!r || r.m !== 'r' || r.rid !== myId) && now - q.at > 6000) { riders.delete(id); lastSent = null; } } }
  });

  /* ---------- chat ---------- */
  function chat(d) {
    const self = d.id === myId;
    if (!self && muted.has(String(d.n).toLowerCase())) return;
    lastChat[d.n] = d.text;
    const line = document.createElement('div'); line.className = 'cl'; line.innerHTML = `<b>${bb.esc(d.n)}</b> ${bb.esc(d.text)}`; log.appendChild(line);
    while (log.children.length > 4) log.firstChild.remove();
    setTimeout(() => { line.classList.add('fade'); setTimeout(() => line.remove(), 800); }, 12000);
    const short = d.text.length > 42 ? d.text.slice(0, 40) + '…' : d.text;
    if (self) { freeSprite(selfBub); selfBub = tag(short, true); selfBub.position.y = (bb.player.mode === 'drive' ? 3.4 : 2.9); selfG.add(selfBub); selfBubT = performance.now() + 7000; }
    else { const r = remotes.get(d.id); if (r) { freeSprite(r.bub); r.bub = tag(short, true); r.bub.position.y = r.tagY + 1.1; r.g.add(r.bub); r.bubT = performance.now() + 7000; } }
  }
  function openBar() { if (silencedUntil > Date.now()) return bb.toast(silenceNote(silencedUntil), '#ff8b8b'); if (bb.CFG.chatOn === false) return bb.toast('💬 ' + bb.esc(bb.CFG.chatNote || 'Chat is paused by the admin right now'), '#ffc93c'); if (status !== 'on') { if (lastErr || !session) return onlineSheet(); offline = false; if (!session || !profile) { next = connect; return flow(); } return connect(); } bar.hidden = false; inp.value = ''; inp.focus(); }
  function closeBar() { bar.hidden = true; inp.blur(); }
  bar.onsubmit = e => { e.preventDefault(); const t = inp.value.trim(); if (t && ws && ws.readyState === 1) { ws.send(JSON.stringify({ t: 'chat', text: t.slice(0, 120), r: chatR })); U.add('chat'); U.add('ws_out'); } closeBar(); };
  bar.querySelector('[data-x]').onclick = closeBar;
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeBar(); } });
  chip.onclick = openBar;
  // T opens chat. Handled here so the T itself is not typed into the box.
  addEventListener('keydown', e => { if (e.code !== 'KeyT' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; if (e.target.closest && e.target.closest('input,textarea,select')) return; if (!bb.started || bb.uiLock()) return; e.preventDefault(); openBar(); }, true);
  // Settings → Online status (and tapping the chip when you are not online): what the game knows about your connection
  function onlineSheet() { const acct = !session ? 'Not signed in' : isAnon() ? 'Guest account (this browser only)' : 'Google account';
    const st = status === 'on' ? `Online · ${remotes.size} player(s) near you · ${online} in India` : status === 'connecting' ? 'Joining the server…' : status === 'retry' ? 'Reconnecting…' : offline ? 'Playing offline' : 'Not connected';
    bb.openSheet('🌐 Online status', 'Who you are and whether you are connected', bb.rowHtml('i_acct', acct, profile ? 'Username: ' + bb.esc(profile.username) : session ? 'No username yet' : 'Sign in to see other players', session && !isAnon() ? '' : 'Sign in', 'ghost') +
      bb.rowHtml('i_srv', st, lastErr ? 'Last message: ' + bb.esc(lastErr) : 'Players see each other within about 700 m', status === 'on' ? '' : 'Connect', status === 'on' ? 'ghost' : '') +
      `<p class="note">To see another player, both of you need your <b>own</b> account (two different Google accounts, or a guest in each browser) and both must show <b>Online</b> here. One account can only be online in one window at a time.</p>`,
      sh => sh.onclick = e => { const id = e.target.dataset.id; if (id === 'i_acct' && (!session || isAnon())) { bb.closeSheet(); return googleIn(); } if (id === 'i_srv' && status !== 'on') { bb.closeSheet(); lastErr = ''; offline = false; kicked = false; if (!session || !profile) { next = connect; return flow(); } connect(); } }); }
  bb.addApp({ id: 'online', label: 'Online status', icon: '🌐', group: 'settings', fn: onlineSheet });
  function renderChip() {
    chip.hidden = !bb.started;
    const pz = bb.ppos(); const zq = bb.started ? bb.zoneAt(pz.x, pz.z, 40) : null;
    chip.innerHTML = status === 'on' ? `<i class="dot on"></i><b>Online</b> <small>${cityN != null && zq ? `${cityN} in ${bb.esc(zq.name)}` : `${online} in India`} · ${remotes.size} near</small><em>💬</em>` : status === 'connecting' ? '<i class="dot wait"></i><b>Joining…</b>' : status === 'retry' ? '<i class="dot wait"></i><b>Reconnecting…</b>' : !session ? '<i class="dot"></i><b>Offline</b> <small>Not signed in · tap</small>' : offline ? '<i class="dot"></i><b>Offline</b> <small>tap to go online</small>' : '<i class="dot"></i><b>Offline</b> <small>tap to rejoin</small>';
    chip.classList.toggle('on', status === 'on');
  }

  /* ---------- start screen line ---------- */
  // under the Start button: who you are
  function whoLine() { const m = $('.imenu'); if (!m) return; let w = $('#iWho'); if (!w) { w = document.createElement('div'); w.id = 'iWho'; const g = $('#go'); if (g && g.parentNode === m) g.after(w); else m.prepend(w); }
    w.innerHTML = session && !isAnon() ? `✓ Signed in as <b>${bb.esc(session.user.email || (profile && profile.username) || 'Google')}</b>` : session ? `Playing as guest${profile ? ' <b>' + bb.esc(profile.username) + '</b>' : ''} · Continue with Google to save your gameplay` : 'Continue with Google to save your gameplay and continue where you left off'; }
  async function serverStatus() { if (!C.serverUrl) return; try { const r = await fetch(String(C.serverUrl).replace(/\/$/, '') + '/status'); const j = await r.json(); if (typeof j[REGION] === 'number') { online = j[REGION]; renderIntro(); } } catch (e) {} }
  function renderIntro() {
    whoLine();
    if (bb.cloudHas && bb.needCity && bb.needCity()) { const g = $('#go'), t = g && (g.querySelector('.gt') || g); if (t) t.textContent = 'Continue from cloud save'; const sp = $('#spick'); if (sp && !sp.querySelector('.chips')) sp.innerHTML = '<p>Your Google save will continue where you left off.</p>'; }
    if (!introLine) return;
    const who = session && profile ? `Signed in as <b>${bb.esc(!isAnon() && session.user.email ? session.user.email : profile.username)}</b>${isAnon() ? ' (guest)' : ''} · <button type="button" class="lnk" data-out>Sign out</button>` : session ? 'Signed in · pick a username when you start' : status === 'error' ? 'Online is unavailable right now' : 'Sign in when you start to play online';
    introLine.innerHTML = `🌐 India online${online ? ` · <b>${online}</b> playing now` : ''}<br><small>${who}</small>`;
    const o = introLine.querySelector('[data-out]'); if (o) o.onclick = signOut;
  }
  async function signOut() { bb.save(); await upload(true); disconnect(true); try { await sb.auth.signOut(); } catch (e) {} localStorage.removeItem('ib.save.v3'); localStorage.removeItem('ib.testmode'); location.reload(); }

  /* ---------- phone app ---------- */
  function sheet() {
    if (!session || !profile) return bb.openSheet('🌐 Online', 'You are playing offline', `<p class="note">Sign in to see other players, chat and keep your progress in the cloud.</p><div class="btnrow"><button class="go" data-id="signin">Go online</button></div>`, s => s.onclick = e => { if (e.target.dataset.id === 'signin') { offline = false; next = () => { bb.closeSheet(); connect(); }; flow(); } });
    const pp = bb.ppos(); const list = [...remotes.values()].map(r => ({ r, d: Math.hypot(r.x - pp.x, r.z - pp.z) })).sort((a, b) => a.d - b.d);
    const st = status === 'on' ? `Connected · ${online} online in India` : status === 'connecting' || status === 'retry' ? 'Connecting…' : 'Offline';
    bb.openSheet('🌐 Online', st,
      bb.rowHtml('conn', status === 'on' ? 'Connected' : 'Not connected', `Region: India${C.serverUrl ? '' : ' · server not set up yet'}`, status === 'on' ? 'Go offline' : 'Connect', status === 'on' ? 'ghost' : '') +
      bb.rowHtml('acct', bb.esc(profile.username), isAnon() ? 'Guest account · progress lives in this browser' : 'Google account · progress saved in the cloud', isAnon() ? (googleOn ? 'Link Google' : 'Guest') : 'Sign out', 'ghost') +
      (isAnon() ? bb.rowHtml('out', 'Sign out', 'A guest account cannot be recovered after signing out', 'Sign out', 'ghost') : '') +
      bb.rowHtml('riders', 'Let players ride with me', allowRiders ? 'On · nearby players can hop into your vehicle when you stop' : 'Off · nobody can join your vehicle', allowRiders ? 'Turn off' : 'Turn on', 'ghost') +
      (riders.size ? bb.rowHtml('dropall', `Riders on board: ${riders.size}`, 'They sit with you while you drive', 'Drop them off', 'ghost') : '') +
      `<h3 class="sub">Players near you (${list.length})</h3>` +
      (list.length ? list.map(({ r, d }) => `<div class="row"><div class="nm">${bb.esc(r.n)}<small>${d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km'} · ${r.m === 'd' ? 'driving' + (r.o ? ` · ${r.o} rider${r.o > 1 ? 's' : ''}` : '') : r.m === 'i' ? 'indoors' : r.m === 'r' ? 'riding along' : 'on foot'}</small></div><div class="btnrow" style="flex-wrap:nowrap;gap:6px"><button class="buy ghost" data-mute="${bb.esc(r.n)}">${muted.has(r.n.toLowerCase()) ? 'Unmute' : 'Mute'}</button><button class="buy ghost" data-rep="${bb.esc(r.n)}">Report</button></div></div>`).join('') : '<p class="note">Nobody nearby yet. Players within about 700 m show up here and on the road.</p>') +
      (bb.VOICE ? bb.rowHtml('voicein', 'Voice messages from others', bb.VOICE.hear ? 'On · they play out loud when they arrive' : 'Off · you will not hear voice messages', bb.VOICE.hear ? 'Turn off' : 'Turn on', 'ghost') : '') +
      `<p class="note">Chat with <kbd>T</kbd> or the 💬 button. Messages reach players within 250 m. Hold 🎙 (or V) to send a voice message. Be kind: reports go to the admin.</p>`,
      s => s.onclick = async e => {
        const id = e.target.dataset.id, mu = e.target.dataset.mute, rep = e.target.dataset.rep;
        if (id === 'conn') { if (status === 'on') disconnect(); else { offline = false; connect(); } return setTimeout(sheet, 400); }
        if (id === 'acct') { if (!isAnon()) return signOut(); return googleIn(); }
        if (id === 'out') return signOut();
        if (id === 'voicein' && bb.VOICE) { bb.VOICE.hear = !bb.VOICE.hear; return sheet(); }
        if (id === 'riders') { allowRiders = !allowRiders; try { localStorage.setItem('ib.riders', allowRiders ? '1' : '0'); } catch (er) {} if (!allowRiders) { for (const k of riders.keys()) vsend('drop', k); riders.clear(); lastSent = null; } return sheet(); }
        if (id === 'dropall') { for (const k of riders.keys()) vsend('drop', k); riders.clear(); lastSent = null; return sheet(); }
        if (mu) { const k = mu.toLowerCase(); muted.has(k) ? muted.delete(k) : muted.add(k); try { localStorage.setItem('ib.mutedPlayers', JSON.stringify([...muted])); } catch (er) {} bb.toast(muted.has(k) ? `${mu} muted` : `${mu} unmuted`, '#d6c8e4'); return sheet(); }
        if (rep) return reportSheet(rep);
      });
  }
  const RKIND = [['chat', 'Nearby chat'], ['text', 'Text messages'], ['voice', 'Voice chat'], ['call', 'Phone call'], ['group', 'Group chat or call'], ['event', 'At an event'], ['post', 'BayGram post or comment'], ['name', 'Bad username'], ['cheat', 'Cheating'], ['other', 'Something else']];
  function reportSheet(name, kind, extra) {
    bb.openSheet('Report ' + name, 'The admin reviews every report · when several players report someone, their chat, voice and calls stop for a while', `<form class="form" id="rp" novalidate><label>Where?<select id="rp_k">${RKIND.map(([k, l]) => `<option value="${k}"${k === (kind || 'chat') ? ' selected' : ''}>${l}</option>`).join('')}</select></label><label>What happened?<select id="rp_r"><option>Rude or abusive</option><option>Bullying or threats</option><option>Spamming</option><option>Sexual or unsafe talk</option><option>Cheating</option><option>Other</option></select></label><label>Details (optional)<textarea id="rp_t" maxlength="200"></textarea></label><div class="btnrow"><button class="go" type="submit">Send report</button></div><p class="note" id="rp_m"></p></form>`, s => {
      s.querySelector('#rp').onsubmit = async e => {
        e.preventDefault(); const k = s.querySelector('#rp_k').value; const reason = (s.querySelector('#rp_r').value + ' · ' + s.querySelector('#rp_t').value).slice(0, 300);
        let { error } = await sb.from('reports').insert({ target_name: name, reporter_name: profile ? profile.username : null, reason, last_chat: extra || lastChat[name] || null, kind: k });
        if (error && /kind/.test(error.message || '')) ({ error } = await sb.from('reports').insert({ target_name: name, reporter_name: profile ? profile.username : null, reason: `[${k}] ` + reason, last_chat: extra || lastChat[name] || null }));
        if (error) { const m = s.querySelector('#rp_m'); m.textContent = niceErr(error); m.className = 'note bad'; return; }
        muted.add(name.toLowerCase()); try { localStorage.setItem('ib.mutedPlayers', JSON.stringify([...muted])); } catch (er) {}
        bb.closeSheet(); bb.toast(`Report sent · ${name} is muted for you`, '#3ddc97');
      };
    });
  }
  bb.addApp({ id: 'online', label: 'Online', icon: '🌐', fn: sheet });

  /* ---------- profile button (👤): account rows ---------- */
  bb.displayName = () => (profile ? profile.username : '');
  bb.userEmail = () => (session && session.user && !isAnon() ? session.user.email || '' : '');
  function sure(e, text) { if (e && e.target && !e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = text; return false; } return true; }
  bb.addProfileRows(() => {
    if (!session || !profile) return { sub: offline ? 'Playing offline on this device' : 'Not signed in', top: [{ id: 'p_in', label: '🌐 Sign in to play online', sub: 'See other players and keep your progress in the cloud', btn: 'Sign in', cls: '' }], end: [],
      handle: id => { if (id === 'p_in') { offline = false; next = passed ? () => { bb.closeSheet(); connect(); } : () => { bb.closeSheet(); renderIntro(); bb.setAvatar(); }; flow(); } } };
    const top = isAdmin ? [{ id: 'p_admin', label: '🔑 Admin panel', sub: 'Game settings, reports and support', btn: 'Open', cls: '' }] : [];
    if (isAnon()) top.unshift({ id: 'p_google', label: '🔗 Sign in with Google', sub: 'Keep this player on every device, post on BayGram, call and text friends', btn: 'Link Google', cls: '' });
    if (isTester || bb.testMode) top.unshift(bb.testMode ? { id: 'p_mode', label: '🧪 Play mode: TEST PLAY', sub: 'Separate test save · everything unlocked · Phone → Test tools', btn: 'Back to real play', cls: '' } : { id: 'p_mode', label: '🧪 Play mode: real play', sub: 'Testers can switch to a separate test save with everything unlocked', btn: 'Switch to test play', cls: 'ghost' });
    const end = [{ id: 'p_out', label: '🚪 Log out', sub: isAnon() ? 'A guest account cannot be recovered after logging out' : 'Sign in again any time with Google', btn: 'Log out', cls: 'danger' },
      { id: 'p_del', label: '🗑 Delete account', sub: 'Removes your player, name, date of birth and cloud save for good', btn: 'Delete', cls: 'danger' }];
    top.push({ id: 'p_keep', label: '🗓 Keep your account', sub: isAnon() ? 'Guest accounts not played for 14 days are removed. Sign in with Google to keep it longer' : 'Accounts not played for 60 days are removed, with their cloud save and BayGram photos', btn: 'OK', cls: 'ghost' });
    return { sub: isAnon() ? 'Guest account' : 'Google · ' + (session.user.email || ''), top, end, handle: async (id, e) => { if (id === 'p_keep') return;
      if (id === 'p_admin') return window.open('admin/', '_blank', 'noopener');
      if (id === 'p_google') { bb.closeSheet(); return googleIn(); }
      if (id === 'p_mode') return bb.setTestMode(!bb.testMode);
      if (id === 'p_out') { if (isAnon() && !sure(e, 'Tap again to log out')) return; return signOut(); }
      if (id === 'p_del') { if (!sure(e, 'Tap again to delete for good')) return; const { error } = await sb.rpc('delete_my_account'); if (error) return bb.toast(niceErr(error), '#ff8b8b'); disconnect(true); try { await sb.auth.signOut(); } catch (er) {} localStorage.removeItem('ib.save.v3'); bb.toast('Your account was deleted', '#d6c8e4'); setTimeout(() => location.reload(), 1200); }
    } };
  });
  bb.profileEdit = () => (session && profile ? nameSheet(true) : bb.profileSheet(false));
  bb.introLabel = () => (session && profile ? profile.username : 'Sign in');
  bb.introClick = () => { if (session && profile) return bb.hubSheet(); offline = false; next = () => { bb.closeSheet(); renderIntro(); bb.setAvatar(); }; flow(); };

  // bubble over a player (or yourself) without adding a chat line; used by voice messages
  function bubble(id, text) { if (id === myId) { freeSprite(selfBub); selfBub = tag(text, true); selfBub.position.y = (bb.player.mode === 'drive' ? 3.4 : 2.9); selfG.add(selfBub); selfBubT = performance.now() + 5000; return; }
    const r = remotes.get(id); if (r) { freeSprite(r.bub); r.bub = tag(text, true); r.bub.position.y = r.tagY + 1.1; r.g.add(r.bub); r.bubT = performance.now() + 5000; } }
  bb.on('zone', () => renderChip());
  bb.ONLINE = { report: reportSheet, get chatR() { return chatR; }, get client() { return sb; }, get uid() { return session && session.user ? session.user.id : null; }, get username() { return profile ? profile.username : ""; }, signOut, get status() { return status; }, get remotes() { return remotes; }, get profile() { return profile; }, get myId() { return myId; }, connect, disconnect, bubble,
    send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); U.add('ws_out'); return true; } return false; }, get silencedUntil() { return silencedUntil > Date.now() ? silencedUntil : 0; }, silenceNote, get banned() { return banned; }, isMuted: n => muted.has(String(n).toLowerCase()), openChat: () => openBar(),
    rpc: (n, a) => (sb ? sb.rpc(n, a) : Promise.resolve({ error: { message: 'offline' } })), get signedIn() { return !!(session && profile); }, get isTester() { return isTester; }, get isAdmin() { return isAdmin; }, get guest() { return !!(session && isAnon()); } };

  // Bot people and bot traffic make room for real players: the more players online near you, the fewer bots.
  // No players = 100% bots. Every player near you removes 8% and every 20 players online in the region remove 5% more,
  // never below 25%. Checked every 10 seconds; going offline brings all the bots back.
  setInterval(() => { if (!bb.started) return; const pp = bb.ppos(); let n = 0;
    if (status === 'on') for (const r of remotes.values()) if (Math.hypot(r.x - pp.x, r.z - pp.z) < 600) n++;
    const all = status === 'on' ? Math.max(0, online - 1) : 0; bb.setBotScale(Math.max(.25, 1 - n * .08 - Math.floor(all / 20) * .05)); }, 10000);
});
