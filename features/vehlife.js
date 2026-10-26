// Locks and selling (Beta v1.01.26).
//  • Locks: luxury vehicles (sedans, SUVs, MPVs, sports cars, coupes, convertibles, limos, campers, sports bikes) lock
//    themselves when you walk away · beep beep and the indicators flash. Older ones you lock yourself: press L next to it,
//    or pick "Lock" from the E menu. A mechanic workshop can fit central locking (auto-lock) to any of your vehicles.
//    Nobody else can take a locked vehicle, and other players see it locked too.
//  • Selling: Menu → Garage → Sell finds a buyer. Often the best offer is in another city: drive the vehicle to the
//    buyer, hand over the keys and get paid.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, esc = bb.esc, P = () => bb.P;
  const LUX = new Set(['sedan', 'suv', 'mpv', 'sports', 'coupe', 'convertible', 'limo', 'camper', 'sportsbike', 'skycar']);
  const NOLOCK = new Set(['cycle', 'rickshaw']);
  const carOf = v => v && v.owned ? P().cars[v.ownedIdx] : null;
  const autoLock = v => { const c = carOf(v); return !!c && (LUX.has(v.type) || !!c.autolock); };
  function beep(n) { const ac = bb.audio; if (!ac || bb.muted) return; try { for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .18; o.type = 'square'; o.frequency.value = 1450; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .1); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .12); } } catch (e) {} }
  // the indicators flash twice
  const flashM = new T.MeshBasicMaterial({ color: 0xffa31a }); const flashG = new T.SphereGeometry(.12, 8, 6);
  function flash(v, times) { const sp = v.spec; const pts = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => { const m = new T.Mesh(flashG, flashM); m.position.set(sx * (sp.wid / 2 - .05), .8, sz * (sp.len / 2 - .05)); m.visible = false; v.m.add(m); return m; });
    let k = 0; const tick = () => { const on = k % 2 === 0; pts.forEach(m => m.visible = on); k++; if (k < times * 2) setTimeout(tick, 220); else pts.forEach(m => v.m.remove(m)); }; tick(); }
  function setLock(v, on, quiet) { const c = carOf(v); if (!c) return; v.locked = on; c.locked = on; bb.setDirty(); if (quiet) return; beep(on ? 2 : 1); flash(v, on ? 2 : 1); }
  bb.on('exitVehicle', v => { if (!v || !v.owned || NOLOCK.has(v.type)) return; setTimeout(() => { if (bb.player.veh === v || !bb.vehicles.includes(v)) return;
      if (autoLock(v)) { setLock(v, true); bb.toast(`🔒 Auto-locked · your ${v.spec.label.toLowerCase()} is safe`, '#3ddc97'); }
      else { const c = carOf(v); c.lockTips = (c.lockTips || 0) + 1; if (c.lockTips <= 3) bb.toast(`🔓 Not locked · press L (or E → Lock) to lock your ${v.spec.label.toLowerCase()}`, '#ffc93c'); } }, 900); });
  function nearOwn(max) { const pp = bb.player.pos; let b = null, bd = max || 6; for (const v of bb.ownedVeh) { if (!v || NOLOCK.has(v.type)) continue; const d = Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z); if (d < bd) { bd = d; b = v; } } return b; }
  function toggleNear() { if (bb.player.mode !== 'foot' || bb.inside) return; const v = nearOwn(7); if (!v) return bb.toast('Stand next to your vehicle to lock it', '#d6c8e4'); setLock(v, !v.locked); bb.toast(v.locked ? `🔒 Locked your ${v.spec.label.toLowerCase()}` : `🔓 Unlocked your ${v.spec.label.toLowerCase()}`, v.locked ? '#3ddc97' : '#ffc93c'); }
  bb.onKey('KeyL', toggleNear);
  bb.addPrompt(() => { if (bb.inside || bb.player.mode !== 'foot') return null; const v = nearOwn(3.2); if (!v || v.locked) return null; return { text: `🔒 Lock your ${v.spec.label.toLowerCase()}`, fn: toggleNear }; });
  bb.LOCKS = { setLock, autoLock, LUX };

  /* ---------- selling: find a buyer, drive the vehicle to them ---------- */
  const NAMES = ['Ravi Kumar', 'Fatima Shaikh', 'Joseph Mathew', 'Priya Nair', 'Arjun Patil', 'Meera Iyer', 'Imran Khan', 'Suresh Reddy', 'Anita Desai', 'Harpreet Singh', 'Lakshmi Menon', 'Vikram Joshi'];
  const sale = () => P().extra && P().extra.sale;
  const sidOf = c => c.sid || (c.sid = Math.random().toString(36).slice(2, 9));
  const isFor = c => !!(sale() && c && c.sid && sale().sid === c.sid);
  const idxOf = sid => P().cars.findIndex(c => c.sid === sid);
  function offers(k) { const c = P().cars[k]; const val = bb.carValue(k); const pp = bb.ppos(); const here = bb.zoneAt(pp.x, pp.z, 150);
    const zs = window.WORLD.zones.map(z => ({ z, d: Math.hypot(z.x0 + z.nx * 40 - pp.x, z.z0 + z.nz * 40 - pp.z) })).filter(q => q.z !== here && q.d > 800 && q.d < 9000).sort((a, b) => a.d - b.d);
    const out = []; const seed = (c.sid || '') + bb.gameDay; let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return h / 4294967296; };
    if (here) out.push({ z: here, price: Math.round(val * (.92 + rnd() * .1) / 50) * 50, local: true });
    for (let i = 0; i < 2 && zs.length; i++) { const q = zs.splice(Math.floor(rnd() * Math.min(zs.length, 6)), 1)[0]; out.push({ z: q.z, price: Math.round(val * (1.05 + q.d / 9000 * .25 + rnd() * .08) / 50) * 50, km: Math.round(q.d * 2.4 / 1000) }); }
    return out.map((o, i) => Object.assign(o, { name: NAMES[(h + i * 7) % NAMES.length] })); }
  function list(k) { const c = P().cars[k]; if (!c) return; if (isFor(c)) return saleSheet(); if (c.garage) return bb.toast('Take it out of your garage first · the buyer wants to see it', '#ff9f1c');
    if (!bb.ownedVeh[k]) return bb.toast('Have it delivered to you first (Menu → Garage → Deliver)', '#ff9f1c'); sidOf(c); const O = offers(k);
    bb.openSheet(`💰 Sell your ${bb.SPEC[c.type].label.toLowerCase()}`, 'Pick a buyer, then drive the vehicle to them', O.map((o, i) => bb.rowHtml('o' + i, `${esc(o.name)} · ${esc(o.z.name)}`, o.local ? 'In this city · a fair price' : `${o.km} km away · pays more`, bb.inr(o.price))).join('') + (sale() ? '<p class="note">Picking a buyer cancels your other sale.</p>' : '') + '<p class="note">Drive it there yourself and hand over the keys. A buyer keeps the offer for one game day.</p>',
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id || id[0] !== 'o') return; const o = O[+id.slice(1)]; const cx = o.z.x0 + o.z.nx * 40 + (Math.random() - .5) * o.z.nx * 30, cz = o.z.z0 + o.z.nz * 40 + (Math.random() - .5) * o.z.nz * 30; const [x, z, hh] = bb.roadSpotNear({ x: cx, z: cz });
        P().extra.sale = { sid: c.sid, price: o.price, x, z, h: hh, name: o.name, city: o.z.name, day: bb.playDay(), type: c.type }; bb.setDirty(); bb.save(); bb.closeSheet(); if (bb.TRAVEL) bb.TRAVEL.go(x, z, `${o.name} (buyer)`, true);
        bb.toast(`🤝 ${esc(o.name)} in ${esc(o.z.name)} will pay ${bb.inr(o.price)} · drive the ${bb.SPEC[c.type].label.toLowerCase()} there`, '#3ddc97'); }); }
  function saleSheet() { const S = sale(); if (!S) return; const pp = bb.ppos(); const km = (Math.hypot(S.x - pp.x, S.z - pp.z) * 2.4 / 1000).toFixed(1);
    bb.openSheet('🤝 Buyer waiting', `${esc(S.name)} · ${esc(S.city)} · ${bb.inr(S.price)}`, bb.rowHtml('go', 'Directions to the buyer', `${km} km · bring the ${bb.SPEC[S.type].label.toLowerCase()} itself`, 'Go') + bb.rowHtml('cancel', 'Cancel the sale', 'Keep the vehicle', 'Cancel', 'danger'),
      s => s.onclick = e => { const id = e.target.dataset.id; if (id === 'go') { bb.closeSheet(); if (bb.TRAVEL) bb.TRAVEL.go(S.x, S.z, `${S.name} (buyer)`, true); } if (id === 'cancel') { P().extra.sale = null; bb.setDirty(); bb.closeSheet(); bb.toast('Sale cancelled', '#d6c8e4'); } }); }
  // the buyer waits at the spot, holding a SOLD-to-me sign
  let buyer = null;
  function sign() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff8dc'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#c0392b'; x.lineWidth = 8; x.strokeRect(4, 4, 248, 120); x.fillStyle = '#c0392b'; x.font = '800 44px "Baloo 2",sans-serif'; x.textAlign = 'center'; x.fillText('BUYER', 128, 60); x.font = '700 26px sans-serif'; x.fillStyle = '#333'; x.fillText(bb.SPEC[sale().type] ? bb.SPEC[sale().type].label : '', 128, 100); return new T.CanvasTexture(c); }
  setInterval(() => { const S = sale(); if (!bb.started) return; if (S && S.day > bb.playDay() + 3) S.day = bb.playDay(); if (S && bb.playDay() > S.day + 1) { P().extra.sale = null; bb.setDirty(); bb.toast(`${esc(S.name)} found another vehicle · the sale is off`, '#ff9f1c'); }
    const pp = bb.ppos(); const near = S && Math.hypot(S.x - pp.x, S.z - pp.z) < 260;
    if (near && !buyer) { const g = bb.buildPerson(bb.LMat('#2f7fc1'), { female: /Fatima|Priya|Meera|Anita|Lakshmi/.test(S.name) }); g.position.set(S.x - Math.cos(S.h) * 1.6, .3, S.z + Math.sin(S.h) * 1.6); g.rotation.y = S.h - Math.PI / 2; const U = g.userData; U.arms.forEach(a => a.rotation.x = -1.6);
      const b = new T.Mesh(new T.PlaneGeometry(.9, .45), new T.MeshBasicMaterial({ map: sign() })); b.position.set(0, 1.75, .45); if (bb.twoSided) bb.twoSided(b); g.add(b); bb.scene.add(g); buyer = g; }
    else if (!near && buyer) { bb.scene.remove(buyer); buyer = null; } }, 1500);
  bb.addMapMarks(() => { const S = sale(); return S ? [{ x: S.x, z: S.z, col: '#3ddc97', txt: '🤝', name: `${S.name} · buyer`, sub: `${bb.inr(S.price)} for your ${bb.SPEC[S.type].label.toLowerCase()}` }] : []; });
  (bb.addFirstPrompt || bb.addPrompt)(() => { const S = sale(); if (!S || bb.inside) return null; const v = bb.player.veh; const pp = bb.ppos(); if (Math.hypot(S.x - pp.x, S.z - pp.z) > 12) return null;
    if (!v || !v.owned || carOf(v) && carOf(v).sid !== S.sid) return bb.player.mode === 'foot' ? { text: `${S.name} is waiting for your ${bb.SPEC[S.type].label.toLowerCase()} · drive it here`, fn: () => saleSheet() } : null;
    return { text: `🤝 Hand over the keys to ${S.name} · ${bb.inr(S.price)}`, fn: () => { if (Math.abs(v.v) > 1) return bb.toast('Stop first', '#ff9f1c'); const k = idxOf(S.sid); if (k < 0) return; const lab = v.spec.label.toLowerCase(); bb.exitVehicle(true);
      bb.dropCar(k); bb.earn(S.price, 'sale'); P().extra.sale = null; bb.setDirty(); bb.save(); bb.big('SOLD', '#3ddc97'); bb.toast(`🤝 Sold your ${lab} to ${esc(S.name)} for ${bb.inr(S.price)}`, '#3ddc97'); bb.emit('carSold', S); } }; });
  bb.VSALE = { list, isFor, saleSheet, offers };
});
