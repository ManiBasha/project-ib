// India Bay online server (Cloudflare Worker + one Durable Object per region).
// Players connect with a WebSocket. The Worker checks their Supabase sign-in and username,
// then hands them to the region's Durable Object, which relays positions and chat to nearby players.
import { DurableObject } from 'cloudflare:workers';

const REGIONS = ['west'];          // regions that have a live map
const MAX_PLAYERS = 150;           // per region
const NEAR = 700;                  // metres: players closer than this see each other
const CHAT_NEAR = 250;             // map units: chat and voice reach this far ("this area")
const CHAT_CLOSE = 21;             // map units (about 50 m in the game): "nearby only" chat and voice
const VOICE_MAX = 46000;           // characters of base64 audio in one voice message (about 8 seconds)
const VOICE_MIME = new Set(['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/aac']);
const IDLE_MS = 60_000;            // drop sockets silent for a minute
const VEH = new Set(['cycle', 'rickshaw', 'bike', 'sportsbike', 'auto', 'taxi', 'car', 'sedan', 'suv', 'sports', 'police', 'bus', 'truck', 'camel', 'horse', 'elephant', 'mpv', 'van', 'coupe', 'convertible', 'limo', 'ambulance', 'camper', 'pickup', 'lorry', 'tanker', 'towtruck', 'firetruck', 'tractor', 'scooter', 'atv', 'golfcart', 'erickshaw']);
const LOOT_MS = 10 * 60_000;      // dropped money and weapons stay on the ground this long (Beta v2.02.00)
const LOOT_CASH = 500_000;         // most money in one drop
const LOOTW = new Set(['pistol', 'shotgun', 'smg', 'rifle', 'bat', 'lathi', 'knife', 'armour']);
const REACT = new Set(['👏', '❤️', '🔥', '😂', '🎉', '💃', '🙏', '⭐']);
const BAD = ['fuck', 'shit', 'bitch', 'chutiya', 'madarchod', 'bhenchod', 'gandu', 'randi', 'harami', 'kamina', 'bastard', 'asshole', 'mc', 'bc'];

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });

function originOk(req, env) {
  const o = req.headers.get('Origin');
  if (!o) return true;
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.length === 0 || list.includes(o);
}

// A WebSocket that tells the game why it could not join, then closes.
function refuse(code, msg) {
  const [c, s] = Object.values(new WebSocketPair());
  s.accept(); s.send(JSON.stringify({ t: 'err', code, msg })); s.close(4000, code);
  return new Response(null, { status: 101, webSocket: c });
}

// Sign-in check. Newer Supabase projects sign tokens with a public key (JWKS), so the server
// checks the signature itself. Older projects fall back to asking Supabase who the token belongs to.
let JWKS = null, jwksAt = 0;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
const dec = s => JSON.parse(new TextDecoder().decode(b64u(s)));
async function jwks(env, force) {
  if (force || !JWKS || Date.now() - jwksAt > 3600_000) {
    const r = await fetch(env.SUPABASE_URL + '/auth/v1/.well-known/jwks.json');
    JWKS = r.ok ? ((await r.json()).keys || []) : []; jwksAt = Date.now();
  }
  return JWKS;
}
async function verifyLocal(env, token) {
  const [h, p, sig] = String(token).split('.');
  if (!sig) return { bad: 'not a sign-in token' };
  const head = dec(h), body = dec(p);
  if (head.alg !== 'ES256' && head.alg !== 'RS256') return null;           // older project: use fallback
  let jwk = (await jwks(env)).find(k => k.kid === head.kid);
  if (!jwk) jwk = (await jwks(env, true)).find(k => k.kid === head.kid);
  if (!jwk) return null;
  const imp = head.alg === 'ES256' ? { name: 'ECDSA', namedCurve: 'P-256' } : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const ver = head.alg === 'ES256' ? { name: 'ECDSA', hash: 'SHA-256' } : { name: 'RSASSA-PKCS1-v1_5' };
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, n: jwk.n, e: jwk.e, alg: jwk.alg, ext: true }, imp, false, ['verify']);
  const ok = await crypto.subtle.verify(ver, key, b64u(sig), new TextEncoder().encode(h + '.' + p));
  if (!ok) return { bad: 'signature did not match' };
  if (body.exp && body.exp * 1000 < Date.now() - 30_000) return { bad: 'expired' };
  if (!body.sub) return { bad: 'no user in token' };
  return { uid: body.sub, anon: !!body.is_anonymous };
}
async function whoIs(env, token) {
  let v = await verifyLocal(env, token);
  if (!v) {
    const u = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_KEY, authorization: 'Bearer ' + token } });
    if (!u.ok) return { bad: 'Supabase said ' + u.status + ' ' + (await u.text()).slice(0, 80) };
    const user = await u.json();
    v = user && user.id ? { uid: user.id, anon: !!user.is_anonymous } : { bad: 'no user' };
  }
  if (v.bad) return v;
  const url = env.SUPABASE_URL + '/rest/v1/profiles?select=username&id=eq.' + encodeURIComponent(v.uid);
  let p = await fetch(url, { headers: { apikey: env.SUPABASE_KEY, authorization: 'Bearer ' + token } });
  if (!p.ok) p = await fetch(url, { headers: { apikey: env.SUPABASE_KEY } });
  if (!p.ok) return { uid: v.uid, dbErr: p.status + ' ' + (await p.text()).slice(0, 80) };
  const rows = await p.json();
  return { uid: v.uid, anon: !!v.anon, name: rows[0] ? rows[0].username : null };
}

