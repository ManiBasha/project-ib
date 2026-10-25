// Nature (Beta v1.01.27): the countryside around you is planted the way each state really looks, wild animals live in
// the forests, and dolphins play off the coast.
//  • Vegetation: Kerala and Lakshadweep are thick with coconut palms and banana plants; Goa has palms and cashew trees;
//    Karnataka and Maharashtra mixed broadleaf (mango, banyan) with palms near the sea; Gujarat dry scrub with acacia and
//    neem; Rajasthan's desert has only a few khejri trees and cactus. The Western Ghats and forest areas are dense.
//    Planted near you only (instanced), so it costs little.
//  • Forest animals: elephants, gaur, deer, monkeys, peacocks, sloth bears and the odd tiger in the southern forests; lions
//    in Gir; tigers, deer and peacocks in the Rajasthan and Maharashtra reserves. They wander off the roads and away from
//    water, and the shy ones run from you.
//  • Dolphins: pods jump off Goa, the Konkan coast, Kovalam and Lakshadweep · you can watch them from the shore.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, W = window.WORLD; const V3 = new T.Vector3();
  const rnd0 = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const inE = (e, x, z) => ((x - e.x) / e.rx) ** 2 + ((z - e.z) / e.rz) ** 2;
  const biomeAt = (x, z) => { let b = null, bd = 1; for (const e of W.biomes || []) { const d = inE(e, x, z); if (d < bd) { bd = d; b = e.kind; } } return b; };
  /* ---------- tree models (each a trunk part and a leaf part) ---------- */
  const merge = gs => { const parts = gs.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const g of parts) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0; for (const g of parts) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; } const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out; };
  const tr = (g, x, y, z, rx, ry, rz) => { if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz); g.translate(x, y, z); return g; };
  function coconut() { const trunk = []; let x = 0, y = 0; for (let i = 0; i < 5; i++) { const s = new T.CylinderGeometry(.2 - i * .02, .24 - i * .02, 2, 6); trunk.push(tr(s, x, y + 1, 0, 0, 0, -.06 * i)); x += Math.sin(.06 * i) * 2; y += 2; }
    const leaves = []; for (let k = 0; k < 9; k++) { const f = new T.PlaneGeometry(.7, 4.2, 1, 3); const p = f.attributes.position; for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 2.1; p.setZ(i, -(v * v) * .09); } f.translate(0, 2.1, 0); f.rotateX(-1.05); f.rotateY(k / 9 * 6.283); f.translate(x, y + .1, 0); leaves.push(f); }
    leaves.push(tr(new T.SphereGeometry(.35, 6, 5), x, y - .2, 0)); return { trunk: merge(trunk), leaf: merge(leaves), tc: '#7a5a3a', lc: '#3f8a2e', ds: true }; }
  function broadleaf(tall) { const h = tall ? 4.2 : 3; const t = new T.CylinderGeometry(.28, .4, h, 6); t.translate(0, h / 2, 0); const L = []; for (const [x, y, z, r] of [[0, h + 1.6, 0, 2.6], [1.3, h + .9, .4, 1.8], [-1.2, h + 1.1, -.5, 1.9], [.2, h + .7, 1.3, 1.7]]) L.push(tr(new T.IcosahedronGeometry(r, 0), x, y, z)); return { trunk: t, leaf: merge(L), tc: '#5a4030', lc: tall ? '#2f6b2a' : '#3d7f33' }; }
  function banana() { const t = new T.CylinderGeometry(.14, .2, 2.2, 6); t.translate(0, 1.1, 0); const L = []; for (let k = 0; k < 6; k++) { const f = new T.PlaneGeometry(.6, 2.2, 1, 2); const p = f.attributes.position; for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 1.1; p.setZ(i, -v * v * .12); } f.translate(0, 1.1, 0); f.rotateX(-.7); f.rotateY(k / 6 * 6.283); f.translate(0, 2.1, 0); L.push(f); } return { trunk: t, leaf: merge(L), tc: '#6b7a3a', lc: '#5aa832', ds: true }; }
  function acacia() { const t = new T.CylinderGeometry(.14, .22, 2.6, 5); t.rotateZ(.12); t.translate(0, 1.3, 0); const c = new T.CylinderGeometry(2.2, 1.6, .6, 9); c.translate(.2, 2.9, 0); const c2 = new T.CylinderGeometry(1.2, 1, .5, 7); c2.translate(-.8, 2.5, .6); return { trunk: t, leaf: merge([c, c2]), tc: '#6b5236', lc: '#7a8a3e' }; }
  function khejri() { const t = new T.CylinderGeometry(.13, .2, 2.4, 5); t.translate(0, 1.2, 0); const L = []; for (const [x, y, z] of [[0, 3, 0], [.8, 2.6, .3], [-.7, 2.7, -.4]]) L.push(tr(new T.IcosahedronGeometry(.9, 0), x, y, z)); return { trunk: t, leaf: merge(L), tc: '#7a6040', lc: '#8a9a50' }; }
  function cactus() { const parts = [tr(new T.CylinderGeometry(.22, .26, 2.2, 7), 0, 1.1, 0), tr(new T.CylinderGeometry(.14, .16, .9, 6), .38, 1.3, 0), tr(new T.CylinderGeometry(.14, .16, .7, 6), -.36, 1.1, 0), tr(new T.CylinderGeometry(.12, .12, .5, 6), .2, .9, 0, 0, 0, 1.2), tr(new T.CylinderGeometry(.12, .12, .45, 6), -.2, .75, 0, 0, 0, -1.2)];
    return { trunk: new T.BoxGeometry(.01, .01, .01), leaf: merge(parts), tc: '#5a4030', lc: '#4f7a3a' }; }
  function bush() { const L = []; for (const [x, y, z, r] of [[0, .5, 0, .8], [.6, .4, .2, .6], [-.5, .45, -.3, .6]]) L.push(tr(new T.IcosahedronGeometry(r, 0), x, y, z)); return { trunk: new T.BoxGeometry(.01, .01, .01), leaf: merge(L), tc: '#5a4030', lc: '#4f7a3a' }; }
  // Beta v1.01.30: the palmyra (Tamil Nadu's state tree): a straight dark trunk and a round crown of stiff fan leaves
  function palmyra() { const t = new T.CylinderGeometry(.22, .3, 9, 6); t.translate(0, 4.5, 0); const L = []; for (let k = 0; k < 14; k++) { const f = new T.CircleGeometry(1.1, 7, 0, Math.PI); f.rotateX(-Math.PI / 2 + .5 + (k % 3) * .35); f.rotateY(k / 14 * 6.283); f.translate(0, 9.2, 0); L.push(f); } return { trunk: t, leaf: merge(L), tc: '#3a2f26', lc: '#3f6a2a', ds: true }; }
  // Beta v2.00.00: the Himalaya: deodar and pine (stacked cones) and the tall poplars of Kashmir and Ladakh villages
  function conifer() { const t = new T.CylinderGeometry(.18, .28, 2.4, 5); t.translate(0, 1.2, 0); const L = []; for (let i = 0; i < 4; i++) L.push(tr(new T.ConeGeometry(2.1 - i * .45, 2.4, 7), 0, 2.6 + i * 1.5, 0)); return { trunk: t, leaf: merge(L), tc: '#4a3626', lc: '#2f5a32' }; }
  function poplar() { const t = new T.CylinderGeometry(.14, .2, 2.2, 5); t.translate(0, 1.1, 0); const c = new T.SphereGeometry(1, 7, 6); c.scale(.9, 3.6, .9); c.translate(0, 5.2, 0); return { trunk: t, leaf: c, tc: '#7a6a5a', lc: '#6f9a3e' }; }
  const KINDS = { conifer: conifer(), poplar: poplar(), palmyra: palmyra(), coconut: coconut(), broad: broadleaf(false), tall: broadleaf(true), banana: banana(), acacia: acacia(), khejri: khejri(), cactus: cactus(), bush: bush() };
  // what grows where: [kind, weight] lists and a density (plants per 200 m square)
  function recipe(x, z) { const st = bb.stateAt(x, z), bi = biomeAt(x, z);
    if (bi === 'rann') return null;
    // Beta v2.00.00: the north, the centre and the east
    if (st === 'FR' || bi === 'snow' || bi === 'mine') return null;
    if (bi === 'colddesert' || st === 'LA') return { n: 3, mix: [['poplar', 6], ['bush', 3]] };
    if (bi === 'alpine') return { n: 12, mix: [['conifer', 4], ['poplar', 3], ['bush', 3]] };
    if (bi === 'pine' || st === 'HP' || st === 'UK' || (st === 'JK' && bi !== 'orchard')) return { n: 40, mix: [['conifer', 7], ['broad', 2], ['poplar', st === 'JK' ? 2 : 0], ['bush', 1]] };
    if (bi === 'orchard') return { n: 30, mix: [['broad', 6], ['poplar', 2], ['bush', 2]] };
    if (bi === 'sal' || bi === 'terai') return { n: 50, mix: [['tall', 6], ['broad', 3], ['bush', 1]] };
    if (bi === 'ravine') return { n: 8, mix: [['acacia', 4], ['bush', 5]] };
    if (bi === 'mangrove') return { n: 40, mix: [['bush', 6], ['broad', 2]] };
    if (bi === 'wheat' || bi === 'mustard' || st === 'PB' || st === 'HR' || st === 'CH' || st === 'DL') return { n: 8, mix: [['broad', 5], ['tall', 2], ['bush', 2]] };
    if (st === 'UP' || st === 'BR' || st === 'WB' || st === 'JH') return { n: 12, mix: [['broad', 5], ['tall', 2], ['banana', 1], ['bush', 2]] };
    if (st === 'MP' && bi !== 'forest') return { n: 14, mix: [['broad', 4], ['acacia', 2], ['tall', 2], ['bush', 2]] };
    if (st === 'OD' && (bb.isWater(x + 120, z) || bb.isWater(x, z + 120))) return { n: 26, mix: [['coconut', 6], ['palmyra', 2], ['broad', 3]] }; if (bi === 'desert') return { n: 3, mix: [['khejri', 4], ['cactus', 5], ['bush', 3]] };
    if (bi === 'forest' || bi === 'ghats') return { n: st === 'RJ' || st === 'GJ' ? 26 : 55, mix: st === 'RJ' || st === 'GJ' ? [['acacia', 4], ['broad', 4], ['khejri', 2]] : [['tall', 6], ['broad', 4], ['banana', 1], ['coconut', st === 'KL' ? 2 : 0]] };
    if (bi === 'coconut' || st === 'LD') return { n: 60, mix: [['coconut', 9], ['banana', 2], ['broad', 1]] };
    if (bi === 'coffee' || bi === 'tea') return { n: 30, mix: [['tall', 4], ['broad', 3], ['bush', 3]] };
    if (bi === 'paddy') return { n: 10, mix: [['coconut', 6], ['broad', 2]] };
    if (st === 'KL') return { n: 52, mix: [['coconut', 7], ['banana', 2], ['broad', 2], ['tall', 1]] };
    // Beta v1.01.30: the South-East. Coconut on the coasts and deltas, palmyra in the dry south, neem and tamarind inland
    if (st === 'TN' || st === 'PY') { const c2 = bb.isWater(x + 120, z) || bb.isWater(x, z + 120) || bb.isWater(x, z - 120); if (bi === 'laterite' || bi === 'scrub') return { n: 14, mix: [['palmyra', 6], ['acacia', 2], ['bush', 2], ['broad', 1]] };
      return { n: 26, mix: [['palmyra', 3], ['coconut', c2 ? 6 : 2], ['broad', 4], ['banana', 1], ['bush', 1]] }; }
    if (st === 'AP') { const c2 = bb.isWater(x + 120, z) || bb.isWater(x, z + 120); if (bi === 'scrub') return { n: 8, mix: [['acacia', 3], ['bush', 4], ['palmyra', 2]] }; return { n: 20, mix: [['coconut', c2 ? 6 : 1], ['palmyra', 3], ['broad', 4], ['bush', 1]] }; }
    if (st === 'TG') return { n: 12, mix: [['broad', 4], ['palmyra', 3], ['acacia', 2], ['bush', 3]] };
    if (st === 'CG' || st === 'OD') return { n: 18, mix: [['broad', 5], ['tall', 3], ['bush', 2]] };
    if (st === 'GA') return { n: 34, mix: [['coconut', 5], ['broad', 3], ['bush', 2]] };
    if (st === 'RJ') return { n: 6, mix: [['khejri', 4], ['acacia', 2], ['cactus', 2], ['bush', 2]] };
    if (st === 'GJ') return { n: 10, mix: [['acacia', 5], ['broad', 2], ['bush', 3]] };
    if (bi === 'scrub' || bi === 'deccan') return { n: 9, mix: [['acacia', 3], ['broad', 3], ['bush', 3]] };
    const coast = bb.isWater(x + 90, z) || bb.isWater(x - 90, z) || bb.isWater(x, z + 90) || bb.isWater(x, z - 90);
    if (st === 'KA') return { n: 24, mix: [['broad', 4], ['tall', 2], ['coconut', coast ? 5 : 1], ['bush', 1]] };
    return { n: 16, mix: [['broad', 4], ['tall', 1], ['coconut', coast ? 4 : 0], ['bush', 2]] }; }
  const CELL = 200, RAD = bb.GFX && bb.GFX.lvl === 'saver' ? 2 : 3; const meshes = {}; const MAXI = Math.round(2600 * (bb.GFX ? bb.GFX.plants : 1));
  for (const [k, D] of Object.entries(KINDS)) { const tm = new T.MeshLambertMaterial({ color: D.tc }), lm = new T.MeshLambertMaterial({ color: D.lc, side: D.ds ? T.DoubleSide : T.FrontSide });
    const a = new T.InstancedMesh(D.trunk, tm, MAXI), b = new T.InstancedMesh(D.leaf, lm, MAXI); a.count = b.count = 0; a.frustumCulled = b.frustumCulled = false; a.castShadow = b.castShadow = false; bb.scene.add(a); bb.scene.add(b); meshes[k] = { a, b }; }
  const cache = new Map();
  function cellPlants(ci, cj) { const key = ci + ',' + cj; if (cache.has(key)) return cache.get(key); const out = []; const cx = ci * CELL + CELL / 2, cz = cj * CELL + CELL / 2;
    if (cx < 0 || cz < (bb.MAPZ0 || 0) || cx > W.W || cz > W.H || !bb.isLand(cx, cz) && bb.isWater(cx, cz)) { cache.set(key, out); return out; } const R = recipe(cx, cz); if (!R) { cache.set(key, out); return out; }
    const r = rnd0((ci * 73856093) ^ (cj * 19349663)); const tot = R.mix.reduce((s, q) => s + q[1], 0);
    for (let i = 0; i < R.n; i++) { const x = ci * CELL + r() * CELL, z = cj * CELL + r() * CELL; let w = r() * tot, kind = R.mix[0][0]; for (const [k, q] of R.mix) { if ((w -= q) <= 0) { kind = k; break; } } const sc = .8 + r() * .5, ry = r() * 6.283;
      if (bb.isWater(x, z) || (bb.wetNear && bb.wetNear(x, z, 3)) || bb.roadAt(x, z, 4) || bb.zoneAt(x, z, 15)) continue; V3.set(x, 0, z); if (bb.collideTest(V3)) continue; out.push([kind, x, z, sc, ry]); }
    cache.set(key, out); if (cache.size > 400) cache.delete(cache.keys().next().value); return out; }
  const M4 = new T.Matrix4(), Q = new T.Quaternion(), S3 = new T.Vector3(), P3 = new T.Vector3(), Y = new T.Vector3(0, 1, 0); let lastCell = '', buildQ = null;
  function rebuild(pp) { const ci0 = Math.floor(pp.x / CELL), cj0 = Math.floor(pp.z / CELL); const cnt = {}; for (const k in meshes) cnt[k] = 0;
    for (let i = -RAD; i <= RAD; i++) for (let j = -RAD; j <= RAD; j++) for (const [k, x, z, sc, ry] of cellPlants(ci0 + i, cj0 + j)) { const m = meshes[k]; if (cnt[k] >= MAXI) continue; Q.setFromAxisAngle(Y, ry); S3.set(sc, sc, sc); P3.set(x, 0, z); M4.compose(P3, Q, S3); m.a.setMatrixAt(cnt[k], M4); m.b.setMatrixAt(cnt[k], M4); cnt[k]++; }
    for (const k in meshes) { const m = meshes[k]; m.a.count = m.b.count = cnt[k]; m.a.instanceMatrix.needsUpdate = m.b.instanceMatrix.needsUpdate = true; } }
  setInterval(() => { if (!bb.started) return; const show = !bb.inside; for (const k in meshes) meshes[k].a.visible = meshes[k].b.visible = show; if (!show) return; const pp = bb.ppos(); const key = Math.floor(pp.x / CELL) + ',' + Math.floor(pp.z / CELL); if (key !== lastCell) { lastCell = key; rebuild(pp); } }, 700);

  /* ---------- wild animals in the forests ---------- */
  const forests = (W.forests || []).concat((W.biomes || []).filter(b => b.kind === 'forest' || b.kind === 'ghats'));
  function faunaOf(f) { const st = bb.stateAt(f.x, f.z);
    // Beta v2.00.00: tigers in Madhya Pradesh, elephants in the Terai and Odisha, bears and ibex in the Himalaya
    if (st === 'LA') return [['deer', 6], ['leopard', 1], ['bear', 1]];
    if (st === 'HP' || st === 'JK') return [['deer', 6], ['monkey', 3], ['bear', 3], ['leopard', 2], ['peacock', 1]];
    if (st === 'UK' || st === 'UP') return [['elephant', 3], ['tiger', 2], ['deer', 7], ['monkey', 4], ['peacock', 3], ['leopard', 1]];
    if (st === 'MP') return [['tiger', 3], ['deer', 8], ['peacock', 4], ['monkey', 4], ['bear', 2], ['leopard', 2], ['buffalo', 2]];
    if (st === 'CG') return [['tiger', 1], ['buffalo', 3], ['deer', 6], ['bear', 3], ['elephant', 2], ['monkey', 3], ['peacock', 2]];
    if (st === 'OD' || st === 'JH') return [['elephant', 4], ['tiger', 1], ['deer', 6], ['monkey', 4], ['peacock', 3], ['bear', 2]]; if (st === 'GJ') return [['lion', 3], ['lioness', 3], ['deer', 6], ['peacock', 4], ['monkey', 2]]; if (st === 'RJ' || st === 'MH' || st === 'TG') return [['tiger', 1], ['deer', 7], ['peacock', 4], ['monkey', 3], ['bear', 1], ['leopard', 1]];
    return [['elephant', 4], ['buffalo', 3], ['deer', 6], ['monkey', 4], ['peacock', 3], ['bear', 1], ['tiger', 1], ['leopard', 1]]; }
  const SPEED = { elephant: .9, buffalo: .8, deer: 1.3, monkey: 1.2, peacock: .7, bear: .8, tiger: 1.4, lion: 1.1, lioness: 1.2, leopard: 1.4 };
  const wild = []; let curF = null, wT = 0;
  const okAt = (x, z) => !bb.isWater(x, z) && !(bb.wetNear && bb.wetNear(x, z, 3)) && !bb.roadAt(x, z, 3) && !bb.zoneAt(x, z, 10);
  bb.onUpdate((dt, now) => { if (!bb.started) return; const nms = performance.now();
    if (nms - wT > 2000) { wT = nms; const pp = bb.ppos(); let best = null, bd = 1.6; for (const f of forests) { const d = inE({ x: f.x, z: f.z, rx: f.rx + 250, rz: f.rz + 250 }, pp.x, pp.z); if (d < bd) { bd = d; best = f; } }
      if (best !== curF || bb.inside) { for (const a of wild) bb.scene.remove(a.g); wild.length = 0; curF = bb.inside ? null : best; }
      if (curF && wild.length < 12) { const F = faunaOf(curF); const tot = F.reduce((s, q) => s + q[1], 0); for (let tries = 0; tries < 30 && wild.length < 12; tries++) { const a0 = Math.random() * 6.283, r0 = 50 + Math.random() * 260; const x = pp.x + Math.cos(a0) * r0, z = pp.z + Math.sin(a0) * r0; if (inE(curF, x, z) > 1.1 || !okAt(x, z)) continue;
          let w = Math.random() * tot, kind = F[0][0]; for (const [k, q] of F) { if ((w -= q) <= 0) { kind = k; break; } } const herd = kind === 'deer' || kind === 'elephant' || kind === 'buffalo' || kind === 'monkey' ? 2 + Math.floor(Math.random() * 3) : 1;
          for (let h = 0; h < herd && wild.length < 14; h++) { const g = bb.buildAnimal(kind, { male: h === 0 }); const hx = x + (Math.random() - .5) * 8, hz = z + (Math.random() - .5) * 8; if (!okAt(hx, hz)) continue; g.position.set(hx, 0, hz); bb.scene.add(g); wild.push({ g, kind, x: hx, z: hz, h: Math.random() * 6.28, sp: 0, t: 0 }); } } }
      for (let i = wild.length - 1; i >= 0; i--) { const a = wild[i]; if (Math.hypot(a.x - pp.x, a.z - pp.z) > 420) { bb.scene.remove(a.g); wild.splice(i, 1); } } }
    const pp = bb.ppos(); for (const a of wild) { a.t -= dt; if (a.t <= 0) { a.t = 3 + Math.random() * 6; a.sp = Math.random() < .5 ? 0 : SPEED[a.kind] || 1; a.h += (Math.random() - .5) * 2; }
      const d = Math.hypot(pp.x - a.x, pp.z - a.z); const shy = a.kind === 'deer' || a.kind === 'peacock' || a.kind === 'monkey'; if (shy && d < 22) { a.h = Math.atan2(a.x - pp.x, a.z - pp.z); a.sp = a.kind === 'deer' ? 6 : 3; a.t = 2; }
      const nx = a.x + Math.sin(a.h) * a.sp * dt, nz = a.z + Math.cos(a.h) * a.sp * dt; if (a.sp && (!okAt(nx, nz) || inE(curF || { x: a.x, z: a.z, rx: 1e9, rz: 1e9 }, nx, nz) > 1.3)) { a.h += Math.PI * .8; } else { a.x = nx; a.z = nz; }
      a.g.position.set(a.x, 0, a.z); a.g.rotation.y = a.h; if (bb.animGait) bb.animGait({ g: a.g }, now, a.sp); } });

  /* ---------- dolphins off the coast ---------- */
  const SPOTS = ['Palolem Beach', 'Fort Aguada', 'Tarkarli Beach', 'Kovalam Beach', 'Kavaratti Lagoon', 'Bangaram Island', 'Arambol Beach', 'Colva Beach', 'Dumas Beach', 'Mandvi Beach and dhow yard', 'Marina Beach', 'RK Beach', 'Gulf of Mannar Marine Park', 'Promenade Beach', 'Chilika Lake (Irrawaddy dolphins)', 'Puri beach and sand art', 'Chandipur low-tide beach'].map(n => (W.places || []).find(p => p[0] === n)).filter(Boolean);
  function offshore(x, z) { for (const r of [70, 110, 160, 220]) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (bb.isWater(px, pz) && bb.isWater(px + 25, pz) && bb.isWater(px - 25, pz) && bb.isWater(px, pz + 25) && bb.isWater(px, pz - 25)) return [px, pz]; } return null; }
  const dmat = new T.MeshLambertMaterial({ color: '#6f8796' }), dbelly = new T.MeshLambertMaterial({ color: '#c9d3d8' });
  function dolphin() { const d = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.5, 12, 8), dmat); b.scale.set(.62, .55, 2.4); d.add(b); const be = new T.Mesh(new T.SphereGeometry(.45, 10, 6), dbelly); be.scale.set(.5, .35, 2); be.position.y = -.12; d.add(be);
    const fin = new T.Mesh(new T.ConeGeometry(.22, .6, 4), dmat); fin.position.set(0, .42, -.1); fin.rotation.x = -.4; d.add(fin); const nose = new T.Mesh(new T.ConeGeometry(.12, .5, 6), dmat); nose.rotation.x = Math.PI / 2; nose.position.z = 1.35; d.add(nose);
    const tail = new T.Mesh(new T.BoxGeometry(.9, .06, .3), dmat); tail.position.z = -1.25; d.add(tail); return d; }
  let pod = null; let pT = 0;
  bb.onUpdate((dt, now) => { if (!bb.started) return; if (performance.now() - pT > 3000) { pT = performance.now(); const pp = bb.ppos(); let s = null, sd = 650; for (const p of SPOTS) { const d = Math.hypot(p[1] - pp.x, p[2] - pp.z); if (d < sd) { sd = d; s = p; } }
      if ((!s || bb.inside) && pod) { bb.scene.remove(pod.g); pod = null; } else if (s && (!pod || pod.s !== s)) { if (pod) bb.scene.remove(pod.g); const c = offshore(s[1], s[2]); if (c) { const g = new T.Group(); bb.scene.add(g); const list = []; for (let i = 0; i < 6; i++) { const d = dolphin(); g.add(d); list.push({ d, ph: i * 1.05, r: 10 + (i % 3) * 5, sp: .22 + Math.random() * .08, jump: 2.2 + Math.random() }); } pod = { s, g, list, cx: c[0], cz: c[1] }; } } }
    if (!pod) return; const t = now; for (const o of pod.list) { const a = t * o.sp + o.ph; const x = pod.cx + Math.cos(a) * o.r * 2, z = pod.cz + Math.sin(a) * o.r; const k = (t * .7 + o.ph) % o.jump; const up = k < .9 ? Math.sin(k / .9 * Math.PI) : 0;
      o.d.position.set(x, -1.6 + up * 3, z); o.d.rotation.set(-Math.cos(k / .9 * Math.PI) * .8 * (k < .9 ? 1 : 0), Math.atan2(-Math.sin(a) * o.r * 2, Math.cos(a) * o.r) + Math.PI, 0, 'YXZ'); o.d.visible = up > .02 || k < 1.2; } });
  bb.NATURE = { recipe, biomeAt, get wild() { return wild; }, get pod() { return pod; }, get forest() { return curF; } };
});
