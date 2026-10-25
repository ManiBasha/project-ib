// Indian road life: FASTag tolls, helmets, mechanic garages, roadside help and monsoon flooding.
// Traffic fines, police paper checks, speed cameras, PUC and insurance were removed in v3.9.
window.BBFeatures.push(function (bb) {
  const W = bb.WORLD, T = bb.THREE, P = () => bb.P;
  const M = { cone: bb.LMat('#ff6a1a'), white: bb.LMat('#f3f1ec'), khaki: bb.LMat('#b89a5a'), pole: bb.LMat('#3b3a40'), cam: bb.LMat('#202226') };
  function onRoad(x, z) { const r = bb.nearestRoadPoint(x, z, 200); return r; }
  /* tolls */
  const tolls = W.tolls.map(([x, z, name]) => { const r = onRoad(x, z); if (!r) return null; const e = r.e, nx = e.dz, nz = -e.dx, a = Math.atan2(e.dx, e.dz);
    for (const s of [-1, 1]) bb.boxRot(1, 6, 1, r.x + nx * s * (e.w / 2 + .8), 3, r.z + nz * s * (e.w / 2 + .8), a, M.white); bb.boxRot(e.w + 3, 1.2, 2, r.x, 6.2, r.z, a, bb.LMat('#1f6f4a')); bb.addSign(name.toUpperCase() + ' · FASTag', r.x, 7.6, r.z, a, 10, 1.2, '#ffffff', '#1f6f4a'); return { x: r.x, z: r.z, name, last: -999 }; }).filter(Boolean);
  /* floods */
  const waterMat = new T.MeshPhongMaterial({ color: 0x5a6e6a, transparent: true, opacity: .78, shininess: 80 });
  const floods = W.floods.map(([x, z]) => { const m = new T.Mesh(new T.CircleGeometry(30, 24), waterMat); m.rotation.x = -Math.PI / 2; m.position.set(x, .14, z); m.visible = false; bb.scene.add(m); return { x, z, m }; });
  bb.flushStatic();
  let flooded = false;
  bb.speedMods.push(v => { if (!flooded) return 1; for (const f of floods) if (Math.hypot(v.pos.x - f.x, v.pos.z - f.z) < 28) { return v.spec.two ? .25 : v.spec.len > 7 ? .6 : .35; } return 1; });
  let floodWarn = 0;

  let helmetWarned = false;
  bb.on('enterVehicle', v => { if (v.spec.two && v.type !== 'cycle' && !P().helmet && !helmetWarned) { helmetWarned = true; bb.toast('No helmet · falls hurt more. Bike dealers sell helmets', '#ff9f1c'); } });
  // Waterfalls and foam: scroll their textures so the water flows.
  bb.onUpdate(dt => { for (const f of window.FLOW_TEX || []) { f.t.offset.y += dt * f.speed; if (f.x) f.t.offset.x += dt * f.x; } });
  bb.onUpdate((dt, now) => { const v = bb.player.mode === 'drive' ? bb.player.veh : null; flooded = bb.weather === 'monsoon' || bb.weather === 'rain'; for (const f of floods) f.m.visible = flooded && !bb.inside;
    if (!v || bb.inside) return; const kmh = Math.abs(v.v) * 2.4;
    for (const t of tolls) if (Math.hypot(v.pos.x - t.x, v.pos.z - t.z) < 10 && now - t.last > 60) { t.last = now; if (v.spec.two || v.spec.pedal) { bb.toast('Two-wheelers ride free through the toll', '#d6c8e4'); continue; } const fee = bb.price(bb.CFG.toll * (v.spec.len > 7 ? 2.5 : 1)); if (P().bank >= fee) { P().bank -= fee; bb.toast(`FASTag · ${t.name} · ${bb.inr(fee)} from your bank`, '#ffc93c'); } else if (P().cash >= fee) { P().cash -= fee; bb.toast(`${t.name} · paid ${bb.inr(fee)} in cash`, '#ffc93c'); } else bb.toast(`${t.name} · no money for the toll, the barrier opens this time`, '#d6c8e4'); bb.setDirty(); }
    if (flooded && now - floodWarn > 20) for (const f of floods) if (Math.hypot(v.pos.x - f.x, v.pos.z - f.z) < 30) { floodWarn = now; bb.toast('Waterlogged road · go slow', '#5fb4ff'); break; } });

  /* mechanic garage */
  function repairCost(v) { return Math.ceil((100 - v.hp) * 40); }
  const PAINTS = [['#c8102e', 'Racing red'], ['#f2f2ee', 'Pearl white'], ['#1c1c20', 'Midnight black'], ['#2d5fb8', 'Royal blue'], ['#1f8a4c', 'Parrot green'], ['#f2b705', 'Haldi yellow'], ['#f07c1a', 'Kesariya orange'], ['#7b2a5e', 'Jamun purple'], ['#b9bec4', 'Silver'], ['#6d1a2a', 'Maroon'], ['#2fc4b2', 'Teal'], ['#ff6fa8', 'Rani pink']];
  // Beta v1.01.28: underglow lights are gone. Anyone who bought them gets the money back once.
  const NEONS = [];
  bb.onStart(() => { const p = P(); let n = 0; for (const c of p.cars || []) if (c && c.neon) { c.neon = null; n++; } if (n) { bb.earn(bb.cost('mod.neon', 5000) * n, 'refund'); bb.save(); setTimeout(() => bb.toast(`Underglow lights are no longer fitted · ${bb.inr(bb.cost('mod.neon', 5000) * n)} refunded`, '#3ddc97'), 4000); } });
  function refresh(i) { const v = bb.ownedVeh[i]; if (!v) return; const was = bb.player.veh === v; const x = v.pos.x, z = v.pos.z, h = v.h; if (was) bb.exitVehicle(true); const c = P().cars[i]; c.fuel = Math.round(v.fuel); c.hp = Math.round(v.hp); const nv = bb.spawnOwned(i, x, z, h); if (was) bb.enterVehicle(nv); return nv; }
  const refs = {};
  // Beta v2.01.00: a vehicle left with the mechanic goes inside the workshop (off the street) until the job is done,
  // then it is parked back where you left it
  function intoShop(v) { if (!v || v.inShop) return; v.inShop = true; bb.removeVeh(v); }
  function outOfShop(v) { if (!v || !v.inShop) return; v.inShop = false; v.m.visible = true; bb.scene.add(v.m); if (!bb.vehicles.includes(v)) bb.vehicles.push(v); }
  const carVeh = i => (i >= 0 ? bb.ownedVeh[i] : null);
  bb.TIMERS.on('repair', (j, away) => { const v = j.data.car >= 0 ? carVeh(j.data.car) : refs[j.data.ref]; if (v) { outOfShop(v); v.hp = 100; v.repairing = false; } if (j.data.car >= 0 && P().cars[j.data.car]) P().cars[j.data.car].hp = 100; delete refs[j.data.ref]; bb.setDirty(); bb.save(); bb.toast(`🔧 Your ${bb.esc(j.data.name.toLowerCase())} is repaired${away ? ' (done while you were away)' : ''} · good as new`, '#3ddc97'); });
  bb.TIMERS.on('paint', (j, away) => { const c = P().cars[j.data.car]; outOfShop(carVeh(j.data.car)); if (c) { c.color = j.data.color; refresh(j.data.car); } const v = carVeh(j.data.car); if (v) v.repairing = false; bb.save(); bb.toast(`🎨 Fresh paint on your ${bb.esc(j.data.name.toLowerCase())}${away ? ' (done while you were away)' : ''}`, '#3ddc97'); bb.emit('mod', 'paint'); });
  function mechSheet(poi, tab) { const v = bb.player.veh || bb.ownedVeh.filter(Boolean).sort((a, b) => a.pos.distanceTo(bb.ppos()) - b.pos.distanceTo(bb.ppos()))[0];
    if (!v || v.pos.distanceTo(bb.ppos()) > 20) { bb.toast('Bring a vehicle to the workshop', '#ff9f1c'); return; } const c = v.owned ? P().cars[v.ownedIdx] : null; const cost = Math.round(repairCost(v) * bb.rawCost('svc.repair', 40) / 40 * bb.CFG.priceMul / 5) * 5;
    tab = tab || 'repair'; const chips = `<div class="chips">${[['repair', '🔧 Repairs'], ['paint', '🎨 Paint'], ['mods', '⚙ Mods']].map(([k, l]) => `<button class="chip${k === tab ? ' on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (!c && !v.company && v.state !== 'police') body += bb.rowHtml('papers', 'Get papers and keep it', `This ${v.spec.label.toLowerCase()} becomes yours and goes in Menu → Garage`, bb.inr(bb.cost('svc.papers', 5000)));
    if (tab === 'repair') body += bb.rowHtml('fix', 'Full repair', 'Denting, painting and engine', v.hp >= 99 ? 'Fine' : bb.inr(cost), v.hp >= 99 ? 'ghost' : '') + bb.rowHtml('service', 'Quick service', 'Oil change and a wash', bb.inr(bb.cost('svc.service', 400)), 'ghost');
    else if (!c) body += '<p class="note">Paint and mods are for your own vehicles. Get papers first, or park it in your home garage.</p>';
    else if (tab === 'paint') body += `<p class="note">Current colour: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${c.color || '#9aa'};vertical-align:-1px"></span> · each paint job ${bb.inr(bb.cost('mod.paint', 3000))}</p>` + PAINTS.map(([col, n]) => `<div class="row"><div class="nm"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${col};margin-right:8px;vertical-align:-3px"></span>${n}</div><button class="buy${c.color === col ? ' ghost' : ''}" data-paint="${col}">${c.color === col ? 'Current' : 'Paint'}</button></div>`).join('');
    else body += (bb.LOCKS && !['cycle', 'rickshaw'].includes(v.type) ? bb.rowHtml('autolock', '🔒 Central locking (auto-lock)', bb.LOCKS.LUX.has(v.type) ? 'Already built in on this model' : c.autolock ? 'Fitted · locks itself when you walk away' : 'Locks itself when you walk away · no more forgetting', bb.LOCKS.LUX.has(v.type) || c.autolock ? 'Fitted' : bb.inr(bb.cost('mod.autolock', 4500)), bb.LOCKS.LUX.has(v.type) || c.autolock ? 'ghost' : '') : '') + bb.rowHtml('tune', 'Engine tune', c.tune ? 'Done · about 10% faster' : 'About 10% more top speed', c.tune ? 'Done' : bb.inr(bb.cost('mod.tune', 15000)), c.tune ? 'ghost' : '') + bb.rowHtml('horn', 'Musical horn', c.horn ? 'Fitted · press H' : 'A five-note tune instead of a beep', c.horn ? 'Remove' : bb.inr(bb.cost('mod.horn', 1200)), c.horn ? 'ghost' : '') +
      NEONS.map(([col, n]) => `<div class="row"><div class="nm"><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${col};margin-right:8px;vertical-align:-3px"></span>Underglow · ${n}</div><button class="buy${c.neon === col ? ' ghost' : ''}" data-neon="${col}">${c.neon === col ? 'Remove' : bb.inr(bb.cost('mod.neon', 5000))}</button></div>`).join('');
    bb.openSheet(poi.name, `${v.spec.label}${c ? '' : ' · not yours'} · body ${Math.round(v.hp)}%`, chips + body,
    s => s.onclick = e => { const t = e.target.dataset.tab; if (t) return mechSheet(poi, t); const id = e.target.dataset.id, pc = e.target.dataset.paint, nc = e.target.dataset.neon;
      if (id === 'papers') { if (!bb.spend(bb.cost('svc.papers', 5000), true)) return; const i = bb.GARAGE.keep(v, null); P().cars[i].stolen = false; bb.toast(`Papers done · the ${v.spec.label.toLowerCase()} is yours`, '#3ddc97'); bb.closeSheet(); bb.enterVehicle(bb.ownedVeh[i]); return; }
      if (id === 'fix' && v.hp < 99) { if (!bb.spend(cost, true)) return; bb.closeSheet(); if (bb.player.veh === v) bb.exitVehicle(true); const ci = c ? v.ownedIdx : -1; if (ci < 0) refs[v.id = v.id || Math.random().toString(36).slice(2)] = v; v.repairing = true; intoShop(v);
        bb.TIMERS.add({ kind: 'repair', icon: '🔧', label: 'Repair · ' + v.spec.label, secs: 30 / Math.max(.05, bb.CFG.timeSpeed), data: { car: ci, ref: ci < 0 ? v.id : null, name: v.spec.label } }); bb.toast('The mechanic is on it · keep playing, the timer is at the top', '#ffc93c'); }
      if (id === 'service' && bb.spend(bb.cost('svc.service', 400))) { v.hp = Math.min(100, v.hp + 10); bb.toast('Serviced and washed', '#3ddc97'); }
      if (!c) return; const i = v.ownedIdx;
      if (pc && c.color !== pc) { if (!bb.spend(bb.cost('mod.paint', 3000), true)) return; bb.closeSheet(); if (bb.player.veh === v) bb.exitVehicle(true); v.repairing = true; intoShop(v); bb.TIMERS.add({ kind: 'paint', icon: '🎨', label: 'Paint · ' + v.spec.label, secs: 40 / Math.max(.05, bb.CFG.timeSpeed), data: { car: i, color: pc, name: v.spec.label } }); bb.toast('In the paint shop · keep playing, the timer is at the top', '#ffc93c'); }
      if (id === 'autolock' && !c.autolock && !(bb.LOCKS && bb.LOCKS.LUX.has(v.type))) { if (!bb.spend(bb.cost('mod.autolock', 4500), true)) return; c.autolock = true; bb.save(); bb.toast('🔒 Central locking fitted · it locks itself when you walk away', '#3ddc97'); bb.emit('mod', 'autolock'); mechSheet(poi, 'mods'); return; }
      if (id === 'tune' && !c.tune) { if (!bb.spend(bb.cost('mod.tune', 15000), true)) return; c.tune = true; bb.save(); bb.toast('Engine tuned · more top speed', '#3ddc97'); bb.emit('mod', 'tune'); mechSheet(poi, 'mods'); }
      if (id === 'horn') { if (c.horn) c.horn = false; else { if (!bb.spend(bb.cost('mod.horn', 1200), true)) return; c.horn = true; bb.emit('mod', 'horn'); } bb.save(); mechSheet(poi, 'mods'); }
      if (nc) { if (c.neon === nc) c.neon = null; else { if (!bb.spend(bb.cost('mod.neon', 5000), true)) return; c.neon = nc; bb.emit('mod', 'neon'); } refresh(i); bb.save(); mechSheet(poi, 'mods'); } }); }
  // Tuned engines go faster.
  bb.speedMods.push(v => v.owned && P().cars[v.ownedIdx] && P().cars[v.ownedIdx].tune ? 1.1 : 1);
  bb.poiHandlers.mechanic = mechSheet;
  function helpSheet() { const v = bb.player.veh || bb.ownedVeh.filter(Boolean).sort((a, b) => a.pos.distanceTo(bb.ppos()) - b.pos.distanceTo(bb.ppos()))[0];
    bb.openSheet('Roadside help', v ? `${v.spec.label} · fuel ${Math.round(v.fuel)}% · body ${Math.round(v.hp)}%` : 'No vehicle nearby', v ? bb.rowHtml('mech', 'Call a mechanic to your vehicle', `A mechanic rides out to where it is parked and repairs it fully · body now ${Math.round(v.hp)}%`, bb.inr(bb.cost('svc.callmech', 2500))) + bb.rowHtml('fuel', 'Fuel delivery', 'A rider brings jerrycans · 30% tank', bb.inr(bb.cost('svc.roadfuel', 500))) + bb.rowHtml('tow', '🚛 Tow to the mechanic', bb.TOW ? bb.TOW.note(v) : 'The tow truck takes it to the garage', bb.inr(bb.TOW ? bb.TOW.price(v) : bb.cost('svc.tow', 1500))) : '',
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id || !v) return; if (id === 'fuel') { if (!v.spec.fuel) { bb.toast('No fuel needed', '#d6c8e4'); return; } if (!bb.spend(bb.cost('svc.roadfuel', 500), true)) return; bb.closeSheet(); const at = () => ({ x: v.pos.x, z: v.pos.z }); if (bb.VISIT) bb.VISIT.send({ role: 'fuel', to: at, label: 'Fuel delivery', onArrive: () => { v.fuel = Math.max(v.fuel, 30); bb.toast('⛽ Fuel delivered · 30% tank', '#3ddc97'); } }); else v.fuel = Math.max(v.fuel, 30); }
        if (id === 'mech') { if (!bb.spend(bb.cost('svc.callmech', 2500), true)) return; bb.closeSheet(); const at = () => ({ x: v.pos.x + Math.cos(v.h) * 1.8, z: v.pos.z - Math.sin(v.h) * 1.8 }); if (bb.VISIT) bb.VISIT.send({ role: 'mechanic', to: at, label: 'The mechanic', onArrive: () => { v.hp = 100; bb.save(); bb.toast('🔧 Repaired on the spot · good as new', '#3ddc97'); bb.emit('mod', 'repair'); } }); else v.hp = 100; }
        if (id === 'tow' && bb.TOW) { bb.closeSheet(); return bb.TOW.call(v); }
        if (id === 'tow') { if (!bb.spend(bb.cost('svc.tow', 1500), true)) return; bb.closeSheet(); const at = () => ({ x: v.pos.x, z: v.pos.z }); if (bb.VISIT) bb.VISIT.send({ role: 'tow', to: at, label: 'The tow truck', onArrive: () => { v.hp = Math.max(v.hp, 60); v.fuel = Math.max(v.fuel || 0, 10); bb.toast('Patched up · get a full repair at a garage', '#3ddc97'); } }); else v.hp = Math.max(v.hp, 60); } }); }
  bb.addApp({ id: 'roadside', label: 'Roadside help', icon: '🛠', fn: helpSheet }); bb.ROADSIDE = helpSheet;
});