// Is this player banned, or silenced after reports? (online/supabase-update-9.sql) Cached for a minute.
async function playerStatus(env, uid) {
  try { const base = String(env.SUPABASE_URL || '').trim().replace(/\/(rest|auth)\/v1.*$/, '').replace(/\/+$/, '');
    const r = await fetch(base + '/rest/v1/rpc/player_status', { method: 'POST', headers: { apikey: env.SUPABASE_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ p_uid: uid }) });
    if (!r.ok) return null; const j = await r.json(); const o = typeof j === 'string' ? JSON.parse(j) : j; return { banned: !!(o && o.banned), sil: o && o.silenced ? Date.parse(o.silenced) || 0 : 0 }; } catch (e) { return null; } }

export default {
  async fetch(req, env) {
    // Accept the Project URL even if it was copied with /rest/v1 or a trailing slash on the end.
    env = Object.assign({}, env, { SUPABASE_URL: String(env.SUPABASE_URL || '').trim().replace(/\/(rest|auth)\/v1.*$/, '').replace(/\/+$/, '') });
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-allow-headers': '*' } });
    if (url.pathname === '/' || url.pathname === '/health') return json({ ok: true, game: 'India Bay', regions: REGIONS });
    if (url.pathname === '/stats') { try { const res = await env.REGION.get(env.REGION.idFromName('west')).fetch('https://region/stats'); return json(await res.json()); } catch (e) { return json({ error: 'no stats' }, 500); } }
    if (url.pathname === '/status') {
      const out = {};
      for (const r of REGIONS) {
        try { const res = await env.REGION.get(env.REGION.idFromName(r)).fetch('https://region/status'); out[r] = (await res.json()).online; } catch (e) { out[r] = null; }
      }
      return json(out);
    }
    if (url.pathname === '/ws') {
      if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'Expected a WebSocket' }, 426);
      if (!originOk(req, env)) return refuse('origin', 'This website is not allowed to join the online world.');
      const region = url.searchParams.get('region') || 'west';
      if (!REGIONS.includes(region)) return refuse('region', 'That region is not open yet.');
      const token = url.searchParams.get('token');
      if (!token) return refuse('auth', 'Please sign in first.');
      let who = null;
      try { who = await whoIs(env, token); } catch (e) { return refuse('auth', 'Could not check your sign-in (' + String(e && e.message || e).slice(0, 60) + '). Try again in a moment.'); }
      if (who.bad) return refuse('auth', 'Sign-in not accepted: ' + who.bad + '. Sign out and play as guest again.');
      if (who.dbErr) return refuse('db', 'Server could not read usernames (' + who.dbErr + '). Check SUPABASE_KEY in wrangler.toml.');
      if (!who.name) return refuse('name', 'Pick a username first.');
      const ps = await playerStatus(env, who.uid); if (ps && ps.banned) return refuse('banned', 'This account is banned from India Bay.');
      const h = new Headers(req.headers); h.set('x-uid', who.uid); h.set('x-name', who.name); h.set('x-anon', who.anon ? '1' : '0');
      return env.REGION.get(env.REGION.idFromName(region)).fetch(new Request('https://region/ws', { headers: h }));
    }
    return json({ error: 'Not found' }, 404);
  }
};

