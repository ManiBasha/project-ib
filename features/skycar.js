// The Aerion flying car (Beta v1.01.28): an original India Bay design. A smooth teardrop body with a bubble canopy,
// and four ducted fans in place of wheels. On the road it drives like a fast electric car. Press F (or ✈ Take off)
// and the four ducts swing flat, the fans spin up and it lifts off: W/S forward and back, A/D turn, Space climb,
// Q/Shift descend, C changes the view. Land on open ground or a road and tap "Land and drive" to drive on.
// Buy it at a car showroom.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE; const LM = c => bb.LMat(c);
  const glass = new T.MeshPhongMaterial({ color: 0x1d4f6b, transparent: true, opacity: .72, shininess: 90, specular: 0x9fd8ff });
  const dark = LM('#1b1f24'), trim = LM('#2c3238'), cyan = new T.MeshBasicMaterial({ color: 0x5ff2ff }), red = new T.MeshBasicMaterial({ color: 0xff3048 });
  const qG = new T.Quaternion().setFromEuler(new T.Euler(0, Math.PI / 2, 0)), qF = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0));
  function model(colorMat) { const g = new T.Group(); const paint = typeof colorMat === 'string' ? LM(colorMat) : colorMat || new T.MeshPhongMaterial({ color: 0xe9edf0, shininess: 70, specular: 0x666666 });
    const add = (geo, m, x, y, z, sx, sy, sz) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); if (sx) o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
    add(new T.SphereGeometry(1, 24, 14), paint, 0, .78, 0, .86, .42, 2.25);             // the teardrop body
    add(new T.SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dark, 0, .74, 0, .84, .22, 2.18); // dark belly
    add(new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 1.05, .15, .66, .5, 1.25);       // bubble canopy
    add(new T.BoxGeometry(1.35, .05, .06), cyan, 0, .86, 2.18); add(new T.BoxGeometry(1.2, .06, .05), red, 0, .9, -2.2); // light bars
    add(new T.BoxGeometry(.1, .08, 1.6), trim, 0, 1.18, -1.15);                          // spine fin
    // four ducted fans on short pylons: upright like wheels on the road, flat for flight
    const ducts = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const piv = new T.Group(); piv.position.set(sx * 1.12, .5, sz * 1.5); g.add(piv);
      add(new T.BoxGeometry(.45, .12, .3), trim, sx * .82, .62, sz * 1.5);
      const ring = new T.Mesh(new T.TorusGeometry(.42, .09, 8, 22), paint); ring.castShadow = true; piv.add(ring); const lip = new T.Mesh(new T.TorusGeometry(.42, .04, 6, 22), cyan); lip.position.z = .07; piv.add(lip);
      const rot = new T.Group(); piv.add(rot); for (let b = 0; b < 5; b++) { const bl = new T.Mesh(new T.BoxGeometry(.07, .36, .02), trim); bl.position.y = .18; const arm = new T.Group(); arm.rotation.z = b * Math.PI * 2 / 5; bl.rotation.y = .5; arm.add(bl); rot.add(arm); }
      const hub = new T.Mesh(new T.CylinderGeometry(.08, .08, .12, 10), dark); hub.rotation.x = Math.PI / 2; piv.add(hub); piv.quaternion.copy(qG); ducts.push({ piv, rot }); }
    g.userData.ducts = ducts; g.userData.wheels = []; g.userData.sky = true; return g; }
  bb.SPEC.skycar.build = model;
  function setDucts(g, k) { for (const d of g.userData.ducts || []) d.piv.quaternion.copy(qG).slerp(qF, k); }
  // on the road the fans turn with the speed, like wheels
  bb.onUpdate(dt => { const v = bb.player.veh; if (!v || v.type !== 'skycar' || bb.player.mode !== 'drive') return; for (const d of v.m.userData.ducts || []) d.rot.rotation.z -= v.v * dt / .42; });

  /* ---------- take off ---------- */
  const btn = document.createElement('button'); btn.id = 'skyBtn'; btn.className = 'buy'; btn.textContent = '✈ Take off (F)'; btn.style.cssText = 'position:fixed;right:16px;bottom:150px;z-index:30;display:none;padding:10px 14px;font-weight:800'; document.body.appendChild(btn);
  btn.onclick = e => { e.preventDefault(); takeOff(); };
  addEventListener('keydown', e => { if (e.code === 'KeyF' && !e.repeat && canFly()) { const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return; e.preventDefault(); e.stopImmediatePropagation(); takeOff(); } }, true);
  function canFly() { const v = bb.player.veh; return bb.started && bb.player.mode === 'drive' && v && v.type === 'skycar' && !bb.inside && !document.body.classList.contains('cine'); }
  setInterval(() => { btn.style.display = canFly() ? '' : 'none'; }, 400);
  function takeOff() { if (!canFly()) return; const V = bb.player.veh; if (Math.abs(V.v) > 12) return bb.toast('Slow down below 40 km/h to take off', '#ff9f1c'); fly(V); }

  const pickPaint = m => { let p = null; m.traverse(o => { if (!p && o.isMesh && o.scale.z > 2.2 && o.position.y > .76) p = o.material; }); return p; };
  function fly(V) { const g = model(pickPaint(V.m) || undefined); // the same paint as your car
    bb.scene.add(g); V.m.visible = false; const S = { x: V.pos.x, z: V.pos.z, y: 0, h: V.h, v: 0, vy: 0, bank: 0, k: {}, t: 0, landed: false, view: 'chase', floor: 0 };
    const K = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', Space: 'u', KeyE: 'u', KeyQ: 'd', ShiftLeft: 'd', ShiftRight: 'd' };
    const pad = `<div class="fhud" id="fhud"></div><div class="fpad l"><span></span><button data-f="f">▲</button><span></span><button data-f="l">◀</button><button data-f="b">▼</button><button data-f="r">▶</button></div><div class="fpad r"><button data-f="u">⤒</button><button data-f="d">⤓</button></div>`;
    const W0 = bb.WORLD.W, H0 = bb.WORLD.H;
    bb.CINE.play({ kind: 'none', hud: true, lookToggle: false, label: 'Aerion flying car', title: 'Flying', sub: 'W/S forward and back · A/D turn · Space climb · Q/Shift down · land, then "Land and drive"', skipLabel: 'Land and drive', extraHtml: pad,
      buttons: [{ id: 'view', label: '🎥 View', fn: () => { S.view = S.view === 'chase' ? 'low' : 'chase'; } }],
      keys: (code, down) => { if (code === 'KeyC' && down) { S.view = S.view === 'chase' ? 'low' : 'chase'; return true; } const m = K[code]; if (!m) return false; S.k[m] = down; return true; },
      onStart: el => { el.querySelectorAll('[data-f]').forEach(b => { const m = b.dataset.f; const on = e => { e.preventDefault(); S.k[m] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} }; const off = () => { S.k[m] = false; b.classList.remove('on'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }); },
      cam: () => { const n = performance.now(); const dt = Math.min(.1, S.lt ? (n - S.lt) / 1000 : .016); S.lt = n; S.t += dt; const k = S.k;
        // the first second and a half: the ducts swing flat and it rises straight up off the road
        const conv = Math.min(1, S.t / 1.4); setDucts(g, conv); const auto = S.t < 2.2;
        const vt = auto ? 0 : k.f ? 55 : k.b ? -10 : 0; S.v += (vt - S.v) * Math.min(1, dt * (vt ? .55 : 1.1)); const turn = auto ? 0 : (k.l ? 1 : 0) - (k.r ? 1 : 0); S.h += turn * (1.25 - Math.min(.6, Math.abs(S.v) / 90)) * dt; S.bank += (-turn * Math.min(.45, .1 + Math.abs(S.v) / 100) - S.bank) * Math.min(1, dt * 3);
        const vyt = auto ? (conv >= 1 ? 6 : 0) : k.u ? 10 : k.d ? -10 : 0; S.vy += (vyt - S.vy) * Math.min(1, dt * 2.5); if (S.landed && !k.u) { S.v = 0; S.vy = 0; } if (k.u) S.landed = false;
        const px = S.x, pz = S.z, py = S.y; S.x = Math.max(20, Math.min(W0 - 20, S.x + Math.sin(S.h) * S.v * dt)); S.z = Math.max((bb.MAPZ0 || 0) + 20, Math.min(H0 - 20, S.z + Math.cos(S.h) * S.v * dt)); S.y = Math.max(0, Math.min(500, S.y + S.vy * dt));
        const top = bb.obstTop ? Math.max(bb.obstTop(S.x, S.z), bb.obstTop(S.x + Math.sin(S.h) * 2.2, S.z + Math.cos(S.h) * 2.2)) : 0; S.floor = top;
        if (S.y < top + .05 && !S.landed && !auto) { const fromAbove = py >= top; if (fromAbove && Math.abs(S.v) < 10 && S.vy > -7) { S.y = top; S.vy = 0; S.v = 0; S.landed = true; bb.toast(top > 1 ? 'Landed on the roof · climb to take off again' : 'Landed · tap "Land and drive" to drive on', '#3ddc97'); }
          else { S.x = px; S.z = pz; S.y = Math.max(py, top + .05); const hit = Math.abs(S.v); S.v *= -.3; S.vy = Math.max(0, S.vy); if (hit > 15) { V.hp = Math.max(5, (V.hp || 100) - Math.round(hit * .6)); bb.shake && bb.shake(.4); bb.toast(`💥 Bump · body ${Math.round(V.hp)}%`, '#ff5d73'); } else if (!S.bt || n - S.bt > 1500) { S.bt = n; bb.toast('⚠ Too close · pull up!', '#ff9f1c'); } } }
        const water = bb.isWater(S.x, S.z) && !bb.roadAt(S.x, S.z); if (water && S.y < 2.5 && !auto) { S.y = 2.5; S.vy = Math.max(0, S.vy); }
        g.position.set(S.x, S.y, S.z); g.rotation.set(S.v / 55 * .12, S.h, S.bank, 'YXZ'); const spin = S.landed ? .2 : 1; for (const d of g.userData.ducts) d.rot.rotation.z += dt * 40 * spin;
        const hud = document.getElementById('fhud'); if (hud) hud.innerHTML = `ALT ${Math.round((S.y - S.floor) * 2.4)} m · ${Math.round(Math.abs(S.v) * 2.4 * 3.6)} km/h${auto ? ' · lifting off' : S.landed ? ' · landed' : water && S.y < 4 ? ' · over water' : ''}`;
        if (S.view === 'low') return { x: S.x - Math.sin(S.h) * 9, y: S.y + 2.6, z: S.z - Math.cos(S.h) * 9, lx: S.x + Math.sin(S.h) * 12, ly: S.y + 1, lz: S.z + Math.cos(S.h) * 12, lookK: 6, px: S.x, pz: S.z };
        return { x: S.x - Math.sin(S.h) * 15, y: S.y + 6.5, z: S.z - Math.cos(S.h) * 15, lx: S.x + Math.sin(S.h) * 6, ly: S.y + 1.2, lz: S.z + Math.cos(S.h) * 6, lookK: 5, px: S.x, pz: S.z }; },
      onStop: () => { bb.scene.remove(g); },
      onDone: () => { // back on the road: on open ground where you landed, or the autopilot sets you down on the nearest road
        let x = S.x, z = S.z, h = S.h; const ok = S.landed && S.floor < .5 && !bb.isWater(x, z); if (!ok) { const r = bb.nearestRoadPoint(x, z, 400); if (r) { x = r.x; z = r.z; h = Math.atan2(r.e.dx, r.e.dz); } bb.toast('🛬 Autopilot · set down on the nearest road', '#d6c8e4'); }
        V.pos.set(x, 0, z); V.h = h; V.v = 0; V.m.position.set(x, 0, z); V.m.rotation.y = h; V.m.visible = true; bb.teleport(x + Math.cos(h) * 2.4, z - Math.sin(h) * 2.4, h); setTimeout(() => { bb.enterVehicle(V); }, 50); bb.emit && bb.emit('skycar', { kind: 'flight' }); } });
  }
  bb.SKYCAR = { model, fly, canFly };
});
