// Tea stalls at the food spots (Beta v1.01.03), built in the local style:
// Kerala thattukada / chaya kada (a tiled hip roof, a glass snack cabinet, a brass tea urn, bananas hanging),
// Karnataka and Goa tea angadi, Maharashtra tapri (tin roof and tarpaulin), Gujarat chai ni lari (a handcart under
// an umbrella), Rajasthan chai ki thadi (a stone platform under a cloth canopy). The stall keeper (a few, near you)
// pours tea; tea and snacks come from the stall's menu (walk up and press E).
window.BBFeatures.push(function (bb) {
  const T = bb.THREE; const MC = {}; const mat = c => MC[c] || (MC[c] = bb.LMat(c));
  const NAMES = { TN: 'TEA KADAI', PY: 'TEA KADAI', AP: 'TEA KOTTU', TG: 'IRANI CHAI', KL: 'CHAYA KADA', KA: 'TEA ANGADI', GA: 'CHAI STALL', MH: 'CHAHA TAPRI', GJ: 'CHAI NI LARI', RJ: 'CHAI KI THADI', DD: 'TEA STALL', DN: 'TEA STALL',
    DL: 'CHAI STALL', HR: 'CHAI KI DUKAN', PB: 'CHAH DI HATTI', CH: 'CHAI STALL', HP: 'CHAI DHABA', UK: 'CHAI DHABA', JK: 'KAHWA STALL', LA: 'BUTTER TEA', UP: 'CHAI KI TAPRI', MP: 'CHAI TAPRI', CG: 'CHAI TAPRI', OD: 'CHA DOKANA' };
  const stalls = [];
  function geo(g, w, h, d, x, y, z, ry, m, rx) { const b = new T.BoxGeometry(w, h, d); if (rx) b.rotateX(rx); b.rotateY(ry); b.translate(x, y, z); bb.addStatic(b, mat(m)); }
  function cyl(r1, r2, h, x, y, z, m, seg) { const c = new T.CylinderGeometry(r1, r2, h, seg || 10); c.translate(x, y, z); bb.addStatic(c, mat(m)); }
  const off = (x, z, ry, lx, lz) => [x + Math.cos(ry) * lx + Math.sin(ry) * lz, z - Math.sin(ry) * lx + Math.cos(ry) * lz];
  function build(p) { const st = (p.zone && p.zone.st) || bb.stateAt(p.x, p.z); const ry = p.rot || 0; const back = -3.2; const [cx, cz] = off(p.x, p.z, ry, 0, back);
    if (bb.isWater(cx, cz)) return; const at = (lx, lz) => off(cx, cz, ry, lx, lz); const B = (w, h, d, lx, y, lz, m, rx) => { const [x, z] = at(lx, lz); geo(null, w, h, d, x, y, z, ry, m, rx); };
    const C = (r1, r2, h, lx, y, lz, m, seg) => { const [x, z] = at(lx, lz); cyl(r1, r2, h, x, y, z, m, seg); };
    if (st === 'KL' || st === 'KA' || st === 'GA' || st === 'TN' || st === 'PY' || st === 'AP') {
      for (const [lx, lz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) B(.14, 2.5, .14, lx, 1.25, lz, '#5a3b22');                 // posts
      B(3.6, .9, 1.3, 0, .45, .55, '#6b4a2c'); B(3.7, .06, 1.4, 0, .92, .55, '#8a6a44');                                                   // counter
      B(1.1, .7, .55, -.9, 1.3, .55, '#cfe9f2'); B(1.14, .04, .58, -.9, 1.67, .55, '#5a3b22');                                             // glass snack cabinet
      for (let i = 0; i < 3; i++) B(.9, .02, .45, -.9, 1.05 + i * .22, .55, '#e8a628');
      C(.26, .26, .62, .9, 1.25, .5, '#c9a227', 12); C(.08, .1, .18, .9, 1.62, .5, '#c9a227', 8); C(.2, .2, .2, 1.4, 1.02, .55, '#d9d4cc', 10);  // tea urn and pot
      const [rx, rz] = at(0, 0); const roof = new T.ConeGeometry(3.1, 1.3, 4, 1, true); roof.rotateY(Math.PI / 4 + ry); roof.scale(1, 1, .75); roof.translate(rx, 3.15, rz); bb.addStatic(roof, mat('#6b3a2a'));
      const cap = new T.ConeGeometry(2.6, 1.0, 4); cap.rotateY(Math.PI / 4 + ry); cap.scale(1, 1, .75); cap.translate(rx, 3.2, rz); bb.addStatic(cap, mat('#7a4432'));
      for (let i = 0; i < 6; i++) B(.08, .32, .08, -1.4 + i * .12, 2.15, .9, '#e8c34a');                                                    // a bunch of bananas hanging
      B(.9, .6, .05, 2.1, .9, 1.4, '#f5efe0'); B(.06, 1.2, .06, 2.1, .6, 1.4, '#5a3b22');                                                  // menu board
      B(2.2, .12, .45, 0, .45, 2.6, '#6b4a2c'); for (const lx of [-.9, .9]) B(.1, .4, .4, lx, .22, 2.6, '#5a3b22');                     // bench
    } else if (st === 'GJ') {
      B(2.6, .14, 1.4, 0, .9, .4, '#c97a4a'); B(2.6, .5, 1.4, 0, .6, .4, '#2f7fc1'); for (const lx of [-1, 1]) { const [x, z] = at(lx, .4); const w = new T.CylinderGeometry(.42, .42, .1, 12); w.rotateZ(Math.PI / 2); w.rotateY(ry); w.translate(x, .42, z); bb.addStatic(w, mat('#2b2b30')); }
      C(.06, .06, 2.4, 0, 2, .4, '#3b3a40', 6); const [ux, uz] = at(0, .4); const um = new T.ConeGeometry(1.7, .7, 10); um.translate(ux, 3.3, uz); bb.addStatic(um, mat('#e4572e')); C(.22, .22, .5, .7, 1.2, .4, '#c9a227', 10);
    } else if (st === 'RJ') {
      B(3, .5, 2, 0, .25, .6, '#c8a26a'); B(2.6, .7, .9, 0, .85, .4, '#a8784e'); for (const [lx, lz] of [[-1.4, -.4], [1.4, -.4], [-1.4, 1.6], [1.4, 1.6]]) B(.1, 2.6, .1, lx, 1.3, lz, '#5a3b22');
      B(3.2, .06, 2.4, 0, 2.6, .6, '#d84315'); C(.22, .26, .5, .8, 1.45, .4, '#c9a227', 10); B(2, .4, .5, 0, .45, 2.4, '#7a5a3a');
    } else { // Maharashtra tapri and others: tin roof, tarpaulin, plastic stools
      for (const [lx, lz] of [[-1.5, -1], [1.5, -1], [-1.5, 1.2], [1.5, 1.2]]) B(.08, 2.4, .08, lx, 1.2, lz, '#6b6b6b');
      B(3.3, .06, 2.6, 0, 2.45, .1, '#9aa1a8', -.08); B(3.1, 1.6, .04, 0, 1.6, -1.05, '#2f6fb5'); B(2.8, .85, 1, 0, .43, .3, '#c9b48a');
      C(.18, .18, .5, .9, 1.1, .3, '#b8bec6', 10); for (const lx of [-1, 0, 1]) C(.22, .18, .45, lx, .23, 2.2, '#e8572a', 10); }
    // the name board
    const [sx, sz] = at(0, 1.3); bb.addSign(NAMES[st] || 'TEA STALL', sx, 2.75, sz, ry, 2.6, .5, '#ffffff', st === 'KL' ? '#7a2e1a' : '#1f6f4f');
    stalls.push({ p, x: cx, z: cz, ry, st }); }
  bb.onStart(() => {}); // stalls are built once the POIs exist (below)
  setTimeout(() => { for (const p of bb.pois) if (p.type === 'food' && p.extra !== 'BEACH' && !p.noStall) try { build(p); } catch (e) {} if (bb.flushStatic) bb.flushStatic(); }, 0);
  // the stall keepers: a few people that stand at the nearest stalls and pour tea
  const keepers = []; for (let i = 0; i < 4; i++) { const k = bb.buildPerson(mat(['#f4f1ea', '#e9e0c8', '#d9483b', '#2f7fc1'][i]), { female: false }); k.visible = false; bb.scene.add(k); keepers.push({ g: k, s: null }); }
  let tick = 0; bb.onUpdate((dt, now) => { tick -= dt; const pp = bb.ppos(); if (tick <= 0) { tick = 2; const near = stalls.map(s => ({ s, d: Math.abs(s.x - pp.x) + Math.abs(s.z - pp.z) })).filter(q => q.d < 160).sort((a, b) => a.d - b.d).slice(0, keepers.length);
      keepers.forEach((k, i) => { const q = near[i]; k.s = q ? q.s : null; k.g.visible = !!q && !bb.inside; if (q) { const [x, z] = off(q.s.x, q.s.z, q.s.ry, 0, -.4); k.g.position.set(x, 0, z); k.g.rotation.y = q.s.ry; } }); }
    for (const k of keepers) if (k.s && k.g.visible) { const U = k.g.userData; U.arms[1].rotation.x = -1.3 + Math.sin(now * 1.6 + k.s.x) * .5; U.arms[0].rotation.x = -.6; } });
  bb.TEA = { stalls };
});
