// Jobs: Swiggy and Zomato food delivery, BayCart parcel delivery, auto taxi, cab, truck, bus and dabbawala,
// through the job agent (5% cut) or freelance.
// Also the RTO office: licences with a short road-rules quiz. Licences only matter for jobs:
// each job needs the licence for the vehicle it uses. Every job has a countdown worked out from the
// real road distance, the vehicle's speed and the time the job takes at each stop.
window.BBFeatures.push(function (bb) {
  const W = bb.WORLD, P = () => bb.P;
  const JOBS = {
    delivery: { name: 'Swiggy delivery partner', kind: 'food', app: 'Swiggy', bag: '#fc8019', veh: ['cycle', 'bike', 'sportsbike', 'scooter'], unlock: 'Cycle: no licence · motorbike or scooter: two-wheeler licence', rate: .32, base: 30, icon: '🧡', desc: 'Restaurant orders on the Swiggy app · streak bonus every 3rd order' },
    zomato: { name: 'Zomato delivery partner', kind: 'food', app: 'Zomato', bag: '#e23744', veh: ['cycle', 'bike', 'sportsbike', 'scooter'], unlock: 'Cycle: no licence · motorbike or scooter: two-wheeler licence', rate: .34, base: 26, icon: '❤️', desc: 'Restaurant orders on the Zomato app · customers often tip' },
    baycart: { name: 'BayCart delivery agent', kind: 'parcel', app: 'BayCart', bag: '#2a62c9', veh: ['cycle', 'bike', 'sportsbike', 'auto', 'car', 'sedan', 'suv'], unlock: 'Licence for the vehicle you use', rate: .2, base: 20, icon: '📦', desc: 'Pick up 3 parcels at the BayCart hub and deliver them around town' },
    auto: { name: 'Auto taxi', veh: ['auto', 'erickshaw'], unlock: 'Auto rickshaw licence', rate: .3, icon: '🛺', desc: 'Short city rides' },
    cab: { name: 'Cab (app style)', veh: ['car', 'sedan', 'taxi', 'suv', 'mpv'], unlock: 'Car licence (LMV) and 3.5★ in any job', rate: .45, icon: '🚕', desc: 'Better fares, pickier riders' },
    truck: { name: 'Truck delivery', veh: ['truck', 'lorry'], unlock: 'Heavy vehicle licence', rate: .2, icon: '🚚', desc: 'City to city cargo, company truck' },
    bus: { name: 'Bus driver', veh: ['bus'], unlock: 'Heavy vehicle licence', rate: 0, icon: '🚌', desc: 'Fixed route and stops, company bus' },
    driver: { name: 'Car delivery driver', veh: ['sedan', 'car', 'suv'], unlock: 'Car licence (LMV)', rate: .3, base: 60, icon: '🚘', desc: "Drive a customer's car to another city · bhatta and the train fare home", company: 'sedan' },
    dabba: { name: 'Dabbawala', veh: ['cycle', 'foot'], unlock: 'No licence needed', rate: .35, icon: '🥡', desc: 'Home tiffin to office, by noon, on cycle or local train' }
  };
  let J = null; let freelance = false; let streak = 0;
  bb.TIMERS.source(() => J && J.timer > 0 ? [{ icon: J.t === 'bus' ? '🚌' : JOBS[J.t].kind === 'food' ? '🛵' : '📦', label: J.stage === 'pickup' ? 'Pick up' : J.t === 'bus' ? 'Route' : 'Deliver', left: J.timer }] : []);
  // Delivery bag in the app's colour on the back of your vehicle while you carry an order.
  // Beta v1.01.22: on a cycle, scooter or motorbike (and on foot to the door) you wear the insulated bag on your back from the
  // moment you take the order; in a car or auto the box rides in the back. It follows you if you change vehicle.
  let bagMesh = null, bagAt = null;
  function makeBag(col, back) { const T = bb.THREE, g = new T.Group(), w = back ? .46 : .55, h = back ? .48 : .5, d = back ? .36 : .5;
    const box = new T.Mesh(new T.BoxGeometry(w, h, d), bb.LMat(col)); box.castShadow = true; g.add(box);
    const band = new T.Mesh(new T.BoxGeometry(w + .01, .07, d + .01), bb.LMat('#f6f3ec')); band.position.y = h * .18; g.add(band);
    const lid = new T.Mesh(new T.BoxGeometry(w + .02, .04, d + .02), bb.LMat('#2a2a2e')); lid.position.y = h / 2; g.add(lid);
    if (back) for (const sx of [-.12, .12]) { const st = new T.Mesh(new T.BoxGeometry(.05, .5, .03), bb.LMat('#2a2a2e')); st.position.set(sx, .02, d / 2 + .03); g.add(st); }
    return g; }
  function bagSync() { const pl = bb.player, job = J && JOBS[J.t] && JOBS[J.t].bag ? JOBS[J.t] : null; let want = null, back = false;
    if (job) { const v = pl.mode === 'drive' ? pl.veh : null; if (v && !(v.spec.two || v.spec.pedal)) want = v.m; else { want = bb.avatar; back = true; } }
    if (want === bagAt && (!want || (bagMesh && bagMesh.parent === want))) return;
    if (bagMesh && bagMesh.parent) bagMesh.parent.remove(bagMesh); bagMesh = null; bagAt = want; if (!want) return;
    const g = makeBag(job.bag, back); if (back) g.position.set(0, 1.22, -.31); else { const sp = pl.veh.spec; g.position.set(0, 1.2, -(sp.len / 2) + .4); } want.add(g); bagMesh = g; }
  function bag() { bagSync(); } setInterval(bagSync, 400);
  let nextOfferT = 0; let hail = null;
  const rating = t => (P().ratings[t] != null ? P().ratings[t] : 3);
  const bestRating = () => Math.max(3, ...Object.values(P().ratings || { a: 3 }));
  // Licence each vehicle needs for paid work. Cycles, cycle rickshaws and walking need none.
  const VLIC = { bike: 'two', sportsbike: 'two', scooter: 'two', auto: 'three', erickshaw: 'three', taxi: 'lmv', skycar: 'lmv', car: 'lmv', sedan: 'lmv', suv: 'lmv', sports: 'lmv', mpv: 'lmv', van: 'lmv', coupe: 'lmv', convertible: 'lmv', limo: 'lmv', ambulance: 'lmv', camper: 'lmv', pickup: 'lmv', police: 'lmv', tractor: 'lmv', truck: 'heavy', bus: 'heavy', lorry: 'heavy', tanker: 'heavy', towtruck: 'heavy', firetruck: 'heavy' };
  const hasLic = type => !VLIC[type] || !!P().lic[VLIC[type]];
  function unlocked(t) { const p = P(); if (t === 'cab') return p.lic.lmv && bestRating() >= 3.5; if (t === 'truck' || t === 'bus') return p.lic.heavy; if (t === 'driver') return !!p.lic.lmv; if (t === 'auto') return !!p.lic.three; return true; }
  function needVeh(t) { const v = bb.player.mode === 'drive' ? bb.player.veh : null; const ok = JOBS[t].veh; if (ok.includes('foot') && bb.player.mode === 'foot') return true; return v && ok.includes(v.type) && hasLic(v.type); }
  const licName = type => LIC[VLIC[type]] ? LIC[VLIC[type]].name : '';
  function vehProblem(t) { const v = bb.player.mode === 'drive' ? bb.player.veh : null; if (v && JOBS[t].veh.includes(v.type) && !hasLic(v.type)) return `A ${v.spec.label.toLowerCase()} needs a ${licName(v.type)} for this job · get it at an RTO office`; return null; }
  function zoneHere() { const p = bb.ppos(); return bb.zoneAt(p.x, p.z, 120) || W.zones.find(z => z.id === 'mumbai'); }
  function spotIn(z, avoid) { for (let k = 0; k < 30; k++) { const i = Math.floor(Math.random() * z.nx), j = Math.floor(Math.random() * z.nz); const bx = z.x0 + i * 80 + 40, bz = z.z0 + j * 80 + 40; const side = bb.mpick(['n', 's', 'e', 'w']); const [x, zz] = bb.edgePos(bx, bz, side, bb.MR(-20, 20), 33);
      if (!bb.drivable(x, zz) || bb.isWater(bx, bz)) continue; if (avoid && Math.hypot(x - avoid.x, zz - avoid.z) < Math.min(300, z.nx * 40)) continue; return { x, z: zz }; } return { x: z.x0 + 40, z: z.z0 - 8 }; }
  const PLACE = ['Main market', 'Station road', 'Old bazaar', 'College gate', 'Hospital chowk', 'Temple lane', 'Bus depot', 'Tech park', 'Housing society', 'Cinema hall', 'Circle', 'Ghat road'];
  const nameAt = (z) => `${bb.mpick(PLACE)}, ${z.name}`;
  function payFor(dist, t, x, z) { const r = rating(t); return Math.round(((JOBS[t].base || 26) + dist * JOBS[t].rate) * (0.8 + 0.1 * r) * bb.fareMultAt(x, z)); }
  /* countdown timers: road distance ÷ the job vehicle's speed, plus time at each stop */
  const PACE = { delivery: .42, zomato: .42, baycart: .42, auto: .42, cab: .42, truck: .5, bus: .4, dabba: .5 };
  const STOPS = { delivery: 15, zomato: 15, baycart: 20, auto: 12, cab: 12, truck: 30, bus: 6, dabba: 15 };
  function jobSpeed(t) { const v = bb.player.mode === 'drive' ? bb.player.veh : null; let type = v && JOBS[t].veh.includes(v.type) ? v.type : JOBS[t].veh.find(q => q !== 'foot') || 'cycle';
    if (t === 'dabba' && !v) return 3.4; const sp = bb.SPEC[type]; return Math.max(3.4, (sp ? sp.max : 10) * (PACE[t] || .42)); }
  function roadLen(ax, az, bx, bz) { const R = bb.findRoute(ax, az, bx, bz); if (!R) return Math.hypot(bx - ax, bz - az) * 1.4; let L = 0; for (let i = 0; i < R.length - 1; i++) L += Math.hypot(R[i + 1][0] - R[i][0], R[i + 1][1] - R[i][1]); return L; }
  function legTime(t, ax, az, bx, bz) { const L = roadLen(ax, az, bx, bz); return { L, secs: Math.round(L / jobSpeed(t) * 1.3 + (STOPS[t] || 12) + 10) }; }
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function newJob(t, kind) { if (t === 'truck' && !kind) kind = Math.random() < .3 ? 'state' : 'inter'; if (kind && kind !== 'city' || (t === 'bus')) { const j = makeRoute(t, kind || 'city'); if (j) return showOffer(j); }
    const z = zoneHere(); const pp = bb.ppos(); let from, to, timer, pay, extra = {};
    if (JOBS[t].kind === 'food') { const rest = bb.pois.filter(p => p.type === 'food' && p.zone === z).sort((a, b) => Math.hypot(a.x - pp.x, a.z - pp.z) - Math.hypot(b.x - pp.x, b.z - pp.z)); const r = rest[Math.floor(Math.random() * Math.min(3, rest.length))] || { x: pp.x + 40, z: pp.z, name: 'Restaurant' };
      from = { x: r.x, z: r.z, name: r.name }; const d = spotIn(z, from); to = Object.assign(d, { name: nameAt(z) }); }
    else if (t === 'baycart') { from = Object.assign(spotIn(z), { name: `BayCart hub, ${z.name}` }); const drops = []; let last = from; for (let i = 0; i < 3; i++) { const q = spotIn(z, last); drops.push(Object.assign(q, { name: `Parcel ${i + 1} of 3 · ${bb.mpick(PLACE)}` })); last = q; } extra.drops = drops; extra.i = 0; to = drops[0]; }
    else if (t === 'truck') { const big = W.zones.filter(q => q.size !== 'small' && q.id !== z.id); const dz = bb.mpick(big); from = Object.assign(spotIn(z), { name: `${z.name} goods depot` }); to = Object.assign(spotIn(dz), { name: `${dz.name} warehouse` }); }
    else if (t === 'bus') { const stops = []; let last = pp; for (let i = 0; i < 5; i++) { const s = spotIn(z, last); stops.push(Object.assign(s, { name: `Stop ${i + 1} · ${bb.mpick(PLACE)}` })); last = s; } extra.stops = stops; extra.i = 0; from = stops[0]; to = stops[stops.length - 1]; }
    else if (t === 'dabba') { from = Object.assign(spotIn(z), { name: `Home tiffin · ${bb.mpick(['Sharma', 'Patil', 'Desai', 'Iyer', 'Khan', 'Shah'])} family` }); const mum = W.zones.find(q => q.id === 'mumbai'); const off = z.id === 'mumbai' ? bb.mpick([{ x: 2980, z: 8752, name: 'CSMT offices' }, { x: 2820, z: 8292, name: 'BKC office tower' }, { x: 2900, z: 8836, name: 'Churchgate offices' }]) : Object.assign(spotIn(z, from), { name: `Office block, ${z.name}` }); to = off; }
    else { const p0 = hail ? hail : Object.assign(spotIn(z), { name: nameAt(z) }); from = p0; let dz = z; if (Math.random() < .25) { const near = W.zones.filter(q => q !== z && Math.hypot(q.x0 - z.x0, q.z0 - z.z0) < 2400); if (near.length) dz = bb.mpick(near); } to = Object.assign(spotIn(dz, from), { name: nameAt(dz) }); }
    const dist = Math.hypot(to.x - from.x, to.z - from.z);
    if (t === 'bus') { let sx = pp.x, sz = pp.z; timer = 0; for (const st of extra.stops) { timer += legTime(t, sx, sz, st.x, st.z).secs; sx = st.x; sz = st.z; } }
    else timer = legTime(t, pp.x, pp.z, from.x, from.z).secs;
    pay = t === 'bus' ? 0 : t === 'baycart' ? payFor(dist * 2.4, t, from.x, from.z) : payFor(dist, t, from.x, from.z);
    const job = { t, stage: t === 'bus' ? 'route' : 'pickup', from, to, timer, total: timer, pay, dist, crashes: 0, agent: !freelance, extra, started: performance.now() };
    showOffer(job); }
  /* ---------- Beta v2.02.00: long routes ----------
     Bus, truck, cab, courier and auto jobs can be city, intercity or interstate. A route is a real road route; bus stops
     are placed in order along it (the depot, the towns the road passes through, the destination), so you never drive back
     and forth. Longer trips pay much more: a wage by distance, a daily allowance (bhatta) out of town, and bus fares by
     how far the passengers ride. Tolls on company vehicles go on the company FASTag. */
  const ROUTED = { driver: ['inter', 'state'], bus: ['city', 'inter', 'state'], truck: ['inter', 'state'], cab: ['city', 'inter'], baycart: ['city', 'inter'], auto: ['city', 'near'] };
  const KL = { city: 'City', near: 'Nearby town', inter: 'Intercity', state: 'Interstate' }, KMULT = { city: 1, near: 1.3, inter: 1.6, state: 2 }, BHATTA = { city: 0, near: 0, inter: 250, state: 700 };
  const zc = q => ({ x: q.x0 + q.nx * 40, z: q.z0 + q.nz * 40 });
  const zd = (a, b) => { const p = zc(a), q = zc(b); return Math.hypot(p.x - q.x, p.z - q.z); };
  function destZone(z, kind) { const all = W.zones.filter(q => q !== z && !!q.island === !!z.island);
    let c = kind === 'near' ? all.filter(q => zd(z, q) > 250 && zd(z, q) < 1300)
      : kind === 'inter' ? all.filter(q => q.st === z.st && zd(z, q) > 500 && zd(z, q) < 3400)
      : all.filter(q => q.st !== z.st && q.size !== 'small' && zd(z, q) > 1200 && zd(z, q) < 7000);
    if (kind === 'inter' && c.length < 2) c = all.filter(q => zd(z, q) > 500 && zd(z, q) < 3000);
    if (!c.length) c = all.slice().sort((a, b) => zd(z, a) - zd(z, b)).slice(0, 6);
    return bb.mpick(c); }
  const bigSpot = (z, from) => { const ok = q => q && bb.drivable(q.x, q.z); let s = null; for (let k = 0; k < 6 && !ok(s); k++) s = spotIn(z, from); return s; };
  function routePts(a, b) { const R = bb.findRoute(a.x, a.z, b.x, b.z); if (!R || !R.length) return null; const pts = [[a.x, a.z]].concat(R, [[b.x, b.z]]); let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(L); } return { pts, cum, L }; }
  function at(r, s) { let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], u = (s - r.cum[i - 1]) / ((r.cum[i] - r.cum[i - 1]) || 1); return { x: a[0] + (b[0] - a[0]) * Math.min(1, Math.max(0, u)), z: a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, u)) }; }
  // the towns a route passes through, in order, as stops
  function townsAlong(r, z0, z1, max) { const out = []; let last = -1e9, seen = new Set([z0 && z0.id, z1 && z1.id]);
    for (let s = 60; s < r.L - 150; s += 25) { const p = at(r, s); const q = bb.zoneAt(p.x, p.z, 0); if (!q || seen.has(q.id) || s - last < 220) continue; seen.add(q.id); last = s; out.push(Object.assign(p, { s, name: `${q.name} bus stand`, town: q })); }
    if (out.length > max) { const keep = []; for (let k = 0; k < max; k++) keep.push(out[Math.round(k * (out.length - 1) / Math.max(1, max - 1))]); return keep; } return out; }
  const DHABA = ['Highway dhaba', 'Toll plaza bus bay', 'Petrol pump stop', 'Village chowk', 'Bypass junction', 'Railway crossing stop'];
  function makeRoute(t, kind) { const z = zoneHere(); const pp = bb.ppos(); let from, to, extra = { kind }, pay, dist, wage = 0;
    if (t === 'bus' && kind === 'city') { // a city line: one end of the city to the other, stops in order along the road
      const long = z.nx >= z.nz; let a = null, b = null;
      for (let k = 0; k < 8 && (!a || !b); k++) { const i0 = long ? 0 : Math.floor(Math.random() * z.nx), j0 = long ? Math.floor(Math.random() * z.nz) : 0, i1 = long ? z.nx - 1 : Math.floor(Math.random() * z.nx), j1 = long ? Math.floor(Math.random() * z.nz) : z.nz - 1;
        const [ax, az] = bb.edgePos(z.x0 + i0 * 80 + 40, z.z0 + j0 * 80 + 40, long ? 'w' : 'n', bb.MR(-15, 15), 33), [bx, bz] = bb.edgePos(z.x0 + i1 * 80 + 40, z.z0 + j1 * 80 + 40, long ? 'e' : 's', bb.MR(-15, 15), 33);
        if (bb.drivable(ax, az) && bb.drivable(bx, bz)) { a = { x: ax, z: az }; b = { x: bx, z: bz }; } }
      if (!a) { a = spotIn(z); b = spotIn(z, a); } if (Math.random() < .5) [a, b] = [b, a];
      const r = routePts(a, b); if (!r) return null; const n = Math.max(4, Math.min(8, Math.round(r.L / 200) + 1)); const stops = [];
      for (let k = 0; k < n; k++) { const p = at(r, r.L * k / (n - 1)); stops.push(Object.assign(p, { s: r.L * k / (n - 1), name: k === 0 ? `${z.name} bus depot` : k === n - 1 ? `${bb.mpick(['Bus terminus', 'Last stop', 'Depot'])}, ${z.name}` : `${PLACE[(k * 5 + Math.floor(Math.random() * 3)) % PLACE.length]}, ${z.name}` })); }
      extra.stops = stops; extra.L = r.L; from = stops[0]; to = stops[n - 1]; dist = r.L; wage = Math.round(r.L * .3 * bb.fareMultAt(from.x, from.z)); }
    else { const dz = kind === 'city' ? z : destZone(z, kind); if (!dz) return null; from = bigSpot(z); to = kind === 'city' ? spotIn(z, from) : bigSpot(dz, null); if (!from || !to) return null;
      const r = routePts(from, to); if (!r) return null; dist = r.L; extra.dest = dz;
      if (t === 'bus') { const towns = townsAlong(r, z, dz, kind === 'state' ? 7 : 5); const stops = [Object.assign(from, { s: 0, name: `${z.name} bus stand` })].concat(towns);
        if (stops.length < 3) for (const f of [.35, .65]) { const p = at(r, r.L * f); stops.push(Object.assign(p, { s: r.L * f, name: `${bb.mpick(DHABA)} · ${(r.L * f * 2.4 / 1000).toFixed(0)} km` })); }
        stops.sort((a, b) => a.s - b.s); stops.push(Object.assign(to, { s: r.L, name: `${dz.name} bus stand` })); extra.stops = stops; extra.L = r.L;
        wage = Math.round(r.L * (kind === 'state' ? .32 : .28) * bb.fareMultAt(from.x, from.z)) + BHATTA[kind]; }
      else if (t === 'baycart' && kind === 'inter') { const towns = townsAlong(r, z, null, 2); const drops = towns.map((q, k) => Object.assign(q, { name: `Parcel ${k + 1} · ${q.town.name}` })); drops.push(Object.assign(to, { name: `Parcel ${drops.length + 1} · ${dz.name} warehouse` }));
        drops.forEach(q => q.name = q.name.replace(/Parcel (\d+)/, (m, n) => `Parcel ${n} of ${drops.length}`)); extra.drops = drops; extra.i = 0; Object.assign(from, { name: `BayCart hub, ${z.name}` }); to = drops[0]; }
      else { from.name = t === 'driver' ? "Customer's car" : t === 'truck' ? `${z.name} goods depot` : t === 'cab' || t === 'auto' ? `${bb.mpick(PLACE)}, ${z.name}` : `BayCart hub, ${z.name}`; to.name = t === 'driver' ? `Customer's home, ${dz.name}` : t === 'truck' ? `${dz.name} warehouse` : t === 'baycart' ? `${bb.mpick(PLACE)}, ${dz.name}` : `${bb.mpick(PLACE)}, ${dz.name}`; } }
    if (t !== 'bus') pay = (t === 'driver' ? Math.round(bb.price(150 + dist * 2.4 / 1000 * 4)) : 0) + Math.round(payFor(dist * (t === 'baycart' ? (kind === 'city' ? 2.4 : 1.4) : 1), t, from.x, from.z) * KMULT[kind] + BHATTA[kind]);
    else pay = wage;
    let timer = 0; if (t === 'bus') { let sx = pp.x, sz = pp.z; for (const st of extra.stops) { timer += legTime(t, sx, sz, st.x, st.z).secs; sx = st.x; sz = st.z; } } else timer = legTime(t, pp.x, pp.z, from.x, from.z).secs;
    if (t === 'bus') extra.i = 0; extra.wage = wage;
    return { t, kind, stage: t === 'bus' ? 'route' : 'pickup', from, to, timer, total: timer, pay, dist, crashes: 0, agent: !freelance, extra, started: performance.now() }; }
  const kmS = m => (m * 2.4 / 1000).toFixed(m * 2.4 < 10000 ? 1 : 0) + ' km';
  function routeSheet(t) { const j = JOBS[t]; const kinds = ROUTED[t]; const opts = [];
    for (const k of kinds) for (let n = 0; n < (kinds.length === 2 ? 2 : 1) + (k === 'city' ? 0 : 1); n++) { const job = makeRoute(t, k); if (job && !opts.some(o => o.to.name === job.to.name)) opts.push(job); }
    if (!opts.length) return newJob(t);
    const row = (o, i) => { const st = o.extra.stops ? `${o.extra.stops.length} stops · ` : o.extra.drops ? `${o.extra.drops.length} drops · ` : ''; const dest = o.t === 'bus' ? o.extra.stops[o.extra.stops.length - 1].name : o.to.name;
      return bb.rowHtml('r' + i, `${KL[o.kind]} · ${bb.esc(dest)}`, `${st}${kmS(o.extra.L || o.dist)} · about ${fmt(o.timer)}${o.kind === 'state' && o.extra.dest ? ' · to ' + bb.esc((W.states || {})[o.extra.dest.st] || o.extra.dest.st) : ''}${BHATTA[o.kind] ? ' · includes ' + bb.inr(BHATTA[o.kind]) + ' bhatta' : ''}`, (o.t === 'bus' ? bb.inr(o.pay) + ' + fares' : bb.inr(o.pay))); };
    bb.openSheet(`${j.icon} ${j.name}`, 'Pick a route · longer trips pay more', opts.map(row).join('') + `<p class="note">${t === 'bus' ? 'Stops are in order along the road, from the depot to the last stop. Stop at each one (slow down inside the orange ring) to pick up passengers; fares go by how far they ride.' : 'Out-of-town trips pay a daily allowance (bhatta) on top. Tolls on the company vehicle are paid by the company.'}</p>`,
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id || id[0] !== 'r') return; const o = opts[+id.slice(1)]; bb.closeSheet(); if (J) return; offer = { job: o, left: 20 }; acceptOffer(); }); }
  // Every job is offered first: accept it or decline it. Declining or missing an offer costs nothing.
  let offer = null; const offerEl = document.createElement('div'); offerEl.id = 'offer'; offerEl.className = 'pill'; offerEl.hidden = true; document.body.appendChild(offerEl);
  function showOffer(job) { offer = { job, left: 20 }; const j = JOBS[job.t]; const pp = bb.ppos(); const toPick = Math.hypot(job.from.x - pp.x, job.from.z - pp.z);
    const km = m => (m * 2.4 / 1000).toFixed(1) + ' km';
    offerEl.innerHTML = `<div class="ok"><b>${j.icon} ${bb.esc(j.app ? j.app + ' order' : j.name)}</b><span>${bb.inr(job.pay)}${job.t === 'bus' ? ' + fares' : ''}</span></div>
      <div class="od">${job.kind ? `${KL[job.kind]} · ` : ''}${job.t === 'bus' ? `${bb.esc(job.extra.stops[0].name)} → ${bb.esc(job.extra.stops[job.extra.stops.length - 1].name)} · ${job.extra.stops.length} stops · ${kmS(job.extra.L || job.dist)} · ${fmt(job.timer)}` : `Pick up: ${bb.esc(job.from.name)} · ${km(toPick)} away<br>Drop: ${bb.esc(job.to.name)}${job.t === 'baycart' ? ' + 2 more' : ''} · trip ${km(job.dist)}`}</div>
      <div class="obtn"><button class="go" data-of="y">Accept <kbd>Y</kbd></button><button class="buy ghost" data-of="n">Decline <kbd>X</kbd></button><i id="ofbar"></i></div>`;
    offerEl.hidden = false; bb.hornSfx && bb.hornSfx(); }
  function acceptOffer() { if (!offer) return; const job = offer.job; offer = null; offerEl.hidden = true; if (J) return; J = job; const pp = bb.ppos();
    if (J.t !== 'bus') { J.timer = legTime(J.t, pp.x, pp.z, J.from.x, J.from.z).secs; J.total = J.timer; }
    if (J.t === 'truck' || J.t === 'bus' || JOBS[J.t].company) companyVehicle(J.t);
    if (J.t === 'driver' && J.company) { J.from = { x: J.company.pos.x, z: J.company.pos.z, name: "Customer's car (parked next to you)" }; J.timer = 90; J.total = 90; }
    bb.toast(`${JOBS[J.t].name}: ${J.stage === 'route' ? 'drive your route · ' + fmt(J.timer) + ' for all stops' : 'pick up at ' + J.from.name + ' · ' + fmt(J.timer)}`, '#ffc93c'); bb.emit('jobStart', J); }
  function declineOffer(missed) { if (!offer) return; offer = null; offerEl.hidden = true; hail = null; nextOfferT = bb.MR(10, 25); bb.toast(missed ? 'Offer missed · no effect on your rating' : 'Offer declined · no effect on your rating', '#d6c8e4'); }
  offerEl.addEventListener('click', e => { const b = e.target.closest('[data-of]'); if (!b) return; if (b.dataset.of === 'y') acceptOffer(); else declineOffer(false); });
  bb.onKey('KeyY', () => acceptOffer()); bb.onKey('KeyX', () => declineOffer(false));
  bb.onUpdate(dt => { if (!offer) return; offer.left -= dt; const bar = offerEl.querySelector('#ofbar'); if (bar) bar.style.width = Math.max(0, offer.left / 20 * 100) + '%'; if (offer.left <= 0) declineOffer(true); });
  function companyVehicle(t) { const vt = JOBS[t].company || t; const v0 = bb.player.veh; if (v0 && v0.type === vt) return; const pp = bb.ppos(); const r = bb.nearestRoadPoint(pp.x, pp.z, 300); if (!r) return; const e = r.e; const nx = e.dz, nz = -e.dx;
    const v = bb.makeVeh(vt, r.x + nx * (e.w / 2 + 2.4), r.z + nz * (e.w / 2 + 2.4), Math.atan2(e.dx, e.dz), 'parked', { fuel: 100, company: true }); J.company = v; bb.toast(t === 'driver' ? "The customer's car is parked on the road next to you · keys are in it" : `Your company ${bb.SPEC[vt].label.toLowerCase()} is parked on the road nearby`, '#ffc93c'); }
  function finish(ok, why) { const t = J.t; const p = P(); let r = rating(t); if (ok) r = Math.min(5, r + (J.crashes ? .05 : .15)); else r = Math.max(1, r - .15); p.ratings[t] = Math.round(r * 100) / 100;
    bag(false); if (ok) { let pay = J.pay; const bonus = J.late ? 0 : Math.max(0, Math.round(J.timer * 1.5)); pay += bonus; let extraNote = '';
      if (t === 'delivery') { streak++; if (streak % 3 === 0) { const sb = bb.price(40); pay += sb; extraNote = ` · Swiggy streak bonus ${bb.inr(sb)}`; } } else if (t !== 'zomato') streak = 0;
      if (t === 'zomato' && Math.random() < .45) { const tip = bb.price(10 + Math.floor(Math.random() * 5) * 10); pay += tip; extraNote = ` · customer tipped ${bb.inr(tip)}`; } if (J.agent) pay = Math.round(pay * .95); bb.earn(pay, 'job'); p.trips++; p.stats.trips++; p.jobs[t] = (p.jobs[t] || 0) + 1;
      bb.toast(`+${bb.inr(pay)}${J.agent ? ' · agent kept 5%' : ''}${extraNote}<br><span style="font-size:15px;font-weight:600">${JOBS[t].name} · rating ${r.toFixed(1)}★</span>`, '#3ddc97'); bb.emit('job', { type: t, pay, agent: J.agent }); }
    else bb.toast(`${why} · rating ${r.toFixed(1)}★`, '#ff5d73');
    if (J.company && t === 'driver' && bb.player.veh === J.company) bb.exitVehicle(true);
    if (J.company && bb.player.veh !== J.company) bb.removeVeh(J.company); const t2 = t, comp = J.company, J0kind = J.kind; J = null; hail = null; bb.setDirty();
    const k2 = J0kind; if (ok && !freelance) setTimeout(() => { if (!J && !offer && bb.started && !bb.inside) newJob(t2, k2); }, 2500); else nextOfferT = bb.MR(15, 40); }
  bb.on('crash', () => { if (J) J.crashes++; });
  bb.on('travel', () => { if (J) { if (J.company) bb.removeVeh(J.company); J = null; hail = null; bb.toast('You left town · current job cancelled', '#d6c8e4'); } });
  bb.onUpdate(dt => {
    if (!J) { if (offer) return; if (freelance && JOBS[freelanceType] && !bb.inside && needVeh(freelanceType)) { nextOfferT -= dt; if (nextOfferT <= 0 && !hail) { const z = zoneHere(); if (['auto', 'cab'].includes(freelanceType)) { hail = Object.assign(spotIn(z), { name: 'Waving customer' }); } else { newJob(freelanceType); } } }
      if (hail) { const pp = bb.ppos(); const v = bb.player.veh; if (v && Math.hypot(pp.x - hail.x, pp.z - hail.z) < 9 && Math.abs(v.v) < 4) newJob(freelanceType); } return; }
    J.timer -= dt; const pp = bb.ppos(); const v = bb.player.veh; const slow = !v || Math.abs(v.v) < 6;
    if (J.timer <= 0 && J.t !== 'bus') return finish(false, J.stage === 'pickup' ? (JOBS[J.t].kind === 'food' ? 'Too late · the restaurant gave the order to another rider' : J.t === 'baycart' ? 'Too late · the hub gave the parcels to another agent' : J.t === 'truck' ? 'Too late · the depot sent another truck' : 'Too late · the customer cancelled') : JOBS[J.t].kind === 'food' ? 'Too late · the food went cold, order cancelled' : J.t === 'baycart' ? 'Too late · the customer returned the parcel' : J.t === 'dabba' ? 'Too late · lunch hour is over' : J.t === 'truck' ? 'Too late · the warehouse refused the cargo' : 'Too late · the rider got out and left');
    if (J.t === 'bus' && J.timer <= 0 && !J.late) { J.late = true; bb.toast('Bus running late · no on-time bonus', '#ff9f1c'); }
    if (J.t === 'bus') { const s = J.extra.stops[J.extra.i]; if (needVeh('bus') && Math.hypot(pp.x - s.x, pp.z - s.z) < 9 && slow) { J.extra.dwell = (J.extra.dwell || 0) + dt; if (J.extra.dwell > 2.5) { J.extra.dwell = 0; const last = J.extra.i >= J.extra.stops.length - 1; const rem = Math.max(0, ((J.extra.L || 0) - (s.s || 0)) * 2.4 / 1000); const pax = last ? 0 : Math.floor(bb.MR(3, J.kind === 'city' ? 12 : 18)); const fare = last ? 0 : Math.round(pax * (12 + rem * (J.kind === 'city' ? 4 : 6)) * bb.fareMultAt(pp.x, pp.z)); J.pay += fare; bb.toast(last ? `${s.name} · everyone gets off · route done` : `${s.name} · ${pax} passengers board · +${bb.inr(fare)} fares`, '#3ddc97'); J.extra.i++; if (J.extra.i >= J.extra.stops.length) { J.timer = Math.max(0, J.timer); finish(true); } } } return; }
    const tg = J.stage === 'pickup' ? J.from : J.to; const d = Math.hypot(pp.x - tg.x, pp.z - tg.z);
    if (d < (J.t === 'truck' ? 12 : 8) && slow && needVeh(J.t)) { if (J.stage === 'pickup') { J.stage = 'drop'; if (J.t === 'baycart') { let sx = J.from.x, sz = J.from.z, tot = 0; for (const q of J.extra.drops) { tot += legTime(J.t, sx, sz, q.x, q.z).secs; sx = q.x; sz = q.z; } J.timer = tot; } else J.timer = legTime(J.t, J.from.x, J.from.z, J.to.x, J.to.z).secs; J.total = J.timer; bag(true); if (v && v.m.userData.pax) v.m.userData.pax.visible = true; bb.toast((J.t === 'baycart' ? '3 parcels loaded · deliver them in order' : JOBS[J.t].kind === 'food' ? `${JOBS[J.t].app} order picked up · deliver it hot` : J.t === 'truck' ? 'Cargo loaded · drive safe' : J.t === 'driver' ? "Customer's car · drive it gently, every scratch counts" : J.t === 'dabba' ? 'Dabba collected · office by noon' : 'Sawari on board · chalo!') + ` · ${fmt(J.timer)} to drop`, '#ffc93c'); bb.hornSfx(); }
      else if (J.t === 'baycart' && J.extra.i < J.extra.drops.length - 1) { J.extra.i++; J.to = J.extra.drops[J.extra.i]; bb.toast(`Parcel delivered · ${J.extra.drops.length - J.extra.i} to go`, '#3ddc97'); bb.hornSfx(); }
      else { if (v && v.m.userData.pax) v.m.userData.pax.visible = false; finish(true); } } });
  let freelanceType = 'auto';
  // Countdown pill that stays on screen while a job runs.
  const pill = document.createElement('div'); pill.id = 'jobTimer'; pill.className = 'pill'; pill.hidden = true; const tc = document.querySelector('#topc'); if (tc) tc.appendChild(pill);
  let pillT = 0; bb.onUpdate(dt => { pillT -= dt; if (pillT > 0) return; pillT = .25; if (!J || bb.inside) { pill.hidden = true; return; } pill.hidden = false;
    const left = J.timer, frac = J.total ? Math.max(0, left / J.total) : 0; const late = J.t === 'bus' && J.late;
    pill.className = 'pill' + (late || left < 30 ? ' low' : left < J.total * .35 ? ' mid' : '');
    pill.innerHTML = `<span>${JOBS[J.t].icon} ${J.t === 'bus' ? 'Route' : J.stage === 'pickup' ? 'Pick up' : 'Drop'}</span><b>${late ? 'Late' : fmt(left)}</b><i style="width:${Math.round(frac * 100)}%"></i>`; });
  bb.addMission(() => { if (!J) { if (hail) return { pri: 40, k: `Freelance · ${JOBS[freelanceType].name}`, t: 'A customer is waving', m: 'Drive up and stop next to them', target: { x: hail.x, z: hail.z, col: 0x7fd858 } }; return null; }
    const pp = bb.ppos(); const tl = Math.max(0, Math.ceil(J.timer)); const tt = `${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, '0')}`;
    if (J.t === 'bus') { const s = J.extra.stops[J.extra.i]; return { pri: 50, k: `Bus route · stop ${J.extra.i + 1} of ${J.extra.stops.length}`, t: s.name, m: `${Math.round(Math.hypot(pp.x - s.x, pp.z - s.z) * 2.4 / 10) * 10} m · ${J.late ? 'late' : tt + ' to finish'} · earned ${bb.inr(J.pay)}`, target: { x: s.x, z: s.z, col: 0xffb347 } }; }
    const tg = J.stage === 'pickup' ? J.from : J.to; const need = needVeh(J.t) ? '' : vehProblem(J.t) ? ' · needs a licence for this vehicle' : ` · needs ${JOBS[J.t].veh.map(t => t === 'foot' ? 'on foot' : bb.SPEC[t].label).join(' or ')}`;
    return { pri: 50, cls: J.stage === 'drop' ? 'ride' : '', k: `${JOBS[J.t].name} · ${J.agent ? 'agent' : 'freelance'} · ${rating(J.t).toFixed(1)}★`, t: (J.stage === 'pickup' ? 'Pick up: ' : 'Drop: ') + tg.name, m: `${Math.round(Math.hypot(pp.x - tg.x, pp.z - tg.z) * 2.4 / 10) * 10} m · ${tt} to ${J.stage === 'pickup' ? 'pick up' : 'drop'} · ${bb.inr(J.pay)}${need}`, target: { x: tg.x, z: tg.z, col: J.stage === 'pickup' ? 0x3ddc97 : 0xff9f1c } }; });
  // Beta v1.01.25: jobs for the vehicle you are on come first; jobs you can't do yet are locked, with the way to unlock them
  const curVeh = () => bb.player.mode === 'drive' && bb.player.veh ? bb.player.veh : null;
  const fitsNow = id => { const v = curVeh(); return v ? JOBS[id].veh.includes(v.type) : JOBS[id].veh.includes('foot') || JOBS[id].veh.includes('cycle'); };
  function lockWhy(id) { if (unlocked(id)) { const vp = vehProblem(id); return vp ? `🔒 ${licName(curVeh().type)} needed for your ${curVeh().spec.label.toLowerCase()}` : ''; } return '🔒 Needs: ' + JOBS[id].unlock; }
  function nearestRto() { const pp = bb.ppos(); let b = null, bd = 1e12; for (const p of bb.pois) if (p.type === 'rto') { const d = Math.hypot(p.x - pp.x, p.z - pp.z); if (d < bd) { bd = d; b = p; } } return b; }
  function goRto() { const r = nearestRto(); if (!r) return bb.toast('No RTO office found', '#ff9f1c'); if (bb.TRAVEL) bb.TRAVEL.go(r.x, r.z, r.name); bb.toast(`🪪 Directions to ${r.name} · pass the test there to get your licence`, '#ffc93c'); }
  function jobsSheet() { const p = P(); const v = curVeh(); const ids = Object.keys(JOBS); const mine = ids.filter(fitsNow), rest = ids.filter(id => !fitsNow(id));
    const row = id => { const j = JOBS[id]; const lk = lockWhy(id); const r = rating(id); return bb.rowHtml(id, `${j.icon} ${j.name}`, `${j.desc} · ${lk ? lk : r.toFixed(1) + '★ · ' + (p.jobs[id] || 0) + ' done · ' + j.unlock}`, J && J.t === id ? 'Active' : lk ? '🔒 Unlock' : 'Start', lk ? 'ghost' : ''); };
    const head = t => `<h3 style="margin:12px 0 4px;font-size:14px">${t}</h3>`;
    const esc = bb.esc; const rows = (mine.length ? head(v ? `With your ${esc(v.spec.label.toLowerCase())}` : 'On foot or by cycle') + mine.map(row).join('') : '') + (rest.length ? head(mine.length ? 'Other jobs' : 'Jobs') + rest.map(row).join('') : '');
    bb.openSheet('Jobs', `${freelance ? 'Freelance · keep 100%, find your own customers' : 'Job agent · steady work, agent keeps 5%'}`, `<div class="chips"><button class="chip${freelance ? '' : ' on'}" data-mode="agent">Agent</button><button class="chip${freelance ? ' on' : ''}" data-mode="free">Freelance</button></div>${rows}${J ? bb.rowHtml('quit', 'Quit current job', 'Your rating drops a little', 'Quit', 'danger') : ''}<p class="note">Every job has a countdown worked out from the road distance and your vehicle. Finish early for a bonus. Licences come from RTO offices. Truck and bus jobs give you a company vehicle. Bus, truck, cab, courier and auto jobs can be city, intercity or interstate: the longer the trip, the more you earn.</p>`,
      s => s.onclick = e => { const m = e.target.dataset.mode; if (m) { freelance = m === 'free'; jobsSheet(); return; } const id = e.target.dataset.id; if (!id) return; if (id === 'quit') { finish(false, 'You quit the job'); bb.closeSheet(); return; }
        if (J) { bb.toast('Finish or quit your current job first', '#ff9f1c'); return; } if (!unlocked(id) || vehProblem(id)) { lockSheet(id); return; }
        if (!['truck', 'bus', 'driver'].includes(id) && !needVeh(id)) { bb.toast(`You need to be ${JOBS[id].veh.map(t => t === 'foot' ? 'on foot' : 'on a ' + bb.SPEC[t].label.toLowerCase()).join(' or ')}`, '#ff9f1c'); if (JOBS[id].kind === 'food' && bb.P.cash >= bb.cost('svc.cyclerent', 50)) { rentCycle(); } return; }
        if (!freelance && ROUTED[id]) return routeSheet(id); bb.closeSheet(); if (freelance) { freelanceType = id; nextOfferT = 3; bb.toast(id === 'auto' || id === 'cab' ? 'Freelance · look for waving customers' : JOBS[id].app ? `Online on ${JOBS[id].app} · orders will ping your phone` : 'Freelance · orders will ping your phone', '#ffc93c'); } else newJob(id); }); }
  function lockSheet(id) { const j = JOBS[id]; const vp = vehProblem(id); const needLic = vp || /licen/i.test(j.unlock) && !unlocked(id);
    bb.openSheet(`🔒 ${j.name}`, 'Locked for now', `<p class="note">${bb.esc(vp || 'Needs: ' + j.unlock)}</p>` + (needLic ? bb.rowHtml('rto', '🪪 Go to the nearest RTO office', 'Pass a short road-rules test there to get the licence', 'Directions') : '') + (id === 'cab' && P().lic.lmv ? bb.rowHtml('x', 'Raise your rating', 'Reach 3.5★ in any job first (deliveries or auto rides)', '') : '') + bb.rowHtml('back', 'Back to jobs', '', 'Back', 'ghost'),
      s => s.onclick = e => { const k = e.target.dataset.id; if (k === 'rto') goRto(); else if (k === 'back') jobsSheet(); }); }
  // when you get on a vehicle: which jobs it can do, or which licence you need for paid work on it
  const toldVeh = {}; bb.on('enterVehicle', v => { if (!v || J || v.company || v.rental || v.state === 'net') return; const now = Date.now(); if (toldVeh[v.type] && now - toldVeh[v.type] < 15 * 60 * 1000) return;
    const fit = Object.keys(JOBS).filter(id => JOBS[id].veh.includes(v.type)); const loc = bb.GIGVEH ? bb.GIGVEH.forVeh(v.type) : []; if (!fit.length && !loc.length) return; toldVeh[v.type] = now;
    setTimeout(() => { if (bb.player.veh !== v || !bb.notify) return; const lab = v.spec.label.toLowerCase();
      if (!hasLic(v.type)) bb.notify('🪪', `Licence needed for paid work`, `Your ${lab} needs a ${licName(v.type)} for jobs · tap for the nearest RTO`, () => goRto(), 'joblic');
      else bb.notify('💼', `Jobs for your ${lab}`, [...fit.map(id => JOBS[id].name), ...loc.slice(0, 2)].slice(0, 3).join(' · ') + ' · tap to see', () => jobsSheet(), 'jobveh'); }, 1500); });
  bb.JOBLIC = { VLIC, hasLic, licName, goRto, nearestRto };
  function rentCycle() { if (!bb.spend(bb.cost('svc.cyclerent', 50))) return; const pp = bb.ppos(); const r = bb.nearestRoadPoint(pp.x, pp.z, 200); if (!r) return; const e = r.e; const v = bb.makeVeh('cycle', r.x + e.dz * (e.w / 2 + 1), r.z - e.dx * (e.w / 2 + 1), Math.atan2(e.dx, e.dz), 'parked', { company: true }); bb.toast(`Rented a cycle for ${bb.inr(bb.cost('svc.cyclerent', 50))} · it is next to you`, '#3ddc97'); }
  bb.poiHandlers.jobs = () => jobsSheet();
  bb.addApp({ id: 'jobs', label: 'Jobs', icon: '💼', group: 'menu', fn: jobsSheet });
  // Beta v1.01.24: running low on money? A nudge towards quick jobs (once every few game hours at most)
  let lowAt = 0; setInterval(() => { if (!bb.started || J || bb.inside || (bb.CINE && bb.CINE.on)) return; const p = P(); if (p.cash + p.bank >= 300 || Date.now() - lowAt < 6 * 60 * 1000) return; lowAt = Date.now();
    const z = bb.zoneAt(bb.ppos().x, bb.ppos().z, 200); const tip = z && z.id === 'mumbai' ? 'Dabba delivery, BayTaxi or an auto' : 'Swiggy on a rented cycle (no licence), a taxi or an auto';
    if (bb.notify) bb.notify('💼', 'Low on money?', `Tap for quick jobs · ${tip}`, () => jobsSheet(), 'lowmoney'); else bb.toast(`💼 Low on money? Phone → Jobs · ${tip}`, '#ffc93c'); }, 20000);

  /* RTO: licences */
  const LIC = { two: { name: 'Two-wheeler licence (MCWG)', fee: 1500 }, three: { name: 'Auto rickshaw licence (3-wheeler)', fee: 1000 }, lmv: { name: 'Car licence (LMV)', fee: 2500 }, heavy: { name: 'Heavy vehicle licence', fee: 6000, need: 'lmv' } };
  const QUIZ = [['In India, vehicles keep to which side of the road?', ['Left', 'Right', 'Middle'], 0], ['What should you do at a red traffic light?', ['Stop', 'Slow down', 'Honk and go'], 0],
    ['Must the pillion rider on a motorbike wear a helmet?', ['Yes', 'Only on highways', 'No'], 0], ['What does PUC stand for?', ['Pollution Under Control', 'Public Utility Card', 'Permit Under Commerce'], 0],
    ['What is the minimum age for a car (LMV) licence?', ['18', '16', '21'], 0], ['An ambulance comes up behind you with its siren on. You should:', ['Move aside and let it pass', 'Speed up', 'Stop in the middle'], 0],
    ['Holding a phone while driving is:', ['Not allowed', 'Allowed at signals', 'Allowed on bikes'], 0], ['A zebra crossing is for:', ['Pedestrians', 'Cycles only', 'Parking'], 0],
    ['On Indian roads you should overtake from the:', ['Right', 'Left', 'Either side'], 0]];
  // Beta v1.01.28: the road-rules test gives you a learner's licence; then the driving test on the RTO track
  // (figure 8 for two- and three-wheelers, H track and parking for cars, S track and gradient for heavy vehicles).
  const learner = () => { const x = P().extra; return x.learner = x.learner || {}; };
  const TESTS = { two: 'figure 8', three: 'figure 8', lmv: 'H track + parking', heavy: 'S track + gradient' };
  function rtoSheet(poi) { const p = P(); const lr = learner(); bb.openSheet(poi.name, 'Road-rules test (3 questions), then a driving test on the track', Object.entries(LIC).map(([id, l]) => bb.rowHtml(id, l.name, p.lic[id] ? 'You have this licence' : l.need && !p.lic[l.need] ? 'Needs a car licence first' : lr[id] ? `Learner passed · driving test: ${TESTS[id]}` : `Rules test, then driving test: ${TESTS[id]}`, p.lic[id] ? 'Owned' : bb.inr(lr[id] ? bb.cost('lic.retest', 300) : bb.cost('lic.' + id, l.fee)), p.lic[id] ? 'ghost' : '')).join(''),
    s => s.onclick = e => { const id = e.target.dataset.id; if (!id || p.lic[id]) return; const l = LIC[id]; if (l.need && !p.lic[l.need]) { bb.toast('Get a car licence first', '#ff9f1c'); return; } if (learner()[id]) { if (!bb.spend(bb.cost('lic.retest', 300))) return; bb.closeSheet(); return drive(id); } if (!bb.spend(bb.cost('lic.' + id, l.fee))) return; quiz(poi, id, 0, QUIZ.slice().sort(() => Math.random() - .5).slice(0, 3)); }); }
  function issue(id) { P().lic[id] = true; delete learner()[id]; bb.save(); bb.toast(`Passed · ${LIC[id].name} issued 🪪`, '#3ddc97'); bb.emit('licence', id); }
  function drive(id) { if (!bb.DRIVETEST) return issue(id); bb.DRIVETEST.start(id, (ok, why) => { if (ok) issue(id); else { bb.setDirty(); bb.openSheet('Driving test failed', LIC[id].name, `<p class="note" style="font-size:14px">${bb.esc(why || 'Not this time')}.</p><p class="note">Your learner's licence is kept. Come back to any RTO office and retake the driving test for ${bb.inr(bb.cost('lic.retest', 300))}.</p>`); } }); }
  function quiz(poi, id, i, qs) { if (i >= qs.length) { learner()[id] = true; bb.save(); bb.closeSheet(); bb.toast(`Road-rules test passed · learner's licence · now the driving test`, '#3ddc97'); setTimeout(() => drive(id), 900); return; }
    const [q, opts, ans] = qs[i]; const order = opts.map((o, k) => k).sort(() => Math.random() - .5);
    bb.openSheet(`Question ${i + 1} of 3`, LIC[id].name, `<p style="font-size:16px;line-height:1.5;margin:0 0 10px">${bb.esc(q)}</p>${order.map(k => `<div class="row"><div class="nm">${bb.esc(opts[k])}</div><button class="buy ghost" data-a="${k}">Choose</button></div>`).join('')}`,
      s => s.onclick = e => { const a = e.target.dataset.a; if (a == null) return; if (+a === ans) quiz(poi, id, i + 1, qs); else { bb.closeSheet(); bb.toast('Wrong answer · test failed. Pay the fee and try again.', '#ff5d73'); } }); }
  bb.poiHandlers.rto = rtoSheet;
  bb.onStart(() => { const p = P(); if (!p.lic) p.lic = {}; if (p.lic.three == null) { p.lic.three = !!(p.lic.lmv || (p.jobs && p.jobs.auto)); bb.setDirty(); } });
  bb.JOBS = { JOBS, get current() { return J; }, rating, take(t) { if (J || !JOBS[t]) return false; newJob(t); acceptOffer(); return !!J; } };
});
