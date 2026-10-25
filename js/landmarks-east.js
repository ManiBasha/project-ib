// Landmark builders for East and North-East India and the Andaman Islands (Beta v2.01.00): Bihar, Jharkhand,
// West Bengal, Sikkim, Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Andaman & Nicobar.
// LOD 200 like the rest: recognisable massing, no fine detail. Block specials sit on the 0.3 m pavement of a city
// block (64 x 64 m); free-standing ones are built at ground level 0. Places of worship are left out on purpose.
(function () {
  const L = window.LANDMARKS; if (!L) return;
  const MC = {}; const mat = (c, hex) => MC[hex] || (MC[hex] = new c.THREE.MeshLambertMaterial({ color: hex }));
  const Y = .3;
  const RED = '#b5523a', BRICK = '#a8573c', CREAM = '#efe3c8', WHITE = '#f4f1ea', STONE = '#a89a84', GREY = '#8c857a', MARBLE = '#f2efe8', YEL = '#e8c98f';
  const ground = (c, x, z, w, d, col, y) => c.box(w, .1, d, x, (y == null ? Y : y) + .02, z, col ? mat(c, col) : c.M.grass, false, true);
  const label = (c, t, x, y, z, ry, w, fg, bg) => c.sign(t, x, y, z, ry || 0, w || 18, 1.5, fg || '#ffffff', bg || '#5b4630');
  function trees(c, x, z, n, r, s) { for (let i = 0; i < n; i++) { const a = c.rnd() * 6.28, rr = r * (.55 + c.rnd() * .45); c.tree(x + Math.cos(a) * rr, z + Math.sin(a) * rr, s || .9); } }
  function colonnade(c, x, y, z, len, h, n, m, ry) { const s = Math.sin(ry || 0), k = Math.cos(ry || 0); for (let i = 0; i < n; i++) { const t = (i / (n - 1) - .5) * len; c.cyl(.5, .55, h, x + k * t, y + h / 2, z - s * t, m, 8); } c.boxRot(len + 1.4, 1, 2.2, x, y + h + .5, z, ry || 0, m); }
  function windows(c, x, y, z, w, rows, cols, h, m) { for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) c.box(w / cols * .5, h * .5, .2, x - w / 2 + (i + .5) * w / cols, y + (r + .5) * h, z, m); }
  function hut(c, x, y, z, w, d, h, wall, roofM, ry) { c.boxRot(w, h, d, x, y + h / 2, z, ry || 0, wall); const g = new c.THREE.CylinderGeometry(0, 1, h * .9, 4, 1); g.rotateY(Math.PI / 4 + (ry || 0)); g.scale(w * .8, 1, d * .8); g.translate(x, y + h + h * .45, z); c.add(g, roofM); }
  function stilts(c, x, y, z, w, d, h, m) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(.4, h, .4, x + sx * w / 2.3, y + h / 2, z + sz * d / 2.3, m); }
  function dome(c, r, x, y, z, m, sx, sy) { const g = new c.THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(sx || 1, sy || 1, sx || 1); g.translate(x, y, z); c.add(g, m); }

  /* ================= block specials (city blocks) ================= */
  // Golghar: the giant beehive-shaped granary of 1786 with spiral stairs round the outside
  L.golghar = (c, x, z) => { const st = mat(c, '#e8dcc0'); ground(c, x, z, 64, 64, '#7fb04f'); dome(c, 20, x, Y, z, st, 1, 1.45); c.cyl(2.4, 2.4, 1.2, x, Y + 29.6, z, st, 12);
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 1.6, h = i * 1.1; c.boxRot(3, .5, 2, x + Math.cos(a) * 20.5, Y + h + .3, z + Math.sin(a) * 20.5, -a, mat(c, '#c9b48a')); }
    label(c, 'GOLGHAR · 1786', x, Y + 2, z + 26, 0, 14); c.col(x, z, 18, 18); return { open: true }; };
  // Bihar Museum: long low modern galleries in rust-red Corten with courtyards
  L.biharMuseum = (c, x, z) => { const rust = mat(c, '#9a4b2c'), gl = mat(c, '#8fb3c9'); ground(c, x, z, 64, 64, '#8fbf5a'); c.box(52, 10, 14, x, Y + 5, z - 16, rust); c.box(18, 8, 26, x - 17, Y + 4, z + 6, rust);
    c.box(20, 12, 18, x + 14, Y + 6, z + 8, rust); c.box(20, 6, .3, x + 14, Y + 6, z - .9, gl); trees(c, x, z + 4, 4, 6); label(c, 'BIHAR MUSEUM', x, Y + 2, z + 28, 0, 16, '#ffffff', '#5b2e1c');
    c.col(x, z - 16, 26, 7); c.col(x - 17, z + 6, 9, 13); c.col(x + 14, z + 8, 10, 9); return { open: true }; };
  // Writers' Building: the long red-brick secretariat facing Lal Dighi
  L.writersBuilding = (c, x, z) => { const r = mat(c, '#a8452e'), wh = mat(c, CREAM); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(60, 16, 16, x, Y + 8, z - 18, r); windows(c, x, Y + 2, z - 9.9, 58, 3, 18, 4.4, wh);
    for (let i = -2; i <= 2; i++) c.box(6, 20, 17, x + i * 12, Y + 10, z - 18, r); colonnade(c, x, Y, z - 9.4, 16, 12, 6, wh); c.flag(x, Y + 20, z - 18);
    c.box(40, .2, 22, x, Y + .12, z + 14, mat(c, '#4f86b0'), false, true); c.pool(x, z + 14, 20, 11); label(c, "WRITERS' BUILDING · LAL DIGHI", x, Y + 2, z + 29, 0, 20); c.col(x, z - 18, 30, 8); return { open: true }; };
  // Indian Museum: the colonnaded classical front on Chowringhee
  L.indianMuseum = (c, x, z) => { const cr = mat(c, '#e9dcc0'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(56, 14, 30, x, Y + 7, z - 8, cr); colonnade(c, x, Y, z + 7.6, 40, 12, 14, mat(c, WHITE));
    c.box(58, 1.4, 32, x, Y + 14.7, z - 8, mat(c, '#d7c7a6')); label(c, 'INDIAN MUSEUM · 1814', x, Y + 2, z + 26, 0, 18); c.col(x, z - 8, 28, 15); return { open: true }; };
  // Victoria Memorial: the white marble hall with a central dome and corner cupolas, in its gardens and pools
  L.victoriaMemorial = (c, x, z) => { const m = mat(c, MARBLE), m2 = mat(c, '#e3ded2'); ground(c, x, z, 64, 64, '#6fa64a');
    c.box(40, 3, 28, x, Y + 1.5, z - 4, m2); c.box(36, 13, 24, x, Y + 9.5, z - 4, m); for (const s of [-1, 1]) { c.box(10, 15, 10, x + s * 15, Y + 10.5, z - 4, m); c.cyl(3, 3, 3, x + s * 15, Y + 19.5, z - 4, m, 10); dome(c, 3, x + s * 15, Y + 21, z - 4, m); }
    c.cyl(9, 10, 6, x, Y + 19, z - 4, m, 20); dome(c, 9.5, x, Y + 22, z - 4, m, 1, 1.15); c.cyl(.3, .3, 4, x, Y + 33, z - 4, mat(c, '#2a2a2a'), 6); c.box(1.6, 2.2, .6, x, Y + 35.6, z - 4, mat(c, '#2a2a2a'));
    colonnade(c, x, Y + 3, z + 8.6, 14, 8, 6, m); c.box(26, .2, 8, x, Y + .12, z + 22, mat(c, '#4f86b0'), false, true); c.pool(x, z + 22, 13, 4); for (const s of [-1, 1]) trees(c, x + s * 26, z + 20, 3, 5);
    label(c, 'VICTORIA MEMORIAL', x, Y + 2, z + 29, 0, 18, '#ffffff', '#3b5d2a'); c.col(x, z - 4, 20, 14); return { open: true }; };
  // Prinsep Memorial: the white Palladian porch on the riverbank, with the Vidyasagar Setu cables beyond
  L.princepGhat = (c, x, z) => { const wh = mat(c, WHITE); ground(c, x, z, 64, 64, '#7fb04f'); c.box(14, 1.2, 10, x, Y + .6, z, wh); colonnade(c, x, Y + 1.2, z - 3.6, 12, 8, 6, wh); colonnade(c, x, Y + 1.2, z + 3.6, 12, 8, 6, wh);
    const g = new c.THREE.ConeGeometry(8, 3, 4); g.rotateY(Math.PI / 4); g.scale(1, 1, .7); g.translate(x, Y + 11, z); c.add(g, wh);
    for (const s of [-1, 1]) { c.box(2, 30, 2, x - 24, Y + 15, z + s * 18, mat(c, '#c9c4b8')); for (let k = 0; k < 4; k++) c.cable(x - 24, Y + 29, z + s * 18, x - 4 + k * 9, Y + 3, z + s * 28); }
    trees(c, x + 18, z, 4, 8); label(c, 'PRINSEP MEMORIAL', x, Y + 2, z + 26, 0, 14); c.col(x, z, 7, 5); return { open: true }; };
  // Howrah Station: the long red terminus with its clock towers
  L.howrahStation = (c, x, z) => { const r = mat(c, '#a8452e'), wh = mat(c, CREAM); ground(c, x, z, 64, 64, '#bdb4a4'); c.box(60, 12, 20, x, Y + 6, z - 12, r); windows(c, x, Y + 2, z - 1.9, 56, 2, 16, 4.6, wh);
    for (const s of [-1, 0, 1]) { c.box(6, 22, 6, x + s * 24, Y + 11, z - 12, r); c.roof(7, 4, 7, x + s * 24, Y + 22, z - 12, mat(c, '#6a2f22')); c.clock(x + s * 24, Y + 18, z - 8.9, 0); }
    for (let i = 0; i < 4; i++) c.box(14, .4, 30, x - 21 + i * 14, Y + 7, z + 16, mat(c, '#8c857a')); label(c, 'HOWRAH JN.', x, Y + 13.5, z - 1.8, 0, 14, '#ffffff', '#1a3d7a');
    c.col(x, z - 12, 30, 10); return { open: true, poi: [{ type: 'station', name: 'Howrah Junction', side: 's', t: 0 }] }; };
  // Science City: the space-theatre dome and the cable-car towers
  L.scienceCity = (c, x, z) => { const w = mat(c, '#e8e6e0'), bl = mat(c, '#3a6fb0'); ground(c, x, z, 64, 64, '#8fbf5a'); c.cyl(16, 16, 6, x - 6, Y + 3, z, w, 24); dome(c, 16, x - 6, Y + 6, z, w);
    c.box(18, 8, 12, x + 20, Y + 4, z - 16, bl); for (const s of [-1, 1]) c.box(1.2, 14, 1.2, x + 22, Y + 7, z + s * 20, mat(c, '#c43c3c')); c.cable(x + 22, Y + 13, z - 20, x + 22, Y + 13, z + 20);
    label(c, 'SCIENCE CITY', x, Y + 2, z + 28, 0, 14, '#ffffff', '#1a3d7a'); c.col(x - 6, z, 16, 16); c.col(x + 20, z - 16, 9, 6); return { open: true }; };
  // Curzon Gate: the triumphal arch on Bardhaman's main road
  L.curzonGate = (c, x, z) => { const cr = mat(c, '#e9d6b0'), r = mat(c, '#c46a4a'); ground(c, x, z, 64, 64, '#cfc8b8'); for (const s of [-1, 1]) c.box(6, 14, 7, x + s * 7, Y + 7, z, cr);
    c.box(20, 5, 7.4, x, Y + 16.5, z, cr); c.box(21, 1, 8, x, Y + 19.5, z, r); for (const s of [-1, 1]) dome(c, 2, x + s * 7, Y + 20, z, r); c.box(8, 11, 7.2, x, Y + 5.5, z, c.M.dark);
    label(c, 'CURZON GATE · BIJAY TORAN', x, Y + 2, z + 22, 0, 18); c.col(x - 7, z, 3, 3.5); c.col(x + 7, z, 3, 3.5); return { open: true }; };
  // Hazarduari Palace: the yellow Italianate palace "of a thousand doors" with its grand stairs
  L.hazarduari = (c, x, z) => { const y = mat(c, '#e8cf8a'), wh = mat(c, WHITE); ground(c, x, z, 64, 64, '#7fb04f'); c.box(56, 18, 26, x, Y + 9, z - 8, y); windows(c, x, Y + 2, z + 5.1, 54, 3, 22, 5.2, mat(c, '#6a4a2a'));
    colonnade(c, x, Y + 4, z + 6.6, 22, 12, 8, wh); c.box(26, 1.4, 4, x, Y + 17, z + 6.6, wh); for (let i = 0; i < 6; i++) c.box(22 - i * 1.2, .7, 1.4, x, Y + .35 + i * .7, z + 15 - i * 1.4, wh);
    c.dome(5, x, Y + 18, z - 8, wh); label(c, 'HAZARDUARI PALACE', x, Y + 2, z + 26, 0, 18); c.col(x, z - 8, 28, 13); return { open: true }; };
  // Himalayan Mountaineering Institute: stone halls with a summit statue and climbing wall
  L.himalayanInstitute = (c, x, z) => { const st = mat(c, '#8c7e6c'), rf = mat(c, '#2f6b4a'); ground(c, x, z, 64, 64, '#6f9a4a'); c.box(30, 9, 14, x - 10, Y + 4.5, z - 14, st); c.roof(32, 4, 16, x - 10, Y + 9, z - 14, rf);
    c.box(6, 18, 6, x + 18, Y + 9, z - 10, mat(c, '#a89a84')); for (let i = 0; i < 10; i++) c.box(.8, .5, .3, x + 18 - 2 + (i % 3) * 2, Y + 2 + i * 1.6, z - 6.8, mat(c, ['#e63946', '#ffd23a', '#2a9d8f'][i % 3]));
    c.box(3, 3, 3, x, Y + 1.5, z + 10, st); c.cyl(.7, .7, 4, x, Y + 5, z + 10, mat(c, '#c9a66a'), 8); trees(c, x - 18, z + 18, 5, 8); label(c, 'HIMALAYAN MOUNTAINEERING INSTITUTE', x, Y + 2, z + 28, 0, 22);
    c.col(x - 10, z - 14, 15, 7); c.col(x + 18, z - 10, 3, 3); return { open: true }; };
  // Cooch Behar Palace: the long red-brick and cream palace with a tall central dome
  L.coochBeharPalace = (c, x, z) => { const r = mat(c, '#b4583e'), cr = mat(c, CREAM); ground(c, x, z, 64, 64, '#6fa64a'); c.box(60, 12, 14, x, Y + 6, z - 8, r); for (let k = 0; k < 2; k++) colonnade(c, x, Y + k * 6, z - .6, 56, 5.4, 18, cr);
    c.cyl(6, 6, 8, x, Y + 16, z - 8, cr, 16); dome(c, 6, x, Y + 20, z - 8, mat(c, '#8c8a80'), 1, 1.4); c.cyl(.4, .4, 3, x, Y + 29, z - 8, cr, 6);
    for (const s of [-1, 1]) c.box(8, 15, 14, x + s * 26, Y + 7.5, z - 8, r); c.box(30, .2, 10, x, Y + .12, z + 18, mat(c, '#4f86b0'), false, true); c.pool(x, z + 18, 15, 5);
    label(c, 'COOCH BEHAR PALACE', x, Y + 2, z + 28, 0, 18); c.col(x, z - 8, 30, 7); return { open: true }; };
  // MG Marg: Gangtok's car-free promenade with flower beds, benches and the shops in a row
  L.mgMarg = (c, x, z) => { const pav = mat(c, '#c9c0ad'), rf = mat(c, '#2f6b4a'); ground(c, x, z, 64, 64, '#c9c0ad'); for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const px = x - 24 + i * 12, pz = z + s * 24;
      c.box(11, 10, 9, px, Y + 5, pz, mat(c, ['#f2d16b', '#7fb7d9', '#e98b7f', '#9fd3a5', '#f4f1ea'][(i + (s > 0 ? 2 : 0)) % 5])); c.box(12, .6, 10, px, Y + 10.3, pz, rf); }
    for (let i = 0; i < 5; i++) { c.box(6, .6, 2, x - 24 + i * 12, Y + .5, z, mat(c, '#6aa84f')); c.box(2.4, .5, .8, x - 24 + i * 12, Y + .5, z + 3, mat(c, '#7a4a2a')); }
    for (let i = 0; i < 6; i++) c.box(.3, .3, 30, x - 30 + i * 12, Y + 6, z, mat(c, ['#e63946', '#ffd23a', '#2a9d8f', '#ffffff', '#3a6fb0', '#e63946'][i]));
    label(c, 'MG MARG · NO SMOKING · NO LITTERING', x, Y + 2.2, z + 31.6, 0, 22, '#ffffff', '#2f6b4a'); c.col(x, z - 24, 30, 5); c.col(x, z + 24, 30, 5); return { open: true }; };
  // Srimanta Sankardev Kalakshetra: cultural complex with a big pavilion roof and open-air stage
  L.kalakshetra = (c, x, z) => { const cr = mat(c, '#efe0c0'), rf = mat(c, '#a8402a'); ground(c, x, z, 64, 64, '#7fb04f'); c.box(30, 8, 18, x - 10, Y + 4, z - 14, cr);
    const g = new c.THREE.CylinderGeometry(0, 1, 6, 4, 1); g.rotateY(Math.PI / 4); g.scale(24, 1, 15); g.translate(x - 10, Y + 11, z - 14); c.add(g, rf);
    for (let i = 0; i < 4; i++) c.box(20 - i * 3, .8, 2, x + 14, Y + .4 + i * .8, z + 8 + i * 2, cr); c.box(12, 6, 6, x + 14, Y + 3, z + 18, cr);
    label(c, 'SRIMANTA SANKARDEV KALAKSHETRA', x, Y + 2, z + 28, 0, 22); c.col(x - 10, z - 14, 15, 9); return { open: true }; };
  // Rang Ghar: the two-storey Ahom royal pavilion with its upturned-boat roof
  L.rangGhar = (c, x, z) => { const br = mat(c, '#9c6a4a'); ground(c, x, z, 64, 64, '#7fb04f'); c.box(26, 6, 14, x, Y + 3, z, br); for (let i = -3; i <= 3; i++) c.box(2.4, 4.4, .3, x + i * 3.4, Y + 2.2, z + 7.1, c.M.dark);
    c.box(18, 4, 10, x, Y + 8, z, br); const s = new c.THREE.Shape(); s.moveTo(-11, 0); s.quadraticCurveTo(0, 5, 11, 0); s.lineTo(-11, 0); const g = new c.THREE.ExtrudeGeometry(s, { depth: 12, bevelEnabled: false }); g.translate(x, Y + 10, z - 6); c.add(g, br);
    for (const s2 of [-1, 1]) c.cone(1, 2.6, x + s2 * 11, Y + 11.4, z, br, 6); label(c, 'RANG GHAR · AHOM AMPHITHEATRE', x, Y + 2, z + 22, 0, 20); c.col(x, z, 13, 7); return { open: true }; };
  // Talatal Ghar: the long multi-storey Ahom palace of brick
  L.talatalGhar = (c, x, z) => { const br = mat(c, '#8f5a40'); ground(c, x, z, 64, 64, '#7fb04f'); for (let k = 0; k < 4; k++) c.box(52 - k * 10, 5, 20 - k * 3, x, Y + 2.5 + k * 5, z - 4, br);
    for (let k = 0; k < 4; k++) for (let i = -4; i <= 4; i++) if (Math.abs(i) * 6 < 24 - k * 5) c.box(2.4, 3, .3, x + i * 5.6, Y + 2 + k * 5, z + 6.1 - k * 1.5, c.M.dark);
    label(c, 'TALATAL GHAR', x, Y + 2, z + 22, 0, 14); c.col(x, z - 4, 26, 10); return { open: true }; };
  // Don Bosco Museum: the seven-storey hexagon tower of the indigenous cultures museum
  L.donBosco = (c, x, z) => { const w = mat(c, '#e6e0d2'), gl = mat(c, '#8fb3c9'); ground(c, x, z, 64, 64, '#cfc8b8'); c.cyl(16, 16, 28, x, Y + 14, z - 4, w, 6);
    for (let k = 0; k < 7; k++) c.cyl(16.2, 16.2, 1.2, x, Y + 2 + k * 4, z - 4, gl, 6); c.cyl(6, 6, 6, x, Y + 31, z - 4, gl, 6);
    label(c, 'DON BOSCO MUSEUM OF INDIGENOUS CULTURES', x, Y + 2, z + 26, 0, 24); c.col(x, z - 4, 14, 14); return { open: true }; };
  // Tawang War Memorial: a stupa-shaped memorial with the names of the 1962 soldiers
  L.tawangMemorial = (c, x, z) => { const wh = mat(c, '#f2efe6'), gd = c.M.gold; ground(c, x, z, 64, 64, '#9fb08a'); c.box(20, 2, 20, x, Y + 1, z, mat(c, '#a89a84')); c.box(12, 3, 12, x, Y + 3.5, z, wh);
    dome(c, 6, x, Y + 5, z, wh); c.cyl(1.2, 2, 7, x, Y + 13, z, gd, 10); for (let i = 0; i < 6; i++) c.box(1, 3, .4, x - 13 + i * 5.2, Y + 1.5, z + 14, mat(c, '#4b5a3a')); c.flag(x + 14, Y, z - 14, true);
    label(c, 'TAWANG WAR MEMORIAL · 1962', x, Y + 2, z + 24, 0, 20, '#ffffff', '#4b5a3a'); c.col(x, z, 10, 10); return { open: true }; };
  // Kohima War Cemetery: terraces of headstones on Garrison Hill and the tennis court lines
  L.kohimaCemetery = (c, x, z, o) => cemetery(c, x, z, Y, (o && o.arg) || 'KOHIMA WAR CEMETERY');
  function cemetery(c, x, z, y, name) { const st = mat(c, '#e9e4d8'), gr = mat(c, '#5f9a45'); ground(c, x, z, 64, 64, '#6aa84f', y);
    for (let t = 0; t < 4; t++) { c.box(56, 1, 10, x, y + .5 + t * 1, z - 18 + t * 11, gr); for (let i = 0; i < 12; i++) c.box(1.2, 1.4, .3, x - 24 + i * 4.4, y + 1.8 + t, z - 18 + t * 11, st); }
    c.box(2, 9, 2, x, y + 4.5, z + 26, st); c.box(5, .6, .8, x, y + 7, z + 26, st); label(c, name, x, y + 2, z + 30, 0, 18, '#ffffff', '#3b5d2a'); return { open: true }; }
  // Kachari ruins: rows of mushroom-domed sandstone pillars
  L.kachariRuins = (c, x, z) => { const st = mat(c, '#b8a07c'); ground(c, x, z, 64, 64, '#7fb04f'); for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const px = x - 22 + i * 8.8, pz = z - 12 + r * 10;
      c.cyl(1.2, 1.4, 4 + (i % 2), px, Y + 2.2, pz, st, 8); dome(c, 1.9, px, Y + 4.5 + (i % 2), pz, st); c.col(px, pz, 1.4, 1.4); }
    c.box(4, 6, 4, x + 22, Y + 3, z + 20, st); label(c, 'KACHARI RUINS', x, Y + 2, z + 28, 0, 14); return { open: true }; };
  // Kangla Fort: moat, the old gate and the white Kangla Sha dragon-lion statues
  L.kanglaFort = (c, x, z) => { const br = mat(c, '#a8573c'), wh = mat(c, WHITE); ground(c, x, z, 64, 64, '#6fa64a');
    for (const [w, d, px, pz] of [[64, 4, x, z - 30], [4, 56, x - 30, z], [4, 56, x + 30, z]]) { c.box(w, .3, d, px, Y + .1, pz, mat(c, '#4f86b0'), false, true); }
    c.box(14, 9, 5, x, Y + 4.5, z + 24, br); c.box(5, 6, 5.2, x, Y + 3, z + 24, c.M.dark); for (const s of [-1, 1]) { c.box(4, 2, 7, x + s * 10, Y + 1, z + 20, wh); c.box(2.4, 5, 2.4, x + s * 10, Y + 4.5, z + 18, wh); c.box(2.4, 2.4, 4, x + s * 10, Y + 7.6, z + 18.8, wh); c.cone(.8, 2.4, x + s * 10, Y + 9.8, z + 18, wh, 6); }
    c.box(20, 5, 12, x, Y + 2.5, z - 8, br); c.roof(22, 4, 14, x, Y + 5, z - 8, mat(c, '#6a2f22')); trees(c, x - 18, z - 10, 5, 7);
    label(c, 'KANGLA FORT', x, Y + 2, z + 29, 0, 14); c.col(x, z + 24, 7, 2.5); c.col(x, z - 8, 10, 6); c.col(x - 10, z + 19, 2, 3.5); c.col(x + 10, z + 19, 2, 3.5); return { open: true }; };
  // Ujjayanta Palace: the white Indo-Saracenic palace with three domes and Mughal gardens
  L.ujjayantaPalace = (c, x, z) => { const wh = mat(c, '#f6f3ec'), wh2 = mat(c, '#e6e0d2'); ground(c, x, z, 64, 64, '#6fa64a'); c.box(56, 12, 18, x, Y + 6, z - 12, wh);
    for (const s of [-1, 0, 1]) { c.box(10, 18, 12, x + s * 20, Y + 9, z - 12, wh); c.cyl(4, 4, 3, x + s * 20, Y + 19.5, z - 12, wh, 12); dome(c, 4.4, x + s * 20, Y + 21, z - 12, wh2, 1, 1.2); }
    colonnade(c, x, Y, z - 2.4, 40, 9, 14, wh); for (let i = 0; i < 2; i++) { c.box(16, .2, 6, x + (i ? 16 : -16), Y + .12, z + 16, mat(c, '#4f86b0'), false, true); c.pool(x + (i ? 16 : -16), z + 16, 8, 3); }
    trees(c, x, z + 20, 4, 6); label(c, 'UJJAYANTA PALACE', x, Y + 2, z + 29, 0, 16); c.col(x, z - 12, 28, 9); return { open: true }; };
  // Cellular Jail: three of the seven wings of cells round a central watchtower
  L.cellularJail = (c, x, z) => { const br = mat(c, '#b0563c'), wh = mat(c, CREAM); ground(c, x, z, 64, 64, '#bdb4a4'); c.cyl(5, 5, 18, x, Y + 9, z, br, 8); c.cone(6, 4, x, Y + 20, z, mat(c, '#6a2f22'), 8);
    for (const a of [Math.PI / 2, Math.PI / 2 + 2.1, Math.PI / 2 - 2.1]) { const px = x + Math.cos(a) * 17, pz = z + Math.sin(a) * 17; c.boxRot(24, 10, 6, px, Y + 5, pz, -a + Math.PI / 2, br);
      for (let k = 0; k < 3; k++) c.boxRot(24.2, .5, 6.2, px, Y + 1 + k * 3.3, pz, -a + Math.PI / 2, wh); c.col(px, pz, 8, 8); }
    c.flag(x, Y + 22, z); label(c, 'CELLULAR JAIL · NATIONAL MEMORIAL', x, Y + 2, z - 29, Math.PI, 20); c.col(x, z, 5, 5); return { open: true }; };

  /* ================= free-standing (ground level) ================= */
  // Howrah Bridge: the steel cantilever over the Hooghly; the road runs east-west under the trusses
  L.howrahBridge = (c, x, z) => { const st = mat(c, '#8b9196'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { c.box(2.2, 34, 2.2, x + sx * 22, 17, z + sz * 10, st); }
    for (const sz of [-1, 1]) { for (const sx of [-1, 1]) { c.boxRot(1, 1, 40, x + sx * 34, 20, z + sz * 10, Math.PI / 2 + sx * .55, st); c.boxRot(1, 1, 30, x + sx * 12, 26, z + sz * 10, Math.PI / 2 - sx * .5, st); }
      c.box(90, 1, 1, x, 33, z + sz * 10, st); c.box(90, 1, 1, x, 8, z + sz * 10, st); for (let i = -4; i <= 4; i++) c.box(.6, 25, .6, x + i * 10, 20.5, z + sz * 10, st); }
    for (let i = -4; i <= 4; i++) c.box(1, 1, 21, x + i * 10, 33, z, st); for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.col(x + sx * 22, z + sz * 10, 1.4, 1.4); return {}; };
  // Nalanda / Vikramshila / Rabdentse / Pilak: excavated brick monastery terraces and stupa mound
  L.nalandaRuins = (c, x, z, o) => { const b = mat(c, BRICK), b2 = mat(c, '#94503a'); ground(c, x, z, 72, 60, '#8fae5a', 0);
    for (let i = 0; i < 3; i++) { const px = x - 22 + i * 20; c.box(16, 3, 16, px, 1.5, z + 12, b); for (const s of [-1, 1]) c.box(16, 4, 1.2, px, 4, z + 12 + s * 7.4, b2); for (let k = -1; k <= 1; k++) c.box(3, 4, 3, px + k * 5, 3, z + 12, b2); c.col(px, z + 12, 8, 8); }
    for (let k = 0; k < 5; k++) c.box(26 - k * 4.5, 3, 20 - k * 3.5, x, 1.5 + k * 3, z - 14, b); c.col(x, z - 14, 13, 10);
    label(c, (o && o.arg) || 'NALANDA MAHAVIHARA', x, 2.2, z + 27, 0, 18, '#ffffff', '#6a3a26'); return {}; };
  // Kesaria (and other) brick stupa ruins: a stepped round mound
  L.stupaRuin = (c, x, z, o) => { const b = mat(c, BRICK); for (let k = 0; k < 5; k++) c.cyl(20 - k * 3.4, 21 - k * 3.4, 4, x, 2 + k * 4, z, b, 20); dome(c, 4, x, 20, z, mat(c, '#8a5a3a')); trees(c, x, z, 6, 26);
    label(c, (o && o.arg) || 'STUPA', x, 2.2, z + 25, 0, 14, '#ffffff', '#6a3a26'); c.col(x, z, 19, 19); return {}; };
  // Vaishali Ashokan pillar: the polished sandstone column with a lion on top, beside the brick stupa
  L.ashokaPillar = (c, x, z) => { const s = mat(c, '#d9c9a4'); c.box(4, .8, 4, x, .4, z, s); c.cyl(.6, .8, 14, x, 7.8, z, s, 12); c.cyl(1, .7, 1.4, x, 15.5, z, s, 10); c.box(1.2, 1.2, 2, x, 16.8, z, s); c.sph(.6, x, 17.6, z + .8, s);
    for (let k = 0; k < 3; k++) c.cyl(8 - k * 2, 8.5 - k * 2, 2, x + 16, 1 + k * 2, z, mat(c, BRICK), 16); label(c, 'ASHOKAN PILLAR · VAISHALI', x, 2, z + 8, 0, 14); c.col(x, z, 2, 2); c.col(x + 16, z, 8, 8); return {}; };
  // Sher Shah Suri's tomb: an octagonal red-sandstone tomb on a terrace in a square lake
  L.sherShahTomb = (c, x, z) => { const r = mat(c, '#c9845a'), w = mat(c, '#4f86b0'); c.box(70, .2, 70, x, .06, z, w, false, true); c.pool(x, z, 35, 35); c.box(30, 3, 30, x, 1.5, z, r); c.box(4, 2.2, 36, x, 1.1, z + 36, r);
    c.cyl(12, 12, 10, x, 8, z, r, 8); c.cyl(9, 9, 4, x, 15, z, r, 8); dome(c, 9, x, 17, z, mat(c, '#e9dcc0')); for (const a of [0, 1.57, 3.14, 4.71]) { c.cyl(1.6, 1.6, 2.4, x + Math.cos(a + .78) * 12, 14.2, z + Math.sin(a + .78) * 12, r, 8); dome(c, 1.7, x + Math.cos(a + .78) * 12, 15.4, z + Math.sin(a + .78) * 12, r); }
    label(c, "SHER SHAH SURI'S TOMB", x, 2.2, z + 52, 0, 16); c.col(x, z, 15, 15); return {}; };
  // Glass skywalk between two rocky hilltops (Rajgir, Pelling)
  L.glassSkywalk = (c, x, z, o) => { const rock = mat(c, '#7d6f62'), gl = new c.THREE.MeshLambertMaterial({ color: 0xbfe4f2, transparent: true, opacity: .55 });
    for (const s of [-1, 1]) { const g = new c.THREE.ConeGeometry(16, 26, 7); g.translate(x + s * 26, 13, z); c.add(g, rock); c.col(x + s * 26, z, 12, 12); }
    c.box(36, .4, 4, x, 22, z, gl); for (const s of [-1, 1]) c.box(36, 1.2, .1, x, 23, z + s * 2, gl); trees(c, x, z + 20, 6, 14); label(c, (o && o.arg) || 'GLASS SKYWALK', x, 2.2, z + 20, 0, 16, '#ffffff', '#2f5b6b'); return {}; };
  // Tiger Hill: the sunrise viewing deck looking at Kanchenjunga
  L.tigerHill = (c, x, z) => { const conc = mat(c, '#c9c4b8'); c.cone(26, 10, x, 5, z, mat(c, '#6f8a4a'), 9); c.box(18, 6, 12, x, 13, z, conc); c.box(20, .6, 14, x, 16.3, z, conc); for (let i = 0; i < 5; i++) c.box(16, .5, 1, x, 13 + i * .6, z + 8 + i, conc);
    label(c, 'TIGER HILL · SUNRISE ON KANCHENJUNGA', x, 2.2, z + 26, 0, 22, '#ffffff', '#2f5b6b'); c.col(x, z, 14, 14); return {}; };
  // Batasia Loop: the toy-train spiral round a garden and war memorial
  L.batasiaLoop = (c, x, z) => { const rail = mat(c, '#5a4a3a'); ground(c, x, z, 60, 60, '#7fb04f', 0); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; c.boxRot(3.2, .3, 1.2, x + Math.cos(a) * 22, .2, z + Math.sin(a) * 22, -a, rail); }
    c.box(3, 1, 3, x, .5, z, mat(c, '#c9c4b8')); c.box(1.2, 8, 1.2, x, 5, z, mat(c, '#c9c4b8')); c.flag(x, 9, z); trees(c, x, z, 6, 14, .8);
    c.box(6, 3, 2.4, x + 22, 1.8, z, mat(c, '#2f5fa8')); c.box(5, 2.4, 2.2, x + 22, 1.6, z + 6, mat(c, '#2f5fa8')); c.cyl(.4, .4, 1.6, x + 24, 4, z, mat(c, '#2a2a2a'), 6);
    label(c, 'BATASIA LOOP · DARJEELING HIMALAYAN RAILWAY', x, 2.2, z + 28, 0, 24, '#ffffff', '#2f5b6b'); c.col(x, z, 3, 3); return {}; };
  // Sundarbans watchtower among mangroves
  L.sundarbansTower = (c, x, z) => { const wd = c.M.wood; for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(.6, 14, .6, x + sx * 3, 7, z + sz * 3, wd); c.box(8, .5, 8, x, 14, z, wd); c.roof(9, 3, 9, x, 15, z, mat(c, '#6a5a3a'));
    for (let i = 0; i < 18; i++) { const a = c.rnd() * 6.28, r = 8 + c.rnd() * 20; c.cyl(.25, .4, 2.4, x + Math.cos(a) * r, 1.2, z + Math.sin(a) * r, wd, 5); c.sph(1.6, x + Math.cos(a) * r, 3.2, z + Math.sin(a) * r, mat(c, '#2f6b3a')); }
    label(c, 'SAJNEKHALI WATCHTOWER · SUNDARBANS', x, 2.2, z + 10, 0, 20, '#ffffff', '#2f6b3a'); c.col(x, z, 3.4, 3.4); return {}; };
  // Living root bridge: a stream through the forest, crossed by a bridge of twisted fig roots (two decks at Nongriat)
  L.livingRootBridge = (c, x, z, o) => { const root = mat(c, '#6b5038'), moss = mat(c, '#4f7a3a'); c.box(10, .3, 70, x, .05, z, c.M.waterBox, false, true);
    const two = /DOUBLE/.test((o && o.arg) || ''); for (let d = 0; d < (two ? 2 : 1); d++) { const y = 3 + d * 6; for (let i = -6; i <= 6; i++) c.boxRot(1.4, .5, 1.2, x + i * 1.2, y - Math.abs(i) * .08, z, .3 * (i % 2), root);
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) c.boxRot(.3, 3, .3, x - 7 + k * 2.8, y + 1.2, z + s * 1, .2, root); }
    for (const s of [-1, 1]) { c.cyl(1.6, 2.4, 14, x + s * 9, 7, z, root, 8); c.sph(6, x + s * 9, 15, z, moss); c.col(x + s * 9, z, 2.4, 2.4); }
    label(c, (o && o.arg) || 'LIVING ROOT BRIDGE', x, 2, z + 10, 0, 16, '#ffffff', '#2f5b3a'); return {}; };
  // Cane hanging bridge over a river
  L.caneBridge = (c, x, z) => { const cane = mat(c, '#b8955a'); for (const s of [-1, 1]) { c.box(1, 8, 1, x + s * 30, 4, z - 1.5, cane); c.box(1, 8, 1, x + s * 30, 4, z + 1.5, cane); c.col(x + s * 30, z, 1, 2); }
    for (let i = -14; i <= 14; i++) { const t = i / 14, y = 7 - (1 - t * t) * 3; c.box(2.1, .2, 2.4, x + i * 2.1, y, z, cane); if (i % 2 === 0) for (const s of [-1, 1]) c.box(.15, 1.6, .15, x + i * 2.1, y + .8, z + s * 1.2, cane); }
    label(c, 'CANE BRIDGE', x + 30, 2, z + 5, 0, 10, '#ffffff', '#6b5038'); return {}; };
  // Charaideo maidams: grassy Ahom royal burial mounds with brick crowns
  L.maidams = (c, x, z) => { const gr = mat(c, '#5f9a45'), b = mat(c, BRICK); ground(c, x, z, 80, 70, '#7fb04f', 0); for (const [dx, dz, r] of [[-20, -12, 10], [8, -18, 12], [24, 10, 9], [-8, 14, 11], [-28, 20, 7]]) {
      dome(c, r, x + dx, 0, z + dz, gr, 1, .7); c.cyl(r * .3, r * .35, 1.4, x + dx, r * .7 + .5, z + dz, b, 8); c.col(x + dx, z + dz, r * .8, r * .8); }
    label(c, 'CHARAIDEO MAIDAMS · AHOM ROYAL MOUNDS', x, 2.2, z + 32, 0, 22, '#ffffff', '#3b5d2a'); return {}; };
  // Oil rig with a flare stack (Duliajan, Digboi)
  L.oilRig = (c, x, z) => { const st = mat(c, '#c9c4b8'), rd = mat(c, '#c43c3c'); ground(c, x, z, 40, 40, '#9a8a6a', 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boxRot(.6, 26, .6, x + sx * 3, 13, z + sz * 3, 0, st);
    for (let k = 0; k < 6; k++) c.box(6.6 - k * .6, .4, 6.6 - k * .6, x, 4 + k * 4, z, rd); c.box(10, 3, 6, x + 10, 1.5, z + 10, mat(c, '#2f5fa8')); c.cyl(.5, .5, 18, x - 12, 9, z - 12, st, 8);
    c.cone(1.2, 4, x - 12, 20, z - 12, new c.THREE.MeshBasicMaterial({ color: 0xffa020 }), 8); label(c, 'OIL FIELD', x, 2, z + 18, 0, 10, '#ffffff', '#333333'); c.col(x, z, 4, 4); c.col(x + 10, z + 10, 5, 3); return {}; };
  // Jharia: smouldering coal field with smoke vents and cracked ground
  L.jhariaFire = (c, x, z) => { const coal = mat(c, '#2a2826'), glow = new c.THREE.MeshBasicMaterial({ color: 0xff5a1a }), smoke = new c.THREE.MeshLambertMaterial({ color: 0x8a8580, transparent: true, opacity: .35 });
    ground(c, x, z, 80, 70, '#3a3330', 0); for (let i = 0; i < 12; i++) { const px = x + (c.rnd() - .5) * 70, pz = z + (c.rnd() - .5) * 60; c.box(3, .2, .5, px, .15, pz, glow, false, false); c.sph(2 + c.rnd() * 2, px, 4 + c.rnd() * 4, pz, smoke); }
    for (let i = 0; i < 4; i++) c.box(14, 3, 10, x - 24 + i * 16, 1.5, z - 26, coal); c.box(1, 3, 6, x, 1.5, z + 30, c.M.wood); label(c, 'DANGER · UNDERGROUND FIRE · KEEP OUT', x, 2.4, z + 30.6, 0, 18, '#ffffff', '#c43c3c'); return {}; };
  // Marjing polo statue: a giant polo player on a Manipuri pony on a hilltop
  L.poloStatue = (c, x, z) => { const br = mat(c, '#8a6a3a'); c.cone(22, 8, x, 4, z, mat(c, '#6f9a4a'), 10); c.box(8, 3, 4, x, 9.5, z, mat(c, '#c9c4b8'));
    c.box(14, 6, 4, x, 14, z, br); c.box(4, 6, 3, x + 8, 18, z, br); c.box(4, 3, 2.6, x + 10, 21, z, br); for (const s of [-1, 1]) for (const t of [-1, 1]) c.box(1.2, 6, 1.2, x + s * 5, 8, z + t * 1.4, br);
    c.box(3, 7, 2.6, x - 1, 20, z, br); c.sph(1.6, x - 1, 25, z, br); c.boxRot(.4, .4, 14, x + 3, 22, z + 3, .8, br); c.boxRot(.4, 11, .4, x + 3, 20, z, -.6, br);
    label(c, 'MARJING POLO STATUE', x, 2.2, z + 22, 0, 16); c.col(x, z, 10, 10); return {}; };
  // Neermahal: the red-and-white water palace standing in Rudrasagar lake
  L.neermahal = (c, x, z) => { const wh = mat(c, '#f6f3ec'), rd = mat(c, '#c4553c'); c.box(40, 2, 26, x, .6, z, rd); c.box(36, 7, 22, x, 5, z, wh); for (let i = -4; i <= 4; i++) c.box(2.2, 4, .3, x + i * 4, 4.6, z + 11.1, rd);
    c.box(26, 5, 16, x, 11, z, wh); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { c.cyl(1.6, 1.6, 3, x + sx * 16, 10, z + sz * 9, rd, 8); dome(c, 1.9, x + sx * 16, 11.5, z + sz * 9, wh); }
    c.cyl(3.6, 3.6, 3, x, 15, z, rd, 12); dome(c, 4, x, 16.5, z, wh, 1, 1.2); c.col(x, z, 20, 13); return {}; };
  // Loktak phumdis: floating rings of vegetation with fishermen's huts
  L.phumdi = (c, x, z) => { const ph = mat(c, '#7a9a4a'), th = mat(c, '#b8955a'); for (const [dx, dz, r] of [[0, 0, 10], [18, 8, 7], [-16, 10, 8], [6, -16, 6]]) { c.cyl(r, r, .6, x + dx, .2, z + dz, ph, 16);
      hut(c, x + dx, .5, z + dz, 3, 3, 2, th, mat(c, '#8a7a4a')); c.col(x + dx, z + dz, r * .7, r * .7); } return {}; };
  // Naga heritage village: morungs with crossed horns, a log drum and a carved gate (Kisama)
  L.kisamaVillage = (c, x, z) => { const wd = mat(c, '#7a5a3a'), th = mat(c, '#b8955a'); ground(c, x, z, 80, 70, '#7fa04f', 0);
    for (let i = 0; i < 5; i++) { const px = x - 28 + i * 14, pz = z - 12 + (i % 2) * 14; hut(c, px, 0, pz, 9, 12, 4, wd, th); c.boxRot(.4, 4, .4, px - 1, 9, pz - 6, .5, wd); c.boxRot(.4, 4, .4, px + 1, 9, pz - 6, -.5, wd); c.col(px, pz, 4.5, 6); }
    c.box(14, 1.6, 1.6, x + 4, 1, z + 20, wd); for (const s of [-1, 1]) c.box(1.2, 7, 1.2, x + s * 8, 3.5, z + 30, wd); c.box(18, 1.4, 1.4, x, 7.2, z + 30, wd);
    label(c, 'KISAMA HERITAGE VILLAGE', x, 9, z + 30.8, 0, 16, '#ffffff', '#6b3a1a'); return {}; };
  // Mizo heritage village: bamboo houses on stilts and the zawlbuk hall
  L.reiekVillage = (c, x, z) => { const bm = mat(c, '#c9a86a'), th = mat(c, '#8a7a4a'); ground(c, x, z, 70, 60, '#7fa04f', 0); for (let i = 0; i < 5; i++) { const px = x - 24 + i * 12, pz = z - 8 + (i % 2) * 12;
      stilts(c, px, 0, pz, 6, 7, 2, bm); hut(c, px, 2, pz, 6, 7, 3, bm, th); c.col(px, pz, 3, 3.5); }
    stilts(c, x, 0, z + 18, 14, 8, 1.6, bm); hut(c, x, 1.6, z + 18, 14, 8, 3.4, bm, th); c.col(x, z + 18, 7, 4); label(c, 'REIEK HERITAGE VILLAGE', x, 2, z + 28, 0, 16, '#ffffff', '#6b3a1a'); return {}; };
  // Mawlynnong Sky View: a tall bamboo tower lashed to a tree
  L.bambooTower = (c, x, z) => { const bm = mat(c, '#c9a86a'); c.cyl(1.2, 1.6, 22, x, 11, z, mat(c, '#6b5038'), 8); c.sph(7, x, 24, z, mat(c, '#3f7a3a'));
    for (let k = 0; k < 6; k++) { c.box(5, .3, 5, x + 3, 3 + k * 3.4, z, bm); for (const s of [-1, 1]) c.box(.3, 3.4, .3, x + 3 + s * 2.3, 1.3 + k * 3.4, z + s * 2.3, bm); }
    label(c, 'SKY VIEW · MAWLYNNONG', x, 2, z + 5, 0, 12, '#ffffff', '#2f5b3a'); c.col(x + 1, z, 3.5, 3); return {}; };
  // Tunnel portal cut into a mountain (Sela)
  L.tunnelPortal = (c, x, z, o) => { const rock = mat(c, '#7d6f62'), conc = mat(c, '#b9b3a8'); const r = new c.THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); r.scale(34, 30, 24); r.translate(x, 0, z - 18); c.add(r, rock);
    c.box(16, 10, 3, x, 5, z + 4, conc); c.box(9, 7, 3.2, x, 3.5, z + 4.1, c.M.dark); label(c, (o && o.arg) || 'TUNNEL', x, 8.4, z + 5.8, 0, 12, '#ffffff', '#1a3d7a'); c.col(x, z - 14, 26, 14); return {}; };
  // A viewing deck with railings and a sign
  L.viewpoint = (c, x, z, o) => { const wd = c.M.wood; c.box(12, .5, 8, x, 1.2, z, wd); for (const s of [-1, 1]) c.box(.3, 2.4, .3, x + s * 5.8, 1.2, z + 3.8, wd); c.box(12, .2, .2, x, 2.4, z + 3.8, wd);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(.4, 1.2, .4, x + sx * 5.5, .6, z + sz * 3.5, wd); c.box(2.4, .5, .8, x - 3, 1.7, z - 2, wd);
    label(c, (o && o.arg) || 'VIEWPOINT', x, 3.6, z - 4, 0, 14, '#ffffff', '#2f5b6b'); c.col(x, z, 6, 4); return {}; };
  // KV Paradise: the white marble memorial on a hillside in Aizawl
  L.kvParadise = (c, x, z) => { const m = mat(c, MARBLE); c.box(30, 2, 24, x, 1, z, mat(c, '#c9c4b8')); c.box(24, 9, 16, x, 6.5, z, m); colonnade(c, x, 2, z + 9, 20, 7, 8, m); c.box(26, 1, 18, x, 11.5, z, m);
    c.box(10, 4, 8, x, 14, z, m); trees(c, x, z + 18, 4, 8); label(c, 'KV PARADISE', x, 2.2, z + 16, 0, 12); c.col(x, z, 15, 12); return {}; };
  // Dakhil Darwaza at Gour: the big brick gateway with corner towers
  L.dakhilDarwaza = (c, x, z) => { const b = mat(c, BRICK); c.box(26, 18, 12, x, 9, z, b); c.box(8, 12, 12.4, x, 6, z, c.M.dark); for (const s of [-1, 1]) { c.cyl(3, 3.4, 20, x + s * 14, 10, z, b, 12); c.col(x + s * 14, z, 3, 3); }
    for (let i = -5; i <= 5; i++) c.box(1.2, 1.2, 12.4, x + i * 2.3, 18.6, z, b); c.box(40, 4, 3, x - 32, 2, z, b); c.box(40, 4, 3, x + 32, 2, z, b); trees(c, x, z + 20, 5, 12);
    label(c, 'DAKHIL DARWAZA · GOUR', x, 2.2, z + 9, 0, 14); c.col(x - 8, z, 5, 6); c.col(x + 8, z, 5, 6); c.col(x - 32, z, 20, 1.5); c.col(x + 32, z, 20, 1.5); return {}; };
  // Rock caves cut into a granite hill (Barabar, Mawsmai)
  L.rockCaves = (c, x, z, o) => { const g = mat(c, '#8a8378'); const h = new c.THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); h.scale(30, 16, 20); h.translate(x, 0, z - 6); c.add(h, g);
    for (let i = -1; i <= 1; i++) { c.box(3, 4, .4, x + i * 9, 2, z + 13.9, c.M.dark); c.cyl(1.5, 1.5, .4, x + i * 9, 4, z + 13.9, c.M.dark, 10); }
    label(c, (o && o.arg) || 'CAVES', x, 2.2, z + 18, 0, 14); c.col(x, z - 6, 26, 16); return {}; };
  // Nartiang monoliths: a garden of tall standing stones and flat table stones
  L.stoneMonoliths = (c, x, z) => { const s = mat(c, '#8a8378'); ground(c, x, z, 60, 50, '#6f9a4a', 0); for (let i = 0; i < 14; i++) { const px = x - 24 + (i % 7) * 8, pz = z - 8 + Math.floor(i / 7) * 14, h = 3 + c.rnd() * 7;
      c.box(1.6, h, 1, px, h / 2, pz, s); c.col(px, pz, .8, .5); } for (let i = 0; i < 4; i++) c.box(4, .5, 3, x - 18 + i * 12, 1, z + 16, s);
    label(c, 'NARTIANG MONOLITHS', x, 2.2, z + 24, 0, 14); return {}; };
  // War cemetery outside town (Imphal) and memorials (INA, Moirang)
  L.cemetery = (c, x, z, o) => { cemetery(c, x, z, 0, (o && o.arg) || 'WAR CEMETERY'); c.col(x, z - 18, 28, 4); return {}; };
  L.memorial = (c, x, z, o) => { const st = mat(c, '#e9e4d8'); c.box(16, 1.2, 12, x, .6, z, mat(c, '#c9c4b8')); c.box(4, 12, 4, x, 7, z, st); c.box(6, 1, 6, x, 1.6, z, st); c.flag(x + 6, 0, z - 4, true);
    label(c, (o && o.arg) || 'MEMORIAL', x, 2.2, z + 7, 0, 14, '#ffffff', '#4b5a3a'); c.col(x, z, 3, 3); return {}; };
})();
