// Landmark builders for South-East India (Beta v1.01.30): Tamil Nadu, Puducherry, Andhra Pradesh and Telangana.
// LOD 200 like the rest: recognisable massing, no fine detail. Block specials sit on the 0.3 m pavement of a city block;
// free-standing ones are built at ground level 0. Places of worship are left out on purpose.
(function () {
  const L = window.LANDMARKS; if (!L) return;
  const MC = {}; const mat = (c, hex) => MC[hex] || (MC[hex] = new c.THREE.MeshLambertMaterial({ color: hex }));
  const Y = .3; // block pavement
  const ground = (c, x, z, w, d, col, y) => c.box(w, .1, d, x, (y == null ? Y : y) + .02, z, col ? mat(c, col) : c.M.grass, false, true);
  function arch(c, x, y, z, w, h, d, m, ry) { // a pointed-arch opening: two piers and a lintel with a dark recess
    const s = Math.sin(ry || 0), k = Math.cos(ry || 0); for (const e of [-1, 1]) c.boxRot(w * .18, h, d, x + k * e * w * .41, y + h / 2, z - s * e * w * .41, ry || 0, m);
    c.boxRot(w, h * .25, d, x, y + h * .875, z, ry || 0, m); c.boxRot(w * .64, h * .74, d * .4, x, y + h * .37, z, ry || 0, c.M.dark); }
  function minaret(c, x, y, z, h, r, m, top) { c.cyl(r * .85, r, h, x, y + h / 2, z, m, 10); for (const f of [.45, .7, .9]) c.cyl(r * 1.35, r * 1.35, .5, x, y + h * f, z, m, 10); c.cyl(r * .7, r * .7, h * .12, x, y + h + h * .06, z, m, 10); c.dome(r * .8, x, y + h * 1.12, z, top || m); }
  function clockFace(c, x, y, z, ry) { if (c.clock) c.clock(x, y, z, ry); }
  function rock(c, x, y, z, sx, sy, sz, m) { const g = new c.THREE.DodecahedronGeometry(1, 0); g.scale(sx, sy, sz); g.translate(x, y, z); c.add(g, m || mat(c, '#8a8378')); }
  const nearestRiverDir = (x, z) => { const W = window.WORLD; let best = null, bd = 1e9; for (const r of W.rivers || []) for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz; let t = L2 ? ((x - a[0]) * dx + (z - a[1]) * dz) / L2 : 0; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z); if (d < bd) { bd = d; best = { dx, dz, w: r.w }; } } return best; };

  /* ---------------- Chennai ---------------- */
  // Chennai Central: the red Indo-Saracenic station with its tall central clock tower and corner turrets
  L.chennaiCentral = (c, x, z) => { const red = mat(c, '#b8442f'), wh = mat(c, '#f1ead8'); ground(c, x, z, 64, 64, '#c9c2b0');
    c.box(54, 12, 18, x, Y + 6, z - 4, red); c.box(56, 1, 20, x, Y + 12.5, z - 4, wh); for (let i = -2; i <= 2; i++) arch(c, x + i * 9.5, Y, z + 5.2, 6, 7, .6, wh);
    c.box(9, 30, 9, x, Y + 15, z - 4, red); c.box(10, 1, 10, x, Y + 30.5, z - 4, wh); c.roof(9, 6, 9, x, Y + 31, z - 4, red); for (const s of [-1, 1]) clockFace(c, x, Y + 24, z - 4 + s * 4.6, s > 0 ? 0 : Math.PI);
    for (const sx of [-1, 1]) { c.cyl(2.4, 2.4, 18, x + sx * 26, Y + 9, z - 4, red, 8); c.cone(2.8, 5, x + sx * 26, Y + 20.5, z - 4, wh); }
    c.box(40, .4, 14, x, Y + .2, z + 18, mat(c, '#8d8a84'), false, true); c.sign('CHENNAI CENTRAL', x, Y + 14.6, z + 5.8, 0, 22, 2.4, '#ffffff', '#7a1f14'); c.col(x, z - 4, 28, 10); return {}; };
  // Ripon Building: the white corporation building with a central clock tower
  L.riponBuilding = (c, x, z) => { const wh = mat(c, '#f4f1e8'), tr = mat(c, '#c9b48a'); ground(c, x, z, 64, 64);
    c.box(50, 13, 16, x, Y + 6.5, z, wh); c.box(52, 1, 18, x, Y + 13.5, z, tr); for (let i = -4; i <= 4; i++) c.box(1.2, 11, 1.2, x + i * 5.5, Y + 5.5, z + 8.4, wh);
    c.box(8, 34, 8, x, Y + 17, z, wh); c.box(9, 1, 9, x, Y + 34.5, z, tr); c.cyl(3, 4, 5, x, Y + 37.5, z, wh, 8); c.dome(3, x, Y + 40, z, tr); clockFace(c, x, Y + 28, z + 4.1, 0);
    for (const sx of [-1, 1]) { c.box(7, 17, 7, x + sx * 24, Y + 8.5, z, wh); c.dome(3.5, x + sx * 24, Y + 17, z, tr); } c.col(x, z, 26, 9); return {}; };
  // Mahabalipuram: Krishna's Butter Ball balanced on its slope and Arjuna's Penance, the giant rock relief
  L.butterBall = (c, x, z) => { const granite = mat(c, '#9a8c7a'), dk = mat(c, '#7d7264'); ground(c, x, z, 70, 50, '#c8b98f', 0);
    rock(c, x - 12, 2, z, 16, 4, 12, dk); const g = new c.THREE.SphereGeometry(5.5, 16, 12); g.scale(1, .92, 1); g.translate(x - 10, 9, z); c.add(g, granite);
    c.box(24, 12, 4, x + 14, 6, z - 10, granite); for (let i = 0; i < 9; i++) c.box(1.4, 1.6 + (i % 3), .3, x + 4 + i * 2.4, 3 + (i % 4) * 2, z - 7.9, dk); c.box(1, 11, .4, x + 14, 5.5, z - 7.8, mat(c, '#5c5448'));
    c.sign("ARJUNA'S PENANCE", x + 14, 13, z - 7.9, 0, 10, 1.2, '#ffffff', '#5b4630'); c.col(x - 10, z, 6, 6); c.col(x + 14, z - 10, 12, 2.5); c.far(); return {}; };
  // Fort with a water moat (Vellore Fort)
  L.moatFort = (c, x, z, o) => { const st = mat(c, '#9a8364'); ground(c, x, z, 64, 64); c.box(62, .2, 62, x, Y + .05, z, c.M.waterBox, false, true);
    c.box(50, .3, 50, x, Y + .25, z, c.M.grass, false, true); for (const [w, d, dx, dz] of [[50, 2.4, 0, -24], [50, 2.4, 0, 24], [2.4, 50, -24, 0], [2.4, 50, 24, 0]]) c.box(w, 7, d, x + dx, Y + 3.5, z + dz, st);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { c.cyl(3.4, 3.8, 9, x + sx * 24, Y + 4.5, z + sz * 24, st, 8); } c.box(8, 9, 4, x, Y + 4.5, z + 24, st); c.box(4, 5, 4.3, x, Y + 2.5, z + 24, c.M.dark);
    c.box(6, .4, 8, x, Y + .3, z + 29, c.M.wood); c.flag(x, Y + 12, z + 24, false); c.col(x, z - 24, 25, 1.5); c.col(x - 24, z, 1.5, 25); c.col(x + 24, z, 1.5, 25); return { open: true }; };

  /* ---------------- Tamil Nadu towns ---------------- */
  // Rock Fort, Tiruchirappalli: a great granite rock with fort walls and steps up to the top
  L.rockFort = (c, x, z) => { const g = mat(c, '#8f8678'), st = mat(c, '#b4a58a'); ground(c, x, z, 64, 64);
    rock(c, x, 10, z, 22, 20, 18, g); rock(c, x + 6, 22, z - 2, 10, 10, 9, g); c.box(10, 6, 6, x + 4, 33, z - 2, st); c.box(6, 3, 6, x + 4, 37.5, z - 2, st);
    for (let i = 0; i < 12; i++) c.box(4, .8, 2.2, x - 14 + i * .9, 1 + i * 2.4, z + 16 - i * 1.4, st); for (const [w, d, dx, dz] of [[56, 2, 0, 27], [2, 30, -27, 12], [2, 30, 27, 12]]) c.box(w, 4, d, x + dx, Y + 2, z + dz, st);
    c.col(x, z, 20, 17); c.far(); return { open: true }; };
  // Thirumalai Nayak Palace, Madurai: white courtyard with huge round pillars, arches and a dome
  L.nayakPalace = (c, x, z) => { const wh = mat(c, '#f2ead8'), cr = mat(c, '#e3cfa3'); ground(c, x, z, 64, 64, '#d8cdb5');
    c.box(52, .3, 40, x, Y + .15, z, mat(c, '#e9e2d0'), false, true); for (let i = -4; i <= 4; i++) for (const sz of [-1, 1]) { c.cyl(1.2, 1.4, 12, x + i * 6, Y + 6, z + sz * 17, wh, 10); }
    c.box(56, 3, 6, x, Y + 13.5, z - 17, cr); c.box(56, 3, 6, x, Y + 13.5, z + 17, cr); c.box(24, 18, 14, x, Y + 9, z - 22, wh); c.cyl(7, 8, 3, x, Y + 19.5, z - 22, cr, 16); c.dome(7, x, Y + 21, z - 22, wh); c.cyl(.4, .4, 3, x, Y + 29, z - 22, cr, 6);
    for (const sx of [-1, 1]) { c.cyl(3, 3, 4, x + sx * 10, Y + 20, z - 22, cr, 8); c.dome(3, x + sx * 10, Y + 22, z - 22, wh); } c.col(x, z - 22, 12, 7); return { open: true }; };
  // Chettinad mansion, Karaikudi: a long tiled-roof house with a pillared veranda, coloured walls and a courtyard
  L.chettinadMansion = (c, x, z) => { const wl = mat(c, '#f0dcb0'), tile = mat(c, '#b5532e'), wood = c.M.wood, flr = mat(c, '#7a2e2e'); ground(c, x, z, 64, 64, '#d8c39a');
    c.box(40, 8, 44, x, Y + 4, z - 4, wl); c.box(20, .2, 20, x, Y + 8.2, z - 4, c.M.dark); c.box(44, .6, 48, x, Y + 8.4, z - 4, tile); c.roof(44, 4, 48, x, Y + 8.6, z - 4, tile);
    for (let i = -4; i <= 4; i++) c.cyl(.45, .5, 6, x + i * 4.6, Y + 3, z + 19.5, wood, 8); c.box(42, .8, 5, x, Y + 6.4, z + 19.5, tile); c.box(42, .4, 5, x, Y + .2, z + 19.5, flr, false, true);
    c.box(5, 5.5, .4, x, Y + 2.75, z + 18.1, mat(c, '#4a2e1c')); c.sign('CHETTINAD MANSION', x, Y + 7.2, z + 22.1, 0, 12, 1.2, '#ffe9b8', '#7a2e1a'); c.col(x, z - 4, 20, 22); return {}; };
  // Auroville: the Matrimandir golden sphere among lawns, with the great banyan beside it
  L.aurovilleDome = (c, x, z) => { const gold = mat(c, '#d9a93a'), red = mat(c, '#b5532e'); ground(c, x, z, 120, 120, '#6f9a52', 0);
    const g = new c.THREE.SphereGeometry(13, 18, 14); g.scale(1, .86, 1); g.translate(x, 14, z); c.add(g, gold);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.boxRot(6, 2.2, 12, x + Math.cos(a) * 20, 1.1, z + Math.sin(a) * 20, -a + Math.PI / 2, red); }
    for (const a of [.4, 2.0, 3.6, 5.2]) c.cyl(.8, 1, 14, x + Math.cos(a) * 11, 3, z + Math.sin(a) * 11, mat(c, '#e8e2d2'), 8);
    bigTree(c, x + 40, z - 30, 1.2); c.col(x, z, 14, 14); c.far(); return {}; };
  // Pichavaram: mangrove islets in the backwater channels, with rowing boats
  L.pichavaram = (c, x, z) => { const leaf = mat(c, '#2f5f2a'), root = mat(c, '#4a3b2a');
    c.box(140, .1, 90, x, -.02, z, c.M.waterBox, false, true); for (let i = 0; i < 26; i++) { const px = x - 62 + (i * 37 % 124), pz = z - 38 + (i * 23 % 76); const r = 3 + (i % 4); c.cyl(r, r * 1.1, 1.2, px, .5, pz, root, 7); const s = new c.THREE.SphereGeometry(r * 1.2, 7, 5); s.scale(1, .55, 1); s.translate(px, 2.1, pz); c.add(s, leaf); }
    for (let i = 0; i < 4; i++) { c.boxRot(1.4, .5, 5, x - 20 + i * 14, .25, z + 6 - i * 4, i * .6, c.M.boat2); }
    c.sign('PICHAVARAM MANGROVES · BOAT HOUSE', x, 4.5, z + 46, 0, 18, 1.8, '#ffffff', '#1f5f3a'); return {}; };
  // Pamban rail bridge beside the road bridge, with the vertical-lift span raised in the middle
  L.pambanBridge = (c, x, z) => { const conc = c.M.concrete, steel = mat(c, '#5a7d9a'); const zz = z + 26;
    for (let px = x - 34; px <= x + 34; px += 8) { c.box(2.2, 6, 2.2, px, 1, zz, conc); } c.box(72, 1.4, 5, x, 4.2, zz, steel); c.box(72, .3, 1.6, x, 5, zz, c.M.ballast);
    for (const s of [-1, 1]) { c.box(3, 26, 3, x + s * 7, 13, zz, steel); c.box(3, 26, 3, x + s * 7, 13, zz + 5, steel); } c.box(16, 1, 8, x, 25, zz + 2.5, steel); c.box(12, 2.2, 6, x, 18, zz + 2.5, steel);
    c.sign('PAMBAN BRIDGE', x, 8, zz - 3, Math.PI, 14, 1.6, '#ffffff', '#1f4f7a'); c.far(); return {}; };
  // Dhanushkodi: the ruined town at the end of the land (walls without roofs, the old railway tank)
  L.dhanushkodi = (c, x, z) => { const ruin = mat(c, '#b9a989'); ground(c, x, z, 60, 50, '#e2cf9f', 0);
    for (let i = 0; i < 7; i++) { const px = x - 22 + i * 7, pz = z - 10 + (i % 3) * 8; c.box(6, 3 + (i % 3), .7, px, 1.8, pz, ruin); c.box(.7, 2.5, 5, px + 3, 1.3, pz + 2.5, ruin); }
    c.cyl(2, 2, 6, x + 18, 3, z + 12, ruin, 10); c.sign("DHANUSHKODI · LAND'S END", x, 4, z + 20, 0, 14, 1.6, '#ffffff', '#5b4630'); return {}; };
  // Salt pans: shallow white squares of drying salt with heaps along the bunds
  L.saltPans = (c, x, z) => { const salt = mat(c, '#f4f2ec'), brine = mat(c, '#9fc3cf'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.box(16, .08, 12, x - 27 + i * 18, .06, z - 14 + j * 14, (i + j) % 3 ? salt : brine, false, true); }
    for (let i = 0; i < 8; i++) c.cone(1.6, 1.8, x - 30 + i * 8, .9, z + 22, salt, 8); return {}; };
  // Wind turbines (Muppandal, Anantapur): tall white towers with three blades
  L.windFarm = (c, x, z) => { const wh = mat(c, '#eef0f2'); for (let k = 0; k < 4; k++) { const px = x + (k % 2) * 34 - 17, pz = z + Math.floor(k / 2) * 34 - 17;
      c.cyl(.7, 1.2, 40, px, 20, pz, wh, 8); c.box(2, 2, 4, px, 40.5, pz, wh); for (let b = 0; b < 3; b++) { const a = b * 2.094 + k; const g = new c.THREE.BoxGeometry(.8, 16, .2); g.translate(0, 8, 0); g.rotateZ(a); g.translate(px, 40.5, pz + 2.2); c.add(g, wh); } } c.far(); return {}; };
  // A port: a quay with gantry cranes and stacks of containers
  L.port = (c, x, z, o) => { const quay = mat(c, '#9a958c'), crane = mat(c, '#e05a2a'); const cols = ['#c0392b', '#2a62c9', '#1f8a4c', '#e8a628', '#7b2a5e', '#5d6d7e'];
    c.box(70, 1, 50, x, .5, z, quay, false, true); for (let i = 0; i < 3; i++) { const pz = z - 18 + i * 18; for (const s of [-1, 1]) c.box(1.4, 22, 1.4, x + 18 + s * 6, 11, pz, crane); c.box(16, 1.6, 2, x + 18, 22, pz, crane); c.box(26, 1.2, 1.6, x + 24, 24, pz, crane); }
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 1 + (i + j) % 3; k++) c.box(6, 2.4, 2.4, x - 26 + i * 7, 2.2 + k * 2.5, z - 16 + j * 9, mat(c, cols[(i * 3 + j + k) % 6]));
    c.sign((o && o.arg) || 'PORT', x - 10, 6, z + 26, 0, 16, 1.8, '#ffffff', '#1f3f6a'); c.col(x - 12, z, 22, 20); c.far(); return {}; };
  // Power plant (Neyveli, Ramagundam, Vizag steel): cooling towers, chimneys and a long hall
  L.powerPlant = (c, x, z, o) => { const conc = mat(c, '#b7b2a8'), red = mat(c, '#c0392b'); ground(c, x, z, 90, 70, '#8f8a7a', 0);
    for (const s of [-1, 1]) { const g = new c.THREE.CylinderGeometry(9, 12, 28, 18, 1, true); g.translate(x + s * 22, 14, z - 14); c.add(g, conc); }
    for (let i = 0; i < 2; i++) { c.cyl(1.6, 2, 46, x - 4 + i * 8, 23, z + 10, conc, 10); c.cyl(1.7, 1.7, 3, x - 4 + i * 8, 40, z + 10, red, 10); }
    c.box(46, 14, 16, x + 10, 7, z + 18, mat(c, '#8c99a6')); c.sign((o && o.arg) || 'POWER PLANT', x + 10, 15.5, z + 26.2, 0, 22, 2, '#ffffff', '#2a3f55'); c.col(x, z, 40, 30); c.far(); return {}; };
  // Hill fort (Gingee, Gooty, Udayagiri, Rachakonda): a rocky hill ringed by walls with a citadel on top
  L.hillFort = (c, x, z, o) => { const g = mat(c, '#8f8678'), st = mat(c, '#a8987a');
    rock(c, x, 8, z, 20, 16, 18, g); rock(c, x + 3, 18, z + 2, 10, 8, 9, g); c.box(9, 5, 7, x + 3, 26, z + 2, st); c.cyl(1.8, 1.8, 4, x + 7, 30, z + 4, st, 8);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; c.boxRot(9.5, 4, 1.6, x + Math.cos(a) * 24, 2, z + Math.sin(a) * 22, -a + Math.PI / 2, st); }
    c.box(6, 7, 4, x, 3.5, z + 23, st); c.box(3, 4, 4.2, x, 2, z + 23, c.M.dark); c.flag(x + 3, 31, z + 2, false); if (o && o.arg) c.sign(o.arg.toUpperCase(), x, 9, z + 25.3, 0, 12, 1.4, '#ffffff', '#5b4630'); c.col(x, z, 18, 16); c.far(); return {}; };
  // Waterfall: a rock face with white water, a plunge pool and spray (Hogenakkal with coracles, Courtallam, Kuntala…)
  L.falls = (c, x, z, o) => { const g = mat(c, '#6f665a'), water = new c.THREE.MeshLambertMaterial({ color: 0xe9f4f8, transparent: true, opacity: .85 });
    rock(c, x, 6, z - 8, 18, 12, 6, g); rock(c, x - 16, 4, z - 4, 8, 8, 6, g); rock(c, x + 16, 4, z - 4, 8, 8, 6, g); for (let i = -2; i <= 2; i++) c.box(2.6, 11, .5, x + i * 3.2, 6, z - 2.6, water);
    c.cyl(12, 12, .1, x, .06, z + 6, c.M.waterBox, 18); const s = new c.THREE.SphereGeometry(4, 8, 6); s.scale(2.4, .5, 1); s.translate(x, 1, z + 1); c.add(s, water);
    const name = (o && o.arg) || 'Waterfall'; if (/hogenakkal/i.test(name)) for (let i = 0; i < 3; i++) { const cg = new c.THREE.SphereGeometry(1.2, 10, 6, 0, 6.283, Math.PI / 2, Math.PI / 2); cg.translate(x - 5 + i * 5, .6, z + 9); c.add(cg, mat(c, '#5a4630')); }
    c.sign(name.toUpperCase(), x, 4, z + 19, 0, 14, 1.4, '#ffffff', '#1f5f3a'); c.col(x, z - 8, 17, 6); c.far(); return {}; };
  // Dam or barrage across the nearest river: a concrete wall with gates and a road on top
  L.dam = (c, x, z, o) => { const r = nearestRiverDir(x, z); const ang = r ? Math.atan2(r.dx, r.dz) + Math.PI / 2 : 0; const len = Math.max(60, (r ? r.w : 40) * 2.2);
    const s = Math.sin(ang), k = Math.cos(ang); c.boxRot(8, 9, len, x, 4.5, z, ang, c.M.concrete); for (let i = 0; i < len / 9; i++) c.boxRot(8.6, 1.6, 3, x + s * (-len / 2 + 6 + i * 9), 9.6, z + k * (-len / 2 + 6 + i * 9), ang, c.M.stone);
    c.boxRot(9, .5, len, x, 9.2, z, ang, c.M.asphalt); if (o && o.arg) c.sign(o.arg.toUpperCase(), x + Math.cos(ang) * 6, 12, z - Math.sin(ang) * 6, ang + Math.PI / 2, 16, 1.6, '#ffffff', '#2a4f6a'); c.far(); return {}; };
  // Giant banyan: dozens of hanging-root trunks under one wide canopy (Pillalamarri, Thimmamma Marrimanu)
  function bigTree(c, x, z, k) { const tr = mat(c, '#6b5236'), lf = mat(c, '#3f6f2f'); for (let i = 0; i < 18; i++) { const a = i * 2.39, r = 4 + (i % 6) * 4 * k; c.cyl(.5, .7, 8 * k, x + Math.cos(a) * r, 4 * k, z + Math.sin(a) * r, tr, 6); }
    for (let i = 0; i < 7; i++) { const a = i * .9, r = i ? 12 * k : 0; const s = new c.THREE.SphereGeometry(11 * k, 9, 6); s.scale(1, .45, 1); s.translate(x + Math.cos(a) * r, 9.5 * k, z + Math.sin(a) * r); c.add(s, lf); } }
  L.banyan = (c, x, z, o) => { ground(c, x, z, 70, 70, '#8a9a50', 0); bigTree(c, x, z, 1.1); if (o && o.arg) c.sign(o.arg.toUpperCase(), x, 3, z + 32, 0, 14, 1.4, '#ffffff', '#3b5d2a'); c.far(); return {}; };

  /* ---------------- Andhra Pradesh ---------------- */
  // INS Kursura submarine on its plinth on the beach, with a TU-142 aircraft beside it
  L.submarineMuseum = (c, x, z) => { const hull = mat(c, '#3d4a52'), red = mat(c, '#8a2a2a'); ground(c, x, z, 64, 64, '#e2cf9f');
    c.box(8, 2, 52, x, Y + 1, z, c.M.concrete); const g = new c.THREE.CylinderGeometry(3.4, 3.4, 44, 16); g.rotateX(Math.PI / 2); g.translate(x, Y + 5.2, z); c.add(g, hull);
    for (const s of [-1, 1]) { const n = new c.THREE.SphereGeometry(3.4, 12, 8); n.scale(1, 1, 1.6); n.translate(x, Y + 5.2, z + s * 22); c.add(n, hull); } c.box(2.6, 4, 7, x, Y + 9.5, z - 4, hull); c.box(7.2, .6, 44, x, Y + 2.6, z, red);
    c.sign('INS KURSURA SUBMARINE MUSEUM', x - 6, Y + 4, z, -Math.PI / 2, 16, 1.6, '#ffffff', '#1f3f6a'); c.col(x, z, 4.5, 27); return {}; };
  // Kailasagiri: a hilltop park with a ropeway coming up from the beach road
  L.kailasagiri = (c, x, z) => { const g = mat(c, '#5f8f3e'); rock(c, x, 12, z, 30, 24, 28, g); c.box(14, 3, 10, x - 4, 34, z, mat(c, '#f4f1ea'));
    for (let i = 0; i < 4; i++) { const t = i / 3; c.box(1, 10 + 24 * (1 - t), 1, x + 34 - t * 30, (10 + 24 * (1 - t)) / 2, z + 30 - t * 26, c.M.steel); }
    for (let i = 0; i < 3; i++) c.box(2, 2, 2, x + 28 - i * 8, 28 - i * 4, z + 26 - i * 7, mat(c, ['#e8573e', '#ffc93c', '#2a62c9'][i])); c.col(x, z, 26, 24); c.far(); return {}; };
  // Borra Caves: a dark cave mouth in the hillside
  L.borraCaves = (c, x, z) => { const g = mat(c, '#7a6d5c'); rock(c, x, 8, z - 6, 22, 14, 14, g); c.box(10, 7, 4, x, 3.5, z + 6.5, c.M.dark); rock(c, x - 9, 3, z + 6, 4, 4, 3, g); rock(c, x + 9, 3, z + 6, 4, 4, 3, g);
    c.sign('BORRA CAVES', x, 9, z + 9, 0, 10, 1.4, '#ffffff', '#5b4630'); c.col(x, z - 6, 20, 12); c.far(); return {}; };
  L.belumCaves = (c, x, z) => { const g = mat(c, '#a89a7c'); ground(c, x, z, 50, 50, '#b8a46a', 0); c.cyl(7, 5, .4, x, .1, z, c.M.dark, 16); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; rock(c, x + Math.cos(a) * 9, 1, z + Math.sin(a) * 9, 2.5, 2, 2, g); }
    c.box(1, 3, 1, x - 10, 1.5, z + 12, c.M.wood); c.sign('BELUM CAVES', x, 3, z + 14, 0, 10, 1.4, '#ffffff', '#5b4630'); c.col(x, z, 7, 7); return {}; };
  // Gandikota: the Pennar canyon of red cliffs with the fort walls on the rim
  L.gandikota = (c, x, z) => { const red = mat(c, '#b0643c'), st = mat(c, '#a8987a');
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) rock(c, x - 50 + i * 20, 9, z + s * 26, 13, 18, 10, red); c.box(110, .1, 16, x, .05, z, c.M.waterBox, false, true);
    for (let i = 0; i < 8; i++) c.box(10, 4, 1.6, x - 40 + i * 11, 20, z - 34, st); c.cyl(3, 3, 7, x - 44, 21, z - 34, st, 8); c.cyl(3, 3, 7, x + 44, 21, z - 34, st, 8);
    c.sign('GANDIKOTA CANYON', x, 4, z - 44, 0, 14, 1.6, '#ffffff', '#7a2e1a'); c.col(x, z - 26, 55, 9); c.col(x, z + 26, 55, 9); c.far(); return {}; };
  // Sriharikota: the launch pad with a rocket in its tower, behind a no-entry fence
  L.rocket = (c, x, z) => { const wh = mat(c, '#f4f4f2'), steel = mat(c, '#c0392b'); ground(c, x, z, 60, 60, '#b8b2a2', 0);
    c.cyl(2.2, 2.2, 32, x, 16, z, wh, 14); c.cone(2.2, 6, x, 35, z, wh, 14); for (const s of [-1, 1]) { c.cyl(1, 1, 16, x + s * 3.4, 8, z, wh, 10); c.cone(1, 3, x + s * 3.4, 17.5, z, wh, 10); }
    c.box(4, 44, 4, x + 7, 22, z, steel); for (let i = 0; i < 6; i++) c.box(5, .5, 3, x + 4.5, 6 + i * 6, z, steel);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; c.boxRot(8, 2.2, .2, x + Math.cos(a) * 28, 1.1, z + Math.sin(a) * 28, -a + Math.PI / 2, mat(c, '#9a9a9a')); }
    c.sign('SPACEPORT · NO ENTRY · WATCH LAUNCHES FROM THE SHORE', x, 3.4, z + 29, 0, 22, 1.6, '#ffffff', '#8a1f1f'); c.col(x, z, 28, 28); c.far(); return {}; };
  // Prawn and fish ponds: a grid of water squares with bunds and aerators
  L.prawnPonds = (c, x, z) => { const bund = mat(c, '#8f7a5a'); c.box(90, .12, 70, x, .04, z, bund, false, true); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) c.box(19, .1, 19, x - 33 + i * 22, .1, z - 22 + j * 22, c.M.waterBox, false, true); return {}; };
  // Guntur chilli drying yard: carpets of red chillies and sacks
  L.chilliYard = (c, x, z) => { const red = mat(c, '#c0281e'), red2 = mat(c, '#a8201a'), sack = mat(c, '#d8c9a3'); ground(c, x, z, 64, 64, '#b8a46a');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.box(16, .2, 14, x - 19 + i * 19, Y + .1, z - 18 + j * 18, (i + j) % 2 ? red : red2, false, true); for (let i = 0; i < 10; i++) c.box(1.2, 1.4, .9, x - 26 + i * 1.5, Y + .7, z + 28, sack);
    c.sign('GUNTUR CHILLI YARD', x, Y + 4, z + 30, 0, 14, 1.4, '#ffffff', '#8a1f1f'); return { open: true }; };
  // A capital under construction: cranes, concrete frames and site hoardings
  L.construction = (c, x, z, o) => { const conc = mat(c, '#c9c4bb'), crane = mat(c, '#f2b705'); ground(c, x, z, 64, 64, '#a89a7c');
    for (let f = 0; f < 6; f++) { c.box(24, .5, 18, x - 6, Y + 1 + f * 4, z - 4, conc); for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(.8, 4, .8, x - 6 + sx * 11, Y + 3 + f * 4, z - 4 + sz * 8, conc); }
    c.box(1.6, 40, 1.6, x + 18, Y + 20, z + 10, crane); c.box(30, 1.2, 1.4, x + 10, Y + 40, z + 10, crane); c.box(4, 3, 3, x + 18, Y + 38, z + 10, crane); c.cable(x + 2, Y + 39, z + 10, x + 2, Y + 18, z + 10);
    c.box(60, 3, .3, x, Y + 1.5, z + 30, mat(c, '#2a62c9')); c.sign((o && o.arg) || 'UNDER CONSTRUCTION', x, Y + 2.2, z + 30.3, 0, 30, 1.4, '#ffffff', '#1f3f6a'); c.col(x - 6, z - 4, 13, 10); return {}; };

  /* ---------------- Telangana ---------------- */
  // Charminar: the square arch with four minarets at the heart of the old city
  L.charminar = (c, x, z) => { const st = mat(c, '#d8c7a4'), st2 = mat(c, '#c7b38c'); ground(c, x, z, 64, 64, '#bfb3a0');
    c.box(22, 14, 22, x, Y + 7, z, st); for (const ry of [0, Math.PI / 2]) { arch(c, x, Y, z + 11.1, 10, 12, .4, st2, ry === 0 ? 0 : 0); }
    c.box(10, 12, 22.4, x, Y + 6, z, c.M.dark); c.box(22.4, 12, 10, x, Y + 6, z, c.M.dark); c.box(22, 6, 22, x, Y + 17, z, st); c.box(24, .8, 24, x, Y + 14.4, z, st2); c.box(23, .8, 23, x, Y + 20.4, z, st2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) minaret(c, x + sx * 11, Y, z + sz * 11, 30, 1.7, st, st2);
    c.col(x - 8, z - 8, 3, 3); c.col(x + 8, z - 8, 3, 3); c.col(x - 8, z + 8, 3, 3); c.col(x + 8, z + 8, 3, 3); return { open: true }; };
  // Chowmahalla Palace: the Nizam's palace round a courtyard with a long pool and fountains
  L.chowmahalla = (c, x, z) => { const wh = mat(c, '#f1e6cf'), tr = mat(c, '#c9a96a'); ground(c, x, z, 64, 64, '#7ea84a');
    c.box(40, 12, 12, x, Y + 6, z - 20, wh); c.box(42, 1, 14, x, Y + 12.5, z - 20, tr); for (let i = -3; i <= 3; i++) arch(c, x + i * 5.6, Y, z - 13.8, 4, 8, .4, tr);
    for (const sx of [-1, 1]) { c.box(10, 10, 30, x + sx * 24, Y + 5, z + 6, wh); c.dome(3, x + sx * 24, Y + 10, z - 6, tr); } c.box(6, .2, 26, x, Y + .2, z + 6, c.M.waterBox, false, true);
    for (let i = 0; i < 3; i++) c.cyl(.6, .8, 1.4, x, Y + .7, z - 2 + i * 8, wh, 8); c.col(x, z - 20, 20, 6); c.col(x - 24, z + 6, 5, 15); c.col(x + 24, z + 6, 5, 15); return { open: true }; };
  // Golconda Fort: granite hill with ring walls, the Bala Hisar citadel on top and the Fateh Darwaza gate
  L.golconda = (c, x, z) => { const g = mat(c, '#8a8070'), st = mat(c, '#b0a084');
    rock(c, x, 14, z, 34, 28, 30, g); rock(c, x - 8, 30, z - 4, 16, 10, 14, g); c.box(16, 9, 12, x - 8, 42, z - 4, st); for (let i = 0; i < 4; i++) c.box(2.2, 3, 2.2, x - 14 + i * 4, 48, z - 10, st);
    for (const R of [42, 52]) for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; c.boxRot(R * .33, 6, 2.2, x + Math.cos(a) * R, 3, z + Math.sin(a) * R * .9, -a + Math.PI / 2, st); if (i % 4 === 0) c.cyl(3, 3.4, 8, x + Math.cos(a) * R, 4, z + Math.sin(a) * R * .9, st, 8); }
    c.box(9, 12, 6, x, 6, z + 47, st); c.box(4.4, 8, 6.2, x, 4, z + 47, c.M.dark); c.sign('GOLCONDA FORT', x, 13.5, z + 50.2, 0, 14, 1.6, '#ffffff', '#5b4630'); c.col(x, z, 30, 27); c.far(); return {}; };
  // Qutb Shahi Tombs: domed tombs on square plinths among gardens
  L.qutbTombs = (c, x, z) => { const st = mat(c, '#a89a80'), st2 = mat(c, '#c4b48f'); ground(c, x, z, 90, 60, '#7ea84a', 0);
    for (const [dx, dz, s] of [[-26, 0, 1], [6, -8, 1.3], [30, 10, .9]]) { c.box(18 * s, 3, 18 * s, x + dx, 1.5, z + dz, st); c.box(13 * s, 10 * s, 13 * s, x + dx, 3 + 5 * s, z + dz, st2); c.cyl(6.4 * s, 6.4 * s, 2 * s, x + dx, 3 + 10 * s + s, z + dz, st2, 16); c.dome(6.4 * s, x + dx, 3 + 12 * s, z + dz, st);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.cyl(.7 * s, .7 * s, 3 * s, x + dx + sx * 6 * s, 3 + 11 * s, z + dz + sz * 6 * s, st2, 6); c.col(x + dx, z + dz, 9 * s, 9 * s); } c.far(); return {}; };
  // Durgam Cheruvu cable bridge: a deck across the lake hung from a leaning A-pylon, lit at night
  L.durgamBridge = (c, x, z) => { const wh = mat(c, '#f2f2ee'); c.box(84, 1.2, 9, x, 6, z, c.M.concrete); for (const s of [-1, 1]) { c.box(84, 1.4, .3, x, 7.2, z + s * 4.4, wh); c.box(4, 6, 4, x + s * 40, 3, z, c.M.concrete); }
    for (const s of [-1, 1]) { const g = new c.THREE.BoxGeometry(1.4, 40, 1.4); g.rotateX(s * .12); g.translate(x - 8, 26, z + s * 2.5); c.add(g, wh); }
    for (let i = 1; i <= 8; i++) for (const d of [-1, 1]) c.cable(x - 8, 42 - i * 1.4, z, x - 8 + d * i * 4.4, 6.8, z + (d > 0 ? 3.5 : -3.5)); c.far(); return {}; };
  // Kakatiya Kala Thoranam: the four carved stone gateways of Warangal Fort around the ruins
  L.kakatiyaArches = (c, x, z) => { const st = mat(c, '#9a8e80'); ground(c, x, z, 64, 64, '#8fa05a');
    const gate = (gx, gz, ry) => { const s = Math.sin(ry), k = Math.cos(ry); for (const e of [-1, 1]) c.boxRot(1.4, 10, 1.4, gx + k * e * 3.6, Y + 5, gz - s * e * 3.6, ry, st); c.boxRot(9.5, 1.2, 1.6, gx, Y + 10.5, gz, ry, st); c.boxRot(7, 1.6, 1.2, gx, Y + 12.2, gz, ry, st); c.boxRot(3, 2, 1, gx, Y + 14, gz, ry, st); };
    gate(x, z - 20, 0); gate(x, z + 20, 0); gate(x - 20, z, Math.PI / 2); gate(x + 20, z, Math.PI / 2);
    for (let i = 0; i < 10; i++) c.box(3, .8 + (i % 3) * .6, 2, x - 10 + (i % 5) * 5, Y + .5, z - 4 + Math.floor(i / 5) * 8, st); c.sign('WARANGAL FORT · KAKATIYA KALA THORANAM', x, Y + 2.5, z + 27, 0, 24, 1.4, '#ffffff', '#5b4630'); return { open: true }; };
  // Bhongir Fort: a single huge egg-shaped granite rock with walls on its top
  L.bhongirFort = (c, x, z) => { const g = mat(c, '#8a8070'), st = mat(c, '#b0a084'); const r = new c.THREE.SphereGeometry(1, 16, 12); r.scale(26, 30, 20); r.translate(x, 18, z); c.add(r, g);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.boxRot(7, 3, 1.4, x + Math.cos(a) * 9, 47, z + Math.sin(a) * 7, -a + Math.PI / 2, st); } c.box(6, 4, 5, x, 49, z, st); c.col(x, z, 24, 18); c.far(); return {}; };
  // Laknavaram: the hanging footbridge across the lake to the island cottages
  L.laknavaram = (c, x, z) => { const wood = c.M.wood; for (let i = 0; i < 20; i++) { const t = i / 19, sag = Math.sin(t * Math.PI) * 1.6; c.box(3.2, .2, 3.2, x - 30 + t * 60, 4 - sag, z, wood); }
    for (const s of [-1, 1]) { c.box(1, 8, 1, x + s * 31, 4, z - 1.6, wood); c.box(1, 8, 1, x + s * 31, 4, z + 1.6, wood); c.cable(x - 31, 7.6, z - 1.6, x + 31, 7.6, z - 1.6); c.cable(x - 31, 7.6, z + 1.6, x + 31, 7.6, z + 1.6); }
    for (let i = 0; i < 3; i++) { c.box(5, 3, 4, x + 40 + i * 7, 1.5, z + 6, mat(c, '#c9a46a')); c.roof(6, 2, 5, x + 40 + i * 7, 3, z + 6, mat(c, '#7a5a3a')); } c.far(); return {}; };
  // Deccan boulders: granite rocks balanced on each other, as all round Hyderabad
  L.boulders = (c, x, z) => { const g = mat(c, '#9a9184'), g2 = mat(c, '#857c70'); let n = 0;
    for (let i = 0; i < 9; i++) { const px = x - 30 + (i * 29 % 60), pz = z - 30 + (i * 17 % 60); const s = 3 + (i % 4) * 1.6; rock(c, px, s * .8, pz, s * 1.3, s, s, i % 2 ? g : g2); if (i % 3 === 0) { const t = new c.THREE.SphereGeometry(s * .8, 10, 8); t.scale(1.2, .9, 1); t.translate(px + .6, s * 1.9, pz); c.add(t, g); } c.col(px, pz, s, s); n++; }
    return {}; };
  // Clock tower on a little plaza (Secunderabad)
  L.clockTower = (c, x, z, o) => { const wh = mat(c, '#f2ead8'), tr = mat(c, '#c9a96a'); ground(c, x, z, 64, 64, '#7ea84a');
    c.box(7, 22, 7, x, Y + 11, z, wh); c.box(8, 1, 8, x, Y + 22.5, z, tr); c.cyl(3, 3.6, 4, x, Y + 25, z, wh, 8); c.dome(3, x, Y + 27, z, tr); for (const s of [-1, 1]) clockFace(c, x, Y + 18, z + s * 3.6, s > 0 ? 0 : Math.PI);
    c.sign(((o && o.arg) || 'CLOCK TOWER') + ' CLOCK TOWER', x, Y + 3, z + 10, 0, 18, 1.4, '#ffffff', '#3b5d2a'); c.col(x, z, 4, 4); return { open: true }; };
})();