const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);
function clean(t) {
  t = String(t || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  for (const w of BAD) t = t.replace(new RegExp('\\b' + w + '\\b', 'gi'), m => m[0] + '*'.repeat(m.length - 1));
  return t;
}
const pub = p => { const o = { id: p.id, n: p.name, x: p.x, z: p.z, y: p.y, h: p.h, m: p.m, v: p.v, c: p.c, s: p.s }; if (p.pl) o.pl = p.pl; if (p.l) o.l = p.l; if (p.w) o.w = p.w; if (p.pv) Object.assign(o, { pv: p.pv, px: p.px, pz: p.pz, py: p.py, ph: p.ph, lk: p.lk ? 1 : 0 });
  if (p.m === 'r' && p.r) Object.assign(o, { r: p.r, rs: p.rs }); if (p.m === 'd' && p.o) o.o = p.o; return o; };
const VACT = new Set(['ride', 'seat', 'full', 'slow', 'no', 'leave', 'drop', 'take']);
const near = (a, b, r) => Math.abs(a.x - b.x) < r && Math.abs(a.z - b.z) < r;

export class Region extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.players = new Map();
    this.lastSweep = 0;
    for (const ws of ctx.getWebSockets()) { const a = ws.deserializeAttachment(); if (a) this.players.set(ws, a); }
  }

  // message counts per kind, per India day (Admin → Dashboards → Usage): every message is a Cloudflare request
  count(kind, out) { const d = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); if (!this.st || this.st.day !== d) { if (this.st) this.ctx.storage.put('st:' + this.st.day, this.st).catch(() => {}); this.st = { day: d, in: {}, out: {}, peak: 0 }; }
    const o = out ? this.st.out : this.st.in; o[kind] = (o[kind] || 0) + (out || 1); if (this.players.size > this.st.peak) this.st.peak = this.players.size;
    if (Date.now() - (this.stAt || 0) > 300_000) { this.stAt = Date.now(); this.ctx.storage.put('st:' + d, this.st).catch(() => {}); } }
  async silenced(p) { const now = Date.now(); if (!p.stAt || now - p.stAt > 60_000) { p.stAt = now; const ps = await playerStatus(this.env, p.uid); if (ps) { p.sil = ps.sil; if (ps.banned) p.banned = true; } } return (p.sil && p.sil > now) ? p.sil : 0; }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/status') return json({ online: this.players.size });
    if (url.pathname === '/stats') { const days = []; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() + 5.5 * 3600e3 - i * 86400e3).toISOString().slice(0, 10); const v = this.st && this.st.day === d ? this.st : await this.ctx.storage.get('st:' + d); if (v) days.push(v); } return json({ online: this.players.size, days }); }
    const uid = req.headers.get('x-uid'), name = req.headers.get('x-name');
    if (!uid || !name) return new Response('Bad request', { status: 400 });
    // One connection per account: an older tab or device is told and closed.
    for (const [ws, p] of this.players) if (p.uid === uid) { this.drop(ws, 4001, 'Signed in somewhere else'); }
    if (this.players.size >= MAX_PLAYERS) return refuse('full', 'This region is full right now. Try again in a few minutes.');
    const [c, s] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(s);
    const p = { id: crypto.randomUUID().slice(0, 8), uid, name, anon: req.headers.get('x-anon') === '1', x: 0, z: 0, y: 0, h: 0, m: 'f', v: '', c: '', s: 0, seen: Date.now(), chatAt: 0, ready: false };
    s.serializeAttachment(p);
    this.players.set(s, p);
    s.send(JSON.stringify({ t: 'hello', id: p.id, name, online: this.players.size, guest: p.anon }));
    return new Response(null, { status: 101, webSocket: c });
  }

  // Reads the admin's voice switch from the game settings in Supabase, at most once a minute.
  // Reads the admin's switches (voice, chat, calls) from the game settings in Supabase, at most once a minute.
  async flags() {
    const now = Date.now(); if (this.cfgCheck && now - this.cfgCheck.at < 60_000) return this.cfgCheck;
    const f = { at: now, voice: true, chat: true, calls: true, note: '' };
    try { const base = String(this.env.SUPABASE_URL || '').trim().replace(/\/(rest|auth)\/v1.*$/, '').replace(/\/+$/, '');
      const r = await fetch(base + '/rest/v1/game_config?select=data&id=eq.1', { headers: { apikey: this.env.SUPABASE_KEY } });
      if (r.ok) { const rows = await r.json(); const d = (rows[0] && rows[0].data) || {}; f.voice = d.voiceChat !== false; f.chat = d.chatOn !== false; f.calls = d.callsOn !== false; f.note = typeof d.chatNote === 'string' ? d.chatNote.slice(0, 200) : ''; } } catch (e) {}
    this.cfgCheck = f; return f;
  }
  async voiceOn() { return (await this.flags()).voice; }

  send(ws, msg) { try { ws.send(msg); } catch (e) { this.players.delete(ws); } }

  drop(ws, code, why) {
    const p = this.players.get(ws);
    this.players.delete(ws);
    try { ws.send(JSON.stringify({ t: 'kick', msg: why })); ws.close(code, why); } catch (e) {}
    if (p) { const m = JSON.stringify({ t: 'leave', id: p.id }); for (const w of this.players.keys()) this.send(w, m); }
  }

  sweep(now) {
    if (now - this.lastSweep < 20_000) return;
    this.lastSweep = now;
    for (const [ws, p] of this.players) if (now - p.seen > IDLE_MS) this.drop(ws, 4002, 'Disconnected for being idle');
  }

  async webSocketMessage(ws, raw) {
    let p = this.players.get(ws);
    if (!p) { p = ws.deserializeAttachment(); if (!p) { try { ws.close(4003, 'Unknown'); } catch (e) {} return; } this.players.set(ws, p); }
    if (typeof raw !== 'string' || raw.length > (raw.startsWith('{"t":"vc"') || raw.startsWith('{"t":"call"') ? VOICE_MAX + 300 : raw.startsWith('{"t":"tr"') || raw.startsWith('{"t":"vs"') ? 4000 : raw.startsWith('{"t":"gc"') ? 13000 : 600)) return;
    let d; try { d = JSON.parse(raw); } catch (e) { return; }
    const now = Date.now();
    p.seen = now; this.count(String(d.t || '?').slice(0, 6));
    if (p.banned) { this.drop(ws, 4004, 'This account is banned from India Bay'); return; }
    // silenced after reports from other players: no chat, voice or calls until then
    if (['chat', 'vc', 'vs', 'gc'].includes(d.t) || (d.t === 'call' && ['ring', 'accept', 'sdp', 'ice', 'vc', 'text'].includes(d.k))) { const until = await this.silenced(p); if (until) return this.send(ws, JSON.stringify({ t: 'silenced', until })); }
    if (d.t === 'p') {
      p.x = num(d.x, -1e5, 1e5); p.z = num(d.z, -1e5, 1e5); p.y = num(d.y, -50, 500); p.h = num(d.h, -100, 100); p.s = num(d.s, -100, 100);
      p.m = d.m === 'd' ? 'd' : d.m === 'i' ? 'i' : d.m === 'r' ? 'r' : 'f';
      // Riding along in another player's vehicle: who drives, and which seat.
      p.r = p.m === 'r' && /^[0-9a-f]{8}$/.test(d.r) ? d.r : ''; p.rs = num(d.rs, 0, 40) | 0; p.o = p.m === 'd' ? num(d.o, 0, 40) | 0 : 0;
      p.v = p.m === 'd' && VEH.has(d.v) ? d.v : '';
      p.c = /^#[0-9a-fA-F]{6}$/.test(d.c) ? d.c : '';
      p.l = typeof d.l === 'string' && /^[mf][0-9]{7,12}$/.test(d.l) ? d.l : '';
      p.w = typeof d.w === 'string' && /^(shirt|kurta|saree)[0-9a-f]{6}[gc]{0,2}$/.test(d.w) ? d.w : '';   // clothes (Beta v1.01.16)   // the player's look (Beta v1.0.0): gender and 7 digits
      // The vehicle this player last got out of, so others see it parked where they left it.
      p.pv = p.m !== 'd' && VEH.has(d.pv) ? d.pv : '';
      p.lk = d.lk ? 1 : 0;   // the parked vehicle is locked (Beta v1.01.26)
      p.pl = typeof d.pl === 'string' && /^[A-Z0-9][A-Z0-9 ]{1,9}$/.test(d.pl) ? d.pl : '';   // the player's number plate (Beta v1.01.24)
      p.zn = typeof d.zn === 'string' && /^[a-z0-9_]{1,24}$/.test(d.zn) ? d.zn : '';   // the town or city you are in (for "N in your city")
      p.px = num(d.px, -1e5, 1e5); p.pz = num(d.pz, -1e5, 1e5); p.py = num(d.py, -50, 500); p.ph = num(d.ph, -100, 100);
      const first = !p.ready; p.ready = true;
      ws.serializeAttachment(p);
      const out = JSON.stringify(Object.assign({ t: 'p' }, pub(p)));
      const snap = [];
      for (const [w, q] of this.players) {
        if (w === ws || !q.ready || !near(p, q, NEAR)) continue;
        this.send(w, out);
        if (first) snap.push(pub(q));
      }
      if (first) this.send(ws, JSON.stringify({ t: 'snap', list: snap, online: this.players.size }));
    } else if (d.t === 'chat') {
      { const f = await this.flags(); if (!f.chat) return this.send(ws, JSON.stringify({ t: 'chatoff', msg: f.note })); }
      if (now - p.chatAt < 1500) return this.send(ws, JSON.stringify({ t: 'slow' }));
      const text = clean(d.text);
      if (!text) return;
      p.chatAt = now;
      const R = d.r === 'close' ? CHAT_CLOSE : CHAT_NEAR;
      const out = JSON.stringify({ t: 'chat', id: p.id, n: p.name, text, r: d.r === 'close' ? 'close' : 'area' });
      for (const [w, q] of this.players) if (w === ws || (q.ready && near(p, q, R))) this.send(w, out);
    } else if (d.t === 'v') {
      // Vehicle sharing (ride requests, seat replies, getting off, taking a parked vehicle): sent only to the named player nearby.
      if (!VACT.has(d.a) || typeof d.to !== 'string') return;
      if (now - (p.vAt || 0) < 150) return; p.vAt = now;
      const out = JSON.stringify({ t: 'v', a: d.a, id: p.id, n: p.name, s: num(d.s, 0, 40) | 0 });
      for (const [w, q] of this.players) if (q.id === d.to) { if (near(p, q, 150)) this.send(w, out); break; }
    } else if (d.t === 'vc') {
      // Push-to-talk voice message: a short recorded clip, sent to players within chat range.
      // The admin can switch voice off for everyone (Admin → Online and moderation); the server checks it.
      if (p.anon) return this.send(ws, JSON.stringify({ t: 'vcguest' }));   // hold to talk is for Google accounts
      if (!(await this.voiceOn())) return this.send(ws, JSON.stringify({ t: 'vcoff' }));
      if (now - (p.vcAt || 0) < 4000) return this.send(ws, JSON.stringify({ t: 'slow' }));
      if (typeof d.a !== 'string' || d.a.length < 200 || d.a.length > VOICE_MAX || !/^[A-Za-z0-9+/=]+$/.test(d.a)) return;
      const mime = VOICE_MIME.has(d.mime) ? d.mime : 'audio/webm'; const ms = num(d.ms, 300, 10000) | 0;
      p.vcAt = now;
      const out = JSON.stringify({ t: 'vc', id: p.id, n: p.name, a: d.a, ms, mime });
      const VR = d.r === 'close' ? CHAT_CLOSE : CHAT_NEAR;
      for (const [w, q] of this.players) if (w === ws || (q.ready && near(p, q, VR))) this.send(w, out);
    } else if (d.t === 'vs') {
      // Live voice (Beta v1.01.21): hold to talk sends 0.2 s pieces (8 kHz phone-line sound); players nearby hear them as they come.
      if (p.anon) return this.send(ws, JSON.stringify({ t: 'vcguest' }));
      if (!(await this.voiceOn())) return this.send(ws, JSON.stringify({ t: 'vcoff' }));
      const k = d.k === 's' ? 's' : d.k === 'e' ? 'e' : 'd';
      if (k === 's') { if (now - (p.vsEnd || 0) < 600) return this.send(ws, JSON.stringify({ t: 'slow' })); p.vsT0 = now; p.vsN = 0; }
      if (!p.vsT0 || now - p.vsT0 > 25000) { if (k !== 'e') return; }
      if (k !== 'e') { if (typeof d.a !== 'string' || d.a.length > 3000 || !/^[A-Za-z0-9+/=]*$/.test(d.a)) return; if (++p.vsN > 140) return; } else { p.vsEnd = now; p.vsT0 = 0; }
      const out = JSON.stringify({ t: 'vs', id: p.id, n: p.name, k, s: num(d.s, 0, 1e6) | 0, a: k === 'e' ? '' : d.a });
      const VR = d.r === 'close' ? CHAT_CLOSE : CHAT_NEAR; let sent = 0;
      for (const [w, q] of this.players) if (w !== ws && q.ready && near(p, q, VR)) { this.send(w, out); sent++; } if (sent) this.count('vs>', sent);
    } else if (d.t === 'gc') {
      // Group calls (Beta v1.01.21): set-up messages between the people in a BayGram group, one person at a time (peer to peer audio).
      if (p.anon) return this.send(ws, JSON.stringify({ t: 'call', k: 'noguest' }));
      const K = new Set(['ring', 'join', 'leave', 'sdp', 'ice', 'end', 'busy']); if (!K.has(d.k) || typeof d.to !== 'string' || !/^[A-Za-z0-9_.]{1,15}$/.test(d.to)) return;
      if (['ring', 'join', 'sdp', 'ice'].includes(d.k)) { const f = await this.flags(); if (!f.calls) return this.send(ws, JSON.stringify({ t: 'call', k: 'off', msg: f.note })); }
      if (d.k === 'ring' && now - (p.gringAt || 0) < 400) return; if (d.k === 'ring') p.gringAt = now;
      let target = null; for (const [w, q] of this.players) if (q.ready && q.name.toLowerCase() === d.to.toLowerCase()) { target = w; break; }
      if (!target) { if (d.k === 'ring') this.send(ws, JSON.stringify({ t: 'gc', k: 'offline', n: d.to, g: num(d.g, 0, 1e12) })); return; }
      const out = { t: 'gc', k: d.k, n: p.name, g: num(d.g, 0, 1e12), gn: typeof d.gn === 'string' ? clean(d.gn).slice(0, 40) : '' };
      if ((d.k === 'sdp' || d.k === 'ice') && typeof d.s === 'string' && d.s.length <= 12000) out.s = d.s;
      this.send(target, JSON.stringify(out));
    } else if (d.t === 'ev') {
      // Events on stages (Beta v1.01.21): reactions to the people on stage, and news for players nearby (a new event, someone let on stage, a tip).
      const e = num(d.e, 0, 1e12) | 0; if (now - (p.evAt || 0) < 250) return; p.evAt = now;
      if (d.k === 'react') { const r = REACT.has(d.r) ? d.r : ''; if (!r) return; const out = JSON.stringify({ t: 'ev', k: 'react', e, r, id: p.id, n: p.name }); for (const [w, q] of this.players) if (q.ready && near(p, q, 300)) this.send(w, out); }
      else if (d.k === 'news') { const out = JSON.stringify({ t: 'ev', k: 'news', e, id: p.id, n: p.name }); for (const [w, q] of this.players) if (w !== ws && q.ready && near(p, q, NEAR * 2)) this.send(w, out); }
      else if ((d.k === 'ok' || d.k === 'tip' || d.k === 'ask') && typeof d.to === 'string') { const out = JSON.stringify({ t: 'ev', k: d.k, e, n: p.name, amt: num(d.amt, 0, 1e6) | 0 }); for (const [w, q] of this.players) if (q.ready && q.name.toLowerCase() === d.to.toLowerCase()) { this.send(w, out); break; } }
    } else if (d.t === 'call') {
      // Phone calls and text pings between players by username, anywhere on the map (Beta v1.01.03).
      // Only Google accounts (not guests) can call; the person called sees who it is and can decline or block.
      // During a call, push-to-talk clips go only to the other person. Nothing is recorded or stored.
      if (p.anon) return this.send(ws, JSON.stringify({ t: 'call', k: 'noguest' }));
      const K = new Set(['ring', 'accept', 'decline', 'busy', 'end', 'vc', 'text', 'sdp', 'ice']); if (!K.has(d.k) || typeof d.to !== 'string' || !/^[A-Za-z0-9_.]{1,15}$/.test(d.to)) return;
      if (['ring', 'accept', 'sdp', 'ice', 'vc'].includes(d.k)) { const f = await this.flags(); if (!f.calls) return this.send(ws, JSON.stringify({ t: 'call', k: 'off', msg: f.note })); }
      if (d.k === 'ring' && now - (p.ringAt || 0) < 8000) return this.send(ws, JSON.stringify({ t: 'slow' }));
      if (d.k === 'vc') { if (!(await this.voiceOn())) return this.send(ws, JSON.stringify({ t: 'vcoff' })); if (now - (p.cvAt || 0) < 1500) return this.send(ws, JSON.stringify({ t: 'slow' })); if (typeof d.a !== 'string' || d.a.length < 200 || d.a.length > VOICE_MAX || !/^[A-Za-z0-9+/=]+$/.test(d.a)) return; p.cvAt = now; }
      if (d.k === 'ring') p.ringAt = now;
      let target = null; for (const [w, q] of this.players) if (q.ready && q.name.toLowerCase() === d.to.toLowerCase()) { target = w; break; }
      if (!target) { if (d.k === 'ring') this.send(ws, JSON.stringify({ t: 'call', k: 'offline', n: d.to })); return; }
      const out = { t: 'call', k: d.k, n: p.name };
      if ((d.k === 'sdp' || d.k === 'ice') && typeof d.s === 'string' && d.s.length <= 12000) out.s = d.s;   // live call set-up (WebRTC), Beta v1.01.16
      if (d.k === 'vc') Object.assign(out, { a: d.a, ms: num(d.ms, 300, 10000) | 0, mime: VOICE_MIME.has(d.mime) ? d.mime : 'audio/webm' });
      this.send(target, JSON.stringify(out));
    } else if (d.t === 'tr') {
      // Shared traffic (Beta v1.01.16): one player near a group drives the traffic and sends where each vehicle is;
      // the others nearby show the same vehicles. Up to 3 times a second, at most 4 kB.
      if (now - (p.trAt || 0) < 300 || !Array.isArray(d.L) || d.L.length > 40) return; p.trAt = now;
      const L = []; for (const q of d.L) { if (!Array.isArray(q) || q.length !== 8) continue; L.push(q.map(v => num(v, -1e6, 1e9))); }
      const out = JSON.stringify({ t: 'tr', id: p.id, L });
      for (const [w, q] of this.players) if (w !== ws && q.ready && near(p, q, 260)) this.send(w, out);
    } else if (d.t === 'mg') {
      // Mini games between players near each other (Beta v1.01.12): invites, replies and moves, sent only to the named player.
      const K = new Set(['inv', 'acc', 'dec', 'mv', 'bye']); if (!K.has(d.k) || typeof d.to !== 'string') return;
      if (now - (p.mgAt || 0) < 100) return; p.mgAt = now;
      const g = typeof d.g === 'string' && /^[a-z0-9]{1,12}$/.test(d.g) ? d.g : ''; const s = typeof d.s === 'string' && d.s.length <= 300 ? d.s : '';
      const out = JSON.stringify({ t: 'mg', k: d.k, id: p.id, n: p.name, g, s, m: num(d.m, 0, 1e9) | 0 });
      for (const [w, q] of this.players) if (q.id === d.to) { if (near(p, q, NEAR)) this.send(w, out); break; }
    } else if (d.t === 'loot') {
      // Dropped money and weapons (Beta v2.02.00): when a player or a person in the street goes down, what they carried
      // stays on the ground. Anyone nearby can pick it up; the first to reach it gets it. Kept in memory for 10 minutes.
      const L = this.loot || (this.loot = new Map());
      for (const [id, l] of L) if (now - l.at > LOOT_MS) L.delete(id);
      if (d.k === 'drop') {
        if (now - (p.lootAt || 0) < 700) return; p.lootAt = now;
        const x = num(d.x, -1e5, 1e5), z = num(d.z, -1e5, 1e5); if (p.ready && Math.hypot(x - p.x, z - p.z) > 150) return;
        const c = num(d.c, 0, LOOT_CASH) | 0; const items = (Array.isArray(d.i) ? d.i.slice(0, 6) : []).filter(q => Array.isArray(q) && LOOTW.has(q[0])).map(q => [q[0], num(q[1], 0, 600) | 0]);
        if (!c && !items.length) return;
        if (L.size >= 500) L.delete(L.keys().next().value);
        const l = { id: crypto.randomUUID().replace(/-/g, '').slice(0, 10), x, z, c, i: items, at: now, by: p.name };
        L.set(l.id, l);
        const out = JSON.stringify({ t: 'loot', k: 'add', L: [{ id: l.id, x, z, c, i: items, a: 0 }] });
        for (const [w, q] of this.players) if (w === ws || (q.ready && Math.hypot(q.x - x, q.z - z) < NEAR)) this.send(w, out);
      } else if (d.k === 'take') {
        const id = String(d.id || ''); const l = L.get(id);
        if (!l) return this.send(ws, JSON.stringify({ t: 'loot', k: 'gone', id }));
        if (Math.hypot(p.x - l.x, p.z - l.z) > 30) return;
        L.delete(id);
        this.send(ws, JSON.stringify({ t: 'loot', k: 'got', id, c: l.c, i: l.i }));
        const out = JSON.stringify({ t: 'loot', k: 'gone', id });
        for (const [w, q] of this.players) if (w !== ws && q.ready && Math.hypot(q.x - l.x, q.z - l.z) < NEAR) this.send(w, out);
      } else if (d.k === 'list') {
        if (now - (p.llAt || 0) < 3000) return; p.llAt = now;
        const list = []; for (const l of L.values()) if (Math.hypot(p.x - l.x, p.z - l.z) < NEAR && list.length < 80) list.push({ id: l.id, x: l.x, z: l.z, c: l.c, i: l.i, a: now - l.at });
        this.send(ws, JSON.stringify({ t: 'loot', k: 'add', L: list, all: 1 }));
      }
    } else if (d.t === 'ping') {
      let city = 0, near1 = 0; for (const q of this.players.values()) { if (!q.ready) continue; if (p.zn && q.zn === p.zn) city++; if (near(p, q, NEAR)) near1++; }
      this.send(ws, JSON.stringify({ t: 'pong', online: this.players.size, city, near: near1, zn: p.zn, ts: Date.now() }));   // ts: the shared clock (Beta v1.01.12)
    }
    this.sweep(now);
  }

  async webSocketClose(ws) { this.left(ws); }
  async webSocketError(ws) { this.left(ws); }
  left(ws) {
    const p = this.players.get(ws) || ws.deserializeAttachment();
    this.players.delete(ws);
    if (!p) return;
    const m = JSON.stringify({ t: 'leave', id: p.id });
    for (const w of this.players.keys()) this.send(w, m);
  }
}
