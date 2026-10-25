// Landmark builders for North, Central and East India (Beta v2.00.00): Delhi, Haryana, Punjab, Chandigarh,
// Himachal Pradesh, Uttarakhand, Jammu & Kashmir, Ladakh, Uttar Pradesh, Madhya Pradesh, Chhattisgarh and Odisha.
// LOD 200 like the rest: recognisable massing, no fine detail. Block specials sit on the 0.3 m pavement of a city
// block (64 x 64 m); free-standing ones are built at ground level 0. Places of worship are left out on purpose.
(function () {
  const L = window.LANDMARKS; if (!L) return;
  const MC = {}; const mat = (c, hex) => MC[hex] || (MC[hex] = new c.THREE.MeshLambertMaterial({ color: hex }));
  const Y = .3;
  const RED = '#b5523a', RED2 = '#9c4430', SAND = '#d9b98a', MARBLE = '#f4f1ea', MARB2 = '#e6e0d2', STONE = '#a89a84', GREY = '#8c857a';
  const ground = (c, x, z, w, d, col, y) => c.box(w, .1, d, x, (y == null ? Y : y) + .02, z, col ? mat(c, col) : c.M.grass, false, true);
  function arch(c, x, y, z, w, h, d, m, ry) { const s = Math.sin(ry || 0), k = Math.cos(ry || 0); for (const e of [-1, 1]) c.boxRot(w * .18, h, d, x + k * e * w * .41, y + h / 2, z - s * e * w * .41, ry || 0, m);
    c.boxRot(w, h * .25, d, x, y + h * .875, z, ry || 0, m); c.boxRot(w * .64, h * .74, d * .4, x, y + h * .37, z, ry || 0, c.M.dark); }
  function minaret(c, x, y, z, h, r, m, cap) { c.cyl(r * .8, r, h, x, y + h / 2, z, m, 10); for (let k = 1; k < 4; k++) c.cyl(r * 1.25, r * 1.25, .5, x, y + h * k / 4, z, m, 10); c.cyl(r * 1.1, r * 1.1, r * 1.2, x, y + h + r * .6, z, cap || m, 8); c.dome(r * 1.15, x, y + h + r * 1.2, z, cap || m); }
  function chhatri(c, x, y, z, r, m, dm) { for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.cyl(r * .12, r * .12, r * 1.2, x + dx * r * .7, y + r * .6, z + dz * r * .7, m, 6); c.box(r * 2, r * .2, r * 2, x, y + r * 1.25, z, m); c.dome(r, x, y + r * 1.3, z, dm || m); }
  function onion(c, x, y, z, r, m) { const g = new c.THREE.SphereGeometry(r, 14, 10); g.scale(1, 1.15, 1); g.translate(x, y + r * .95, z); c.add(g, m); c.cone(r * .25, r * .9, x, y + r * 2.3, z, c.M.gold, 8); }
  function crenel(c, x, z, w, d, h, m, step) { step = step || 3; for (let t = -w / 2 + step / 2; t < w / 2; t += step) { c.box(1.2, 1.2, 1.2, x + t, Y + h + .6, z - d / 2, m); c.box(1.2, 1.2, 1.2, x + t, Y + h + .6, z + d / 2, m); }
    for (let t = -d / 2 + step / 2; t < d / 2; t += step) { c.box(1.2, 1.2, 1.2, x - w / 2, Y + h + .6, z + t, m); c.box(1.2, 1.2, 1.2, x + w / 2, Y + h + .6, z + t, m); } }
  function ringWall(c, x, z, w, d, h, th, m) { c.box(w, h, th, x, Y + h / 2, z - d / 2, m); c.box(w, h, th, x, Y + h / 2, z + d / 2, m); c.box(th, h, d, x - w / 2, Y + h / 2, z, m); c.box(th, h, d, x + w / 2, Y + h / 2, z, m); }
  function bastion(c, x, z, r, h, m) { c.cyl(r, r * 1.08, h, x, Y + h / 2, z, m, 12); c.cyl(r * 1.1, r * 1.1, .8, x, Y + h + .4, z, m, 12); }
  function trees(c, x, z, n, r, s) { for (let i = 0; i < n; i++) { const a = c.rnd() * 6.28, rr = r * (.55 + c.rnd() * .45); c.tree(x + Math.cos(a) * rr, z + Math.sin(a) * rr, s || .9); } }
  function waterPool(c, x, z, w, d, y) { c.box(w, .3, d, x, (y == null ? Y : y) + .02, z, c.M.waterBox, false, true); }
  function colonnade(c, x, z, len, h, n, m, ry) { const s = Math.sin(ry || 0), k = Math.cos(ry || 0); for (let i = 0; i < n; i++) { const t = (i / (n - 1) - .5) * len; c.cyl(.5, .55, h, x + k * t, Y + h / 2, z - s * t, m, 8); } c.boxRot(len + 1.4, 1, 2.2, x, Y + h + .5, z, ry || 0, m); }
  function label(c, t, x, y, z, ry, w, fg, bg) { c.sign(t, x, y, z, ry || 0, w || 18, 1.5, fg || '#ffffff', bg || '#5b4630'); }
  function block(c, x, z, w, d, h, m, roofM) { c.box(w, h, d, x, Y + h / 2, z, m); if (roofM) c.box(w + .6, .6, d + .6, x, Y + h + .3, z, roofM); c.col(x, z, w / 2, d / 2); }

  /* ---------------- Delhi ---------------- */
  // Red Fort: the Lahori Gate in a long red sandstone wall with round bastions and white pavilions inside
  L.redFort = (c, x, z) => { const r = mat(c, RED), r2 = mat(c, RED2), wh = mat(c, MARBLE); ground(c, x, z, 64, 64, '#7ea84a');
    c.box(64, 13, 4, x, Y + 6.5, z + 24, r); crenel(c, x, z + 24, 64, 0, 13, r2, 2.6); for (const s of [-1, 1]) bastion(c, x + s * 30, z + 24, 4, 15, r);
    c.box(16, 18, 8, x, Y + 9, z + 24.5, r); c.box(17, 1, 9, x, Y + 18.5, z + 24.5, r2); arch(c, x, Y, z + 28.7, 7, 11, .5, r2); for (const s of [-1, 1]) chhatri(c, x + s * 6, Y + 19, z + 24.5, 1.8, wh);
    for (const s of [-1, 1]) { c.box(4, 13, 50, x + s * 31, Y + 6.5, z - 1, r); } c.box(64, 10, 4, x, Y + 5, z - 26, r);
    c.box(22, 6, 12, x, Y + 3, z - 4, wh); for (let i = -2; i <= 2; i++) arch(c, x + i * 4.2, Y, z + 2.1, 3.4, 5, .3, wh); for (const s of [-1, 1]) c.dome(1.6, x + s * 10, Y + 7, z - 4, wh);
    c.flag(x, Y + 19, z + 24.5, true); c.col(x, z + 24, 32, 2); c.col(x - 31, z, 2, 25); c.col(x + 31, z, 2, 25); c.col(x, z - 26, 32, 2); c.col(x, z - 4, 11, 6); return { open: true }; };
  // Connaught Place: a ring of white colonnaded blocks round a central park
  L.connaughtPlace = (c, x, z) => { const wh = mat(c, '#f2efe6'), gr = mat(c, '#6aa84f'); ground(c, x, z, 64, 64, '#cfc8b8');
    const g = new c.THREE.CircleGeometry(14, 28); g.rotateX(-Math.PI / 2); g.translate(x, Y + .06, z); c.add(g, gr, false, true); c.flag(x, Y, z, true);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + .31; const px = x + Math.cos(a) * 25, pz = z + Math.sin(a) * 25; c.boxRot(13, 9, 7, px, Y + 4.5, pz, -a + Math.PI / 2, wh);
      c.boxRot(13.4, .5, 9, px + Math.cos(a) * -.9, Y + 4.3, pz + Math.sin(a) * -.9, -a + Math.PI / 2, wh); for (let k = -2; k <= 2; k++) { const qx = px - Math.cos(a) * 4.4 + Math.sin(a) * k * 2.6, qz = pz - Math.sin(a) * 4.4 - Math.cos(a) * k * 2.6; c.cyl(.35, .35, 4, qx, Y + 2, qz, wh, 6); }
      c.col(px, pz, 5, 5); }
    label(c, 'CONNAUGHT PLACE', x, Y + 2, z + 31, 0, 18, '#ffffff', '#3b5d2a'); return { open: true }; };
  // India Gate: the war memorial arch on Kartavya Path, with the canopy behind it
  L.indiaGate = (c, x, z) => { const st = mat(c, '#c9a582'), st2 = mat(c, '#b8916c'); ground(c, x, z, 64, 64, '#7fb04f'); c.box(64, .12, 10, x, Y + .08, z, mat(c, '#d8cdb6'), false, true);
    c.box(26, 3, 9, x, Y + 1.5, z, st2); for (const s of [-1, 1]) c.box(8, 26, 8, x + s * 9, Y + 16, z, st); c.box(26, 7, 8.6, x, Y + 32.5, z, st); c.box(10.4, 20, 8.2, x, Y + 13, z, c.M.dark);
    c.box(24, 2, 8, x, Y + 37, z, st2); c.box(18, 3, 6, x, Y + 39.5, z, st); c.cyl(3.5, 4, 2, x, Y + 42, z, st2, 16); c.dome(3.6, x, Y + 43, z, st);
    c.box(6, 1, 6, x, Y + 6, z - 22, st); for (const [dx, dz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) c.box(.8, 8, .8, x + dx, Y + 10, z - 22 + dz, st); c.dome(3.2, x, Y + 14, z - 22, st);
    label(c, 'INDIA GATE', x, Y + 2.6, z + 16, 0, 12, '#ffffff', '#5b4630'); c.col(x - 9, z, 4, 4); c.col(x + 9, z, 4, 4); return { open: true }; };
  // Rashtrapati Bhavan: long sandstone front with a colonnade and the great copper dome
  L.rashtrapatiBhavan = (c, x, z) => { const cr = mat(c, '#e3c9a3'), rd = mat(c, '#b5604a'); ground(c, x, z, 64, 64, '#7fb04f');
    c.box(60, 4, 30, x, Y + 2, z - 8, rd); c.box(58, 12, 26, x, Y + 10, z - 8, cr); colonnade(c, x, z + 5.6, 30, 10, 12, cr); c.box(32, 1.2, 4, x, Y + 16.6, z + 5.6, cr);
    c.cyl(9, 9.5, 6, x, Y + 19, z - 8, cr, 20); c.dome(9, x, Y + 22, z - 8, mat(c, '#8c6a4f')); c.cyl(1.2, 1.2, 4, x, Y + 32, z - 8, cr, 8); c.flag(x, Y + 34, z - 8);
    for (let i = 0; i < 8; i++) c.tree(x - 28 + i * 8, z + 26, 1.1); c.col(x, z - 8, 29, 15); return { open: true }; };
  // Parliament House: the round colonnaded old building and the triangular new one
  L.parliamentHouse = (c, x, z) => { const cr = mat(c, '#e3c9a3'), rd = mat(c, '#c48a64'); ground(c, x, z, 64, 64, '#7fb04f');
    const N = 28; for (let i = 0; i < N; i++) { const a = i / N * 6.283; c.cyl(.45, .45, 7, x - 12 + Math.cos(a) * 16, Y + 3.5, z + Math.sin(a) * 16, cr, 6); }
    c.cyl(16.6, 16.6, 1.2, x - 12, Y + 7.6, z, cr, 28); c.cyl(14, 14, 9, x - 12, Y + 4.5, z, rd, 28); c.dome(6, x - 12, Y + 9, z, cr);
    const sh = new c.THREE.Shape(); sh.moveTo(0, -12); sh.lineTo(11, 8); sh.lineTo(-11, 8); sh.lineTo(0, -12); const g = new c.THREE.ExtrudeGeometry(sh, { depth: 12, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(x + 18, Y, z); c.add(g, rd);
    c.cyl(4, 4, 2, x + 18, Y + 13, z - 1, cr, 12); c.dome(4, x + 18, Y + 14, z - 1, cr); c.col(x - 12, z, 15, 15); c.col(x + 18, z, 10, 10); return { open: true }; };
  // Humayun's Tomb: red sandstone and white marble tomb on a high plinth in a charbagh garden
  L.humayunTomb = (c, x, z) => { const r = mat(c, RED), wh = mat(c, MARBLE); ground(c, x, z, 64, 64, '#6f9f45');
    for (const s of [-1, 1]) { c.box(.8, .2, 60, x + s * 0, Y + .12, z, mat(c, '#d8cdb6'), false, true); c.box(60, .2, .8, x, Y + .12, z, mat(c, '#d8cdb6'), false, true); }
    waterPool(c, x, z + 24, 2, 10); waterPool(c, x + 24, z, 10, 2); c.box(40, 5, 40, x, Y + 2.5, z, r); for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) { arch(c, x + i * 5.2, Y, z + s * 20.1, 3.6, 4, .3, r); arch(c, x + s * 20.1, Y, z + i * 5.2, 3.6, 4, .3, r, Math.PI / 2); }
    c.box(24, 13, 24, x, Y + 11.5, z, r); for (const s of [-1, 1]) { arch(c, x, Y + 5, z + s * 12.1, 8, 11, .4, wh); arch(c, x + s * 12.1, Y + 5, z, 8, 11, .4, wh, Math.PI / 2); }
    c.cyl(8, 8, 4, x, Y + 20, z, r, 16); onion(c, x, Y + 21.5, z, 8.2, wh); for (const [dx, dz] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) chhatri(c, x + dx, Y + 18, z + dz, 1.8, r, wh);
    c.col(x, z, 20, 20); return { open: true }; };
  // Lodhi Garden: lawns, trees and two small domed tombs
  L.lodhiGarden = (c, x, z) => { const st = mat(c, '#a8987c'); ground(c, x, z, 64, 64, '#6aa84f'); trees(c, x, z, 16, 30, 1.1);
    for (const [dx, dz, s] of [[-12, -8, 1], [14, 10, .8]]) { c.cyl(7 * s, 7 * s, 8 * s, x + dx, Y + 4 * s, z + dz, st, 8); c.dome(6 * s, x + dx, Y + 8 * s, z + dz, st); c.col(x + dx, z + dz, 7 * s, 7 * s); }
    label(c, 'LODHI GARDEN', x, Y + 2, z + 31, 0, 14, '#ffffff', '#3b5d2a'); return { open: true }; };
  // Hauz Khas: the old reservoir with ruined domed pavilions and cafés
  L.hauzKhas = (c, x, z) => { const st = mat(c, '#a8987c'); ground(c, x, z, 64, 64, '#7ea84a'); waterPool(c, x - 10, z + 10, 36, 30, Y);
    for (let i = 0; i < 4; i++) { c.box(9, 6, 9, x + 20, Y + 3, z - 24 + i * 12, st); c.dome(3.4, x + 20, Y + 6, z - 24 + i * 12, st); c.col(x + 20, z - 24 + i * 12, 4.5, 4.5); }
    for (let i = 0; i < 4; i++) { c.box(8, 5, 6, x - 22 + i * 10, Y + 2.5, z - 22, mat(c, ['#e8c070', '#bfe0cf', '#f2b8a2', '#cfc6dc'][i])); c.col(x - 22 + i * 10, z - 22, 4, 3); }
    return { open: true }; };
  // Qutub Minar: the fluted five-storey tower with balconies, beside the iron pillar and the Alai Darwaza
  L.qutubMinar = (c, x, z) => { const r = mat(c, '#b0644a'), r2 = mat(c, '#9a5440'), wh = mat(c, '#e9e1cf'); ground(c, x, z, 64, 64, '#7ea84a');
    let y = Y, rad = 4.6; const H = [14, 11, 9, 7, 6]; for (let i = 0; i < 5; i++) { c.cyl(rad * .86, rad, H[i], x, y + H[i] / 2, z, i < 3 ? r : wh, 16); y += H[i]; c.cyl(rad * 1.12, rad * .92, 1.1, x, y + .3, z, r2, 16); rad *= .86; }
    c.cyl(rad * .7, rad * .9, 3, x, y + 2, z, r, 10); c.dome(rad * .8, x, y + 3.5, z, r); c.cyl(.25, .25, 7, x + 10, Y + 3.5, z + 6, mat(c, '#3a3530'), 8);
    c.box(12, 9, 10, x - 16, Y + 4.5, z + 12, r); arch(c, x - 16, Y, z + 17.1, 6, 7, .3, wh); c.dome(4.6, x - 16, Y + 9, z + 12, r);
    for (let i = 0; i < 6; i++) c.box(1.6, 6, 1.6, x + 14 - (i % 3) * 5, Y + 3, z - 16 + Math.floor(i / 3) * 6, wh);
    c.col(x, z, 5, 5); c.col(x - 16, z + 12, 6, 5); return { open: true }; };
  // Signature Bridge: the tall leaning pylon of the cable-stayed bridge (over a strip of Yamuna water)
  L.signatureBridge = (c, x, z) => { const st = c.M.steel || mat(c, '#c9ccd1'); waterPool(c, x, z, 64, 30);
    c.box(64, 1.2, 10, x, Y + 4, z, mat(c, '#b9b4ab')); for (const s of [-1, 1]) c.box(64, .9, .3, x, Y + 5.2, z + s * 5, st);
    for (const s of [-1, 1]) { const g = new c.THREE.BoxGeometry(1.6, 70, 1.6); g.rotateZ(s * .32); g.translate(x - 4 + s * 7, Y + 35, z); c.add(g, st); }
    c.box(20, 1.6, 1.6, x - 4, Y + 66, z, st); for (let i = 0; i < 8; i++) for (const sd of [-1, 1]) c.cable(x - 4, Y + 60 - i * 3, z, x + sd * (8 + i * 3.4), Y + 4.6, z + 4.8); c.col(x - 4, z, 6, 2); return { open: true }; };
  // Purana Qila: the old fort walls and the Bara Darwaza gate
  L.purnaQila = (c, x, z) => { const st = mat(c, '#a68b6a'); ground(c, x, z, 64, 64, '#7ea84a'); ringWall(c, x, z, 56, 56, 9, 2.6, st);
    for (const [dx, dz] of [[-28, -28], [28, -28], [-28, 28], [28, 28]]) bastion(c, x + dx, z + dz, 3.6, 11, st); c.box(14, 15, 6, x, Y + 7.5, z + 28, st); arch(c, x, Y, z + 31.1, 6, 9, .4, mat(c, RED));
    for (const s of [-1, 1]) chhatri(c, x + s * 5, Y + 15, z + 28, 1.5, mat(c, MARBLE)); c.col(x, z - 28, 28, 1.5); c.col(x - 28, z, 1.5, 28); c.col(x + 28, z, 1.5, 28); return { open: true }; };

  /* ---------------- NCR, Haryana, Punjab, Chandigarh ---------------- */
  L.raceTrack = (c, x, z) => { const tar = mat(c, '#3a3c40'), kerb = mat(c, '#d0342c'); ground(c, x, z, 64, 64, '#7ea84a');
    const g = new c.THREE.RingGeometry(22, 30, 40); g.rotateX(-Math.PI / 2); g.scale(1, 1, .7); g.translate(x, Y + .06, z); c.add(g, tar, false, true);
    for (let i = 0; i < 40; i += 2) { const a = i / 40 * 6.283; c.boxRot(3, .1, .8, x + Math.cos(a) * 30, Y + .1, z + Math.sin(a) * 21, -a, kerb, false, true); }
    c.box(30, 8, 6, x, Y + 4, z - 26, mat(c, '#e8e8e8')); c.box(32, .6, 9, x, Y + 8.3, z - 26, mat(c, '#2a2f3a')); label(c, 'BUDDH INTERNATIONAL CIRCUIT', x, Y + 10, z - 22.8, 0, 26, '#ffffff', '#1d1d1f'); c.col(x, z - 26, 15, 3); return { open: true }; };
  L.factory = (c, x, z, o) => { const sh = mat(c, '#b8bcc2'), rf = mat(c, '#8a9099'), br = mat(c, '#a0523a'); ground(c, x, z, 64, 64, '#9a958c');
    c.box(40, 12, 26, x - 6, Y + 6, z - 8, sh); for (let i = 0; i < 4; i++) c.box(10.5, 3, 26.4, x - 21 + i * 10, Y + 13, z - 8, rf); for (const k of [0, 1]) c.cyl(1.6, 2, 30, x + 20 + k * 6, Y + 15, z - 16, br, 10);
    c.box(18, 6, 12, x + 16, Y + 3, z + 16, mat(c, '#d9d4c8')); c.cyl(4, 4, 10, x - 20, Y + 5, z + 18, mat(c, '#d5d0c6'), 14); label(c, (o && o.arg) || 'FACTORY', x - 6, Y + 14, z + 5.4, 0, 22, '#ffffff', '#33475b');
    c.col(x - 6, z - 8, 20, 13); c.col(x + 23, z - 16, 5, 2); c.col(x + 16, z + 16, 9, 6); return { open: true }; };
  L.pinjoreGardens = (c, x, z) => { const wh = mat(c, '#efe6d2'); ground(c, x, z, 64, 64, '#6aa84f'); for (let i = 0; i < 4; i++) { c.box(50, .6 + i * .9, 12, x, Y + (i * .9 + .6) / 2, z - 22 + i * 14, mat(c, '#79ad52')); waterPool(c, x, z - 22 + i * 14, 3, 11, Y + i * .9 + .5); }
    c.box(14, 6, 8, x, Y + 7, z + 26, wh); c.dome(3, x, Y + 13, z + 26, wh); for (const s of [-1, 1]) c.box(6, 4, 6, x + s * 18, Y + 5, z + 26, wh); for (let i = 0; i < 10; i++) c.tree(x + (i % 2 ? 22 : -22), z - 26 + i * 5.6, 1); return { open: true }; };
  // Capitol Complex: Le Corbusier's raw concrete secretariat and assembly, and the Open Hand on its pole
  L.capitolComplex = (c, x, z) => { const conc = mat(c, '#b9b3a8'), dk = mat(c, '#6f6a62'); ground(c, x, z, 64, 64, '#c9c2b2');
    c.box(54, 16, 8, x, Y + 8, z - 24, conc); for (let i = 0; i < 18; i++) c.box(2.6, 14, .4, x - 25.5 + i * 3, Y + 8, z - 19.8, dk); c.box(16, 10, 14, x + 16, Y + 5, z + 4, conc);
    const hy = new c.THREE.CylinderGeometry(5, 6.5, 8, 16, 1, true); hy.translate(x + 16, Y + 13, z + 4); c.add(hy, conc); const cap = new c.THREE.CylinderGeometry(3, 6, 4, 16); cap.translate(x + 16, Y + 14, z + 4);
    c.box(18, .8, 16, x + 16, Y + 10.4, z + 4, conc); c.cyl(.5, .6, 14, x - 16, Y + 7, z + 14, dk, 8); const hand = new c.THREE.BoxGeometry(7, 7, .4); hand.translate(x - 16, Y + 17, z + 14); c.add(hand, mat(c, '#9aa0a6'));
    for (let i = 0; i < 4; i++) c.box(1, 3, .4, x - 18.6 + i * 1.7, Y + 21.6, z + 14, mat(c, '#9aa0a6')); waterPool(c, x - 4, z + 4, 10, 10);
    label(c, 'CAPITOL COMPLEX · OPEN HAND', x, Y + 2, z + 31, 0, 22, '#ffffff', '#3d3d3d'); c.col(x, z - 24, 27, 4); c.col(x + 16, z + 4, 8, 7); return { open: true }; };
  // Rock Garden: Nek Chand's figures made of broken tiles and scrap, with stone walls and small waterfalls
  L.rockGarden = (c, x, z) => { const st = mat(c, '#9c968a'), cols = ['#e8e1d0', '#c94f4f', '#4f7fc9', '#e0b040', '#5aa36a']; ground(c, x, z, 64, 64, '#8f9a6a');
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; c.boxRot(10, 3 + (i % 3), 1.6, x + Math.cos(a) * 26, Y + 1.5, z + Math.sin(a) * 26, -a + Math.PI / 2, st); }
    for (let i = 0; i < 26; i++) { const px = x - 18 + (i % 7) * 6, pz = z - 14 + Math.floor(i / 7) * 8, m = mat(c, cols[i % 5]); c.box(.9, 1.4, .6, px, Y + 1, pz, m); c.sph(.5, px, Y + 2, pz, m); }
    c.box(8, 6, 3, x + 18, Y + 3, z + 18, st); waterPool(c, x + 18, z + 22, 8, 4); label(c, 'ROCK GARDEN', x, Y + 2, z + 31, 0, 12, '#ffffff', '#6a5a3a'); return { open: true }; };
  L.roseGarden = (c, x, z) => { ground(c, x, z, 64, 64, '#6aa84f'); const cols = ['#d6336c', '#f06595', '#ffd43b', '#fa5252', '#ffffff'];
    for (let i = 0; i < 48; i++) { const px = x - 26 + (i % 8) * 7.4, pz = z - 24 + Math.floor(i / 8) * 9; c.box(4, .6, 2, px, Y + .3, pz, mat(c, '#3f7f3a'), false, true); c.box(3.6, .4, 1.6, px, Y + .8, pz, mat(c, cols[i % 5]), false, false); }
    waterPool(c, x, z, 8, 8); label(c, 'ZAKIR HUSSAIN ROSE GARDEN', x, Y + 2, z + 31, 0, 22, '#ffffff', '#3b5d2a'); return { open: true }; };
  L.fatehBurj = (c, x, z) => { const r = mat(c, RED), wh = mat(c, MARBLE); ground(c, x, z, 64, 64, '#7ea84a'); c.box(14, 3, 14, x, Y + 1.5, z, r); c.cyl(3.4, 4.6, 34, x, Y + 20, z, r, 8);
    for (let k = 1; k < 4; k++) c.cyl(5, 5, .8, x, Y + 3 + k * 8.5, z, wh, 8); chhatri(c, x, Y + 37, z, 2.6, wh); c.col(x, z, 7, 7); return { open: true }; };
  L.jagatjitPalace = (c, x, z) => { const p = mat(c, '#efe0c4'), rf = mat(c, '#6f8fa8'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(54, 14, 18, x, Y + 7, z - 10, p); c.box(56, 3, 20, x, Y + 15.5, z - 10, rf);
    c.box(16, 22, 20, x, Y + 11, z - 10, p); c.box(18, 4, 22, x, Y + 24, z - 10, rf); colonnade(c, x, z + .6, 30, 12, 10, p); waterPool(c, x, z + 18, 24, 10); c.col(x, z - 10, 27, 9); return { open: true }; };
  // Jallianwala Bagh: the walled garden, the narrow entrance lane, the martyrs' well and the flame-shaped memorial
  L.jallianwala = (c, x, z) => { const br = mat(c, '#9a5a40'), rd = mat(c, '#b5523a'); ground(c, x, z, 64, 64, '#6aa84f'); ringWall(c, x, z, 60, 60, 3, .8, br);
    const fl = new c.THREE.ConeGeometry(4, 18, 4); fl.translate(x, Y + 11, z - 8); c.add(fl, rd); c.box(10, 2, 10, x, Y + 1, z - 8, mat(c, '#d8cdb6')); c.cyl(3, 3, 1.4, x + 14, Y + .7, z + 10, mat(c, '#8c857a'), 14);
    c.box(3, 3, 6, x, Y + 1.5, z + 30, mat(c, '#8a6a50')); label(c, 'JALLIANWALA BAGH · 1919', x, Y + 2.4, z + 33, 0, 18, '#ffffff', '#5b2a20'); c.col(x, z - 8, 5, 5); return { open: true }; };
  L.gobindgarhFort = (c, x, z) => { const br = mat(c, '#b0563c'); ground(c, x, z, 64, 64, '#7ea84a'); ringWall(c, x, z, 54, 54, 9, 3, br); for (const [dx, dz] of [[-27, -27], [27, -27], [-27, 27], [27, 27]]) bastion(c, x + dx, z + dz, 4.5, 11, br);
    c.box(12, 12, 6, x, Y + 6, z + 27, br); arch(c, x, Y, z + 30.1, 5, 8, .4, mat(c, '#e3d3b0')); c.col(x, z - 27, 27, 2); c.col(x - 27, z, 2, 27); c.col(x + 27, z, 2, 27); return { open: true }; };
  L.partitionMuseum = (c, x, z) => { const rd = mat(c, '#b5604a'), cr = mat(c, '#efe0c4'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(50, 12, 20, x, Y + 6, z - 8, rd); c.box(20, 18, 20, x, Y + 9, z - 8, rd); c.cyl(2, 2, 6, x, Y + 21, z - 8, cr, 8); c.dome(2.4, x, Y + 24, z - 8, cr);
    colonnade(c, x, z + 2.6, 40, 8, 12, cr); label(c, 'PARTITION MUSEUM · TOWN HALL', x, Y + 2, z + 31, 0, 22, '#ffffff', '#5b4630'); c.col(x, z - 8, 25, 10); return { open: true }; };
  // Attari–Wagah: the border gates, a road between two stands of seats, and the flag
  L.wagahBorder = (c, x, z) => { const wh = mat(c, '#f2efe6'), or = mat(c, '#ff9933'), gr = mat(c, '#138808'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(10, .1, 64, x, Y + .08, z, mat(c, '#3a3c40'), false, true);
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { c.box(12, 1 + k * 1.2, 40, x + s * (12 + k * 2.4), Y + (1 + k * 1.2) / 2, z + 4, k % 2 ? or : wh); } c.box(14, 8, 2, x, Y + 4, z - 26, wh); arch(c, x, Y, z - 24.9, 8, 7, .3, gr);
    c.flag(x, Y, z - 30, true); label(c, 'ATTARI–WAGAH BORDER · RETREAT CEREMONY', x, Y + 9.5, z - 24.8, 0, 26, '#ffffff', '#1d4f2a'); c.col(x - 17, z + 4, 6, 20); c.col(x + 17, z + 4, 6, 20); return { open: true }; };
  L.qilaMubarak = (c, x, z) => { const br = mat(c, '#b98a5a'), wh = mat(c, '#efe0c4'); ground(c, x, z, 64, 64, '#bfae86'); ringWall(c, x, z, 56, 56, 11, 3, br);
    for (const [dx, dz] of [[-28, -28], [28, -28], [-28, 28], [28, 28]]) bastion(c, x + dx, z + dz, 4, 13, br); c.box(22, 14, 18, x, Y + 7, z - 6, wh); for (const s of [-1, 1]) chhatri(c, x + s * 8, Y + 14, z - 6, 1.8, wh);
    c.box(10, 13, 6, x, Y + 6.5, z + 28, br); arch(c, x, Y, z + 31.1, 5, 8, .4, wh); c.col(x, z - 6, 11, 9); c.col(x, z - 28, 28, 2); c.col(x - 28, z, 2, 28); c.col(x + 28, z, 2, 28); return { open: true }; };
  L.virasatKhalsa = (c, x, z) => { const sand = mat(c, '#d9c4a0'), steel = mat(c, '#a8b0b8'); ground(c, x, z, 64, 64, '#cfc8b8'); waterPool(c, x, z + 14, 50, 14);
    for (let i = 0; i < 5; i++) { c.box(8, 14 + (i % 2) * 4, 10, x - 22 + i * 11, Y + 7 + (i % 2) * 2, z - 10, sand); const g = new c.THREE.CylinderGeometry(6, 6, 9, 12, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); g.translate(x - 22 + i * 11, Y + 15 + (i % 2) * 4, z - 10); c.add(g, steel); }
    label(c, 'VIRASAT-E-KHALSA MUSEUM', x, Y + 2, z + 31, 0, 20, '#ffffff', '#33475b'); c.col(x, z - 10, 26, 6); return { open: true }; };

  /* ---------------- Himachal, Uttarakhand ---------------- */
  // Hill-station Mall Road: a pedestrian ridge with a bandstand, a clock post, railings and colonial shop fronts
  L.mallRoad = (c, x, z, o) => { const pav = mat(c, '#c9c0ad'), wood = c.M.wood, cr = mat(c, '#f1e6cf'), rf = mat(c, '#8a3a2a'); ground(c, x, z, 64, 64, '#c9c0ad');
    for (let i = 0; i < 5; i++) { c.box(11, 9, 8, x - 24 + i * 12, Y + 4.5, z - 26, cr); c.roof(12, 3, 9, x - 24 + i * 12, Y + 9, z - 26, rf); c.box(9, 2.6, .3, x - 24 + i * 12, Y + 3, z - 21.8, mat(c, ['#ffd23a', '#7fb7d9', '#e98b7f', '#9fd3a5', '#d9a0c8'][i])); }
    c.cyl(5, 5, .6, x, Y + .5, z + 4, pav, 16); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.cyl(.18, .18, 3.4, x + Math.cos(a) * 4.4, Y + 2.2, z + 4 + Math.sin(a) * 4.4, wood, 5); } c.cone(5.6, 2.4, x, Y + 5, z + 4, rf, 8);
    for (let i = 0; i < 14; i++) c.box(4, 1, .15, x - 26 + i * 4, Y + .8, z + 30, mat(c, '#2a2a2a')); c.box(1, 7, 1, x + 20, Y + 3.5, z + 10, mat(c, '#2a2a2a')); c.clock(x + 20, Y + 7, z + 10.6, 0);
    label(c, (o && o.arg) || 'MALL ROAD', x, Y + 2.2, z + 31.6, 0, 20, '#ffffff', '#5b4630'); c.col(x, z - 26, 30, 4); c.col(x, z + 4, 5, 5); return { open: true }; };
  L.viceregalLodge = (c, x, z) => { const st = mat(c, '#8a8478'), rf = mat(c, '#5a6a7a'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(46, 16, 22, x, Y + 8, z - 6, st); c.roof(48, 6, 24, x, Y + 16, z - 6, rf);
    c.box(10, 26, 10, x + 14, Y + 13, z - 6, st); c.roof(11, 5, 11, x + 14, Y + 26, z - 6, rf); for (let i = 0; i < 6; i++) c.box(1, 6, .4, x - 20 + i * 6, Y + 9, z + 5.2, mat(c, '#2e3a44')); c.flag(x + 14, Y + 31, z - 6); c.col(x, z - 6, 23, 11); return { open: true }; };
  // Forest Research Institute: the long red-brick Greco-Roman main building with arcades and a lawn
  L.fri = (c, x, z) => { const br = mat(c, '#a8563c'), cr = mat(c, '#efe0c4'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(62, 12, 14, x, Y + 6, z - 12, br); for (let i = -6; i <= 6; i++) arch(c, x + i * 4.6, Y, z - 4.9, 3.4, 5, .4, cr);
    for (const s of [-1, 0, 1]) { c.box(10, 16, 16, x + s * 26, Y + 8, z - 12, br); c.cyl(3, 3, 3, x + s * 26, Y + 17.5, z - 12, cr, 10); c.dome(3, x + s * 26, Y + 19, z - 12, cr); }
    for (let i = 0; i < 8; i++) c.tree(x - 28 + i * 8, z + 20, 1.2); c.col(x, z - 12, 31, 8); return { open: true }; };
  // Ram Jhula: a steel suspension footbridge over a strip of fast green river
  L.ramJhula = (c, x, z) => { const st = mat(c, '#c9ccd1'), or = mat(c, '#ff9a3c'); ground(c, x, z - 22, 64, 20, '#a99a7a'); ground(c, x, z + 22, 64, 20, '#a99a7a'); waterPool(c, x, z, 64, 26);
    for (const s of [-1, 1]) { c.box(3, 22, 3, x + s * 26, Y + 11, z - 2, or); c.box(3, 22, 3, x + s * 26, Y + 11, z + 2, or); c.box(3, 2, 7, x + s * 26, Y + 22, z, or); }
    for (let i = 0; i < 26; i++) { const t = i / 25, sag = Math.sin(t * Math.PI) * 1.4; c.box(2.1, .2, 3.4, x - 26 + t * 52, Y + 6 - sag, z, c.M.wood); }
    for (const dz of [-1.7, 1.7]) for (let k = 0; k < 8; k++) c.cable(x - 26 + k * 6.5, Y + 21 - Math.sin(k / 8 * Math.PI) * 13, z + dz, x - 19.5 + k * 6.5, Y + 21 - Math.sin((k + 1) / 8 * Math.PI) * 13, z + dz);
    label(c, 'RAM JHULA', x, Y + 2, z + 31, 0, 10, '#ffffff', '#5b4630'); return { open: true }; };
  L.steamShed = (c, x, z) => { const br = mat(c, '#8a4a34'), bk = mat(c, '#1e1e20'); ground(c, x, z, 64, 64, '#9a958c'); c.box(40, 10, 20, x, Y + 5, z - 14, br); c.roof(42, 4, 22, x, Y + 10, z - 14, mat(c, '#6f6a62'));
    for (const dx of [-8, 8]) { c.box(.3, .2, 60, x + dx - .8, Y + .3, z, c.M.steel); c.box(.3, .2, 60, x + dx + .8, Y + .3, z, c.M.steel); }
    c.box(3, 3, 9, x + 8, Y + 2.4, z + 14, bk); c.cyl(1.4, 1.4, 6, x + 8, Y + 3.4, z + 12, bk, 10); c.cyl(.5, .6, 2.6, x + 8, Y + 5.4, z + 16, bk, 8); c.box(3.2, 2.6, 3, x + 8, Y + 4.4, z + 9.5, mat(c, '#6a1f1a'));
    label(c, 'REWARI STEAM LOCO SHED', x, Y + 12.5, z - 3.6, 0, 20, '#ffffff', '#3b2a20'); c.col(x, z - 14, 20, 10); c.col(x + 8, z + 13, 2, 5); return { open: true }; };

  /* ---------------- Jammu and Kashmir, Ladakh ---------------- */
  L.bahuFort = (c, x, z) => { const st = mat(c, '#b09a7a'); ground(c, x, z, 64, 64, '#7ea84a'); ringWall(c, x, z, 52, 52, 10, 3, st); for (const [dx, dz] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) bastion(c, x + dx, z + dz, 4.4, 12, st);
    c.box(10, 12, 6, x, Y + 6, z + 26, st); arch(c, x, Y, z + 29.1, 5, 8, .4, mat(c, RED)); c.col(x, z - 26, 26, 2); c.col(x - 26, z, 2, 26); c.col(x + 26, z, 2, 26); return { open: true }; };
  L.mubarakMandi = (c, x, z) => { const p = mat(c, '#e6d3b0'), g = mat(c, '#7a8a5a'); ground(c, x, z, 64, 64, '#bfae86'); for (let i = 0; i < 3; i++) { c.box(16, 14 + i * 3, 18, x - 20 + i * 20, Y + 7 + i * 1.5, z - 10, p); c.roof(17, 4, 19, x - 20 + i * 20, Y + 14 + i * 3, z - 10, g); }
    for (let i = -3; i <= 3; i++) arch(c, x + i * 8, Y, z - .9, 5, 7, .3, mat(c, '#c9a96a')); c.col(x, z - 10, 30, 9); return { open: true }; };
  // Dal Lake houseboats: carved cedar houseboats and shikaras moored in a basin of lake water
  L.houseboatsDal = (c, x, z) => { const ced = mat(c, '#7a4a2a'), rf = mat(c, '#c9b48a'), sh = mat(c, '#c43c3c'); ground(c, x, z - 26, 64, 12, '#7ea84a'); waterPool(c, x, z + 6, 64, 52);
    for (let i = 0; i < 3; i++) { const bx = x - 20 + i * 20, bz = z - 6; c.box(5, 1.2, 18, bx, Y + .5, bz, ced); c.box(4.6, 3, 15, bx, Y + 2.6, bz, mat(c, '#a8703f')); c.roof(5.4, 1.6, 16, bx, Y + 4.1, bz, rf); c.box(5, .2, 3, bx, Y + 1.2, bz + 9, ced); c.col(bx, bz, 2.5, 9); }
    for (let i = 0; i < 4; i++) { const sx = x - 22 + i * 14, sz = z + 20; c.box(1.4, .5, 7, sx, Y + .5, sz, sh); c.box(1.2, .9, 2.4, sx, Y + 1.1, sz, mat(c, '#f2d16b')); }
    return { open: true }; };
  L.mughalGarden = (c, x, z, o) => { const ch = mat(c, '#a9653f'); ground(c, x, z, 64, 64, '#5f9a3e'); for (let i = 0; i < 4; i++) { c.box(52, .5 + i * .8, 14, x, Y + (i * .8 + .5) / 2, z - 21 + i * 14, mat(c, '#6aa84f')); waterPool(c, x, z - 21 + i * 14, 3, 13, Y + i * .8 + .4); }
    for (let i = 0; i < 8; i++) c.tree(x + (i % 2 ? 24 : -24), z - 26 + Math.floor(i / 2) * 15, 1.5, mat(c, '#8a2a1a')); c.box(10, 5, 6, x, Y + 5.5, z + 27, ch); c.roof(11, 2.4, 7, x, Y + 8, z + 27, mat(c, '#3f5a3a'));
    label(c, ((o && o.arg) || 'MUGHAL GARDEN').toUpperCase(), x, Y + 2, z + 31.6, 0, 16, '#ffffff', '#3b5d2a'); return { open: true }; };
  // Gulmarg Gondola: the base station and the cable climbing towards Apharwat
  L.gondola = (c, x, z) => { const st = mat(c, '#c9ccd1'), cab = mat(c, '#d43c2c'); ground(c, x, z, 64, 64, '#8fb05a'); c.box(18, 8, 14, x - 18, Y + 4, z, mat(c, '#a8703f')); c.roof(19, 4, 15, x - 18, Y + 8, z, mat(c, '#5a6a7a'));
    for (let i = 0; i < 3; i++) { c.box(1.2, 14 + i * 10, 1.2, x - 4 + i * 14, Y + 7 + i * 5, z, st); c.box(5, 1, 1, x - 4 + i * 14, Y + 14 + i * 10, z, st); }
    c.cable(x - 12, Y + 8, z - 1.5, x + 40, Y + 46, z - 1.5); c.cable(x - 12, Y + 8, z + 1.5, x + 40, Y + 46, z + 1.5); for (let k = 0; k < 3; k++) c.box(2.4, 2.4, 2.4, x + 2 + k * 12, Y + 10 + k * 9.5, z - 1.5, cab);
    label(c, 'GULMARG GONDOLA', x - 18, Y + 2, z + 7.6, 0, 14, '#ffffff', '#33475b'); c.col(x - 18, z, 9, 7); return { open: true }; };
  // Leh Palace: nine storeys of whitewashed mud brick stepping up a rock, with black-framed windows
  L.lehPalace = (c, x, z) => { const wh = mat(c, '#d9c9a8'), dk = mat(c, '#2a2420'), rock = mat(c, '#8a7a66'); ground(c, x, z, 64, 64, '#b59c7c');
    const r = new c.THREE.SphereGeometry(1, 12, 8); r.scale(30, 14, 22); r.translate(x, Y, z); c.add(r, rock);
    c.box(26, 30, 16, x, Y + 15 + 6, z - 2, wh); c.box(20, 6, 12, x, Y + 39, z - 2, wh); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) c.box(1.4, 1.6, .3, x - 10 + i * 4, Y + 12 + j * 7, z + 6.1, dk);
    c.box(27, .8, 17, x, Y + 36.4, z - 2, dk); c.col(x, z, 22, 14); c.far(); return { open: true }; };
  L.hallOfFame = (c, x, z) => { const st = mat(c, '#c9b08a'), ol = mat(c, '#4b5a3a'); ground(c, x, z, 64, 64, '#b59c7c'); c.box(40, 9, 18, x, Y + 4.5, z - 10, st); c.box(42, .8, 20, x, Y + 9.2, z - 10, ol);
    c.box(2.6, 1.6, 6, x - 12, Y + 1.1, z + 14, ol); c.cyl(.3, .3, 4, x - 12, Y + 2.2, z + 17, ol, 6); c.box(5, 2, 7, x + 12, Y + 1.3, z + 14, ol); c.flag(x, Y + 10, z - 10);
    label(c, 'HALL OF FAME · LEH', x, Y + 2, z + 31, 0, 16, '#ffffff', '#4b5a3a'); c.col(x, z - 10, 20, 9); return { open: true }; };
  L.warMemorial = (c, x, z) => { const st = mat(c, '#c9c0ad'), dk = mat(c, '#4b5a3a'); ground(c, x, z, 64, 64, '#b5a07c'); c.box(30, 1, 20, x, Y + .5, z, st);
    for (let i = 0; i < 9; i++) c.box(1.2, 3 + (i % 3), .5, x - 12 + i * 3, Y + 2.5, z + 6, dk); c.box(3, 10, 3, x, Y + 5, z - 6, st); c.flag(x, Y + 10, z - 6, true);
    label(c, 'KARGIL WAR MEMORIAL · DRASS', x, Y + 2.4, z + 12, 0, 22, '#ffffff', '#4b5a3a'); c.col(x, z, 15, 10); return { open: true }; };
  L.observatory = (c, x, z) => { const wh = mat(c, '#f2f2f0'); ground(c, x, z, 64, 64, '#b59c7c'); for (const [dx, dz, r] of [[-12, 0, 6], [12, -8, 4], [10, 14, 3.4]]) { c.cyl(r, r, r * 1.2, x + dx, Y + r * .6, z + dz, wh, 16); c.dome(r, x + dx, Y + r * 1.2, z + dz, wh); c.col(x + dx, z + dz, r, r); }
    label(c, 'INDIAN ASTRONOMICAL OBSERVATORY · HANLE', x, Y + 2, z + 26, 0, 26, '#ffffff', '#1d2a44'); return { open: true }; };

  /* ---------------- Uttar Pradesh ---------------- */
  // Rumi Darwaza: the huge Awadhi gateway, its top shaped like a turban crest
  L.rumiDarwaza = (c, x, z) => { const st = mat(c, '#e3cfa6'), st2 = mat(c, '#cdb48a'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(64, .1, 12, x, Y + .08, z, mat(c, '#8c8478'), false, true);
    for (const s of [-1, 1]) { c.box(10, 18, 10, x + s * 14, Y + 9, z, st); c.box(10, 3, 10, x + s * 24, Y + 6, z, st2); } c.box(18, 6, 9, x, Y + 18, z, st); c.box(10, 15, 9.4, x, Y + 7.5, z, c.M.dark);
    const sh = new c.THREE.Shape(); sh.moveTo(-10, 0); sh.quadraticCurveTo(-10, 14, 0, 18); sh.quadraticCurveTo(10, 14, 10, 0); sh.lineTo(-10, 0); const g = new c.THREE.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false }); g.translate(x, Y + 21, z - 1.5); c.add(g, st);
    c.cyl(1.2, 1.4, 4, x, Y + 40, z, st2, 8); c.dome(1.6, x, Y + 42, z, st); for (const s of [-1, 1]) c.cyl(.8, 1, 6, x + s * 9, Y + 24, z, st2, 8); c.col(x - 14, z, 5, 5); c.col(x + 14, z, 5, 5); return { open: true }; };
  L.residency = (c, x, z) => { const br = mat(c, '#a0644a'), br2 = mat(c, '#8a5440'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(34, 10, 16, x - 4, Y + 5, z - 8, br); for (let i = 0; i < 6; i++) c.box(4, 4 + (i % 3) * 2, 16.4, x - 18 + i * 6, Y + 11 + (i % 3), z - 8, i % 2 ? br : br2);
    c.cyl(3, 3, 18, x + 16, Y + 9, z - 10, br, 10); c.box(7, 1, 7, x + 16, Y + 18.5, z - 10, br2); c.flag(x + 16, Y + 19, z - 10); trees(c, x, z + 16, 8, 14, 1.1); c.col(x - 4, z - 8, 17, 8); return { open: true }; };
  L.ambedkarPark = (c, x, z) => { const pk = mat(c, '#c9a39a'), sd = mat(c, '#d9b98a'); ground(c, x, z, 64, 64, '#d9cdb8'); c.cyl(9, 10, 10, x, Y + 5, z - 8, pk, 16); c.dome(9, x, Y + 10, z - 8, sd);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.box(2.4, 6, 2.4, x + Math.cos(a) * 20, Y + 3, z - 8 + Math.sin(a) * 18, pk); c.sph(1.4, x + Math.cos(a) * 20, Y + 7, z - 8 + Math.sin(a) * 18, sd); }
    for (let i = 0; i < 6; i++) c.box(3, 2.2, 6, x - 15 + i * 6, Y + 1.1, z + 22, mat(c, '#9a9a96')); c.col(x, z - 8, 10, 10); return { open: true }; };
  L.charbagh = (c, x, z) => { const rd = mat(c, '#c95a3a'), wh = mat(c, '#f2e6cf'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(56, 10, 18, x, Y + 5, z - 8, rd); for (let i = -4; i <= 4; i++) arch(c, x + i * 5.8, Y, z + 1.1, 4, 6, .3, wh);
    for (const dx of [-24, -8, 8, 24]) { c.box(5, 16, 5, x + dx, Y + 8, z - 8, wh); onion(c, x + dx, Y + 16, z - 8, 2.4, wh); } label(c, 'LUCKNOW CHARBAGH', x, Y + 11, z + 1.4, 0, 18, '#ffffff', '#7a2a1a'); c.col(x, z - 8, 28, 9); return { open: true, poi: [] }; };
  // Taj Mahal: the white marble tomb on its plinth with four minarets, the long pool and the garden
  L.tajMahal = (c, x, z) => { const wh = mat(c, MARBLE), wh2 = mat(c, MARB2), rd = mat(c, RED); ground(c, x, z, 64, 64, '#5f9a3e');
    c.box(64, .2, 2, x, Y + .1, z + 31, rd); c.box(6, .2, 34, x, Y + .12, z + 14, mat(c, '#d8cdb6'), false, true); waterPool(c, x, z + 14, 2.6, 30, Y + .1); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) c.tree(x + s * 6, z + 2 + i * 5.6, .8, mat(c, '#2f5f2a'));
    c.box(40, 3, 30, x, Y + 1.5, z - 14, wh2); c.box(22, 14, 18, x, Y + 10, z - 14, wh); for (const s of [-1, 1]) { arch(c, x, Y + 3, z - 14 + s * 9.1, 8, 11, .3, wh2); arch(c, x + s * 11.1, Y + 3, z - 14, 8, 11, .3, wh2, Math.PI / 2); }
    for (const [dx, dz] of [[-9, -5], [9, -5], [-9, -23], [9, -23]]) { c.box(4, 10, 4, x + dx, Y + 8, z + dz, wh); chhatri(c, x + dx, Y + 17, z + dz, 1.6, wh); }
    c.cyl(6, 6, 4, x, Y + 19, z - 14, wh, 18); onion(c, x, Y + 21, z - 14, 6.4, wh); for (const [dx, dz] of [[-18, -1], [18, -1], [-18, -27], [18, -27]]) minaret(c, x + dx, Y + 3, z + dz, 22, 1.4, wh);
    c.col(x, z - 14, 20, 15); return { open: true }; };
  L.agraFort = (c, x, z) => { const r = mat(c, RED), r2 = mat(c, RED2), wh = mat(c, MARBLE); ground(c, x, z, 64, 64, '#7ea84a'); ringWall(c, x, z, 60, 60, 14, 4, r); crenel(c, x, z, 60, 60, 14, r2, 3);
    for (const [dx, dz] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) bastion(c, x + dx, z + dz, 5, 16, r); c.box(16, 18, 8, x, Y + 9, z + 30, r); arch(c, x, Y, z + 34.1, 7, 12, .4, r2); for (const s of [-1, 1]) chhatri(c, x + s * 6, Y + 18, z + 30, 2, wh);
    c.box(18, 6, 12, x - 8, Y + 3, z - 12, wh); c.dome(2.4, x - 14, Y + 6, z - 12, wh); c.col(x, z - 30, 30, 3); c.col(x - 30, z, 3, 30); c.col(x + 30, z, 3, 30); c.col(x - 8, z - 12, 9, 6); return { open: true }; };
  // Buland Darwaza: the giant gateway at Fatehpur Sikri, up a flight of steps
  L.bulandDarwaza = (c, x, z) => { const r = mat(c, RED), wh = mat(c, MARBLE); ground(c, x, z, 64, 64, '#bfae86'); for (let i = 0; i < 8; i++) c.box(30 - i, .8, 20 - i * 1.6, x, Y + .4 + i * .8, z + 10 - i * .8, r);
    c.box(26, 34, 10, x, Y + 6.4 + 17, z - 6, r); c.box(14, 24, 10.4, x, Y + 6.4 + 12, z - 6, c.M.dark); for (let i = 0; i < 5; i++) chhatri(c, x - 10 + i * 5, Y + 40.4, z - 6, 1.4, r, wh);
    c.box(64, 10, 3, x, Y + 5, z - 22, r); for (const s of [-1, 1]) c.box(4, 20, 4, x + s * 13, Y + 10 + 6.4, z - 6, r); c.col(x, z - 6, 13, 5); c.col(x, z - 22, 32, 2); return { open: true }; };
  L.university = (c, x, z, o) => { const br = mat(c, '#b5604a'), cr = mat(c, '#efe0c4'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(48, 12, 16, x, Y + 6, z - 12, br); c.box(14, 22, 16, x, Y + 11, z - 12, br); onion(c, x, Y + 22, z - 12, 4, cr);
    for (const s of [-1, 1]) { c.box(4, 16, 4, x + s * 22, Y + 8, z - 12, cr); c.dome(2.4, x + s * 22, Y + 16, z - 12, cr); } for (let i = 0; i < 6; i++) c.tree(x - 25 + i * 10, z + 16, 1.2);
    label(c, (o && o.arg) || 'UNIVERSITY', x, Y + 2, z + 31, 0, 24, '#ffffff', '#5b2a20'); c.col(x, z - 12, 24, 8); return { open: true }; };
  L.razaLibrary = (c, x, z) => { const wh = mat(c, '#f2ead8'), gr = mat(c, '#7aa86a'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(46, 14, 22, x, Y + 7, z - 8, wh); c.box(48, 1, 24, x, Y + 14.5, z - 8, gr);
    colonnade(c, x, z + 3.6, 30, 10, 12, wh); for (const s of [-1, 1]) { c.cyl(2.6, 2.6, 8, x + s * 22, Y + 18, z - 8, wh, 10); c.dome(2.8, x + s * 22, Y + 22, z - 8, gr); } waterPool(c, x, z + 20, 16, 10); c.col(x, z - 8, 23, 11); return { open: true }; };
  L.jhumka = (c, x, z) => { const gold = c.M.gold, st = mat(c, '#d8cdb6'); ground(c, x, z, 64, 64, '#cfc8b8'); const g = new c.THREE.CircleGeometry(12, 24); g.rotateX(-Math.PI / 2); g.translate(x, Y + .08, z); c.add(g, mat(c, '#6aa84f'), false, true);
    c.box(1.2, 12, 1.2, x, Y + 6, z, st); c.cyl(3, .4, 4, x, Y + 9, z, gold, 12); c.sph(1.2, x, Y + 13, z, gold); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.sph(.4, x + Math.cos(a) * 2.8, Y + 6.6, z + Math.sin(a) * 2.8, gold); }
    label(c, 'JHUMKA CHOWK · BAREILLY', x, Y + 2, z + 14, 0, 16, '#ffffff', '#7a2a1a'); c.col(x, z, 2, 2); return { open: true }; };
  L.latachowk = (c, x, z) => { const wd = mat(c, '#b8742a'), gold = c.M.gold; ground(c, x, z, 64, 64, '#cfc8b8'); const g = new c.THREE.CircleGeometry(14, 28); g.rotateX(-Math.PI / 2); g.translate(x, Y + .08, z); c.add(g, mat(c, '#6aa84f'), false, true);
    const n = new c.THREE.BoxGeometry(1.4, 14, 1.2); n.rotateZ(.35); n.translate(x, Y + 8, z); c.add(n, wd); c.sph(3.2, x - 2.6, Y + 2.6, z, wd); c.sph(2.2, x + 2.8, Y + 14, z, wd); for (let k = 0; k < 4; k++) c.cable(x - 2.4, Y + 3 + k * .3, z, x + 2.4, Y + 13.8, z + (k - 1.5) * .3);
    label(c, 'LATA MANGESHKAR CHOWK', x, Y + 2, z + 16, 0, 18, '#ffffff', '#7a2a1a'); c.col(x, z, 3, 3); return { open: true }; };
  L.longPlatform = (c, x, z) => { const cr = mat(c, '#d8cdb6'), rf = mat(c, '#8a9099'); ground(c, x, z, 64, 64, '#9a958c'); c.box(6, 1, 64, x - 8, Y + .5, z, cr); c.box(6, 1, 64, x + 8, Y + .5, z, cr);
    for (let i = 0; i < 6; i++) { c.box(.4, 5, .4, x - 8, Y + 3.5, z - 28 + i * 11, c.M.steel); c.box(.4, 5, .4, x + 8, Y + 3.5, z - 28 + i * 11, c.M.steel); } c.box(7, .4, 64, x - 8, Y + 6.2, z, rf); c.box(7, .4, 64, x + 8, Y + 6.2, z, rf);
    for (const dx of [-14, 0, 14]) { c.box(.15, .15, 64, x + dx - .75, Y + .1, z, c.M.steel); c.box(.15, .15, 64, x + dx + .75, Y + .1, z, c.M.steel); } label(c, 'GORAKHPUR · ONE OF THE LONGEST PLATFORMS', x - 8, Y + 4.6, z - 30, 0, 22, '#ffffff', '#1d3f9a'); return { open: true }; };
  L.shahiBridge = (c, x, z) => { const st = mat(c, '#a89a80'); waterPool(c, x, z, 64, 28); c.box(10, 1.4, 64, x, Y + 5, z, st);
    for (let i = -3; i <= 3; i++) { c.box(10.4, 5, 2.4, x, Y + 2.4, z + i * 9, st); c.box(3, 3, 3, x - 5.6, Y + 7, z + i * 9, st); c.dome(1.5, x - 5.6, Y + 8.5, z + i * 9, st); } c.col(x - 6.2, z, 1, 30); c.col(x + 6.2, z, 1, 30); return { open: true }; };
  // Malviya Bridge: the double-deck rail and road truss bridge over the Ganga
  L.malviyaBridge = (c, x, z) => { const st = mat(c, '#7a6a5a'), conc = mat(c, '#b9b4ab'); waterPool(c, x, z, 64, 34);
    for (let i = -2; i <= 2; i++) c.box(4, 10, 6, x + i * 14, 5, z, conc); c.box(64, .8, 8, x, 10.4, z, conc); c.box(64, .8, 8, x, 16.4, z, st); c.col(x, z, 32, 4);
    for (let i = 0; i < 16; i++) for (const s of [-1, 1]) { const g = new c.THREE.BoxGeometry(.3, 6.4, .3); g.rotateZ(i % 2 ? .6 : -.6); g.translate(x - 30 + i * 4, 13.4, z + s * 4); c.add(g, st); } return { open: true }; };
  L.anandBhawan = (c, x, z) => { const cr = mat(c, '#e9dcc0'), bl = mat(c, '#6f8fa8'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(40, 8, 18, x, Y + 4, z - 8, cr); c.box(40, 7, 18, x, Y + 11.5, z - 8, cr);
    for (let i = -4; i <= 4; i++) { c.cyl(.5, .5, 7, x + i * 4.6, Y + 3.5, z + 1.6, cr, 8); c.cyl(.5, .5, 6, x + i * 4.6, Y + 11, z + 1.6, cr, 8); } c.box(42, .6, 20, x, Y + 15.3, z - 8, bl);
    c.box(42, .6, 3, x, Y + 7.3, z + 1.8, bl); label(c, 'ANAND BHAWAN', x, Y + 2, z + 31, 0, 14, '#ffffff', '#33475b'); c.col(x, z - 8, 20, 9); return { open: true }; };

  /* ---------------- Madhya Pradesh ---------------- */
  // Gwalior Fort: sandstone cliff walls and the Man Mandir palace with blue tiles and domed towers
  L.gwaliorFort = (c, x, z) => { const rock = mat(c, '#8a7a66'), st = mat(c, '#d9c39a'), bl = mat(c, '#3f8fa8'); ground(c, x, z, 64, 64, '#9a8a6a');
    c.box(62, 14, 44, x, Y + 7, z - 6, rock); c.box(52, 10, 6, x, Y + 19, z + 13, st); for (let i = 0; i < 12; i++) c.box(3, .8, .3, x - 22 + i * 4, Y + 20, z + 16.2, bl);
    for (let i = 0; i < 5; i++) { c.cyl(3, 3.4, 14, x - 24 + i * 12, Y + 21, z + 13, st, 12); c.dome(3.4, x - 24 + i * 12, Y + 28, z + 13, st); }
    c.box(30, 8, 20, x, Y + 18, z - 8, st); label(c, 'GWALIOR FORT · MAN MANDIR', x, Y + 2, z + 31, 0, 22, '#ffffff', '#5b4630'); c.col(x, z - 6, 31, 22); c.far(); return { open: true }; };
  L.jaiVilas = (c, x, z) => { const wh = mat(c, '#f2ead8'), gd = mat(c, '#d9b26a'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(56, 12, 22, x, Y + 6, z - 8, wh); c.box(56, 10, 22, x, Y + 17, z - 8, wh);
    for (let i = -5; i <= 5; i++) { c.cyl(.5, .5, 11, x + i * 5, Y + 5.5, z + 3.6, wh, 8); c.cyl(.45, .45, 9, x + i * 5, Y + 16.5, z + 3.6, wh, 8); } c.box(58, 1.2, 24, x, Y + 22.6, z - 8, gd);
    waterPool(c, x, z + 20, 20, 10); c.col(x, z - 8, 28, 11); return { open: true }; };
  L.tansenTomb = (c, x, z) => { const st = mat(c, '#c9b48a'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(22, 3, 22, x, Y + 1.5, z, st); c.box(14, 8, 14, x, Y + 7, z, st); for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) arch(c, x + i * 4.2, Y + 3, z + s * 7.1, 3, 5, .3, st);
    c.dome(6, x, Y + 11, z, st); trees(c, x, z, 10, 28, 1); label(c, "TANSEN'S TOMB", x, Y + 2, z + 31, 0, 14, '#ffffff', '#5b4630'); c.col(x, z, 11, 11); return { open: true }; };
  L.datiaPalace = (c, x, z) => { const st = mat(c, '#b8a07a'); ground(c, x, z, 64, 64, '#bfae86'); c.box(46, 30, 46, x, Y + 15, z, st); for (let i = 0; i < 5; i++) c.box(46.4, .8, 46.4, x, Y + 6 + i * 6, z, mat(c, '#9c8664'));
    c.box(14, 10, 14, x, Y + 35, z, st); onion(c, x, Y + 40, z, 5, st); for (const [dx, dz] of [[-20, -20], [20, -20], [-20, 20], [20, 20]]) chhatri(c, x + dx, Y + 30, z + dz, 2.4, st); c.col(x, z, 23, 23); c.far(); return { open: true }; };
  L.orchhaPalace = (c, x, z) => { const st = mat(c, '#c9a77a'), gr = mat(c, '#6f8a6a'); ground(c, x, z, 64, 64, '#9fae55'); c.box(40, 20, 40, x, Y + 10, z, st); for (const [dx, dz] of [[-17, -17], [17, -17], [-17, 17], [17, 17], [0, 0]]) { c.box(7, 8, 7, x + dx, Y + 24, z + dz, st); onion(c, x + dx, Y + 28, z + dz, 3.4, gr); }
    for (let i = -3; i <= 3; i++) arch(c, x + i * 5, Y + 2, z + 20.1, 3.4, 6, .3, mat(c, '#a8865a')); c.col(x, z, 20, 20); c.far(); return { open: true }; };
  L.diamondMine = (c, x, z) => { const pit = mat(c, '#8a7a5a'), wtr = c.M.waterBox; ground(c, x, z, 64, 64, '#a8946a'); for (let i = 0; i < 4; i++) c.cyl(28 - i * 6, 28 - i * 6, .2, x, Y - i * .2, z, i % 2 ? pit : mat(c, '#9a8a62'), 20);
    for (let i = 0; i < 6; i++) { c.box(2, 1, 2, x - 16 + i * 6, Y + .5, z + 22, mat(c, '#c9b88a')); c.box(1.6, .6, 1, x - 16 + i * 6, Y + 1.2, z + 22, mat(c, '#5a7a9a')); }
    label(c, 'PANNA DIAMOND MINES · LEASE A PLOT', x, Y + 2, z + 30, 0, 22, '#ffffff', '#33475b'); return { open: true }; };
  L.tribalMuseum = (c, x, z) => { const ea = mat(c, '#b88a5a'), ea2 = mat(c, '#9a6a44'); ground(c, x, z, 64, 64, '#bfae86'); const g = new c.THREE.CylinderGeometry(24, 26, 10, 18, 1, false, 0, Math.PI * 1.4); g.translate(x, Y + 5, z - 4); c.add(g, ea);
    c.cyl(25, 25, .8, x, Y + 10.4, z - 4, ea2, 18); for (let i = 0; i < 6; i++) c.box(3, 4, .4, x - 14 + i * 6, Y + 3, z + 21.8, mat(c, ['#c94f4f', '#e0b040', '#4f7fc9'][i % 3])); label(c, 'TRIBAL MUSEUM · BHOPAL', x, Y + 2, z + 30, 0, 18, '#ffffff', '#5b4630'); c.col(x, z - 4, 24, 24); return { open: true }; };
  L.gauharMahal = (c, x, z) => { const st = mat(c, '#d9c4a0'), wd = mat(c, '#8a5a3a'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(48, 9, 40, x, Y + 4.5, z, st); c.box(30, 8, 22, x, Y + 13, z, st); for (let i = -4; i <= 4; i++) c.box(4, 4, .3, x + i * 5, Y + 6, z + 20.2, wd);
    c.box(50, .8, 42, x, Y + 9.4, z, wd); c.col(x, z, 24, 20); return { open: true }; };
  L.rajwada = (c, x, z) => { const st = mat(c, '#d9c4a0'), wd = mat(c, '#7a4a2a'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(44, 10, 16, x, Y + 5, z - 6, st); for (let k = 0; k < 4; k++) { c.box(36 - k * 4, 4.5, 15, x, Y + 12 + k * 4.5, z - 6, k % 2 ? wd : st); for (let i = -3; i <= 3; i++) c.box(1.6, 2.2, .3, x + i * 4, Y + 12 + k * 4.5, z + 1.7, mat(c, '#2a2420')); }
    c.box(8, 10, 1, x, Y + 5, z + 2.3, c.M.dark); label(c, 'RAJWADA', x, Y + 2, z + 31, 0, 10, '#ffffff', '#7a2a1a'); c.col(x, z - 6, 22, 8); return { open: true }; };
  L.lalBaghPalace = (c, x, z) => { const p = mat(c, '#efe0c4'), rf = mat(c, '#7a6a5a'); ground(c, x, z, 64, 64, '#6aa84f'); c.box(46, 14, 20, x, Y + 7, z - 8, p); c.box(48, 2, 22, x, Y + 15, z - 8, rf); colonnade(c, x, z + 3, 24, 12, 8, p);
    c.box(12, 8, 6, x, Y + 4, z + 28, mat(c, '#2a2a2a')); for (const s of [-1, 1]) c.box(2, 10, 2, x + s * 8, Y + 5, z + 28, p); waterPool(c, x, z + 16, 14, 8); c.col(x, z - 8, 23, 10); return { open: true }; };
  // Vedh Shala (Jantar Mantar), Ujjain: old astronomical instruments in a yard
  L.vedhShala = (c, x, z) => { const st = mat(c, '#e8dcc4'); ground(c, x, z, 64, 64, '#cfc8b8'); c.wedge(4, 14, 22, x - 10, Y, z - 8, st); c.cyl(9, 9, 1.4, x + 14, Y + .7, z + 10, st, 20); c.box(1, 6, 6, x + 14, Y + 3, z + 10, st);
    c.box(10, 2, 10, x - 14, Y + 1, z + 16, st); label(c, 'VEDH SHALA · UJJAIN', x, Y + 2, z + 31, 0, 16, '#ffffff', '#5b4630'); c.col(x - 8, z - 8, 4, 11); return { open: true }; };
  // Jahaz Mahal: the long "ship palace" between two tanks at Mandu
  L.jahazMahal = (c, x, z) => { const st = mat(c, '#b8a07a'); ground(c, x, z, 64, 64, '#7ea84a'); waterPool(c, x - 22, z, 18, 60); waterPool(c, x + 22, z, 18, 60); c.box(22, 10, 58, x, Y + 5, z, st);
    for (let i = -3; i <= 3; i++) { arch(c, x - 11.1, Y, z + i * 7.6, 5, 7, .3, st, Math.PI / 2); arch(c, x + 11.1, Y, z + i * 7.6, 5, 7, .3, st, Math.PI / 2); } for (let i = 0; i < 3; i++) chhatri(c, x, Y + 10, z - 18 + i * 18, 2.2, st);
    c.col(x, z, 11, 29); return { open: true }; };
  L.ahilyaFort = (c, x, z) => { const st = mat(c, '#b8a07a'); waterPool(c, x, z + 20, 64, 24); for (let i = 0; i < 6; i++) c.box(64, .6, 3, x, Y + i * .6, z + 6 - i * 3, st);
    c.box(50, 22, 20, x, Y + 11 + 3, z - 18, st); for (let i = -4; i <= 4; i++) arch(c, x + i * 5.4, Y + 4, z - 7.9, 3.6, 6, .3, mat(c, '#9c8664')); for (const s of [-1, 1]) chhatri(c, x + s * 20, Y + 25, z - 18, 2.4, st); c.col(x, z - 18, 25, 10); return { open: true }; };
  // Marble Rocks: white marble cliffs rising out of a green Narmada gorge
  L.marbleRocks = (c, x, z) => { const wm = mat(c, '#ecebe6'), wm2 = mat(c, '#d9d8d2'); waterPool(c, x, z, 64, 18);
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const g = new c.THREE.BoxGeometry(11, 18 + (i % 3) * 5, 10); g.rotateY((i % 2 ? .12 : -.08) * s); g.translate(x - 27 + i * 11, 9, z + s * 15); c.add(g, i % 2 ? wm : wm2); c.col(x - 27 + i * 11, z + s * 15, 5.5, 5); }
    for (let i = 0; i < 3; i++) c.box(1.4, .5, 6, x - 12 + i * 12, Y + .5, z, mat(c, '#c43c3c')); return { open: true }; };
  L.whiteTigerSafari = (c, x, z) => { ground(c, x, z, 64, 64, '#7ea84a'); for (let i = 0; i < 14; i++) c.box(4, 3, .2, x - 28 + i * 4.3, Y + 1.5, z - 28, c.M.steel); trees(c, x, z, 12, 26, 1.1);
    for (let k = 0; k < 2; k++) { const tx = x - 6 + k * 12, tz = z + 2; c.box(3, 1.4, 1.2, tx, Y + 1.2, tz, mat(c, '#f4f4f0')); c.box(1.1, 1, 1, tx + 1.9, Y + 1.7, tz, mat(c, '#f4f4f0')); for (let s = 0; s < 4; s++) c.box(.2, 1.42, 1.22, tx - 1 + s * .6, Y + 1.2, tz, mat(c, '#2a2a2a')); }
    label(c, 'WHITE TIGER SAFARI · MUKUNDPUR', x, Y + 2, z + 31, 0, 22, '#ffffff', '#3b5d2a'); return { open: true }; };
  L.coalMine = (c, x, z) => { const coal = mat(c, '#2a2826'), earth = mat(c, '#6e5a48'); ground(c, x, z, 64, 64, '#6e5a48'); for (let i = 0; i < 4; i++) c.box(60 - i * 10, .6, 60 - i * 10, x, Y - .3 - i * .6, z, i % 2 ? coal : earth);
    for (const s of [-1, 1]) { c.box(4, 3, 7, x + s * 14, Y + 1.5, z + 8, mat(c, '#e0b040')); c.box(4.4, 2, 4, x + s * 14, Y + 3.6, z + 5, mat(c, '#c9a030')); } c.box(8, 5, 8, x + 20, Y + 2.5, z - 20, coal); c.cone(5, 6, x - 20, Y + 3, z - 20, coal, 8); return { open: true }; };
  L.ironMine = (c, x, z) => { const ore = mat(c, '#8a3a2a'), earth = mat(c, '#a0583a'); ground(c, x, z, 64, 64, '#a0583a'); for (let i = 0; i < 4; i++) c.box(60 - i * 10, .6, 60 - i * 10, x, Y - .3 - i * .6, z, i % 2 ? ore : earth);
    for (const s of [-1, 1]) c.box(4, 3, 8, x + s * 14, Y + 1.5, z + 10, mat(c, '#e0b040')); c.cone(6, 7, x - 18, Y + 3.5, z - 18, ore, 8); return { open: true }; };

  /* ---------------- Chhattisgarh, Odisha ---------------- */
  L.mantralaya = (c, x, z, o) => { const gl = c.M.glassBox || mat(c, '#8fb3c9'), cr = mat(c, '#e8e2d6'); ground(c, x, z, 64, 64, '#cfc8b8'); c.box(40, 26, 16, x, Y + 13, z - 10, cr); for (let i = 0; i < 8; i++) c.box(3.6, 22, .3, x - 17 + i * 4.8, Y + 13, z - 1.8, gl);
    c.box(44, 1, 20, x, Y + 26.5, z - 10, cr); c.flag(x, Y + 27, z - 10); label(c, (o && o.arg) || 'MANTRALAYA · NAVA RAIPUR', x, Y + 2, z + 30, 0, 22, '#ffffff', '#33475b'); c.col(x, z - 10, 20, 8); return { open: true }; };
  L.jungleSafari = (c, x, z) => { ground(c, x, z, 64, 64, '#6a9a44'); trees(c, x, z, 18, 28, 1.2); c.box(4, 6, 4, x - 22, Y + 3, z + 26, c.M.wood); c.box(4, 6, 4, x + 22, Y + 3, z + 26, c.M.wood); c.box(48, 2, 4, x, Y + 7, z + 26, c.M.wood);
    label(c, 'NAVA RAIPUR JUNGLE SAFARI', x, Y + 9, z + 28.2, 0, 22, '#ffffff', '#3b5d2a'); waterPool(c, x + 8, z - 8, 18, 12); return { open: true }; };
  L.purkhouti = (c, x, z) => { ground(c, x, z, 64, 64, '#a8946a'); for (let i = 0; i < 6; i++) { const hx = x - 20 + (i % 3) * 20, hz = z - 12 + Math.floor(i / 3) * 22; c.box(9, 4, 7, hx, Y + 2, hz, mat(c, ['#c8a46a', '#b88a5a', '#d8b88a'][i % 3])); c.roof(10, 2.4, 8, hx, Y + 4, hz, mat(c, '#8a4a2a')); c.col(hx, hz, 4.5, 3.5); }
    label(c, 'PURKHOUTI MUKTANGAN', x, Y + 2, z + 31, 0, 18, '#ffffff', '#5b4630'); return { open: true }; };
  L.maitriBagh = (c, x, z) => { ground(c, x, z, 64, 64, '#6aa84f'); trees(c, x, z, 14, 28, 1.1); waterPool(c, x, z, 20, 14); c.box(6, 6, 6, x, Y + 3, z, mat(c, '#c9a46a')); c.dome(3, x, Y + 6, z, mat(c, '#e8e2d6'));
    label(c, 'MAITRI BAGH ZOO', x, Y + 2, z + 31, 0, 14, '#ffffff', '#3b5d2a'); return { open: true }; };
  // Udayagiri and Khandagiri: two low rocky hills honeycombed with old rock-cut caves
  L.khandagiri = (c, x, z) => { const rock = mat(c, '#a88a6a'), dk = c.M.dark; ground(c, x, z, 64, 64, '#7ea84a');
    for (const [dx, s] of [[-14, 1], [14, .8]]) { const g = new c.THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(16 * s, 14 * s, 14 * s); g.translate(x + dx, Y, z); c.add(g, rock);
      for (let i = 0; i < 5; i++) c.box(2.4, 2.2, .4, x + dx - 8 * s + i * 4 * s, Y + 3 + (i % 2) * 3, z + 12.6 * s, dk); c.col(x + dx, z, 14 * s, 12 * s); } return { open: true }; };
  L.hockeyStadium = (c, x, z) => { const bl = mat(c, '#2f6fd0'), conc = mat(c, '#c9c4bb'); c.box(46, .1, 30, x, Y + .05, z, bl, false, true); c.box(40, .02, 25, x, Y + .1, z, mat(c, '#3f9a45'), false, true);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) c.box(54, 1 + k * 1.4, 4, x, Y + (1 + k * 1.4) / 2, z + s * (17 + k * 3), k % 2 ? conc : mat(c, '#f2c14e')); c.box(56, 1, 18, x, Y + 14, z - 25, mat(c, '#e8e8e8'));
    label(c, 'BIRSA MUNDA HOCKEY STADIUM', x, Y + 9, z + 30, 0, 24, '#ffffff', '#1d3f9a'); c.col(x, z + 24, 28, 7); c.col(x, z - 24, 28, 7); return { open: true }; };

  /* ---------------- free-standing: passes, the tunnel, the bridge, Magnetic Hill ---------------- */
  // A pass board: the yellow-and-black BRO style sign on its stone plinth, prayer-flag strings, a little cairn
  L.passSign = (c, x, z, o) => { const st = mat(c, '#8a7a66'); c.box(6, 2, 2, x, 1, z, st); c.box(5.6, 3, .3, x, 3.6, z, mat(c, '#f2c94c')); label(c, (o && o.arg) || 'PASS', x, 3.6, z + .2, 0, 5.4, '#1a1a1a', '#f2c94c');
    const cols = ['#2f6fd0', '#f4f4f0', '#d0342c', '#3aa66b', '#f2c94c']; for (let i = 0; i < 10; i++) c.box(.6, .5, .05, x - 6 + i * 1.3, 5.2 - Math.abs(i - 4.5) * .15, z - 2, mat(c, cols[i % 5]));
    c.cone(1.6, 2.4, x + 5, 1.2, z + 1, st, 6); c.col(x, z, 3, 1); c.far(); return {}; };
  L.atalTunnel = (c, x, z) => { const conc = mat(c, '#b9b3a8'), rock = mat(c, '#7d6f62'); const r = new c.THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); r.scale(40, 36, 30); r.translate(x, 0, z - 20); c.add(r, rock);
    c.box(16, 10, 6, x, 5, z + 6, conc); c.box(9, 7, 6.4, x, 3.5, z + 6, c.M.dark); label(c, 'ATAL TUNNEL · 9.02 KM', x, 9, z + 9.3, 0, 12, '#ffffff', '#33475b'); c.col(x, z - 20, 34, 24); c.far(); return {}; };
  // Chenab Bridge: the steel arch of the world's highest railway bridge over a gorge
  L.chenabBridge = (c, x, z) => { const st = mat(c, '#d0342c'), conc = mat(c, '#b9b4ab'), rock = mat(c, '#7d6f62'); for (const s of [-1, 1]) { const g = new c.THREE.BoxGeometry(30, 50, 50); g.translate(x + s * 70, 25, z); c.add(g, rock); c.col(x + s * 70, z, 15, 25); }
    const N = 24; for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; const a0 = Math.PI * t0, a1 = Math.PI * t1; const x0 = x - 55 + t0 * 110, x1 = x - 55 + t1 * 110, y0 = 10 + Math.sin(a0) * 34, y1 = 10 + Math.sin(a1) * 34;
      const L2 = Math.hypot(x1 - x0, y1 - y0); const g = new c.THREE.BoxGeometry(L2, 2, 3); g.rotateZ(Math.atan2(y1 - y0, x1 - x0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, z); c.add(g, st); }
    c.box(140, 1.6, 6, x, 48, z, conc); for (let i = -5; i <= 5; i++) { const h = 48 - (10 + Math.sin(Math.PI * (i + 5.5) / 11) * 34); if (h > 1) c.box(1, h, 1, x + i * 10, 48 - h / 2, z, st); }
    label(c, 'CHENAB RAIL BRIDGE', x, 51, z + 3.2, 0, 16, '#ffffff', '#d0342c'); c.far(); return {}; };
  // Magnetic Hill: the yellow board that says your car will roll uphill, and a painted box on the road
  L.magneticHill = (c, x, z) => { c.box(.3, 4, .3, x - 3, 2, z, c.M.pole); c.box(.3, 4, .3, x + 3, 2, z, c.M.pole); c.box(7, 3, .2, x, 4.4, z, mat(c, '#f2c94c')); label(c, 'MAGNETIC HILL · PARK IN THE BOX', x, 4.4, z + .15, 0, 6.6, '#1a1a1a', '#f2c94c');
    c.far(); return {}; };
  L.icestupa = (c, x, z) => { const ice = mat(c, '#cfe6f2'); c.cone(6, 16, x, 8, z, ice, 10); c.cone(3, 6, x + 9, 3, z + 4, ice, 8); c.col(x, z, 5, 5); return {}; };
})();
