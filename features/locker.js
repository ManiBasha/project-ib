// Weapon locker and carrying guns (Beta v2.03.00).
//  • Every home you own has a weapon locker in its garage. Guns kept there are safe: if you are busted the police take
//    only the guns you carry, and if you are knocked out only the guns you carry fall to the ground.
//  • A gun in your hand is seen. Walk near a police jeep or a police station with a gun drawn and they come after you
//    (one star). Put it away (Q until you have bare hands) or leave it in the locker. Bats, lathis and knives are fine.
window.BBFeatures.push(function (bb) {
  const P = () => bb.P, esc = bb.esc, pl = bb.player;
  const L = () => { const x = P().extra = P().extra || {}; return x.locker = x.locker || { w: [], ammo: {} }; };
  const isGun = w => !!(bb.WEAP && bb.WEAP[w] && bb.WEAP[w].ammo);
  const NAME = w => (bb.WEAP && bb.WEAP[w] && bb.WEAP[w].name) || w;
  function homeNear(r) { const pp = bb.ppos(); for (const id of P().homes || []) { const q = bb.pois.find(x => x.type === 'home' && x.extra === id); if (q && Math.hypot(q.x - pp.x, q.z - pp.z) < r) return q; } return null; }
  function sheet() { const p = P(), k = L(); const carried = p.weapons.filter(isGun); const ammo = w => p.ammo[bb.WEAP[w].ammo] || 0;
    const rows = carried.map(w => bb.rowHtml('put_' + w, `🔫 ${esc(NAME(w))}`, `In your hands · ${ammo(w)} rounds`, 'Store', 'ghost')).join('') +
      k.w.map(w => bb.rowHtml('get_' + w, `🔒 ${esc(NAME(w))}`, `In the locker · ${k.ammo[bb.WEAP[w].ammo] || 0} rounds`, 'Take')).join('') +
      ((p.armour || 0) > 0 ? bb.rowHtml('put_armour', '🦺 Body armour', `Wearing · ${Math.round(p.armour)}%`, 'Store', 'ghost') : '') + (k.armour ? bb.rowHtml('get_armour', '🦺 Body armour', `In the locker · ${Math.round(k.armour)}%`, 'Take') : '');
    bb.openSheet('🔒 Weapon locker', 'Guns kept here are safe from the police and are not dropped if you are knocked out', (rows || '<p class="note">Nothing to store. Buy guns at a weapon shop (Hathiyar Ghar).</p>') + '<p class="note">A gun in your hand near a police jeep or a police station brings the police after you. Put it away with Q (bare hands) or keep it here.</p>',
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id) return; const [op, w] = id.split('_'); const p2 = P(), k2 = L();
        if (w === 'armour') { if (op === 'put') { k2.armour = Math.max(k2.armour || 0, p2.armour); p2.armour = 0; } else { p2.armour = Math.max(p2.armour || 0, k2.armour); k2.armour = 0; } }
        else if (op === 'put') { const a = bb.WEAP[w].ammo; p2.weapons = p2.weapons.filter(q => q !== w); if (!k2.w.includes(w)) k2.w.push(w); k2.ammo[a] = (k2.ammo[a] || 0) + (p2.ammo[a] || 0); if (!p2.weapons.some(q => isGun(q) && bb.WEAP[q].ammo === a)) p2.ammo[a] = 0; if (p2.weapon === w) p2.weapon = 'fist'; }
        else { const a = bb.WEAP[w].ammo; k2.w = k2.w.filter(q => q !== w); if (!p2.weapons.includes(w)) p2.weapons.push(w); p2.ammo[a] = (p2.ammo[a] || 0) + (k2.ammo[a] || 0); k2.ammo[a] = 0; }
        bb.updWeap(); bb.setDirty(); bb.save(); sheet(); }); }
  bb.addPrompt(() => { if (bb.inside || pl.mode !== 'foot') return null; const h = homeNear(7); if (!h) return null; return { text: '🔒 Weapon locker', fn: sheet }; });
  bb.LOCKER = { sheet, get list() { return L(); } };
  /* ---------- a drawn gun is noticed ---------- */
  let seenT = 0, cool = 0, told = false;
  bb.onUpdate(dt => { if (!bb.started || bb.inside || bb.afk || pl.hidden) { seenT = 0; return; } cool = Math.max(0, cool - dt);
    const w = P().weapon; if (pl.mode !== 'foot' || !isGun(w) || !bb.CFG.weapons) { seenT = 0; return; }
    if (!told) { told = true; bb.toast('🔫 Gun in hand · the police will notice it · Q puts it away', '#ffc93c'); }
    const pp = bb.ppos(); let near = false;
    for (const v of bb.vehicles) if (v.state === 'police' && !v.dead && Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z) < 30) { near = true; break; }
    if (!near) for (const q of bb.pois) if (q.type === 'police' && Math.abs(q.x - pp.x) < 25 && Math.abs(q.z - pp.z) < 25) { near = true; break; }
    if (!near) { seenT = Math.max(0, seenT - dt); return; }
    seenT += dt; if (seenT > 1.2 && cool <= 0 && pl.stars < 1) { cool = 20; seenT = 0; bb.addWanted(1, `Seen with a ${NAME(w).toLowerCase()} in hand`); } });
  bb.on('bust', () => { const k = L(); if (k.w.length) setTimeout(() => bb.toast(`🔒 The guns in your locker are safe (${k.w.map(NAME).join(', ')})`, '#d6c8e4'), 3400); });
});
