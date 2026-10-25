// Wildlife at the national parks, tiger reserves, sanctuaries and safari parks (Beta v2.01.00). When you come within
// about 300 m of a park gate, its animals graze and wander in the open ground behind it: rhinos at Kaziranga, lions at
// Gir, a tiger now and then at the tiger reserves, elephants, deer, peacocks, crocodiles by the water and flamingos at
// the bird sanctuaries. They are seen from the road and the gate, like a safari drive. Only the nearest park is shown.
window.BBFeatures.push(function (bb) {
  const W = bb.WORLD;
  const RULES = [
    [/KAZIRANGA|POBITORA|MANAS|ORANG|JALDAPARA|GORUMARA|DUDHWA|DIBRU/, [['rhino', 4], ['elephant', 3], ['deer', 5], ['buffalo', 3], ['peacock', 2]]],
    [/GIR\b|GIR |LION|ETAWAH/, [['lion', 2], ['lioness', 3], ['deer', 5], ['peacock', 3]]],
    [/SUNDARBANS/, [['tiger', 1], ['deer', 6], ['crocodile', 3], ['monkey', 3]]],
    [/BHITARKANIKA|CHAMBAL|KATARNIAGHAT|CROCODILE/, [['crocodile', 5], ['flamingo', 4], ['deer', 2]]],
    [/BIRD|EAGLENEST|SULTANPUR|KEOLADEO|HARIKE|THOL|NAL SAROVAR|CHILIKA/, [['flamingo', 8], ['peacock', 4], ['deer', 2]]],
    [/GIBBON|HOOLLONGAPAR|SEPAHIJALA|PHAWNGPUI|NOKREK|BALPAKRAM|NTANGKI/, [['monkey', 7], ['deer', 4], ['peacock', 2], ['elephant', 1]]],
    [/VALLEY OF FLOWERS|GREAT HIMALAYAN/, [['goat', 6], ['deer', 3], ['bear', 1]]],
    [/GUINDY/, [['deer', 8], ['peacock', 3], ['monkey', 2]]],
    [/NANDANKANAN/, [['tiger', 2], ['deer', 5], ['crocodile', 2], ['peacock', 2]]],
    [/KEIBUL|SANGAI/, [['deer', 8], ['buffalo', 2]]],
    [/HEMIS|SNOW LEOPARD|DACHIGAM/, [['leopard', 1], ['goat', 6], ['bear', 1], ['deer', 3]]],
    [/ELEPHANT|DALMA|BANDIPUR|PERIYAR|NAGARHOLE|BETLA|MUDUMALAI|WAYANAD|DUBARE|RAJAJI|PAKKE|NAMERI/, [['elephant', 5], ['deer', 4], ['monkey', 3], ['peacock', 2]]],
    [/TIGER|RANTHAMBORE|KANHA|BANDHAVGARH|PENCH|TADOBA|CORBETT|VALMIKI|BUXA|NAMDAPHA|DAMPA|PANNA|SATPURA|SIMILIPAL|ACHANAKMAR/, [['tiger', 1], ['deer', 6], ['monkey', 3], ['peacock', 3], ['bear', 1]]],
    [/KUNO|LEOPARD/, [['leopard', 2], ['deer', 5], ['peacock', 2]]],
    [/WHITE TIGER|JUNGLE SAFARI|MAITRI/, [['tiger', 3], ['deer', 4], ['peacock', 2]]],
    [/./, [['deer', 5], ['monkey', 3], ['peacock', 3], ['bear', 1]]]];
  const SPEED = { elephant: .9, buffalo: .8, deer: 1.3, monkey: 1.2, peacock: .7, bear: .8, tiger: 1.4, lion: 1.1, lioness: 1.2, leopard: 1.4, rhino: .8, crocodile: .3, flamingo: .5, goat: .9 };
  const NAMES = { whiteTigerSafari: 'WHITE TIGER SAFARI', jungleSafari: 'JUNGLE SAFARI', maitriBagh: 'MAITRI BAGH', girGate: 'GIR LIONS' };
  const parks = (W.landmarks || []).map(l => { const [k, ...a] = l.kind.split(':'); const name = k === 'parkGate' ? a.join(':') : NAMES[k]; return name ? { x: l.x, z: l.z, name: name.toUpperCase() } : null; }).filter(Boolean);
  const faunaOf = p => { for (const [re, list] of RULES) if (re.test(p.name)) return list; return RULES[RULES.length - 1][1]; };
  const okAt = (x, z) => !bb.isWater(x, z) && !(bb.wetNear && bb.wetNear(x, z, 2)) && !bb.roadAt(x, z, 4) && !bb.zoneAt(x, z, 12) && !(bb.isForeign && bb.isForeign(x, z));
  const nearWater = (x, z) => bb.isWater(x + 6, z) || bb.isWater(x - 6, z) || bb.isWater(x, z + 6) || bb.isWater(x, z - 6);
  let cur = null, herd = [], tick = 0;
  function clear() { for (const a of herd) bb.scene.remove(a.g); herd = []; }
  function fill(p) { const list = faunaOf(p); let seed = Math.abs(Math.round(p.x * 7 + p.z * 13)); const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // a tiger is seen on about two visits in three (seeded by the hour so it does not flicker)
    const hour = Math.floor(Date.now() / 3.6e6); const tigerToday = ((hour + seed) % 3) !== 0;
    for (const [kind, n] of list) { if ((kind === 'tiger' || kind === 'leopard') && !tigerToday && !/WHITE|SAFARI|MAITRI|NANDANKANAN/.test(p.name)) continue;
      for (let i = 0; i < n; i++) { let x = 0, z = 0, ok = false; for (let t = 0; t < 30 && !ok; t++) { const a = rnd() * 6.283, r = 22 + rnd() * 70; x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r; ok = okAt(x, z) && (kind !== 'crocodile' || nearWater(x, z) || t > 20); }
        if (!ok) continue; const g = bb.buildAnimal(kind, { male: i === 0 }); g.position.set(x, 0, z); bb.scene.add(g); herd.push({ g, kind, x, z, h: rnd() * 6.28, sp: 0, t: rnd() * 4, home: p }); } } }
  bb.onUpdate((dt, now) => { if (!bb.started) return; tick -= dt;
    if (tick <= 0) { tick = 1.5; const pp = bb.ppos(); let best = null, bd = 300; if (!bb.inside) for (const p of parks) { const d = Math.hypot(p.x - pp.x, p.z - pp.z); if (d < bd) { bd = d; best = p; } }
      if (best !== cur) { clear(); cur = best; if (cur) fill(cur); } }
    if (!herd.length) return; const pp = bb.ppos();
    for (const a of herd) { a.t -= dt; if (a.t <= 0) { a.t = 3 + Math.random() * 6; a.sp = Math.random() < .55 ? 0 : SPEED[a.kind] || 1; a.h += (Math.random() - .5) * 2; }
      const d = Math.hypot(pp.x - a.x, pp.z - a.z); if ((a.kind === 'deer' || a.kind === 'peacock' || a.kind === 'monkey' || a.kind === 'flamingo') && d < 16) { a.h = Math.atan2(a.x - pp.x, a.z - pp.z); a.sp = a.kind === 'deer' ? 6 : 2.5; a.t = 2; }
      const nx = a.x + Math.sin(a.h) * a.sp * dt, nz = a.z + Math.cos(a.h) * a.sp * dt;
      if (a.sp && (!okAt(nx, nz) || Math.hypot(nx - a.home.x, nz - a.home.z) > 110)) a.h += Math.PI * .8; else { a.x = nx; a.z = nz; }
      a.g.position.set(a.x, 0, a.z); a.g.rotation.y = a.h; if (bb.animGait) bb.animGait({ g: a.g }, now, a.sp); } });
  bb.PARKFAUNA = { parks, get herd() { return herd; }, faunaOf };
});
