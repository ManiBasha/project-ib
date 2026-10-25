// Home garages: park your vehicles at a home you own and take them out later from Menu → Garage.
// A vehicle taken from the street (or from another player) can be kept: park it in your garage.
window.BBFeatures.push(function (bb) {
  const P = () => bb.P;
  function homeHere(r) { const pp = bb.ppos(); let best = null, bd = r; for (const id of P().homes) { const q = bb.pois.find(x => x.type === 'home' && x.extra === id); if (!q) continue; const d = Math.hypot(q.x - pp.x, q.z - pp.z); if (d < bd) { bd = d; best = q; } } return best; }
  function keep(v, home) { const p = P(); const col = v.m.userData.col || null; p.cars.push({ type: v.type, fuel: Math.round(v.fuel), hp: Math.round(v.hp), color: col, stolen: true }); const i = p.cars.length - 1;
    if (bb.player.veh === v) bb.exitVehicle(true); bb.removeVeh(v); bb.ownedVeh[i] = null; if (home) bb.storeOwned(i, home.extra); else { const [x, z, h] = (bb.freeRoadSpot || bb.roadSpotNear)(bb.ppos()); bb.spawnOwned(i, x, z, h); } bb.save(); return i; }
  bb.addFirstPrompt(() => { const pl = bb.player; if (pl.mode !== 'drive' || !pl.veh || bb.inside) return null; const v = pl.veh; if (Math.abs(v.v) > 2 || v.company || v.state === 'police') return null; const home = homeHere(16); if (!home) return null;
    const name = bb.homeById(home.extra).name;
    if (v.owned) return { text: `Park in your garage · ${name}`, fn: () => { bb.storeOwned(v.ownedIdx, home.extra); bb.save(); bb.toast(`${v.spec.label} parked in your garage. Take it out from Menu → Garage`, '#3ddc97'); bb.emit('garage', { kind: 'park' }); } };
    return { text: `Keep this ${v.spec.label.toLowerCase()} in your garage`, fn: () => { keep(v, home); bb.toast(`The ${v.spec.label.toLowerCase()} is yours now · in your garage at ${name}`, '#3ddc97'); bb.emit('garage', { kind: 'keep' }); } }; });
  bb.GARAGE = { keep };
});
