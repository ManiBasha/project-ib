// Elevated metro lines: a viaduct on pillars down the middle of the road between the metro stations of each
// metro city (Mumbai, Pune, Ahmedabad, Jaipur, Bengaluru, Kochi), elevated platforms with roofs and stairs,
// and a metro train running up and down the line. Rides themselves are in features/travel.js.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, W = bb.WORLD; const DECK = 11;
  const LINE = { mumbai: ['#1f6fd1', '#e8eef7'], pune: ['#e2231a', '#f4f4f4'], ahmedabad: ['#d81e5b', '#f4f4f4'], jaipur: ['#f08a24', '#f4f4f4'], bengaluru: ['#7a3d9a', '#f4f4f4'], kochi: ['#1aa39a', '#f4f4f4'], chennai: ['#1f6fd1', '#f4f4f4'], hyderabad: ['#d6262f', '#f4f4f4'],
    delhi: ['#f2b71f', '#f4f4f4'], gurugram: ['#2a62c9', '#f4f4f4'], noida: ['#1fb5b5', '#f4f4f4'], lucknow: ['#d6262f', '#f4f4f4'], kanpur: ['#e2231a', '#f4f4f4'], agra: ['#7a3d9a', '#f4f4f4'], meerut: ['#2f7d4a', '#f4f4f4'], indore: ['#ff8f1f', '#f4f4f4'], bhopal: ['#1f6fd1', '#f4f4f4'] };
  const kerb = bb.LMat('#d8d2c4'), grass = bb.LMat('#5f8f3e'), leaf = bb.LMat('#3f7a34'); const shrubG = new T.SphereGeometry(.7, 6, 4);
  const shrub = (x, z) => { const g = shrubG.clone(); g.scale(1, .8, 1); g.translate(x, .75, z); bb.addStatic(g, leaf); };
  const conc = bb.LMat('#c9c4bb'), concD = bb.LMat('#a9a39a'), rail = bb.LMat('#4a4a50'), roof = bb.LMat('#e6e1f2'), glass = new T.MeshLambertMaterial({ color: 0x9fd3e8, transparent: true, opacity: .55 });
  const box = (w, h, d, x, y, z, ry, m) => { const g = new T.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); bb.addStatic(g, m); };
  const cyl = (r, h, x, y, z, m) => { const g = new T.CylinderGeometry(r, r * 1.1, h, 10); g.translate(x, y, z); bb.addStatic(g, m); };
  const lines = [];
  const byZone = {}; for (const p of bb.pois) if (p.type === 'metro') { const z = String(p.extra).split(':')[0]; (byZone[z] = byZone[z] || []).push(p); }
  for (const [zid, sts] of Object.entries(byZone)) { const z = W.zones.find(q => q.id === zid); if (!z || sts.length < 2) continue; const [c1] = LINE[zid] || ['#7a3d9a'];
    // route along the roads, station to station; the deck sits over the middle of the road
    let pts = []; for (let i = 0; i < sts.length - 1; i++) { const a = sts[i], b = sts[i + 1]; const ra = bb.nearestRoadPoint(a.x, a.z, 80), rb = bb.nearestRoadPoint(b.x, b.z, 80); if (!ra || !rb) continue;
      const R = bb.findRoute(ra.x, ra.z, rb.x, rb.z) || [[ra.x, ra.z], [rb.x, rb.z]]; const seg = [[ra.x, ra.z]].concat(R, [[rb.x, rb.z]]); pts = pts.concat(i ? seg.slice(1) : seg); }
    // merge points that are almost the same
    const P = []; for (const q of pts) { const l = P[P.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 2) P.push(q); } if (P.length < 2) continue;
    const onGrid = (x, y) => { const i = (x - z.x0) / 80, j = (y - z.z0) / 80; return Math.abs(i - Math.round(i)) * 80 < 10 && Math.abs(j - Math.round(j)) * 80 < 10; };
    let acc = 0; const lens = [0];
    for (let k = 0; k < P.length - 1; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1]; const L = Math.hypot(bx - ax, bz - az); lens.push(lens[k] + L); if (L < .5) continue; const ry = Math.atan2(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2;
      box(7.2, 1.1, L + 7.2, mx, DECK, mz, ry, conc); box(4.6, .6, L + 4, mx, DECK - .85, mz, ry, concD);                       // deck and its beam
      for (const sd of [-1, 1]) { const ox = Math.cos(ry) * sd * 3.45, oz = -Math.sin(ry) * sd * 3.45; box(.3, .9, L + 7, mx + ox, DECK + 1, mz + oz, ry, conc); // parapets
        const rx = Math.cos(ry) * sd * .75, rz = -Math.sin(ry) * sd * .75; box(.12, .16, L + 6, mx + rx, DECK + .63, mz + rz, ry, rail); }
      // a raised, planted median under the line; it opens at every junction and every 160 m for U-turns
      { const gap = (x, y) => onGrid(x, y); let run = null; const flush = (t1) => { if (!run) return; const t0 = run, l = t1 - t0; run = null; if (l < 6) return; const cx = ax + (bx - ax) * (t0 + l / 2) / L, cz = az + (bz - az) * (t0 + l / 2) / L;
          box(2.8, .26, l, cx, .13, cz, ry, kerb); box(2.3, .08, l - .4, cx, .3, cz, ry, grass); for (let s = 2; s < l - 1; s += 7) { const sx = ax + (bx - ax) * (t0 + s) / L, sz = az + (bz - az) * (t0 + s) / L; shrub(sx, sz); }
          if (Math.abs(Math.sin(ry)) < .02 || Math.abs(Math.cos(ry)) < .02) bb.addCol(cx, cz, Math.abs(Math.sin(ry)) > .5 ? l / 2 : 1.4, Math.abs(Math.sin(ry)) > .5 ? 1.4 : l / 2, true, false); };
        for (let t = 0; t <= L; t += 2) { const x = ax + (bx - ax) * t / L, y = az + (bz - az) * t / L; const open = gap(x, y) || t % 160 < 10 && t > 40 && t < L - 40 || bb.isWater(x, y); if (open) flush(t); else if (run == null) run = t; } flush(L); }
      // pillars every 30 m on the median, kept clear of junctions
      for (let t = 12; t < L - 6; t += 30) { const x = ax + (bx - ax) * t / L, y = az + (bz - az) * t / L; if (onGrid(x, y) || bb.isWater(x, y) || t % 160 < 12 && t > 40 && t < L - 40) continue; if (((t / 30) | 0) % 3 === 1 && bb.addAdSlot) bb.addAdSlot({ id: `mp:${zid}:${k}:${t | 0}`, x, y: 0, z: y, rot: ry, kind: 'pillar', road: 'metro', zone: zid, bw: 1.5, bh: 2.4, y0: 4.4, off: .95 }); cyl(.85, DECK - 1.2, x, (DECK - 1.2) / 2, y, conc); box(5, .8, 1.6, x, DECK - 1.4, y, ry, concD); } }
    // elevated stations over each stop: platform, canopy, glass sides and a stair tower to the street kiosk
    for (const s of sts) { const r = bb.nearestRoadPoint(s.x, s.z, 80); if (!r) continue; const ry = Math.atan2(r.e.dx, r.e.dz), x = r.x, y = r.z;
      box(13, .8, 44, x, DECK + .3, y, ry, conc); box(14, .35, 46, x, DECK + 6, y, ry, roof); for (const sd of [-1, 1]) { const ox = Math.cos(ry) * sd * 6.6, oz = -Math.sin(ry) * sd * 6.6; box(.12, 4.4, 40, x + ox, DECK + 3, y + oz, ry, glass); for (const t of [-18, 0, 18]) { const px = x + ox + Math.sin(ry) * t, pz = y + oz + Math.cos(ry) * t; cyl(.25, 5.4, px, DECK + 3.4, pz, conc); } }
      for (const t of [-16, 16]) { const px = x + Math.sin(ry) * t, pz = y + Math.cos(ry) * t; cyl(1.1, DECK - .2, px, (DECK - .2) / 2, pz, conc); }
      const sx = s.x, sz = s.z; box(3, DECK + 1, 3, sx - Math.sin(s.rot) * 1.5, (DECK + 1) / 2, sz - Math.cos(s.rot) * 1.5, s.rot, concD);
      bb.addSign('Ⓜ ' + s.name.replace(' Metro', '').toUpperCase(), x + Math.cos(ry) * 7, DECK + 7.2, y - Math.sin(ry) * 7, ry + Math.PI / 2, 8, 1.3, '#ffffff', c1); }
    lines.push({ zid, P, lens, len: lens[lens.length - 1], col: LINE[zid] || ['#7a3d9a', '#f4f4f4'], z }); }

  /* trains */
  // a 3-car metro train: rounded cars with a line-colour band, window bands with pillars, doors, roof AC units,
  // gangways between cars, and a driver cab with a raked windscreen and headlights at both ends
  function train(col) { const g = new T.Group(); const body = bb.LMat(col[1]), band = bb.LMat(col[0]), win = bb.LMat('#22303b'), door = bb.LMat('#c6ccd2'), grey = bb.LMat('#8d939a'), lamp = new T.MeshBasicMaterial({ color: 0xfff3c4 });
    const m = (geo, mt, x, y, z, rx) => { const o = new T.Mesh(geo, mt); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
    for (let i = 0; i < 3; i++) { const z = (i - 1) * 12.6;
      m(new T.BoxGeometry(2.9, 2.6, 12.2), body, 0, 1.9, z); m(new T.CylinderGeometry(1.45, 1.45, 12.2, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), body, 0, 3.15, z).scale.y = .25;
      m(new T.BoxGeometry(2.94, .42, 12.24), band, 0, 1.0, z); m(new T.BoxGeometry(2.95, .9, 11.2), win, 0, 2.35, z);
      for (let k = -2; k <= 2; k++) m(new T.BoxGeometry(2.97, .9, .14), body, 0, 2.35, z + k * 2.6);
      for (const dz of [-3.9, 0, 3.9]) for (const s of [-1, 1]) m(new T.BoxGeometry(.04, 1.95, 1.3), door, s * 1.47, 1.65, z + dz);
      m(new T.BoxGeometry(1.4, .3, 2.4), grey, 0, 3.55, z - 3); m(new T.BoxGeometry(1.4, .3, 2.4), grey, 0, 3.55, z + 3);
      if (i < 2) m(new T.BoxGeometry(2.2, 2.3, .5), grey, 0, 1.9, z + 6.3); }
    for (const s of [-1, 1]) { const cab = m(new T.BoxGeometry(2.86, 2.3, 1.4), band, 0, 1.85, s * 19.4); const ws = m(new T.BoxGeometry(2.4, 1.1, .1), win, 0, 2.35, s * 20.15, s * .35);
      for (const x of [-.95, .95]) m(new T.BoxGeometry(.32, .16, .05), lamp, x, 1.25, s * 20.12); }
    bb.scene.add(g); return g; }
  for (const L of lines) { L.train = train(L.col); L.s = Math.random() * L.len; L.dir = 1; L.wait = 0; L.train.visible = false; }
  function at(L, s) { let k = 1; while (k < L.lens.length - 1 && L.lens[k] < s) k++; const a = L.P[k - 1], b = L.P[k], u = (s - L.lens[k - 1]) / ((L.lens[k] - L.lens[k - 1]) || 1); return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, h: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
  bb.onUpdate(dt => { const pp = bb.ppos(); for (const L of lines) { const near = !bb.inside && Math.abs(pp.x - L.P[0][0]) < 1400 && Math.abs(pp.z - L.P[0][1]) < 1400; L.train.visible = near; if (!near) continue;
      if (L.wait > 0) { L.wait -= dt; continue; } L.s += L.dir * 14 * dt; if (L.s > L.len - 20) { L.s = L.len - 20; L.dir = -1; L.wait = 6; } if (L.s < 20) { L.s = 20; L.dir = 1; L.wait = 6; }
      const a = at(L, L.s); L.train.position.set(a.x, DECK + .65, a.z); L.train.rotation.y = a.h + (L.dir < 0 ? Math.PI : 0); } });
  bb.METRO = { lines, DECK };
});
