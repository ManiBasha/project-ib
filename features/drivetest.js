// RTO driving tests (Beta v1.01.28), done the Indian way on a test track after the road-rules (learner) test:
//   · Two-wheeler (MCWG) and auto rickshaw: the figure "8". Ride round both loops inside the lines and back to the
//     start, without touching a line and without putting a foot down (stopping on the track).
//   · Car (LMV): the "H" track, then parking. Drive forward into the H, across and up to the stop line, then reverse
//     all the way back out without touching a pole. Then park between two cars, backing in parallel to the kerb.
//   · Heavy vehicles: the "S" track (stay inside the poles through two bends), then the gradient test: stop in the
//     box on the slope, hold it on the brake, and pull away up the hill without rolling back.
// Three touches (lines, poles, a foot down or a bump) fail the test, and so does running out of time.
// Keys: W/▲ go · S/▼ brake, then reverse · A/D or ◀ ▶ steer · Space brake (holds you on the slope) · C or 🎥 changes the view.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, P = () => bb.P, esc = bb.esc; const LM = c => bb.LMat(c);
  const Y0 = 600; // the test ground is built high above the city so nothing of the city gets in the way
  const VEH = { two: 'scooter', three: 'auto', lmv: 'car', heavy: 'truck' };
  const STAGES = { two: ['eight'], three: ['eight'], lmv: ['h', 'park'], heavy: ['s', 'grad'] };
  const NAME = { eight: 'Figure 8 test', h: 'H track test', park: 'Parking test', s: 'S track test', grad: 'Gradient test' };
  const HOW = { eight: 'Ride the figure 8: round one loop, round the other, back to the start · stay inside the lines · do not stop on the track',
    h: 'Drive up the left side, across and up to the STOP line, stop, then reverse all the way back out · do not touch the poles',
    park: 'Drive past the gap, stop, then reverse into the gap between the two cars · end up straight, inside the box, stopped',
    s: 'Drive through the S bends to the finish without touching the poles',
    grad: 'Stop with the cab inside the yellow box on the slope, hold it 2 s with Space, then drive up to the top without rolling back' };
  const TOP = { eight: [0, 0, 24], h: [0, 8.5, 19], park: [-1, 3, 16], s: [13, 13, 36], grad: [0, 6, 22] };
  const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', Space: 'h' };
  const poleGeo = new T.CylinderGeometry(.06, .06, 1.1, 6), lineMat = new T.MeshBasicMaterial({ color: 0xf4f1ea }), yel = new T.MeshBasicMaterial({ color: 0xffc61a });
  const poleMat = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#1c1c20' : '#ffc61a'; x.fillRect(0, i * 8, 8, 8); } return new T.MeshLambertMaterial({ map: new T.CanvasTexture(c) }); })();

  /* ---------- the track pieces ---------- */
  function lineSeg(g, x0, z0, x1, z1, w) { const L = Math.hypot(x1 - x0, z1 - z0); const m = new T.Mesh(new T.PlaneGeometry(w || .12, L), lineMat); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(x1 - x0, z1 - z0); m.position.set((x0 + x1) / 2, .02, (z0 + z1) / 2); g.add(m); }
  function ring(g, cx, cz, r, w) { const m = new T.Mesh(new T.RingGeometry(r - (w || .12) / 2, r + (w || .12) / 2, 64), lineMat); m.rotation.x = -Math.PI / 2; m.position.set(cx, .02, cz); g.add(m); }
  function pole(g, x, z, list) { const m = new T.Mesh(poleGeo, poleMat); m.position.set(x, .55, z); g.add(m); list.push({ x, z, m }); }
  function pad(g, w, d, cx, cz, col) { const m = new T.Mesh(new T.PlaneGeometry(w, d), LM(col || '#4d5157')); m.rotation.x = -Math.PI / 2; m.position.set(cx, .01, cz); m.receiveShadow = true; g.add(m); return m; }
  function label(g, txt, x, z, rot) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const q = c.getContext('2d'); q.fillStyle = '#f4f1ea'; q.font = '800 46px sans-serif'; q.textAlign = 'center'; q.fillText(txt, 128, 48); const m = new T.Mesh(new T.PlaneGeometry(2.4, .6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true })); m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0; m.position.set(x, .03, z); g.add(m); }

  function makeStage(kind, vtype) { const g = new T.Group(); const sp = bb.SPEC[vtype]; const St = { kind, g, poles: [], cars: [], len: sp.len, wid: sp.wid };
    pad(g, 1400, 1400, 0, 0, '#6f8550').position.y = -.02;
    if (kind === 'eight') { const R = vtype === 'auto' ? 6.5 : 5.2, w = vtype === 'auto' ? 3.0 : 2.3; St.R = R; St.w = w; pad(g, 4 * R + 10, 2 * R + 14, 0, 0); for (const s of [-1, 1]) { ring(g, 0, s * R, R - w / 2); ring(g, 0, s * R, R + w / 2); } label(g, 'START', 0, -1.6 - w, 0);
      St.start = { x: 0, z: 0, h: Math.PI / 2 }; St.marks = [{ x: 0, z: 2 * R, hit: false }, { x: 0, z: -2 * R, hit: false }]; St.time = 150; }
    if (kind === 'h') { const W = 3.6, cx = 4.7, L = 17, z0 = 6.4, z1 = 10.2; St.rects = [[-cx - W / 2, 0, -cx + W / 2, L], [cx - W / 2, 0, cx + W / 2, L], [-cx + W / 2, z0, cx - W / 2, z1]]; pad(g, 2 * cx + W + 10, L + 14, 0, L / 2);
      const inside = (x, z) => St.rects.some(r => x > r[0] + .01 && x < r[2] - .01 && z > r[1] + .01 && z < r[3] - .01);
      for (const r of St.rects) { const per = [[r[0], r[1], r[2], r[1]], [r[2], r[1], r[2], r[3]], [r[2], r[3], r[0], r[3]], [r[0], r[3], r[0], r[1]]];
        for (const [a, b, c, d] of per) { const n = Math.max(1, Math.round(Math.hypot(c - a, d - b) / 1.5)); for (let i = 0; i <= n; i++) { const x = a + (c - a) * i / n, z = b + (d - b) * i / n; if (Math.abs(z) < .01 && x < 0) continue; // the way in at the bottom of the left leg
            const ox = x + (x === r[0] ? -.01 : x === r[2] ? .01 : 0), oz = z + (z === r[1] ? -.01 : z === r[3] ? .01 : 0); if (inside(ox, oz) || St.poles.some(p => Math.hypot(p.x - x, p.z - z) < .7)) continue; pole(g, x, z, St.poles); } } }
      lineSeg(g, cx - W / 2, L - 2.2, cx + W / 2, L - 2.2, .25); label(g, 'STOP', cx, L - 1.2, 0); label(g, 'IN', -cx, -1, 0); St.start = { x: -cx, z: -4, h: 0 }; St.cx = cx; St.L = L; St.step = 0; St.time = 180; }
    if (kind === 'park') { const kx = -3.2, bx1 = -.7, bz0 = 0, bz1 = 7.2; pad(g, 18, 46, -1, 4); lineSeg(g, kx, -18, kx, 26, .25); const kerb = new T.Mesh(new T.BoxGeometry(.3, .18, 44), LM('#c9c2b0')); kerb.position.set(kx - .15, .09, 4); g.add(kerb);
      for (const [a, b, c, d] of [[kx, bz0, bx1, bz0], [bx1, bz0, bx1, bz1], [bx1, bz1, kx, bz1]]) lineSeg(g, a, b, c, d, .1); for (const z of [bz0, bz1]) for (const x of [kx + .3, bx1]) pole(g, x, z, St.poles);
      for (const z of [bz0 - 2.6, bz1 + 2.6]) { const c = bb.buildVeh('sedan'); c.position.set((kx + bx1) / 2, 0, z); g.add(c); St.cars.push({ x: (kx + bx1) / 2, z, hw: 1.0, hl: 2.35 }); }
      St.bay = [kx, bz0, bx1, bz1]; St.kx = kx; St.start = { x: 1.6, z: -16, h: 0 }; St.time = 150; }
    if (kind === 's') { const R = 13, W = 4.6; St.R = R; St.W = W; pad(g, 2 * R + 20, 2 * R + 44, R, R - 3); St.path = sPath(R);
      for (const side of [-1, 1]) for (let i = 0; i < St.path.length; i += 2) { const p = St.path[i]; pole(g, p.x + p.nx * side * W / 2, p.z + p.nz * side * W / 2, St.poles); }
      label(g, 'FINISH', 2 * R, 2 * R + 8, 0); lineSeg(g, 2 * R - W / 2, 2 * R + 9, 2 * R + W / 2, 2 * R + 9, .3); St.start = { x: 0, z: -12, h: 0 }; St.time = 180; }
    if (kind === 'grad') { const W = 5; pad(g, 14, 60, 0, 10); St.ramp = [0, 14, .085]; // starts at z 0, 14 m long, 8.5% slope
      const geo = new T.PlaneGeometry(W + 2, 14, 1, 1); geo.rotateX(-Math.PI / 2 - Math.atan(.085)); const rm = new T.Mesh(geo, LM('#55595f')); rm.position.set(0, 14 * .085 / 2 + .02, 7); g.add(rm);
      const top = new T.Mesh(new T.BoxGeometry(W + 2, 14 * .085, 14), LM('#55595f')); top.position.set(0, 14 * .085 / 2, 21); g.add(top);
      for (const s of [-1, 1]) { const wall = new T.Mesh(new T.BoxGeometry(.25, .5, 28), LM('#c9c2b0')); wall.position.set(s * (W / 2 + 1.1), .5, 14); g.add(wall); }
      St.box = [5.5, 9.5]; for (const z of St.box) { const m = new T.Mesh(new T.PlaneGeometry(W, .25), yel); m.rotation.x = -Math.PI / 2 - Math.atan(.085); m.position.set(0, z * .085 + .05, z); g.add(m); }
      label(g, 'STOP BOX', 0, 7.5, 0); St.label = g.children[g.children.length - 1]; St.label.position.y = 7.5 * .085 + .06; St.label.rotation.x = -Math.PI / 2 - Math.atan(.085);
      St.start = { x: 0, z: -12, h: 0 }; St.time = 150; St.step = 0; }
    return St; }
  function sPath(R) { const pts = []; const push = (x, z, tx, tz) => { const l = Math.hypot(tx, tz); pts.push({ x, z, nx: tz / l, nz: -tx / l }); };
    for (let z = -17; z < 0; z += 1) push(0, z, 0, 1);
    for (let a = 0; a <= 1.0001; a += 1 / 14) { const t = Math.PI - a * Math.PI / 2; push(R + Math.cos(t) * R, Math.sin(t) * R, Math.sin(t), -Math.cos(t)); }
    for (let a = 0; a <= 1.0001; a += 1 / 14) { const t = -Math.PI / 2 + a * Math.PI / 2; push(R + Math.cos(t) * R, 2 * R + Math.sin(t) * R, -Math.sin(t), Math.cos(t)); }
    for (let z = 2 * R + 1; z <= 2 * R + 9; z += 1) push(2 * R, z, 0, 1); return pts; }
  function distToPath(path, x, z) { let b = 1e9; for (let i = 0; i < path.length - 1; i++) { const a = path[i], c = path[i + 1]; const dx = c.x - a.x, dz = c.z - a.z, l2 = dx * dx + dz * dz; let t = l2 ? ((x - a.x) * dx + (z - a.z) * dz) / l2 : 0; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(a.x + dx * t - x, a.z + dz * t - z); if (d < b) b = d; } return b; }

  /* ---------- driving ---------- */
  function corners(S, St, grow) { const f = [Math.sin(S.h), Math.cos(S.h)], r = [Math.cos(S.h), -Math.sin(S.h)]; const hl = St.len / 2 + (grow || 0), hw = St.wid / 2 + (grow || 0); const out = [];
    for (const a of [hl, -hl]) for (const b of [hw, -hw]) out.push([S.x + f[0] * a + r[0] * b, S.z + f[1] * a + r[1] * b]); return out; }
  function inRect(px, pz, S, St, grow) { const f = [Math.sin(S.h), Math.cos(S.h)]; const dx = px - S.x, dz = pz - S.z; const a = dx * f[0] + dz * f[1], b = dx * f[1] - dz * f[0]; return Math.abs(a) < St.len / 2 + grow && Math.abs(b) < St.wid / 2 + grow; }
  function rampY(St, z) { if (!St.ramp) return 0; const [z0, L, s] = St.ramp; return z < z0 ? 0 : z < z0 + L ? (z - z0) * s : L * s; }

  // Beta v2.03.00: the test ground stands on a big grass field with a boundary wall, trees and the RTO office, so you
  // never see the sea or the city below it (it used to look as if the track floated on water)
  const grassM = LM('#6a9a4a'), wallM = LM('#d8cfbd'), treeM = LM('#3f7a34'), trunkM = LM('#6b4a2e'), offM = LM('#efe2c6'), roofM = LM('#a8452c');
  function addGround(g) { const gr = new T.Mesh(new T.PlaneGeometry(9000, 9000), grassM); gr.rotation.x = -Math.PI / 2; gr.position.y = -.03; gr.receiveShadow = true; g.add(gr);
    const R = 70; for (let k = 0; k < 4; k++) { const w = new T.Mesh(new T.BoxGeometry(2 * R, 2.2, .4), wallM); const a = k * Math.PI / 2; w.position.set(Math.sin(a) * R, 1.1, Math.cos(a) * R); w.rotation.y = a; g.add(w); }
    for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283, r = R + 8 + (k % 3) * 6; const t = new T.Mesh(new T.CylinderGeometry(.25, .3, 2.4, 6), trunkM); t.position.set(Math.sin(a) * r, 1.2, Math.cos(a) * r); g.add(t); const c = new T.Mesh(new T.SphereGeometry(2.2 + (k % 4) * .4, 8, 6), treeM); c.position.set(Math.sin(a) * r, 3.6, Math.cos(a) * r); g.add(c); }
    const o = new T.Mesh(new T.BoxGeometry(16, 5, 8), offM); o.position.set(0, 2.5, -R + 8); g.add(o); const rf = new T.Mesh(new T.BoxGeometry(17, .5, 9), roofM); rf.position.set(0, 5.25, -R + 8); g.add(rf); }
  function runStage(lic, list, i, ctx) { const kind = list[i]; const vtype = VEH[lic]; const St = makeStage(kind, vtype); const sp = bb.SPEC[vtype];
    const two = !!sp.two; const wb = Math.max(1.1, sp.len * .62), maxSt = two ? .7 : vtype === 'truck' ? .58 : .62; const vmax = vtype === 'truck' ? 4.5 : two ? 5 : 5.5;
    const base = bb.ppos(); St.g.position.set(ctx.ox, Y0, ctx.oz); bb.scene.add(St.g); addGround(St.g);
    const amb = new T.AmbientLight(0xffffff, .55); bb.scene.add(amb);
    const car = bb.buildVeh(vtype); St.g.add(car); if (two || vtype === 'auto') { const rider = bb.buildPerson(LM('#e8573e'), { seated: true, female: false }); const seat = sp.seat || [0, 1.0, sp.fp ? sp.fp[2] - .2 : 0];
      rider.position.set(0, (sp.seat ? seat[1] : 1.15) - .62, sp.seat ? seat[2] : .55); rider.userData.legs.forEach(l => l.rotation.x = -1.25); rider.userData.arms.forEach(a => a.rotation.x = -1.0); car.add(rider); }
    const S = { x: St.start.x, z: St.start.z, h: St.start.h, v: 0, steer: 0, k: {}, pen: 0, touch: {}, t0: performance.now(), view: kind === 'h' || kind === 'park' ? 'top' : 'chase', done: null, still: 0, moved: false };
    const say = (m, c) => bb.toast(m, c || '#ff9f1c'); const penalty = (key, why) => { const n = performance.now(); if (S.touch[key] && n - S.touch[key] < 1500) { S.touch[key] = n; return; } S.touch[key] = n; S.pen++; bb.shake && bb.shake(.15); say(`⚠ ${why} · ${S.pen} of 3`); if (S.pen >= 3) end(false, 'Three faults'); };
    function end(ok, why) { if (S.done) return; S.done = { ok, why }; setTimeout(() => { if (bb.DRIVETEST.cur && bb.DRIVETEST.cur.S === S) bb.CINE.finish(false); }, ok ? 900 : 600); }
    bb.DRIVETEST.cur = { S, St };
    const pad = `<div class="fhud" id="fhud"></div><div class="fpad l"><span></span><button data-f="f">▲</button><span></span><button data-f="l">◀</button><button data-f="b">▼</button><button data-f="r">▶</button></div><div class="fpad r"><button data-f="h">✋ Brake</button></div>`;
    bb.CINE.play({ kind: 'none', hud: true, dur: 0, lookToggle: false, label: `${ctx.name} · test ${i + 1} of ${list.length}`, title: NAME[kind], sub: HOW[kind], skipLabel: 'Give up the test', extraHtml: pad,
      buttons: [{ id: 'view', label: '🎥 View', fn: () => { S.view = S.view === 'top' ? 'chase' : 'top'; } }],
      keys: (code, down) => { if (code === 'KeyC' && down) { S.view = S.view === 'top' ? 'chase' : 'top'; return true; } const m = KEYS[code]; if (!m) return false; S.k[m] = down; return true; },
      onStart: el => { el.querySelectorAll('[data-f]').forEach(b => { const m = b.dataset.f; const on = e => { e.preventDefault(); S.k[m] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} }; const off = () => { S.k[m] = false; b.classList.remove('on'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }); },
      cam: () => { const n = performance.now(); const dt = Math.min(.1, S.lt ? (n - S.lt) / 1000 : .016); S.lt = n; if (!S.done) step(dt); const k = S.k;
        const y = rampY(St, S.z); car.position.set(S.x, y, S.z); car.rotation.set(St.ramp && S.z > 0 && S.z < 14 ? -Math.atan(.085) * Math.cos(S.h) : 0, S.h, 0, 'YXZ'); for (const w of car.userData.wheels || []) w.rotation.x += S.v * dt / .35;
        const left = Math.max(0, St.time - (n - S.t0) / 1000); const hud = document.getElementById('fhud'); if (hud) hud.innerHTML = `${NAME[kind]} · ${S.v < -.05 ? 'R' : 'D'} · ${Math.round(Math.abs(S.v) * 3.6 * 2.4)} km/h · faults ${S.pen}/3 · ${Math.ceil(left)} s${St.msg ? `<br><span style="opacity:.9">${esc(St.msg)}</span>` : ''}`;
        if (!S.done && left <= 0) end(false, 'Out of time');
        const ox = ctx.ox, oz = ctx.oz; if (S.view === 'top') { const m = TOP[kind]; const c = { x: S.x * .7 + m[0] * .3, z: S.z * .7 + m[1] * .3 }; return { x: ox + c.x, y: Y0 + m[2], z: oz + c.z - m[2] * .35, lx: ox + c.x, ly: Y0, lz: oz + c.z + 1, lookK: 4, px: ox + S.x, pz: oz + S.z }; }
        const back = St.len * 1.4 + 5; return { x: ox + S.x - Math.sin(S.h) * back, y: Y0 + y + St.len * .45 + 4.2, z: oz + S.z - Math.cos(S.h) * back, lx: ox + S.x + Math.sin(S.h) * 4, ly: Y0 + y + .5, lz: oz + S.z + Math.cos(S.h) * 4, lookK: 5, px: ox + S.x, pz: oz + S.z }; },
      onStop: () => { bb.scene.remove(St.g); bb.scene.remove(amb); },
      onDone: () => { const r = S.done || { ok: false, why: 'You gave up' }; if (r.ok && i + 1 < list.length) { bb.toast(`✅ ${NAME[kind]} passed`, '#3ddc97'); setTimeout(() => runStage(lic, list, i + 1, ctx), 700); return; } ctx.finish(r.ok, r.ok ? '' : `${NAME[kind]}: ${r.why}`); } });

    function step(dt) { const k = S.k; const pv = S.v;
      // throttle, brake and reverse; on the slope gravity pulls you back unless you hold the brake
      if (k.f) S.v += (S.v < 0 ? 6 : 2.4) * dt; else if (k.b) S.v -= (S.v > .2 ? 6 : 1.8) * dt; else S.v -= Math.sign(S.v) * Math.min(Math.abs(S.v), 1.2 * dt);
      const onRamp = St.ramp && S.z > 0 && S.z < 14; if (onRamp) S.v -= 9.8 * .085 * Math.cos(S.h) * dt; if (k.h) { S.v -= Math.sign(S.v) * Math.min(Math.abs(S.v), 8 * dt); if (Math.abs(S.v) < .25) S.v = 0; }
      S.v = Math.max(-2.5, Math.min(vmax, S.v)); const want = ((k.l ? 1 : 0) - (k.r ? 1 : 0)) * maxSt; S.steer += Math.max(-1.8 * dt, Math.min(1.8 * dt, want - S.steer));
      S.h += S.v * Math.tan(S.steer) / wb * dt; S.x += Math.sin(S.h) * S.v * dt; S.z += Math.cos(S.h) * S.v * dt; if (Math.abs(S.v) > .3) S.moved = true;
      check(dt, pv); }
    function check(dt) { const C = corners(S, St);
      if (kind === 'eight') { const pts = two ? [[S.x + Math.sin(S.h) * St.len * .45, S.z + Math.cos(S.h) * St.len * .45], [S.x - Math.sin(S.h) * St.len * .45, S.z - Math.cos(S.h) * St.len * .45]] : C;
        for (const [x, z] of pts) { const d = Math.min(Math.abs(Math.hypot(x, z - St.R) - St.R), Math.abs(Math.hypot(x, z + St.R) - St.R)); if (d > St.w / 2) { penalty('line', 'Touched the line'); break; } }
        for (const m of St.marks) if (!m.hit && Math.hypot(S.x - m.x, S.z - m.z) < St.w * .7) { m.hit = true; bb.toast(`Loop ${St.marks.filter(q => q.hit).length} of 2 ✓`, '#3ddc97'); }
        if (S.moved && Math.abs(S.v) < .3) { S.still += dt; if (S.still > 1.5) { S.still = -2; penalty('foot', two ? 'Foot down · you stopped on the track' : 'Stopped on the track'); } } else if (S.still > 0) S.still = 0;
        St.msg = St.marks.every(m => m.hit) ? 'Both loops done · ride back to the START' : `Loops ${St.marks.filter(q => q.hit).length} of 2`;
        if (St.marks.every(m => m.hit) && Math.hypot(S.x, S.z) < 1.6) end(true); }
      if (kind === 'h' || kind === 's') for (const p of St.poles) if (inRect(p.x, p.z, S, St, .07)) { penalty('p' + p.x.toFixed(1) + p.z.toFixed(1), 'Touched a pole'); p.m.rotation.z = .25; }
      if (kind === 'h') { const cx = St.cx, L = St.L; if (St.step === 0) { St.msg = 'Forward: up, across, and up to the STOP line'; if (S.x > cx - 1.2 && S.z > L - 3.4 && S.v > -.1) { if (Math.abs(S.v) < .2) { St.step = 1; bb.toast('Stopped at the line ✓ · now reverse all the way back out', '#3ddc97'); } else St.msg = 'Stop at the line'; } if (S.z > L - .6) penalty('over', 'Crossed the stop line'); }
        else { St.msg = 'Reverse back the same way and out at the bottom'; if (S.v > .3) { S.fw = (S.fw || 0) + dt; if (S.fw > 1.2) { S.fw = -3; penalty('fwd', 'Moved forward · the second half must be in reverse'); } } if (S.x < -cx + 1.5 && S.z < 1.0) end(true); } }
      if (kind === 'park') { for (const c of St.cars) for (const [x, z] of C) if (Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hl) { penalty('car', 'Bumped a parked car'); break; } if (C.some(([x]) => x < St.kx)) penalty('kerb', 'Over the kerb');
        const [x0, z0, x1, z1] = St.bay; const inside = C.every(([x, z]) => x > x0 - .05 && x < x1 + .15 && z > z0 - .1 && z < z1 + .1); const straight = Math.abs(Math.sin(S.h)) < .17;
        St.msg = inside ? straight ? 'Inside and straight · stop and hold' : 'Inside · straighten up' : 'Back into the gap between the cars';
        if (inside && straight && Math.abs(S.v) < .1) { S.park = (S.park || 0) + dt; if (S.park > 1) end(true); } else S.park = 0; }
      if (kind === 's') { for (const [x, z] of C) if (distToPath(St.path, x, z) > St.W / 2 + .3) { penalty('out', 'Left the track'); break; } St.msg = 'Through both bends to the FINISH'; if (S.z > 2 * St.R + 8.5 && Math.abs(S.x - 2 * St.R) < 3) end(true); }
      if (kind === 'grad') { const front = S.z + Math.cos(S.h) * St.len * .3; const inBox = front > St.box[0] && front < St.box[1];
        if (St.step === 0) { St.msg = 'Stop with the cab in the yellow box'; if (inBox && Math.abs(S.v) < .05 && S.k.h) { S.hold = (S.hold || 0) + dt; St.msg = `Holding… ${Math.min(2, S.hold).toFixed(1)} s`; if (S.hold > 2) { St.step = 1; S.zHold = S.z; S.minZ = S.z; bb.toast('Held on the slope ✓ · now pull away up the hill', '#3ddc97'); } } else S.hold = 0; if (front > St.box[1] + 2.5) { penalty('pass', 'Drove past the box'); St.msg = 'Too far · back down into the box'; } }
        else { S.minZ = Math.min(S.minZ, S.z); St.msg = `Pull away up the hill · roll-back ${Math.max(0, (S.zHold - S.minZ)).toFixed(1)} m`; if (S.zHold - S.minZ > .6) { S.zHold = S.minZ; penalty('roll', 'Rolled back on the slope'); } if (S.z > 17) end(true); }
        if (C.some(([x]) => Math.abs(x) > 3.3)) penalty('wall', 'Touched the side'); } }
  }

  /* ---------- the test, start to end ---------- */
  function start(lic, onEnd) { const vtype = VEH[lic]; if (!vtype || !bb.SPEC[vtype]) return onEnd(true); const pp = bb.ppos(); const back = { x: pp.x, z: pp.z, h: bb.player.h };
    const ctx = { ox: pp.x, oz: pp.z, name: { two: 'Two-wheeler licence', three: 'Auto rickshaw licence', lmv: 'Car licence (LMV)', heavy: 'Heavy vehicle licence' }[lic],
      finish: (ok, why) => { bb.teleport(back.x, back.z, back.h); setTimeout(() => onEnd(ok, why), 300); } };
    bb.toast(`🚦 Driving test on the RTO track · ${STAGES[lic].map(s => NAME[s]).join(' + ')}`, '#ffc93c'); runStage(lic, STAGES[lic], 0, ctx); }
  bb.DRIVETEST = { start, STAGES, NAME };
});
