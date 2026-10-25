// Walk-in buildings and seats (Beta v1.01.24).
//  • Lodges, hospitals, police stations, banks, RTOs, job offices, shops and showrooms: walk in through the door,
//    go to the reception or counter (press E) to book a room, see a doctor, bank, buy and so on. Sofas, chairs,
//    plants, a rug and staff behind the desk.
//  • Airports, railway stations, bus stands, metro and bullet train stations: a big hall with counters, a departure
//    board and rows of benches. Book at the counter; the ride starts outside.
//  • Car and bike showrooms show vehicles on stands; the mechanic has a workshop with a car on the lift.
//  • Every other city building: walk up to it and press E to go in (an apartment lobby, an office or a little shop).
//  • Sit down: on sofas, chairs and benches inside, and on benches outside at tea stalls, bus stops and famous
//    places. While you sit, look round with the arrow keys / W A S D or drag, and you get a little rest.
// bb.SEATS.add({x, z, y, h, name}) adds an outdoor seat (y = seat height, h = the way you face when sitting).
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, esc = bb.esc, P = () => bb.P; const mats = {}; const M = c => mats[c] || (mats[c] = new T.MeshLambertMaterial({ color: c })); const glow = c => mats['g' + c] || (mats['g' + c] = new T.MeshBasicMaterial({ color: c }));
  function kit(g, blk) { const box = (w, h, d, x, y, z, m, solid) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), typeof m === 'string' ? M(m) : m); o.position.set(x, y, z); g.add(o); if (solid) blk.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]); return o; };
    const cyl = (r1, r2, h, x, y, z, m, seg) => { const o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 12), typeof m === 'string' ? M(m) : m); o.position.set(x, y, z); g.add(o); return o; };
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return new T.CanvasTexture(c); };
    const sign = (text, w, h, x, y, z, ry, bg, fg) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex(512, Math.round(512 * h / w), (c, W2, H2) => { c.fillStyle = bg; c.fillRect(0, 0, W2, H2); c.fillStyle = fg; let f = Math.round(H2 * .5); c.font = `800 ${f}px "Baloo 2",sans-serif`; while (c.measureText(text).width > W2 - 30 && f > 12) { f -= 2; c.font = `800 ${f}px "Baloo 2",sans-serif`; } c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W2 / 2, H2 / 2 + 2, W2 - 20); }) }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m); return m; };
    const person = (col, x, z, ry, sitY) => { const p = bb.buildPerson(M(col), { female: Math.random() < .45 }); p.position.set(x, sitY != null ? sitY + .03 - .86 * p.scale.y : 0, z); p.rotation.y = ry || 0; if (sitY != null && p.userData.legs) p.userData.legs.forEach(l => l.rotation.x = -1.45); g.add(p); return p; };
    const plant = (x, z, s = 1) => { cyl(.28 * s, .22 * s, .5 * s, x, .25 * s, z, '#8a5a3a'); const b = new T.Mesh(new T.SphereGeometry(.5 * s, 9, 7), M('#3e8c3a')); b.position.set(x, .95 * s, z); b.scale.set(1, 1.3, 1); g.add(b); };
    // walls that face into the room: from outside (where the camera may be) they are see-through
    const walls = (w, d, H, col, ceil) => { const m = typeof col === 'string' ? M(col) : col; const P2 = (pw, ph, x, y, z, ry) => { const o = new T.Mesh(new T.PlaneGeometry(pw, ph), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); };
      P2(w, H, 0, H / 2, -d / 2, 0); P2(w, H, 0, H / 2, d / 2, Math.PI); P2(d, H, -w / 2, H / 2, 0, Math.PI / 2); P2(d, H, w / 2, H / 2, 0, -Math.PI / 2);
      if (ceil) { const c = new T.Mesh(new T.PlaneGeometry(w, d), M(ceil)); c.rotation.x = Math.PI / 2; c.position.y = H; g.add(c); } };
    return { box, cyl, sign, person, plant, tex, walls }; }
  // furniture that you can sit on returns its seat spots: {x, z, y, h}
  function sofa(K, x, z, ry, n, col) { const L = n * .62; const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const k = kit(g, []); k.box(L, .42, .8, 0, .21, 0, col); k.box(L, .55, .16, 0, .7, -.34, col); for (const s of [-1, 1]) k.box(.16, .62, .8, s * (L / 2 + .08), .31, 0, col);
    for (let i = 0; i < n; i++) k.box(.56, .1, .62, -L / 2 + .31 + i * .62, .47, .06, M(shade(col)));
    K.g.add(g); const ch = Math.cos(ry), sh = Math.sin(ry); const hw = (L / 2 + .2), hd = .45; const ax = Math.abs(ch) > .5; K.blk.push(ax ? [x - hw, z - hd, x + hw, z + hd] : [x - hd, z - hw, x + hd, z + hw]);
    const out = []; for (let i = 0; i < n; i++) { const lx = -L / 2 + .31 + i * .62, lz = .05; out.push({ x: x + lx * ch + lz * sh, z: z - lx * sh + lz * ch, y: .5, h: ry, name: n > 1 ? 'Sit on the sofa' : 'Sit in the armchair' }); } return out; }
  const shade = c => { const C = new T.Color(c); C.multiplyScalar(1.12); return '#' + C.getHexString(); };
  function benchRow(K, x, z, ry, len, col) { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const k = kit(g, []); k.box(len, .08, .45, 0, .45, 0, col); k.box(len, .45, .06, 0, .75, -.2, col); for (const s of [-1, 1]) k.box(.06, .45, .4, s * (len / 2 - .1), .22, 0, '#3a3b40'); K.g.add(g);
    const ch = Math.cos(ry), sh = Math.sin(ry); const ax = Math.abs(ch) > .5; K.blk.push(ax ? [x - len / 2, z - .3, x + len / 2, z + .3] : [x - .3, z - len / 2, x + .3, z + len / 2]);
    const out = []; for (let lx = -len / 2 + .35; lx < len / 2 - .2; lx += .7) out.push({ x: x + lx * ch + .05 * sh, z: z - lx * sh + .05 * ch, y: .5, h: ry, name: 'Sit on the bench' }); return out; }
  /* ---------- the rooms ---------- */
  const STAFF = { lodge: '#7a2f1d', hospital: '#f4f4f2', police: '#c9b27a', bank: '#2b3a5a', rto: '#e9e4d6', jobs: '#2f7fc1', realty: '#1c1c20', clothes: '#c2185b', mobile: '#3b2f8f', furniture: '#8d5a2b', guns: '#3d4a3a', cars: '#1c1c20', bikes: '#c8102e', mechanic: '#24467a' };
  const DESK = { lodge: 'Reception · book a room', hospital: 'Reception · see a doctor', police: 'Front desk', bank: 'Bank counter', rto: 'RTO counter · licences and papers', jobs: 'Job counter', realty: 'Sales desk · homes for sale', clothes: 'Shop counter', mobile: 'Shop counter', furniture: 'Showroom desk', guns: 'Shop counter', cars: 'Showroom desk · buy a vehicle', bikes: 'Showroom desk · buy a two-wheeler', mechanic: 'Workshop desk · repairs and mods', airport: 'Check-in counter · flights', station: 'Ticket counter · trains', bus: 'Ticket counter · buses', metro: 'Ticket counter · metro', bullet: 'Ticket counter · bullet train', local: 'Ticket window · local trains' };
  // floor, wall, accent · Beta v1.01.27: warm, rich colours instead of plain white
  const LOOK = { lodge: ['#9a6a44', '#e8b97a', '#7a1f2b'], hospital: ['#c9dde0', '#bfe3e0', '#1f7a8c'], police: ['#a69a82', '#c9b98c', '#2f3f66'], bank: ['#b49a72', '#d8c49a', '#1f3460'], rto: ['#a8a090', '#cfd8a8', '#5a4a3a'], jobs: ['#b8b2a6', '#a8d0e8', '#1f5fa8'],
    realty: ['#3b3b40', '#e8d6b0', '#b8901a'], clothes: ['#d8c8b8', '#f2b8c8', '#b0124f'], mobile: ['#c8c8d6', '#b8b0f0', '#3b2f8f'], furniture: ['#a07448', '#e8c89a', '#7a4a22'], guns: ['#6b665c', '#a8a088', '#3d4a3a'], cars: ['#d0d0d6', '#dfe3ea', '#1c1c20'], bikes: ['#d0d0d6', '#f0c8c0', '#c8102e'], mechanic: ['#5a5a5a', '#b8b08a', '#24467a'],
    flats: ['#b8a88a', '#e8d8a8', '#4a5a3a'], office: ['#9aa0a8', '#c8d8e8', '#2b3a5a'], shop: ['#a88a5a', '#f0c878', '#a0381a'] };
  function lobby(poi, kind) { const w = kind === 'cars' || kind === 'bikes' ? 22 : 16, d = kind === 'cars' || kind === 'bikes' ? 16 : 14, H = 4.2; const L = LOOK[kind] || LOOK.jobs;
    return room(poi, kind, w, d, H, (K, seats, pts) => { const { box, sign, person, plant } = K;
      box(w, .02, d, 0, .01, 0, L[0]); K.walls(w, d, H, L[1], '#f6f3ee');
      for (const x of [-w / 4, w / 4]) box(1.4, .04, .5, x, H - .05, 0, glow('#fff6e0')); box(w * .5, .02, 2.2, 0, .03, d / 4, L[2]);
      // the desk with the staff behind it, and the place's name on the wall
      box(4.2, 1.05, .8, 0, .52, -d / 2 + 2.3, L[2], true); box(4.4, .06, .95, 0, 1.08, -d / 2 + 2.3, '#e9e4d6'); person(STAFF[kind] || '#2f7fc1', 0, -d / 2 + 1.4, 0); if (Math.random() < .6) person(STAFF[kind] || '#2f7fc1', 1.4, -d / 2 + 1.4, 0);
      sign(poi.name, 6, .9, 0, H - .9, -d / 2 + .17, 0, L[2], '#ffffff'); pts.push({ k: 'desk', name: DESK[kind] || 'Counter', x: 0, z: -d / 2 + 3.2 });
      // waiting area: a sofa, armchairs, a low table, plants and a picture
      seats.push(...sofa(K, -w / 2 + 2.2, 1.0, Math.PI / 2, 3, '#4a3b5a')); seats.push(...sofa(K, -w / 2 + 4.8, 3.4, Math.PI, 1, '#4a3b5a')); seats.push(...sofa(K, -w / 2 + 4.8, -1.4, 0, 1, '#4a3b5a'));
      box(1.0, .4, 1.6, -w / 2 + 4.0, .2, 1.0, '#8a5a3a', true); plant(w / 2 - 1, -d / 2 + 1); plant(-w / 2 + 1, -d / 2 + 1); plant(w / 2 - 1, d / 2 - 1.2, .8); box(1.6, 1.1, .05, w / 2 - .17, 2.1, -1, '#3e6e8a').rotation.y = -Math.PI / 2;
      if (kind === 'cars' || kind === 'bikes') { const L2 = kind === 'cars' ? ['sedan', 'suv', 'mpv'] : ['bike', 'sportsbike', 'scooter']; L2.forEach((t, i) => { try { const v = bb.buildVeh(t); v.position.set(-3 + i * 4.2, .3, 2.8); v.rotation.y = .6; K.g.add(v); box(kind === 'cars' ? 3.2 : 1.8, .3, kind === 'cars' ? 5 : 2.6, -3 + i * 4.2, .15, 2.8, '#d9d9de', true); } catch (e) {} }); }
      else if (kind === 'lodge') { box(.8, 1.8, .5, w / 2 - 2.5, .9, -d / 2 + .5, '#8a5a3a'); sign('ROOMS 1st FLOOR ↑', 2.6, .4, -w / 2 + 3, 2.6, -d / 2 + .17, 0, '#2b2b30', '#ffd36a'); seats.push(...sofa(K, w / 2 - 2.2, 2.2, -Math.PI / 2, 2, '#6b2a2a')); }
      else if (kind === 'hospital') { seats.push(...benchRow(K, w / 2 - 3, 2.6, Math.PI, 4, '#2f6f8a')); seats.push(...benchRow(K, w / 2 - 3, .6, Math.PI, 4, '#2f6f8a')); sign('OPD · EMERGENCY →', 3.2, .45, w / 2 - 3, 2.8, -d / 2 + .17, 0, '#c8202a', '#ffffff'); }
      else if (kind === 'police') { for (let i = 0; i < 9; i++) box(.05, 2.4, .05, w / 2 - 3.5 + i * .4, 1.2, -d / 2 + 2.6, '#5a5d62'); seats.push(...benchRow(K, w / 2 - 3, 2.2, Math.PI, 3, '#5a4a3a')); }
      else if (kind === 'bank') { for (let i = -1; i <= 1; i++) { box(1.6, 1.05, .6, w / 2 - 3.5 + i * 0, .52, -d / 2 + 2.3 + i * 0, L[2]); } seats.push(...benchRow(K, w / 2 - 3, 2.6, Math.PI, 3.6, '#2b3a5a')); }
      else if (kind === 'mechanic') { box(3.2, .2, 5, 3, 1.6, 2.2, '#c9a227'); for (const s of [-1, 1]) box(.2, 1.6, .2, 3 + s * 1.5, .8, 2.2, '#c9a227'); try { const v = bb.buildVeh('car'); v.position.set(3, 1.7, 2.2); K.g.add(v); } catch (e) {} box(4, 1.8, .2, -2, 1.5, d / 2 - .3, '#8a3a2a'); }
      else seats.push(...benchRow(K, w / 2 - 3, 2.6, Math.PI, 3, '#5a5d62')); }); }
  function hall(poi, kind) { const w = 34, d = 22, H = 8; const air = kind === 'airport', col = air ? '#2f6f8a' : kind === 'metro' ? '#7a3d9a' : kind === 'bullet' ? '#2a5aa8' : kind === 'bus' ? '#b8202a' : '#1f5f3a';
    return room(poi, kind, w, d, H, (K, seats, pts) => { const { box, sign, person, cyl, tex } = K;
      box(w, .02, d, 0, .01, 0, air ? '#c8c2b8' : '#a89a86'); K.walls(w, d, H, air ? '#cfe0ea' : kind === 'metro' ? '#d8c8e8' : kind === 'bus' ? '#e8d0b8' : '#d8e0c0', '#f6f3ee'); box(6, 3.2, .05, 0, 1.6, d / 2 - .05, new T.MeshPhongMaterial({ color: 0x9fc6dd, transparent: true, opacity: .35, side: T.BackSide })); for (let x = -12; x <= 12; x += 6) { cyl(.35, .35, H, x, H / 2, -2, '#d9d4cc'); box(2, .04, .6, x, H - .05, 3, glow('#fffbe8')); }
      // the counters along the back wall, with staff
      for (let i = 0; i < 5; i++) { const x = -10 + i * 5; box(3.6, 1.1, .8, x, .55, -d / 2 + 2.2, col, true); box(3.8, .06, .95, x, 1.12, -d / 2 + 2.2, '#e9e4d6'); person(air ? '#2f6f8a' : '#e9e4d6', x, -d / 2 + 1.4, 0); sign(String(i + 1), .6, .5, x, 2.2, -d / 2 + .17, 0, col, '#fff'); }
      pts.push({ k: 'desk', name: DESK[kind] || 'Ticket counter', x: 0, z: -d / 2 + 3.2 }); sign(poi.name, 12, 1.3, 0, H - 1.6, -d / 2 + .17, 0, col, '#ffffff');
      // the departure board
      const dests = ['On time', 'Boarding', 'Delayed 10 min', 'On time', 'Gate open'].map((s, i) => [`${String(6 + i * 3).padStart(2, '0')}:${i * 15 % 60 || '00'}`, s]);
      const bt = tex(512, 256, (c, W2, H2) => { c.fillStyle = '#0b0f14'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#ffb020'; c.font = '700 26px monospace'; c.fillText(air ? 'DEPARTURES' : 'DEPARTURES · PLATFORMS', 16, 34); c.font = '600 22px monospace'; dests.forEach((r, i) => { c.fillStyle = '#ffd36a'; c.fillText(r[0], 16, 74 + i * 36); c.fillStyle = i === 1 ? '#7bff9a' : '#e9e4d6'; c.fillText(air ? ['Delhi', 'Bengaluru', 'Goa', 'Kochi', 'Jaipur'][i] : ['Express', 'Passenger', 'Superfast', 'Intercity', 'Fast'][i], 120, 74 + i * 36); c.fillStyle = '#9fd3e8'; c.fillText(r[1], 330, 74 + i * 36); }); });
      const board = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshBasicMaterial({ map: bt })); board.position.set(w / 2 - .17, 4.6, -2); board.rotation.y = -Math.PI / 2; K.g.add(board);
      // rows of seats facing the counters
      for (let r = 0; r < 3; r++) for (const s of [-1, 1]) seats.push(...benchRow(K, s * 7, 2 + r * 2.4, Math.PI, 6, air ? '#26406e' : '#5a5d62'));
      for (let i = 0; i < 10; i++) { const st = seats[Math.floor(Math.random() * seats.length)]; if (st && !st.taken) { st.taken = true; person(['#d9483b', '#2f7fc1', '#f4f1ea', '#1f8a4c', '#ffc93c'][i % 5], st.x, st.z, st.h, st.y); } }
      for (let i = 0; i < 6; i++) { const p = person(['#e8573e', '#2f7fc1', '#f2c14e'][i % 3], -12 + Math.random() * 24, -4 + Math.random() * 5, Math.random() * 6); } }); }
  // other city buildings
  function generic(b, door) { const h = b.h, kind = h > 22 ? 'flats' : h > 11 ? 'office' : 'shop'; const w = kind === 'shop' ? 10 : 14, d = kind === 'shop' ? 9 : 12, H = kind === 'shop' ? 3.6 : 4;
    const name = kind === 'flats' ? 'Apartment lobby' : kind === 'office' ? 'Office building' : 'Kirana store';
    return room(door, kind, w, d, H, (K, seats, pts) => { const { box, sign, person, plant } = K; const wall = LOOK[kind][1];
      box(w, .02, d, 0, .01, 0, LOOK[kind][0]); K.walls(w, d, H, wall, '#f6f3ee'); box(1.4, .04, .5, 0, H - .05, 0, glow('#fff6e0'));
      if (kind === 'shop') { for (const s of [-1, 1]) for (let r = 0; r < 4; r++) { box(.5, .05, 6, s * (w / 2 - .5), .5 + r * .6, -.5, '#8a5a3a', r === 0); for (let i = 0; i < 9; i++) box(.3, .35, .4, s * (w / 2 - .5), .72 + r * .6, -3.2 + i * .65, ['#e8573e', '#f2c14e', '#2f7fc1', '#3aa66b', '#ff9f1c'][(i + r) % 5]); }
        box(3, 1.0, .7, 0, .5, -d / 2 + 1.6, '#8a5a3a', true); person('#f4f1ea', 0, -d / 2 + .9, 0); pts.push({ k: 'buy', name: 'Buy a snack and a cold drink · ₹30', x: 0, z: -d / 2 + 2.6 }); seats.push(...benchRow(K, w / 2 - 2.5, d / 2 - 1.2, Math.PI, 1.8, '#5a4a3a')); }
      else { box(3, 1.05, .8, 0, .52, -d / 2 + 2.2, kind === 'flats' ? '#5a4a3a' : '#2b3a5a', true); person(kind === 'flats' ? '#3a4a6a' : '#2f7fc1', 0, -d / 2 + 1.4, 0); sign(kind === 'flats' ? 'SECURITY' : 'RECEPTION', 2.4, .45, 0, 2.6, -d / 2 + .17, 0, '#2b2b30', '#ffd36a');
        pts.push({ k: 'chat', name: kind === 'flats' ? 'Talk to the security guard' : 'Ask at reception', x: 0, z: -d / 2 + 3.1 });
        for (const s of [-1, 1]) { box(1.2, 2.4, .1, s * 3, 1.2, -d / 2 + .2, '#b9bcc1'); box(.05, 2.3, .11, s * 3, 1.2, -d / 2 + .2, '#5a5d62'); } sign('LIFT', 1, .3, 0, 2.95, -d / 2 + .17, 0, '#2b2b30', '#ffffff');
        seats.push(...sofa(K, -w / 2 + 1.6, 1, Math.PI / 2, 3, '#3d4a5a')); seats.push(...sofa(K, w / 2 - 1.6, 1, -Math.PI / 2, 2, '#3d4a5a')); plant(-w / 2 + 1, -d / 2 + 1); plant(w / 2 - 1, -d / 2 + 1);
        if (kind === 'flats') for (let i = 0; i < 12; i++) box(.3, .25, .05, -2 + (i % 6) * .35, 1.2 + Math.floor(i / 6) * .3, d / 2 - .2, '#c9a227'); } }, name); }
  /* Beta v1.01.25: rooms that look lived in — polished tiles with grout lines, skirting, a false ceiling with panel lights,
     ceiling fans that turn, windows with daylight, glass entrance doors, a wall clock, framed pictures and a water cooler. */
  const TX = {}; function tileTex(kind) { if (TX[kind]) return TX[kind]; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.clearRect(0, 0, 256, 256);
    const big = kind === 'hall'; x.strokeStyle = 'rgba(40,30,20,.45)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 253); if (!big) { x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke(); }
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .08})`; x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 30, 2 + Math.random() * 5, Math.random() * 3, 0, 6.3); x.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return TX[kind] = t; }
  const fans = []; bb.onUpdate(dt => { for (let i = fans.length - 1; i >= 0; i--) { const f = fans[i]; if (!f.parent) { fans.splice(i, 1); continue; } f.rotation.y += dt * 7; } });
  function dress(K, kind, w, d, H) { const g = K.g, big = w > 24; const { box } = K;
    // tiles over the floor colour
    const tt = tileTex(big ? 'hall' : 'room').clone(); tt.needsUpdate = true; tt.repeat.set(w / (big ? 1.6 : 1.2), d / (big ? 1.6 : 1.2)); const fl = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshLambertMaterial({ map: tt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); fl.rotation.x = -Math.PI / 2; fl.position.y = .035; g.add(fl);
    // skirting and a dado line
    const sk = kind === 'mechanic' ? '#3a3b40' : '#6b5a4a'; box(w, .14, .04, 0, .07, -d / 2 + .02, sk); box(w, .14, .04, 0, .07, d / 2 - .02, sk); box(.04, .14, d, -w / 2 + .02, .07, 0, sk); box(.04, .14, d, w / 2 - .02, .07, 0, sk);
    // wood panelling on the lower walls with an accent stripe above it, in the room's own colour
    const acc = (LOOK[kind] || LOOK.jobs)[2]; const wp = big ? 1.4 : 1.05;
    for (const [ww, x, z, ry] of [[w, 0, -d / 2 + .03, 0], [d, -w / 2 + .03, 0, Math.PI / 2], [d, w / 2 - .03, 0, -Math.PI / 2]]) { const pnl = new T.Mesh(new T.PlaneGeometry(ww, wp), M('#6b4a32')); pnl.position.set(x, wp / 2, z); pnl.rotation.y = ry; g.add(pnl); const st = new T.Mesh(new T.PlaneGeometry(ww, .12), M(acc)); st.position.set(x, wp + .08, z + (ry === 0 ? .002 : 0)); st.rotation.y = ry; g.add(st); }
    // a big patterned rug in the middle
    const rt = document.createElement('canvas'); rt.width = 256; rt.height = 160; const rx = rt.getContext('2d'); rx.fillStyle = acc; rx.fillRect(0, 0, 256, 160); rx.strokeStyle = '#e9c46a'; rx.lineWidth = 8; rx.strokeRect(10, 10, 236, 140); rx.lineWidth = 3; rx.strokeRect(24, 24, 208, 112); rx.fillStyle = '#e9c46a'; for (let i = 0; i < 5; i++) { rx.beginPath(); rx.moveTo(128, 40 + i * 4); rx.lineTo(168 - i * 6, 80); rx.lineTo(128, 120 - i * 4); rx.lineTo(88 + i * 6, 80); rx.closePath(); rx.globalAlpha = .25 + i * .12; rx.fill(); } rx.globalAlpha = 1;
    if (kind !== 'cars' && kind !== 'bikes' && kind !== 'mechanic') { const rug = new T.Mesh(new T.PlaneGeometry(big ? 10 : 4.4, big ? 6 : 2.8), new T.MeshLambertMaterial({ map: new T.CanvasTexture(rt), polygonOffset: true, polygonOffsetFactor: -3 })); rug.rotation.x = -Math.PI / 2; rug.position.set(big ? 0 : -w / 4, .045, big ? 4 : 1); g.add(rug); }
    // false ceiling: a frame and panel lights
    const cm = new T.Mesh(new T.PlaneGeometry(w, d), M('#f3f0ea')); cm.rotation.x = Math.PI / 2; cm.position.y = H - .02; g.add(cm); const step = big ? 4 : 3;
    for (let x = -w / 2 + step / 2; x < w / 2; x += step) for (let z = -d / 2 + step / 2; z < d / 2; z += step) { box(.62, .03, .62, x, H - .04, z, glow('#fffaf0')); box(.68, .02, .68, x, H - .025, z, '#d9d4cc'); }
    // ceiling fans in the smaller rooms
    if (!big && kind !== 'cars' && kind !== 'bikes') for (const fx of w > 12 ? [-w / 4, w / 4] : [0]) { const f = new T.Group(); f.position.set(fx, H - .55, 1.5); const rod = new T.Mesh(new T.CylinderGeometry(.03, .03, .5, 6), M('#5a5d62')); rod.position.y = .3; f.add(rod); const hub = new T.Mesh(new T.CylinderGeometry(.14, .12, .12, 10), M('#e9e4d6')); f.add(hub);
      for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.BoxGeometry(.95, .015, .16), M('#e9e4d6')); b.position.set(Math.cos(i * 2.094) * .52, 0, Math.sin(i * 2.094) * .52); b.rotation.y = -i * 2.094; f.add(b); } g.add(f); fans.push(f); }
    // windows with daylight on the left wall
    const glass = glow('#cfe6f5'); for (let z = -d / 2 + 2.2; z < d / 2 - 2; z += big ? 4.5 : 3.2) { const ww = big ? 3 : 1.8, wh = big ? 3 : 1.4, y = big ? 3.6 : 1.85; const q = new T.Mesh(new T.PlaneGeometry(ww, wh), glass); q.position.set(-w / 2 + .03, y, z); q.rotation.y = Math.PI / 2; g.add(q);
      for (const [a, b2, c, dx, dy] of [[.08, wh + .16, .1, 0, -ww / 2], [.08, wh + .16, .1, 0, ww / 2], [.08, .08, ww, wh / 2, 0], [.1, .1, ww + .3, -wh / 2 - .04, 0], [.06, wh, .05, 0, 0]]) box(a, b2, c, -w / 2 + .06, y + (dx || 0), z + (dy || 0), '#8a7a6a');
        for (const sd of [-1, 1]) box(.06, wh + .5, .45, -w / 2 + .12, y - .1, z + sd * (ww / 2 + .3), acc); box(.08, .08, ww + 1.4, -w / 2 + .14, y + wh / 2 + .3, z, '#c9a227'); }
    // glass entrance doors in the front wall (where you came in)
    const dw = big ? 4 : 2.4, dh = big ? 3.2 : 2.5; const dg = new T.Mesh(new T.PlaneGeometry(dw, dh), glow('#e8f4fb')); dg.position.set(0, dh / 2, d / 2 - .03); dg.rotation.y = Math.PI; g.add(dg); box(.1, dh, .12, 0, dh / 2, d / 2 - .06, '#5a5d62'); box(dw + .3, .14, .14, 0, dh + .07, d / 2 - .06, '#5a5d62'); for (const s2 of [-1, 1]) box(.12, dh, .14, s2 * (dw / 2 + .08), dh / 2, d / 2 - .06, '#5a5d62');
    K.sign('EXIT', .8, .28, 0, dh + .45, d / 2 - .05, Math.PI, '#1e8a4c', '#ffffff');
    // a wall clock and framed pictures on the back wall, a water cooler by the door
    const clk = new T.Mesh(new T.CircleGeometry(.32, 20), M('#f7f5ef')); clk.position.set(w / 2 - 1.6, H - 1.1, -d / 2 + .04); g.add(clk); const rim = new T.Mesh(new T.RingGeometry(.32, .37, 20), M('#2b2b30')); rim.position.copy(clk.position); rim.position.z += .005; g.add(rim);
    for (const [hx, hl] of [[.12, .2], [-.02, .26]]) { const hd = new T.Mesh(new T.PlaneGeometry(.02, hl), M('#1c1c20')); hd.position.set(clk.position.x + hx * .3, clk.position.y + hl / 2 * .7, clk.position.z + .01); hd.rotation.z = hx * 6; g.add(hd); }
    const PIC = ['#3e6e8a', '#b35a2a', '#3a7a4a', '#7a3d9a']; for (const [px, i] of [[-w / 2 + 2.2, 0], [w / 2 - 3.4, 1]]) { box(1.3, .9, .05, px, 2.1, -d / 2 + .05, '#5a4030'); box(1.15, .75, .06, px, 2.1, -d / 2 + .06, PIC[(i + w) % 4]); }
    if (kind !== 'cars' && kind !== 'bikes') { box(.38, 1.0, .38, w / 2 - .5, .5, d / 2 - 1.2, '#e9e4d6', true); K.cyl(.15, .15, .4, w / 2 - .5, 1.2, d / 2 - 1.2, new T.MeshPhongMaterial({ color: 0x8fc8e8, transparent: true, opacity: .7 })); } }
  // a room = an enterVenue description; seats are interior points too
  function room(poi, kind, w, d, H, build, title) { const blk = [], seats = [], pts = [];
    return { poi, name: title || poi.name, w, d, H, bg: '#dcd6cc', exitName: `Exit · back outside`, exit: { x: 0, z: d / 2 - 1.1 }, start: { x: 0, z: d / 2 - 3.2, h: Math.PI }, blk, _ib: true, _kind: kind,
      build: g => { const K = Object.assign(kit(g, blk), { g, blk }); build(K, seats, pts); dress(K, kind, w, d, H); const L = new T.PointLight(0xfff4e0, 1.1, 60); L.position.set(0, H - .5, 0); g.add(L); const L2 = new T.HemisphereLight(0xffffff, 0x887766, .55); g.add(L2);
        seats.forEach((s, i) => { if (!s.taken) pts.push({ k: 'seat' + i, name: s.name, x: s.x + Math.sin(s.h) * .55, z: s.z + Math.cos(s.h) * .55 }); }); return pts; },
      onAction: k => { if (k === 'desk') { poi._desk = true; try { return bb.openPoi(poi); } finally { poi._desk = false; } }
        if (k === 'buy') { if (!bb.spend(30, true)) return; P().hunger = Math.min(100, P().hunger + 15); bb.emit('eat'); return bb.toast('🥤 A cold drink and chips · hunger +15', '#3ddc97'); }
        if (k === 'chat') return bb.toast((L => L[Math.floor(Math.random() * L.length)])(['"Namaste! Visitors sign the register, please."', '"The lift is slow today, take the stairs."', '"Looking for someone? Sit, I will call them."', '"Office hours are 10 to 6."']), '#d6c8e4');
        if (k.startsWith('seat')) { const s = seats[+k.slice(4)]; if (s) sit(s, true); } } }; }
  /* ---------- walking in ---------- */
  const HALLS = new Set(['airport', 'station', 'bus', 'metro', 'bullet', 'local']), LOBBIES = new Set(['lodge', 'hospital', 'police', 'bank', 'rto', 'jobs', 'realty', 'clothes', 'mobile', 'furniture', 'guns', 'cars', 'bikes', 'mechanic']);
  bb.walkIn = poi => { const t = poi.type; if (!HALLS.has(t) && !LOBBIES.has(t)) return false; if (poi.drive && bb.player.mode === 'drive') return false; poi._orig = poi._orig || null;
    bb.enterVenue(HALLS.has(t) ? hall(poi, t) : lobby(poi, t)); bb.toast(`Inside ${esc(poi.name)} · walk to the ${HALLS.has(t) ? 'counter' : 'desk'} and press E · sit on a sofa or bench`, '#ffc93c'); return true; };
  // a ride or a trip booked at the counter starts outside the building
  const play0 = bb.CINE && bb.CINE.play; if (play0) bb.CINE.play = o => { if (!o.keepInside && bb.inside && bb.insideVenue && bb.insideVenue._ib) bb.leaveVenue(); return play0(o); };
  // other buildings: a prompt when you stand by one, away from the shops and offices that have their own door
  const HB = new Map(), CS = 60; for (const b of bb.BLDS || []) { const k = Math.floor(b.x / CS) + ',' + Math.floor(b.z / CS); let a = HB.get(k); if (!a) HB.set(k, a = []); a.push(b); }
  function nearBld(x, z) { let best = null, bd = 1.6; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = HB.get((Math.floor(x / CS) + i) + ',' + (Math.floor(z / CS) + j)); if (!a) continue;
      for (const b of a) { const dx = Math.max(Math.abs(x - b.x) - b.w / 2, 0), dz = Math.max(Math.abs(z - b.z) - b.d / 2, 0); const d = Math.hypot(dx, dz); if (d < bd) { bd = d; best = b; } } } return best; }
  bb.addPrompt(() => { if (bb.inside || bb.player.mode !== 'foot') return null; const p = bb.player.pos; const b = nearBld(p.x, p.z); if (!b) return null; if (bb.pois.some(q => Math.abs(q.x - p.x) < 7 && Math.abs(q.z - p.z) < 7)) return null;
    const kind = b.h > 22 ? 'Go into the apartment block' : b.h > 11 ? 'Go into the office building' : 'Go into the shop'; return { text: kind, fn: () => { const ox = p.x - b.x, oz = p.z - b.z; const ax = Math.abs(ox) / b.w > Math.abs(oz) / b.d; const rot = ax ? (ox > 0 ? Math.PI / 2 : -Math.PI / 2) : (oz > 0 ? 0 : Math.PI);
      const door = { x: p.x, z: p.z, rot, name: kind.replace('Go into the ', '').replace(/^./, c => c.toUpperCase()), type: 'bld' }; bb.enterVenue(generic(b, door)); } }; });
  /* ---------- sitting ---------- */
  const SEATS = []; const SH = new Map();
  const addSeat = s => { SEATS.push(s); if (!s.indoor && bb.pedBlock) bb.pedBlock(s.x, s.z, .5); const k = Math.floor(s.x / 30) + ',' + Math.floor(s.z / 30); let a = SH.get(k); if (!a) SH.set(k, a = []); a.push(s); };
  function seatNear(x, z) { let b = null, bd = 1.25; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = SH.get((Math.floor(x / 30) + i) + ',' + (Math.floor(z / 30) + j)); if (!a) continue; for (const s of a) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s; } } } return b; }
  bb.addPrompt(() => { if (bb.inside || bb.player.mode !== 'foot') return null; const p = bb.player.pos; const s = seatNear(p.x, p.z); return s ? { text: s.name || 'Sit on the bench', fn: () => sit(s, false) } : null; });
  function sit(s, indoor) { if (!bb.CINE) return; const A = bb.avatar, U = A.userData; const S = { yaw: 0 }; const base = indoor ? 0 : .3; let rest = 0;
    bb.CINE.play({ keepInside: true, kind: 'none', hud: true, lookToggle: false, showAvatar: true, label: indoor ? 'Inside' : 'Taking a break', title: 'Sitting', sub: 'Relax · ◀ ▶ or drag to look round · Stand up when you are ready', skipLabel: 'Stand up',
      cam: (f, dt, st, keys) => { if (keys) { if (keys.ArrowLeft || keys.KeyA) S.yaw += dt * 1.3; if (keys.ArrowRight || keys.KeyD) S.yaw -= dt * 1.3; }
        if (bb.seatAvatar) bb.seatAvatar(true); const sc = A.scale.y || 1; A.position.set(s.x - Math.sin(s.h) * .1, s.y + .03 - .86 * sc, s.z - Math.cos(s.h) * .1); A.rotation.set(0, s.h, 0); if (U.legs) U.legs.forEach((l, i) => { l.rotation.x = -1.52; l.rotation.z = (i ? 1 : -1) * .06; }); if (U.arms) U.arms.forEach(a => a.rotation.x = -.55);
        rest += dt; if (rest > 3) { rest = 0; P().energy = Math.min(100, P().energy + .6); }
        const a = s.h + Math.PI + .5 + S.yaw, r = indoor ? 2.4 : 3.6; const cx = s.x + Math.sin(a) * r, cz = s.z + Math.cos(a) * r; return { x: cx, y: base + (indoor ? 1.7 : 2.0), z: cz, lx: s.x, ly: base + s.y + .4, lz: s.z, lookK: 6, px: s.x, pz: s.z }; },
      onStop: () => { if (bb.seatAvatar) bb.seatAvatar(false); if (U.legs) U.legs.forEach(l => { l.rotation.x = 0; l.rotation.z = 0; }); if (U.arms) U.arms.forEach(a => a.rotation.x = 0); const p = bb.player.pos; p.set(s.x + Math.sin(s.h) * .8, 0, s.z + Math.cos(s.h) * .8); bb.player.h = s.h; } }); }
  // outdoor benches: at tea and food stalls and bus stops (where there is room)
  const bm = bb.LMat('#6b4a2e'), lm = bb.LMat('#3a3b40'); const V = new T.Vector3();
  function bench(x, z, h, name) { const parts = [[1.7, .07, .42, 0, .45, 0, bm], [1.7, .38, .05, 0, .72, -.2, bm], [.06, .45, .36, -.75, .22, 0, lm], [.06, .45, .36, .75, .22, 0, lm]];
    for (const [w, hh, d, lx, y, lz, m] of parts) { const g = new T.BoxGeometry(w, hh, d); g.rotateY(h); g.translate(x + lx * Math.cos(h) + lz * Math.sin(h), y, z - lx * Math.sin(h) + lz * Math.cos(h)); bb.addStatic(g, m); }
    if (bb.pedBlock) bb.pedBlock(x, z, .95);
    for (const lx of [-.4, .4]) addSeat({ x: x + lx * Math.cos(h) + .05 * Math.sin(h), z: z - lx * Math.sin(h) + .05 * Math.cos(h), y: .5, h, name: name || 'Sit on the bench' }); }
  const clear = (x, z) => { if (bb.isWater(x, z) || bb.roadAt(x, z, .6)) return false; V.set(x, 0, z); return !bb.collideTest(V) && !bb.pois.some(p => Math.abs(p.x - x) < 1.6 && Math.abs(p.z - z) < 1.6); };
  let nb = 0; for (const p of bb.pois) { if (p.type !== 'food' && p.type !== 'bus') continue; const r = p.rot || 0; for (const side of [1, -1]) { const x = p.x + Math.cos(r) * 3.2 * side, z = p.z - Math.sin(r) * 3.2 * side; if (clear(x, z) && clear(x + Math.cos(r) * .8, z - Math.sin(r) * .8)) { bench(x, z, r, p.type === 'bus' ? 'Sit at the bus stop' : 'Sit on the bench by the stall'); nb++; break; } } }
  if (bb.flushStatic) bb.flushStatic();
  bb.SEATS = { add: s => addSeat(s), bench, list: SEATS, sit, get count() { return nb; } };
  bb.INTERIORS = { lobby, hall, generic };
});
