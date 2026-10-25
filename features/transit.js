// Transport (Beta v1.01.12): BayTaxi in the phone, state buses (KSRTC, MSRTC, GSRTC, RSRTC, Kadamba and city
// operators such as BEST and BMTC) with their colours on the road, city buses and open-top city tours from every
// bus stand, a seated view inside the bus, and directions that ask how you want to go and guide you to the stop.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, W = bb.WORLD, P = () => bb.P, esc = bb.esc;
  /* ---------- operators and liveries ---------- */
  const OPS = { MH: { name: 'MSRTC', full: 'MSRTC · Lal Pari', body: '#c1272d', band: '#f2c230', seat: '#3d5a8a', note: 'The red "Lal Pari" of Maharashtra · 2+2 seats' },
    KL: { name: 'KSRTC', full: 'KSRTC Kerala', body: '#c8102e', band: '#ffd23f', seat: '#7a1f2a', note: 'Kerala\'s red and yellow Anavandi · fast passenger and super fast' },
    KA: { name: 'KSRTC', full: 'KSRTC Karnataka', body: '#b3202a', band: '#d9d9d9', seat: '#2f3f5f', note: 'Red and silver Karnataka Sarige · Airavat AC on long routes' },
    GJ: { name: 'GSRTC', full: 'GSRTC Gujarat', body: '#1f5fa8', band: '#f4f1ea', seat: '#6b2a2a', note: 'Blue and white express buses across Gujarat' },
    RJ: { name: 'RSRTC', full: 'RSRTC Rajasthan', body: '#2f6f3a', band: '#f4e3b0', seat: '#7b4a2a', note: 'Green and cream buses through the desert towns' },
    GA: { name: 'KTCL', full: 'Kadamba (KTCL) Goa', body: '#1b7f5c', band: '#f4f1ea', seat: '#2b4a6a', note: 'Kadamba green buses between the beaches and towns' },
    DD: { name: 'DNH-DD', full: 'DNH & DD transport', body: '#2a62c9', band: '#f4f1ea', seat: '#2b3a5a', note: 'Blue buses around Daman and Silvassa' } };
  // Beta v1.01.30: the South-East
  Object.assign(OPS, { TN: { name: 'TNSTC', full: 'TNSTC Tamil Nadu', body: '#c8202a', band: '#f2e6c8', seat: '#3d3d46', note: 'Tamil Nadu state buses · SETC for the long routes · women ride free on town buses' },
    AP: { name: 'APSRTC', full: 'APSRTC Andhra Pradesh', body: '#2f7d4a', band: '#f4f1ea', seat: '#2f3f5f', note: 'Pallevelugu village buses and Garuda AC coaches · women ride free' },
    TG: { name: 'TGSRTC', full: 'TGSRTC Telangana', body: '#c1272d', band: '#f6d24a', seat: '#3d3d46', note: 'Red express buses and Rajadhani AC coaches · women ride free' },
    PY: { name: 'PRTC', full: 'PRTC Puducherry', body: '#1f6fb5', band: '#f4f1ea', seat: '#2b3a5a', note: 'Puducherry Road Transport buses on the ECR' } });
  // Beta v2.00.00: the north, the centre and the east
  Object.assign(OPS, { DL: { name: 'DTC', full: 'DTC Delhi', body: '#2f7d4a', band: '#f2c230', seat: '#3d3d46', note: 'Green low-floor and electric DTC buses · women ride free with a pink ticket' },
    HR: { name: 'Haryana Roadways', full: 'Haryana Roadways', body: '#1f5fa8', band: '#f4f1ea', seat: '#3d3d46', note: 'Blue Haryana Roadways buses and Volvos to the Delhi airport' },
    PB: { name: 'PRTC', full: 'PRTC · PUNBUS Punjab', body: '#e36a1f', band: '#f4f1ea', seat: '#3d3d46', note: 'Orange PRTC and PUNBUS buses · Indo-Canadian Volvos to Delhi airport' },
    CH: { name: 'CTU', full: 'CTU Chandigarh', body: '#c1272d', band: '#f4f1ea', seat: '#3d3d46', note: 'Chandigarh Transport Undertaking buses round the sectors' },
    HP: { name: 'HRTC', full: 'HRTC Himachal', body: '#2f6f3a', band: '#f4f1ea', seat: '#3d3d46', note: 'HRTC mountain buses · the overnight Volvo from Delhi and the long Delhi–Leh bus' },
    UK: { name: 'UTC', full: 'Uttarakhand Roadways', body: '#1f6fb5', band: '#f6d24a', seat: '#3d3d46', note: 'Uttarakhand Roadways and GMOU hill buses on the Char Dham roads' },
    JK: { name: 'JKSRTC', full: 'JKSRTC', body: '#c8202a', band: '#f4f1ea', seat: '#3d3d46', note: 'JKSRTC buses · Sumo shared taxis between the towns' },
    LA: { name: 'JKSRTC Leh', full: 'Leh buses (JKSRTC and HRTC)', body: '#f2c230', band: '#3d3d46', seat: '#3d3d46', note: 'A few buses a day · local union taxis everywhere else' },
    UP: { name: 'UPSRTC', full: 'UPSRTC Uttar Pradesh', body: '#e36a1f', band: '#f4f1ea', seat: '#3d3d46', note: 'UPSRTC Janrath AC and Volvos on the expressways · pink buses for women' },
    MP: { name: 'Private bus', full: 'Private buses · Madhya Pradesh', body: '#7a3d9a', band: '#f2c230', seat: '#3d3d46', note: 'Private buses with touts calling out the stops' },
    CG: { name: 'Private bus', full: 'Private buses · Chhattisgarh', body: '#2f7d4a', band: '#f2c230', seat: '#3d3d46', note: 'Private buses between the towns' },
    OD: { name: 'OSRTC', full: 'OSRTC Odisha', body: '#1f6fb5', band: '#f4f1ea', seat: '#3d3d46', note: 'OSRTC buses and private buses across Odisha' } });
  OPS.DN = OPS.DD;
  const CITY = { mumbai: { name: 'BEST', full: 'BEST Mumbai', body: '#b8202a', band: '#f3efe6', seat: '#4a4f57', dd: true, note: 'Red BEST buses, some double-deckers' }, bengaluru: { name: 'BMTC', full: 'BMTC Bengaluru', body: '#2f7d4a', band: '#e9f2e4', seat: '#2f3f5f', note: 'Green and white BMTC buses' },
    pune: { name: 'PMPML', full: 'PMPML Pune', body: '#d06a1d', band: '#f4f1ea', seat: '#3d3d46', note: 'Orange PMPML city buses' }, ahmedabad: { name: 'AMTS', full: 'AMTS Ahmedabad', body: '#c0392b', band: '#f6e7c1', seat: '#4a3b2b', note: 'AMTS red city buses' },
    kochi: { name: 'KSRTC', full: 'KSRTC city · Kochi', body: '#1f6fb5', band: '#f4f1ea', seat: '#2b3a5a', note: 'Blue KSRTC city circulars' }, jaipur: { name: 'JCTSL', full: 'JCTSL Jaipur', body: '#ff8f1f', band: '#fff4e2', seat: '#5a3b2b', note: 'Orange Jaipur city buses' },
    chennai: { name: 'MTC', full: 'MTC Chennai', body: '#1f5fa8', band: '#f4f1ea', seat: '#3d3d46', note: 'Blue MTC buses, some electric · women ride free' }, hyderabad: { name: 'TGSRTC', full: 'TGSRTC city · Hyderabad', body: '#c1272d', band: '#f4f1ea', seat: '#3d3d46', note: 'Red city buses and electric buses' },
    visakhapatnam: { name: 'APSRTC', full: 'APSRTC city · Vizag', body: '#2f7d4a', band: '#f4f1ea', seat: '#2f3f5f', note: 'Green city buses along the Beach Road' },
    delhi: { name: 'DTC', full: 'DTC Delhi', body: '#d6262f', band: '#f4f1ea', seat: '#3d3d46', note: 'Red AC and green non-AC DTC buses, many electric' }, gurugram: { name: 'GMCBL', full: 'GMCBL Gurugram', body: '#1f6fb5', band: '#f4f1ea', seat: '#3d3d46', note: 'Gurugram city buses' },
    chandigarh: { name: 'CTU', full: 'CTU Chandigarh', body: '#c1272d', band: '#f4f1ea', seat: '#3d3d46', note: 'Red CTU city buses round the sectors' }, lucknow: { name: 'LCTSL', full: 'Lucknow city buses', body: '#2f7d4a', band: '#f4f1ea', seat: '#3d3d46', note: 'Green and electric city buses' },
    indore: { name: 'iBus', full: 'iBus Indore', body: '#e36a1f', band: '#f4f1ea', seat: '#3d3d46', note: 'Indore BRTS iBus in its own lane' }, bhopal: { name: 'BCLL', full: 'BCLL Bhopal', body: '#c1272d', band: '#f4f1ea', seat: '#3d3d46', note: 'Red Bhopal city buses' },
    bhubaneswar: { name: 'Mo Bus', full: 'Mo Bus Bhubaneswar', body: '#2f7d4a', band: '#7fd06a', seat: '#3d3d46', note: 'Smart green Mo Bus city buses' }, raipur: { name: 'City bus', full: 'Raipur city buses', body: '#1f6fb5', band: '#f4f1ea', seat: '#3d3d46', note: 'Blue city buses' } };
  const zoneOf = at => at && at.zone ? at.zone : at ? bb.zoneAt(at.x, at.z, 250) : null;
  const opFor = (at, city) => { const z = zoneOf(at); if (city && z && CITY[z.id]) return CITY[z.id]; return (z && OPS[z.st]) || OPS.MH; };
  // Beta v1.01.24: the livery also names its style, so the bus is drawn like the real one (see buildBus in the core).
  // On the highways about one bus in five is the white AC intercity coach; in Mumbai some double-deckers are open-top tour buses.
  const hash = (x, z) => { const v = Math.sin(Math.floor(x / 37) * 12.9898 + Math.floor(z / 37) * 78.233) * 43758.5453; return v - Math.floor(v); };
  const liveryAt = (x, z) => { const zz = bb.zoneAt(x, z, 0); const city = zz && CITY[zz.id]; const o = city ? CITY[zz.id] : opFor({ x, z }); const st = (zz && zz.st) || (bb.zoneAt(x, z, 400) || {}).st || 'MH';
    const L = { body: o.body, band: o.band, text: o.name, dd: !!o.dd, key: city ? 'city' : (OPS[st] ? st : 'MH') }; if (!city && !zz && hash(x, z) < .22) L.style = 'volvo'; if (city && o.dd && hash(z, x) < .3) L.open = true; return L; };
  bb.livery = liveryAt;
  const label = (mode, at) => { const z = zoneOf(at);
    if (mode === 'bus') return opFor(at).full + ' · Express'; if (mode === 'busac') return opFor(at).name + ' · AC sleeper'; if (mode === 'interstate') return opFor(at).name + ' · Interstate AC coach';
    if (mode === 'citybus') return opFor(at, true).name + ' city bus'; if (mode === 'tour') return (z ? z.name + ' ' : '') + 'city tour · open-top';
    return bb.TRAVEL && bb.TRAVEL.MODE[mode] || mode; };
  const modeNote = (mode, poi) => { const o = opFor(poi, mode === 'citybus'); const n = mode === 'bus' ? o.note : mode === 'busac' ? 'Overnight AC sleeper with berths and curtains · long trips' : mode === 'interstate' ? 'White AC coach to the big cities of the other states · reclining seats' : mode === 'citybus' ? `${o.note} · hop on to any place in ${poi.zone ? esc(poi.zone.name) : 'town'}` : mode === 'tour' ? 'A guided loop past the famous places, then back here' : '';
    return n ? `<p class="note">${n}</p>` : ''; };
  /* ---------- destinations for city buses and tours ---------- */
  const inZone = (z, x, q, m = 40) => x > z.x0 - m && x < z.x0 + z.nx * 80 + m && q > z.z0 - m && q < z.z0 + z.nz * 80 + m;
  function cityPlaces(z) { const out = []; for (const p of (W.places || [])) if (inZone(z, p[1], p[2], 60)) out.push({ name: p[0], x: p[1], z: p[2] });
    const TY = { mall: 'Mall', stadium: 'Stadium', hospital: 'Hospital', station: 'Railway station', airport: 'Airport', metro: 'Metro', realty: 'Property office', cars: 'Car showroom' };
    for (const p of bb.pois) if (p.zone === z && TY[p.type] && !out.some(o => o.name === p.name)) out.push({ name: p.name, x: p.x, z: p.z, sub: TY[p.type] }); return out; }
  const arriveAt = (x, z, name, zn) => { const r = bb.nearestRoadPoint(x, z, 140); const ax = r ? r.x : x, az = r ? r.z : z; return { x: ax, z: az, rot: 0, name, zoneName: zn || name }; };
  function destsFor(mode, poi) { const z = poi.zone; if (!z) return null;
    if (mode === 'citybus') return cityPlaces(z).filter(p => Math.hypot(p.x - poi.x, p.z - poi.z) > 70).map(p => ({ key: 'p:' + p.name, name: p.name, sub: p.sub || 'Stop near', x: p.x, z: p.z, arrive: arriveAt(p.x, p.z, p.name, p.name) }));
    if (mode === 'tour') { const L = cityPlaces(z).filter(p => !p.sub).slice(0, 7); if (L.length < 2) return [];
      let pts = [[poi.x, poi.z]]; let len = 0, at = { x: poi.x, z: poi.z };
      for (const p of L) { const r = bb.findRoute(at.x, at.z, p.x, p.z); const seg = r && r.length > 1 ? r : [[p.x, p.z]]; for (const q of seg) { len += Math.hypot(q[0] - pts[pts.length - 1][0], q[1] - pts[pts.length - 1][1]); pts.push(q); } at = { x: seg[seg.length - 1][0], z: seg[seg.length - 1][1] }; }
      const back = bb.findRoute(at.x, at.z, poi.x, poi.z); if (back) for (const q of back) pts.push(q); pts.push([poi.x, poi.z]);
      const lines = ['Welcome aboard · sit back on the top deck'].concat(L.map(p => `On your left: ${p.name}`), ['Last stop · thank you for riding with us']);
      return [{ key: 'tour', name: `${z.name} city tour`, sub: `${L.length} famous places · back here at the end`, x: poi.x + 1, z: poi.z, arrive: { x: poi.x + Math.sin(poi.rot || 0) * 3, z: poi.z + Math.cos(poi.rot || 0) * 3, rot: poi.rot || 0, name: poi.name, zoneName: z.name },
        opts: { pts, lines, secs: Math.max(60, Math.min(240, Math.round(len / 7))), label: label('tour', poi), arriveText: `Tour over · back at ${poi.name}`, onArrive: () => bb.emit('cityTour', z.id) } }]; }
    return null; }
  /* ---------- the seated view inside the bus ---------- */
  const mats = {}; const M = c => mats[c] || (mats[c] = bb.LMat(c)); const glow = new T.MeshBasicMaterial({ color: 0xfff6dc });
  function interior(op, kind) { const g = new T.Group(); const box = (w, h, d, x, y, z, m) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    const open = kind === 'tour', sleeper = kind === 'busac'; const F = open ? 4.1 : .95;   // floor height
    const body = M(op.body), trim = M('#2b2b30'), floor = M('#5a5048'), ceil = M('#e8e2d4'), seatM = M(op.seat || '#3d5a8a'), rail = M('#c9ccd1'), panel = M('#d9d2c2');
    box(2.5, .1, 10.5, 0, F, 0, floor);
    for (const s of [-1, 1]) { box(.08, .7, 10.5, s * 1.22, F + .4, 0, panel); box(.1, .7, 10.5, s * 1.27, F + .4, 0, body);   // below the windows
      if (!open) { box(.1, .42, 10.5, s * 1.25, F + 1.78, 0, body); for (let z = -4.6; z <= 4.8; z += 1.3) box(.1, .72, .14, s * 1.24, F + 1.17, z, trim); } else box(.08, .08, 10.5, s * 1.24, F + .95, 0, rail); }
    if (!open) { box(2.5, .08, 10.5, 0, F + 2.02, 0, ceil); for (const s of [-1, 1]) box(.05, .05, 9.5, s * .4, F + 1.82, 0, rail); box(.18, .03, 9, 0, F + 1.97, 0, glow); }
    box(2.5, open ? .9 : 2, .08, 0, F + (open ? .45 : 1), -5.25, panel);
    // the front: dashboard, windscreen pillars, header with the route board; the driver sits on the right
    if (!open) { box(2.5, .7, .3, 0, F + .35, 5.2, trim); for (const s of [-1, 1]) box(.12, 1.3, .12, s * 1.2, F + 1.35, 5.25, trim); box(2.5, .3, .1, 0, F + 1.87, 5.25, trim); box(1.4, .2, .03, 0, F + 1.87, 5.19, M('#ffb020'));
      box(.55, .12, .5, -.65, F + .5, 4.4, M('#222')); const d = bb.buildPerson(M('#f4f1ea'), { female: false }); d.position.set(-.65, F - .45, 4.35); d.rotation.y = 0; g.add(d); }
    // seats in rows of 2 + 2 (berths in the sleeper), some taken
    const sit = []; const people = ['#d9483b', '#2f7fc1', '#f4f1ea', '#1f8a4c', '#ffc93c', '#7b2a5e', '#e58f2a'];
    for (let r = 0, z = open ? -4.3 : -4.4; z < (open ? 4.6 : 3.8); z += sleeper ? 1.9 : .85, r++) for (const s of [-1, 1]) {
      if (sleeper) { box(.95, .1, 1.8, s * .74, F + .55, z, seatM); box(.95, .1, 1.8, s * .74, F + 1.45, z, seatM); box(.04, .9, 1.7, s * .27, F + 1, z, M('#8a1f3a')); continue; }
      for (const k of [.45, 1.0]) { const x = s * k; box(.5, .12, .45, x, F + .45, z, seatM); box(.5, .58, .08, x, F + .78, z - .22, seatM); box(.5, .06, .1, x, F + 1.08, z - .22, rail); if (Math.random() < .42 && !(s === -1 && Math.abs(z - .7) < .5)) sit.push([x, z]); } }
    for (const [x, z] of sit) { const p = bb.buildPerson(M(people[Math.floor(Math.random() * people.length)]), { female: Math.random() < .45 }); p.position.set(x, F - .62, z + .02); p.scale.setScalar(.96); g.add(p); }
    if (kind === 'citybus') for (let i = 0; i < 3; i++) { const p = bb.buildPerson(M(people[i]), { female: i === 1 }); p.position.set((Math.random() - .5) * .3, F, -2 + i * 1.6); p.rotation.y = Math.random() * 6; g.add(p); }
    return { g, F }; }
  function wrap(rideObj, mode, pp, R) { const op = opFor(pp, mode === 'citybus' || mode === 'tour'); const { g, F } = interior(op, mode);
    // Beta v1.01.24: the open-top tour bus has both decks; look round and change seat (features/cabins.js)
    let seats; if (mode === 'tour') { const lo = interior(op, 'citybus'); g.add(lo.g); seats = [{ name: 'Top deck, front row', eye: [.45, F + 1.15, 4.0], yaw: 0, pitch: -.05 }, { name: 'Top deck, by the rail', eye: [-1.0, F + 1.15, -1.5], yaw: -Math.PI / 2 * .8 }, { name: 'Lower deck window', eye: [-.95, lo.F + 1.22, .72], yaw: -Math.PI / 2 * .85 }]; }
    else seats = [{ name: 'Window seat', eye: [-.95, F + 1.22, .72], yaw: -Math.PI / 2 * .85 }, { name: 'Aisle seat', eye: [-.45, F + 1.22, .72], yaw: 0 }, { name: 'Front seat, left side', eye: [.45, F + 1.25, 3.7], yaw: 0, pitch: -.04 }].concat(mode === 'citybus' ? [{ name: 'Standing by the door', eye: [.6, F + 1.65, 4.5], yaw: Math.PI / 2 * .7 }] : []);
    if (bb.CABIN) return bb.CABIN.look(rideObj, g, seats, c => { const h = Math.atan2(c.lx - c.x, c.lz - c.z); return { x: c.x, y: c.y - (R.y || 3.1), z: c.z, h, bob: .012 }; });
    bb.scene.add(g); let hd = null; const base = rideObj.cam; const stop0 = rideObj.onStop;
    rideObj.kind = 'bus3d'; rideObj.lookToggle = true;
    rideObj.cam = (f, dt, st, keys) => { const want = st.look; st.look = 'fwd'; const c = base(f, dt, st, keys); st.look = want; if (!c) return c;
      const h = Math.atan2(c.lx - c.x, c.lz - c.z); if (hd == null) hd = h; else { let d = h - hd; d = Math.atan2(Math.sin(d), Math.cos(d)); hd += d * Math.min(1, dt * 2.5); }
      const gy = c.y - (R.y || 3.1); g.position.set(c.x, gy, c.z); g.rotation.set(0, hd, 0);
      const ch = Math.cos(hd), sh = Math.sin(hd); const W2 = (lx, ly, lz) => ({ x: c.x + lx * ch + lz * sh, y: gy + ly, z: c.z - lx * sh + lz * ch });
      const eye = want === 'side' ? W2(-.9, F + 1.22, .72) : W2(.15, F + 1.3, -3.4); const look = want === 'side' ? W2(-7, F + .95, 2.2) : W2(.1, F + 1.05, 8);
      return Object.assign({}, c, { x: eye.x, y: eye.y, z: eye.z, lx: look.x, ly: look.y, lz: look.z, hard: true, lookK: 14, px: c.x, pz: c.z }); };
    rideObj.onStop = () => { bb.scene.remove(g); if (stop0) try { stop0(); } catch (e) {} };
    return rideObj; }
  /* ---------- BayTaxi ---------- */
  const RIDES = [['auto', '🛺', 'BayAuto', 'Auto rickshaw · cheapest in the city', 30, 14, 'auto'], ['mini', '🚗', 'BayMini', 'Hatchback · 4 seats', 50, 18, 'car'], ['sedan', '🚘', 'BayPrime', 'Sedan with AC · more legroom', 70, 22, 'sedan'], ['xl', '🚙', 'BayXL', 'SUV · 6 seats', 90, 28, 'suv']];
  let taxi = null;   // { stage: 'coming' | 'here', end, dest, ride, fare, v, sprite, here }
  const kmOf = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) * 2.4 / 1000;
  const fareOf = (r, km) => bb.price(r[4] + r[5] * km);
  function taxiDests() { const pp = bb.ppos(); const z = bb.zoneAt(pp.x, pp.z, 200); const out = []; const g = bb.TRAVEL && bb.TRAVEL.gps; if (g) out.push({ icon: '📍', name: g.name, x: g.x, z: g.z, sub: 'Your directions' });
    for (const id of P().homes || []) { const h = bb.homeById(id); const p = bb.pois.find(q => q.type === 'home' && q.extra === id); if (h && p) out.push({ icon: '🏠', name: h.name, x: p.x, z: p.z, sub: 'Your home' }); }
    if (z) for (const p of cityPlaces(z)) out.push({ icon: p.sub ? '🏢' : '⭐', name: p.name, x: p.x, z: p.z, sub: p.sub || 'Famous place' });
    const far = W.zones.filter(q => q !== z && q.size !== 'small').map(q => ({ q, d: Math.hypot(q.x0 + q.nx * 40 - pp.x, q.z0 + q.nz * 40 - pp.z) })).sort((a, b) => a.d - b.d).slice(0, 6);
    for (const { q } of far) out.push({ icon: '🛣', name: q.name, x: q.x0 + q.nx * 40, z: q.z0 + q.nz * 40, sub: 'Outstation', zone: q });
    return out.filter((d, i, a) => Math.hypot(d.x - pp.x, d.z - pp.z) > 40 && a.findIndex(o => o.name === d.name) === i).slice(0, 24); }
  let pre = null;
  function taxiApp(rideId, preset) { if (preset) pre = preset; if (taxi) return taxiStatus(); if (bb.inside) return bb.toast('Go outside to book a taxi', '#ff9f1c');
    const pp = bb.ppos(); const r = RIDES.find(q => q[0] === rideId) || RIDES[1]; const L = (pre ? [Object.assign({ icon: '📍', sub: 'Where you are going' }, pre)] : []).concat(taxiDests().filter(d => !pre || d.name !== pre.name));
    const body = `<div class="chips tscroll">${RIDES.map(q => `<button class="chip${q === r ? ' on' : ''}" data-r="${q[0]}">${q[1]} ${q[2]}</button>`).join('')}</div><p class="note">${esc(r[3])} · ${bb.inr(bb.price(r[4]))} + ${bb.inr(bb.price(r[5]))}/km</p>` +
      L.map((d, i) => { const km = kmOf(pp, d); const bad = r[0] === 'auto' && km > 25; return bb.rowHtml('d' + i, `${d.icon} ${esc(d.name)}`, `${esc(d.sub)} · ${km.toFixed(km < 10 ? 1 : 0)} km${bad ? ' · too far for an auto' : ''}`, bad ? '—' : bb.inr(fareOf(r, km)), bad ? 'ghost' : ''); }).join('');
    bb.openSheet('🚕 BayTaxi', 'Where to?', body, s => s.onclick = e => { const c = e.target.closest('[data-r]'); if (c) return taxiApp(c.dataset.r); const id = e.target.dataset.id; if (!id) return; const d = L[+id.slice(1)]; const km = kmOf(bb.ppos(), d); if (r[0] === 'auto' && km > 25) return bb.toast('Autos go up to 25 km · pick another ride', '#ff9f1c');
      const fare = fareOf(r, km); if (!bb.spend(fare, true)) return; bb.closeSheet(); pre = null; const eta = 20 + Math.random() * 40;
      taxi = { stage: 'coming', end: Date.now() + eta * 1000, dest: d, ride: r, fare }; bb.toast(`${r[1]} ${r[2]} booked · arriving in about ${Math.ceil(eta)} s · stay near the road`, '#ffc93c'); bb.emit('taxiBook', r[0]); }); }
  function taxiStatus() { const t = taxi; const left = Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
    bb.openSheet('🚕 BayTaxi', t.stage === 'coming' ? `${t.ride[2]} on the way · ${left} s` : `${t.ride[2]} is here`, `<p class="note">To ${esc(t.dest.name)} · paid ${bb.inr(t.fare)}</p>` + (t.stage === 'here' ? '<p class="note">Walk to the taxi with the yellow sign and press E.</p>' : '') + bb.rowHtml('cancel', 'Cancel the ride', `Refund ${bb.inr(Math.max(0, t.fare - bb.price(20)))} (₹20 cancellation fee)`, 'Cancel', 'danger'),
      s => s.onclick = e => { if (e.target.dataset.id === 'cancel') { endTaxi(true); bb.closeSheet(); } }); }
  function endTaxi(refund) { if (!taxi) return; if (refund) { const back = Math.max(0, taxi.fare - bb.price(20)); bb.earn(back, 'refund'); bb.toast(`Ride cancelled · ${bb.inr(back)} refunded`, '#d6c8e4'); } if (taxi.v) bb.removeVeh(taxi.v); if (taxi.sprite) bb.scene.remove(taxi.sprite); taxi = null; }
  function tag(text) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ffc93c'; x.beginPath(); x.roundRect ? x.roundRect(4, 4, 248, 56, 18) : x.rect(4, 4, 248, 56); x.fill(); x.fillStyle = '#1d1433'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText(text, 128, 43);
    const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false })); s.scale.set(3.2, .8, 1); s.renderOrder = 9; return s; }
  bb.TIMERS.source(() => taxi && taxi.stage === 'coming' ? [{ icon: taxi.ride[1], label: taxi.ride[2] + ' arriving', left: (taxi.end - Date.now()) / 1000 }] : []);
  let tk = 0;
  bb.onUpdate(dt => { if (!taxi) return; tk -= dt; if (tk > 0) return; tk = .3; const pp = bb.ppos();
    if (taxi.stage === 'coming' && Date.now() >= taxi.end) { const r = bb.nearestRoadPoint(pp.x, pp.z, 80); if (!r) { taxi.end = Date.now() + 5000; return; } const e = r.e; const h = Math.atan2(e.dx, e.dz); const off = e.w / 2 - 1.3; const x = r.x + e.dz * off, z = r.z - e.dx * off;
      taxi.v = bb.makeVeh(taxi.ride[6], x, z, h, 'parked'); taxi.v.bayTaxi = true; taxi.sprite = tag('BayTaxi ' + taxi.ride[1]); taxi.sprite.position.set(x, 3.4, z); bb.scene.add(taxi.sprite); taxi.stage = 'here'; taxi.here = Date.now(); bb.toast(`${taxi.ride[1]} Your ${taxi.ride[2]} is here · walk to the yellow sign`, '#ffc93c'); if (bb.horn) bb.horn(); }
    if (taxi.stage === 'here') { if (taxi.sprite) taxi.sprite.position.y = 3.4 + Math.sin(performance.now() / 300) * .1; const d = Math.hypot(taxi.v.pos.x - pp.x, taxi.v.pos.z - pp.z); if (d > 220 && Date.now() - taxi.here > 60000) { bb.toast('Your BayTaxi left · you were too far away (no refund)', '#ff9f1c'); endTaxi(false); } } });
  (bb.addFirstPrompt || bb.addPrompt)(() => { if (!taxi || taxi.stage !== 'here' || bb.inside || bb.player.mode !== 'foot') return null; const pp = bb.ppos(); if (Math.hypot(taxi.v.pos.x - pp.x, taxi.v.pos.z - pp.z) > 7) return null;
    return { text: `Get in your ${taxi.ride[2]} · to ${taxi.dest.name}`, fn: () => { const t = taxi; const d = t.dest; const from = bb.zoneAt(pp.x, pp.z, 200); const to = d.zone ? arriveAt(d.zone.x0 + d.zone.nx * 40, d.zone.z0 + d.zone.nz * 40, d.name, d.name) : arriveAt(d.x, d.z, d.name, d.name);
      const dist = Math.hypot(d.x - pp.x, d.z - pp.z); bb.teleport(t.v.pos.x, t.v.pos.z, t.v.h); endTaxi(false); bb.TRAVEL.journey('baytaxi', from ? from.name : 'Here', to, dist, 0, { label: `BayTaxi · ${t.ride[2]}`, arriveText: `${t.ride[1]} You reached ${d.name} · rate your driver ★★★★★`, onArrive: () => bb.emit('taxiRide', t.ride[0]) }); } }; });
  bb.addApp({ id: 'baytaxi', label: 'BayTaxi', icon: '🚕', fn: () => taxiApp() });
  /* ---------- directions: how do you want to go? ---------- */
  let plan = null;
  const nearest = (type, x, z, f) => bb.pois.filter(p => p.type === type && (!f || f(p))).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  function choose(x, z, name) { const pp = bb.ppos(); const dist = Math.hypot(x - pp.x, z - pp.z); if (dist < 320 || bb.inside) return false;
    const zp = bb.zoneAt(pp.x, pp.z, 120), zd = bb.zoneAt(x, z, 160); const same = zp && zd && zp === zd; const km = d => (d * 2.4 / 1000).toFixed(d * 2.4 < 10000 ? 1 : 0);
    const opts = [{ id: 'drive', icon: bb.player.mode === 'drive' ? '🚗' : '🚶', name: bb.player.mode === 'drive' ? 'Drive' : 'Walk or drive', sub: `${km(dist)} km · follow the blue line` }, { id: 'taxi', icon: '🚕', name: 'BayTaxi', sub: 'A taxi comes to you · Phone → BayTaxi' }];
    const busStand = nearest('bus', pp.x, pp.z); const destStand = zd && nearest('bus', x, z, p => p.zone === zd);
    if (busStand && (same ? busStand.zone === zp : destStand)) opts.push({ id: 'bus', icon: '🚌', name: same ? 'City bus' : 'Bus', sub: `From ${busStand.name} · ${km(Math.hypot(busStand.x - pp.x, busStand.z - pp.z))} km away`, stop: busStand, mode: same ? 'citybus' : 'bus', dest: same ? { key: 'p:' + name, name } : { zone: zd.id, name: zd.name, key: zd.id } });
    if (same) { const m1 = nearest('metro', pp.x, pp.z, p => p.zone === zp), m2 = nearest('metro', x, z, p => p.zone === zp); if (m1 && m2 && m1 !== m2) opts.push({ id: 'metro', icon: '🚇', name: 'Metro', sub: `${m1.name} → ${m2.name}`, stop: m1, mode: 'metro', dest: { key: m2.extra, name: m2.name } }); }
    else { const s1 = nearest('station', pp.x, pp.z), s2 = zd && nearest('station', x, z, p => p.zone === zd); if (s1 && s2 && s1.zone !== s2.zone) opts.push({ id: 'train', icon: '🚆', name: 'Train', sub: `${s1.name} → ${s2.zone.name}`, stop: s1, mode: 'sleeper', dest: { zone: s2.zone.id, key: s2.zone.id, name: s2.zone.name } }); }
    if (dist > 2200) { const a1 = nearest('airport', pp.x, pp.z), a2 = nearest('airport', x, z); if (a1 && a2 && a1 !== a2 && Math.hypot(a2.x - x, a2.z - z) < 1400) opts.push({ id: 'fly', icon: '✈', name: 'Flight', sub: `${a1.name} → ${a2.name}`, stop: a1, mode: 'flight', dest: { key: a2.extra, name: a2.name } }); }
    bb.openSheet('🧭 How do you want to go?', `To ${esc(name)} · ${km(dist)} km`, opts.map(o => bb.rowHtml(o.id, `${o.icon} ${esc(o.name)}`, esc(o.sub), o.id === 'drive' ? 'Go' : o.stop ? 'Guide me' : 'Book', o.id === 'drive' ? '' : 'ghost')).join('') + '<p class="note">With a bus, train, metro or flight the blue line takes you to the stop first. Your trip is starred when you book, and after you arrive the line takes you the rest of the way.</p>',
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id) return; const o = opts.find(q => q.id === id); bb.closeSheet();
        if (id === 'drive') { plan = null; return bb.TRAVEL.go(x, z, name, true); }
        if (id === 'taxi') { plan = null; return taxiApp(null, { name, x, z }); }
        plan = { mode: o.mode, dest: o.dest, final: { x, z, name }, stop: o.stop.name }; bb.TRAVEL.go(o.stop.x, o.stop.z, o.stop.name, true); bb.toast(`${o.icon} Go to ${esc(o.stop.name)}, then take the ${esc(o.name.toLowerCase())}`, '#5fb4ff'); });
    return true; }
  bb.on('travel', e => { if (!plan || !e) return; const f = plan.final; plan = null; if (!f) return; if (Math.hypot(f.x - e.x, f.z - e.z) < 120) return; setTimeout(() => { bb.TRAVEL.go(f.x, f.z, f.name, true); bb.toast(`Last part · follow the blue line to ${esc(f.name)}`, '#5fb4ff'); }, 1500); });
  bb.TRANSIT = { liveryAt, label, modeNote, destsFor, wrap, choose, taxiApp, get plan() { return plan; }, OPS, CITY };
});
