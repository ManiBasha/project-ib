// Home, garage and property (Beta v1.01.03).
// - Everyone has a free starter home with a garage in their home city. A new game starts there, with your vehicle in
//   front of it; after that the game continues where you left off. Pick another home city in Menu → Property.
// - Rent a home in another city by the Bay day, buy homes, sell them back (80% of the price) or rent them out.
// - Any vehicle you are driving can be added to your garage (you need a home with a garage first). Vehicles taken
//   from the street are marked as taken until you get papers at a mechanic; other players can take yours too.
window.BBFeatures.push(function (bb) {
  const W = bb.WORLD, P = () => bb.P, esc = bb.esc;
  const ex = () => { const p = P(); p.extra = p.extra || {}; return p.extra; };
  const starterOf = zid => W.homes.find(h => h.starter && h.zone === zid);
  const nearestStarterZone = (x, z) => W.zones.filter(q => starterOf(q.id)).sort((a, b) => Math.hypot(a.x0 + a.nx * 40 - x, a.z0 + a.nz * 40 - z) - Math.hypot(b.x0 + b.nx * 40 - x, b.z0 + b.nz * 40 - z))[0];
  const homePoi = id => bb.pois.find(p => p.type === 'home' && p.extra === id);
  // Beta v2.03.00: leases run in play days (time you spend in the game), not real days, so rent never runs out while you are away
  const day = () => bb.playDay();
  function setHomeCity(zid, quiet) { const h = starterOf(zid); if (!h) return false; const p = P(), e = ex(); const old = e.homeCity && starterOf(e.homeCity);
    if (old && old.id !== h.id) { p.homes = p.homes.filter(x => x !== old.id); for (const c of p.cars) if (c.garage === old.id) c.garage = h.id; }
    if (!p.homes.includes(h.id)) p.homes.push(h.id); e.homeCity = zid; bb.save(); if (!quiet) bb.toast(`🏠 Your home is now in ${W.zones.find(q => q.id === zid).name}`, '#3ddc97'); bb.emit('buy', { kind: 'home', id: h.id }); return h; }
  // a new game: home city = the city you start in, and you start at your home with your vehicle outside
  const fresh = !P().pos;   // a brand-new game (no saved position yet)
  bb.onStart(() => { const e = ex(); if (e.homeCity && starterOf(e.homeCity)) { const h = starterOf(e.homeCity); if (!P().homes.includes(h.id)) P().homes.push(h.id); return; }
    const pp = bb.ppos(); const z = bb.zoneAt(pp.x, pp.z, 300) && starterOf(bb.zoneAt(pp.x, pp.z, 300).id) ? bb.zoneAt(pp.x, pp.z, 300) : nearestStarterZone(pp.x, pp.z); if (!z) return;
    const h = setHomeCity(z.id, true); const poi = homePoi(h.id); if (!poi) return; if (!fresh) return bb.toast(`🏠 You have a free starter home with a garage in ${z.name} · Menu → Property`, '#3ddc97');
    const [x, zz, hd] = bb.roadSpotNear(poi); const v = bb.player.veh; bb.teleport(x, zz, hd); if (v) { v.pos.set(x, 0, zz); v.h = hd; v.v = 0; bb.enterVehicle(v); }
    setTimeout(() => bb.toast(`🏠 Welcome home · your free starter home and garage are right here in ${z.name}`, '#3ddc97'), 1500); });
  // walking up to a starter home of another city
  bb.starterSheet = (h, poi) => { const z = W.zones.find(q => q.id === h.zone); const cur = ex().homeCity && W.zones.find(q => q.id === ex().homeCity);
    bb.openSheet(`🏠 ${esc(h.name)}`, 'A free starter home with a garage', bb.rowHtml('move', `Make ${esc(z.name)} my home city`, `${cur ? `Moves your starter home from ${esc(cur.name)}. ` : ''}Vehicles in that garage move with you`, cur ? bb.inr(bb.cost('home.move', 5000)) : 'Free') +
      bb.rowHtml('rent', 'Or rent a place here', 'Menu → Property lists homes to rent and buy', 'Property', 'ghost'),
      s => s.onclick = e => { const id = e.target.dataset.id; if (id === 'rent') return sheet(); if (id !== 'move') return; if (cur && !bb.spend(bb.cost('home.move', 5000), true)) return; setHomeCity(h.zone); bb.closeSheet(); bb.enterHome(poi); }); };
  /* renting by the Bay day */
  const rentOf = h => Math.max(150, Math.round(bb.cost('home.' + h.id, h.price) * .004 / 10) * 10);
  bb.onStart(() => { const e = ex(); if (e.lease && !e.leaseV2) { const d0 = Math.floor(bb.gameMin() / 1440); for (const id in e.lease) e.lease[id] = day() + Math.max(1, e.lease[id] - d0); } e.leaseV2 = 1; });
  bb.onUpdate(() => { const e = ex(); if (!e.lease || !e.leaseV2) return; const d = day(); for (const [id, until] of Object.entries(e.lease)) if (d > until) { delete e.lease[id]; P().homes = P().homes.filter(x => x !== id); for (const c of P().cars) if (c.garage === id) c.garage = null; const h = bb.homeById(id); bb.toast(`🔑 Your rent for ${h ? h.name : 'a home'} ended · pay again in Menu → Property to keep it`, '#ff9f1c'); bb.save(); } });
  function sheet() { const p = P(), e = ex(); e.lease = e.lease || {}; const d = day(); const hc = e.homeCity && W.zones.find(q => q.id === e.homeCity);
    const owned = p.homes.map(id => bb.homeById(id)).filter(Boolean);
    const rows = owned.map(h => { const z = W.zones.find(q => q.id === h.zone); const lease = e.lease[h.id] != null; const tenants = p.rent && p.rent[h.id];
      return bb.rowHtml((h.starter ? 'go_' : lease ? 'go_' : 'sell_') + h.id, `${h.starter ? '🏠' : lease ? '🔑' : '🏡'} ${esc(h.name)}`, `${esc(z ? z.name : '')} · ${h.starter ? 'Free starter home with garage' : lease ? `Rented · ${e.lease[h.id] - d + 1} Bay day(s) left` : tenants ? 'Owned · rented out to tenants' : 'Owned · garage'}`, h.starter || lease ? 'Go there' : `Sell ${bb.inr(Math.round(bb.cost('home.' + h.id, h.price) * .8))}`, h.starter || lease ? 'ghost' : 'danger'); }).join('');
    const market = W.homes.filter(h => !h.starter && !p.homes.includes(h.id)).map(h => { const z = W.zones.find(q => q.id === h.zone); return bb.rowHtml('rent_' + h.id, `${esc(h.name)}`, `${esc(z ? z.name : '')} · rent ${bb.inr(rentOf(h))} a Bay day · buy ${bb.inr(bb.cost('home.' + h.id, h.price))}`, 'Rent 3 days', 'ghost'); }).join('');
    const cities = W.zones.filter(q => starterOf(q.id)).sort((a, b) => a.name.localeCompare(b.name));
    bb.openSheet('🏡 Property', hc ? `Home city: ${esc(hc.name)} · ${owned.length} home(s)` : 'Pick a home city', `<h3 class="sub">Your homes</h3>${rows || '<p class="note">No homes yet.</p>'}
      <h3 class="sub">Home city (free starter home)</h3><div class="chips">${cities.map(z => `<button class="chip${e.homeCity === z.id ? ' on' : ''}" data-city="${z.id}">${esc(z.name)}</button>`).join('')}</div><p class="note">Moving your home city costs ${bb.inr(bb.cost('home.move', 5000))}; vehicles in the garage move with you.</p>
      <h3 class="sub">Rent or buy</h3>${market}<p class="note">To buy, visit the home itself or a 🏘 Homes for sale office. Rent is paid for 3 Bay days at a time; when it ends the home goes back on the market and your vehicles come out of its garage.</p>`,
      s => s.onclick = e2 => { const id = e2.target.dataset.id, c = e2.target.dataset.city;
        if (c) { if (c === e.homeCity) return; if (e.homeCity && !bb.spend(bb.cost('home.move', 5000), true)) return; setHomeCity(c); return sheet(); }
        if (!id) return; const [k, ...rest] = id.split('_'); const hid = rest.join('_'); const h = bb.homeById(hid); if (!h) return;
        if (k === 'go') { const poi = homePoi(hid); if (!poi) return; const [x, z, hd] = bb.roadSpotNear(poi); bb.closeSheet(); const v = bb.player.veh; const far = Math.hypot(poi.x - bb.ppos().x, poi.z - bb.ppos().z); if (far > 900) return bb.toast('That home is in another city · take a train, bus, flight or drive there (the map gives directions)', '#ffc93c'); bb.TRAVEL && bb.TRAVEL.go(x, z, h.name); return; }
        if (k === 'sell') { if (!e2.target.dataset.sure) { e2.target.dataset.sure = 1; e2.target.textContent = 'Tap again to sell'; return; } const val = Math.round(bb.cost('home.' + h.id, h.price) * .8); p.homes = p.homes.filter(x => x !== hid); if (p.rent) delete p.rent[hid]; for (const c2 of p.cars) if (c2.garage === hid) c2.garage = null; p.bank += val; bb.save(); bb.toast(`Sold ${h.name} · +${bb.inr(val)} to your bank`, '#3ddc97'); bb.emit('sell', { kind: 'home', id: hid }); return sheet(); }
        if (k === 'rent') { const fee = rentOf(h) * 3; if (!bb.spend(fee, true)) return; e.lease[hid] = day() + 2; if (!p.homes.includes(hid)) p.homes.push(hid); bb.save(); bb.toast(`🔑 ${h.name} is yours for 3 Bay days`, '#3ddc97'); return sheet(); } }); }
  bb.addApp({ id: 'property', label: 'Property', icon: '🏡', group: 'menu', fn: sheet });
  /* add the vehicle you are driving to your garage */
  function addToGarage() { const v = bb.player.veh; if (!v || bb.player.mode !== 'drive') return bb.toast('Get in the driver seat of a vehicle first', '#ff9f1c');
    if (v.owned) return bb.toast('This one is already in your garage list · park it at a home to store it', '#d6c8e4');
    const homes = P().homes.map(id => bb.homeById(id)).filter(Boolean); if (!homes.length) return bb.toast('You need a home with a garage first · Menu → Property', '#ff9f1c');
    const pp = bb.ppos(); const near = homes.map(h => ({ h, poi: homePoi(h.id) })).filter(q => q.poi).sort((a, b) => Math.hypot(a.poi.x - pp.x, a.poi.z - pp.z) - Math.hypot(b.poi.x - pp.x, b.poi.z - pp.z))[0];
    const label = v.spec.label; const i = bb.GARAGE.keep(v, null); const c = P().cars[i]; c.garage = null; bb.save();
    bb.toast(`🚗 The ${label.toLowerCase()} is in your garage list now${c.stolen ? ' · it is a taken vehicle: get papers at a mechanic or the police may stop you' : ''} · park it at ${near ? near.h.name : 'your home'} to keep it safe`, '#3ddc97'); bb.emit('garage', { kind: 'keep' });
    const ov = bb.ownedVeh[i]; if (ov) bb.enterVehicle(ov); }
  bb.addApp({ id: 'addgarage', label: 'Add to garage', icon: '🅿', group: 'menu', fn: () => { bb.closeSheet(); addToGarage(); } });
  bb.PROPERTY = { setHomeCity, sheet, addToGarage };
});
