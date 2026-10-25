// Open zoos: walk-in zoological parks where the animals roam big open habitats behind dry moats and water, not
// cages. Lions, tigers, a leopard, elephants, giraffes, zebras, rhinos, hippos, crocodiles, flamingos, sloth bears,
// monkeys, spotted deer and peacocks (the peacocks wander the paths with you). Take the battery-car safari through
// the habitats, eat at the canteen and read the boards. Real zoos: Mysuru, Bannerghatta, Byculla (Mumbai),
// Kevadia Jungle Safari, Kamla Nehru (Ahmedabad), Katraj (Pune), Bondla (Goa), Pilikula (Mangaluru), Thiruvananthapuram.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, W = bb.WORLD, esc = bb.esc;
  const ll = (lat, lon) => [3250 + (lon - 73.6) * 850, 11000 + (16 - lat) * 1000];
  const zoneP = (id, dx, dz) => { const z = W.zones.find(q => q.id === id); return z ? [z.x0 + z.nx * 40 + dx, z.z0 + z.nz * 40 + dz] : null; };
  const ZOOS = [
    { id: 'mysuru', name: 'Mysuru Zoo', full: 'Sri Chamarajendra Zoological Gardens', p: () => zoneP('mysuru', 60, 70), st: 'KA' },
    { id: 'bannerghatta', name: 'Bannerghatta Biological Park', full: 'Bannerghatta Biological Park and Safari', p: () => zoneP('bengaluru', 30, 270), st: 'KA', safari: true },
    { id: 'byculla', name: 'Byculla Zoo', full: 'Veermata Jijabai Bhosale Udyan (Rani Baug)', p: () => zoneP('mumbai', 140, 260), st: 'MH' },
    { id: 'kevadia', name: 'Kevadia Jungle Safari', full: 'Sardar Patel Zoological Park, Kevadia', p: () => [4650, 6180], st: 'GJ', safari: true },
    { id: 'kankaria', name: 'Kamla Nehru Zoo', full: 'Kamla Nehru Zoological Garden, Kankaria', p: () => zoneP('ahmedabad', 60, 90), st: 'GJ' },
    { id: 'katraj', name: 'Katraj Zoo', full: 'Rajiv Gandhi Zoological Park, Katraj', p: () => zoneP('pune', 20, 230), st: 'MH' },
    { id: 'bondla', name: 'Bondla Zoo', full: 'Bondla Wildlife Sanctuary and Zoo', p: () => zoneP('ponda', 140, -40), st: 'GA' },
    { id: 'pilikula', name: 'Pilikula Biological Park', full: 'Pilikula Biological Park, Mangaluru', p: () => zoneP('mangaluru', 40, -70), st: 'KA' },
    { id: 'tvm', name: 'Thiruvananthapuram Zoo', full: 'Thiruvananthapuram Zoo and Museum', p: () => zoneP('thiruvananthapuram', 30, -40), st: 'KL' },
    // Beta v2.01.00: zoos of the rest of the country
    { id: 'delhizoo', name: 'National Zoological Park', full: 'National Zoological Park, Delhi', p: () => zoneP('delhi', 200, 60), st: 'DL' },
    { id: 'chhatbir', name: 'Chhatbir Zoo', full: 'Mahendra Chaudhary Zoological Park, Chhatbir', p: () => zoneP('mohali', 60, 140), st: 'PB', safari: true },
    { id: 'lucknowzoo', name: 'Lucknow Zoo', full: 'Nawab Wajid Ali Shah Zoological Garden', p: () => zoneP('lucknow', 120, -40), st: 'UP' },
    { id: 'kanpurzoo', name: 'Kanpur Zoo', full: 'Allen Forest Zoo, Kanpur', p: () => zoneP('kanpur', 60, -150), st: 'UP' },
    { id: 'etawah', name: 'Etawah Safari Park', full: 'Etawah Safari Park (lion safari)', p: () => zoneP('etawah', 140, 60), st: 'UP', safari: true },
    { id: 'nahargarh', name: 'Nahargarh Biological Park', full: 'Nahargarh Biological Park, Jaipur', p: () => zoneP('jaipur', -40, -260), st: 'RJ', safari: true },
    { id: 'vanvihar', name: 'Van Vihar', full: 'Van Vihar National Park and Zoo, Bhopal', p: () => zoneP('bhopal', -60, 60), st: 'MP' },
    { id: 'gwaliorzoo', name: 'Gwalior Zoo', full: 'Gandhi Zoological Park, Gwalior', p: () => zoneP('gwalior', 40, 90), st: 'MP' },
    { id: 'maitribagh', name: 'Maitri Bagh Zoo', full: 'Maitri Bagh Zoo, Bhilai (white tigers)', p: () => zoneP('bhilai', 60, 90), st: 'CG' },
    { id: 'nandankanan', name: 'Nandankanan Zoo', full: 'Nandankanan Zoological Park (white tigers)', p: () => zoneP('bhubaneswar', 40, -200), st: 'OD', safari: true },
    { id: 'nehruzoo', name: 'Nehru Zoological Park', full: 'Nehru Zoological Park, Hyderabad', p: () => zoneP('hyderabad', 60, 200), st: 'TG', safari: true },
    { id: 'vandalur', name: 'Arignar Anna Zoo', full: 'Arignar Anna Zoological Park, Vandalur', p: () => zoneP('chennai', -60, 330), st: 'TN', safari: true },
    { id: 'alipore', name: 'Alipore Zoo', full: 'Alipore Zoological Garden, Kolkata', p: () => zoneP('kolkata', -60, 150), st: 'WB' },
    { id: 'patnazoo', name: 'Patna Zoo', full: 'Sanjay Gandhi Biological Park, Patna', p: () => zoneP('patna', 60, 150), st: 'BR' },
    { id: 'birsazoo', name: 'Birsa Zoological Park', full: 'Bhagwan Birsa Biological Park, Ranchi', p: () => zoneP('ranchi', 60, 180), st: 'JH', safari: true },
    { id: 'tatazoo', name: 'Jamshedpur Zoo', full: 'Tata Steel Zoological Park', p: () => zoneP('jamshedpur', -40, 140), st: 'JH' },
    { id: 'darjzoo', name: 'Himalayan Zoo, Darjeeling', full: 'Padmaja Naidu Himalayan Zoological Park (red pandas)', p: () => zoneP('darjeeling', -40, 100), st: 'WB' },
    { id: 'assamzoo', name: 'Assam State Zoo', full: 'Assam State Zoo cum Botanical Garden, Guwahati', p: () => zoneP('guwahati', 60, 230), st: 'AS' }];
  for (const z of ZOOS) { const p = z.p(); if (!p) continue; const [x, y, h] = bb.roadSpotNear({ x: p[0], z: p[1] }); z.x = x; z.z = y;
    bb.addPoi({ type: 'zoo', name: z.name, x, z: y, rot: h + Math.PI / 2, extra: z.id, zoo: z }); }

  /* ---------- the park ---------- */
  const W2 = 200, D2 = 160;   // venue size
  const mats = {}; const mat = c => (mats[c] = mats[c] || bb.LMat(c)); const bmat = c => (mats['b' + c] = mats['b' + c] || new T.MeshBasicMaterial({ color: c }));
  const water = new T.MeshLambertMaterial({ color: 0x4f9fc4, transparent: true, opacity: .88 });
  function add(g, geo, m, x, y, z) { const o = new T.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(x, y, z); g.add(o); return o; }
  function flat(g, rx, rz, x, y, z, m, seg) { const o = add(g, new T.CircleGeometry(1, seg || 40), m, x, y, z); o.rotation.x = -Math.PI / 2; o.scale.set(rx, rz, 1); return o; }
  function ring(g, rx, rz, w, x, y, z, m) { const o = add(g, new T.RingGeometry(1 - w, 1, 48), m, x, y, z); o.rotation.x = -Math.PI / 2; o.scale.set(rx, rz, 1); return o; }
  function tree(g, x, z, s, kind) { s = s || 1; if (kind === 'acacia') { add(g, new T.CylinderGeometry(.18 * s, .28 * s, 3.6 * s, 6), '#6b4a2c', x, 1.8 * s, z); const c = add(g, new T.SphereGeometry(2.6 * s, 10, 6), '#6f8f3a', x, 3.9 * s, z); c.scale.y = .32; return; }
    if (kind === 'palm') { add(g, new T.CylinderGeometry(.16 * s, .24 * s, 6 * s, 6), '#8a6a44', x, 3 * s, z); for (let i = 0; i < 6; i++) { const l = add(g, new T.BoxGeometry(.5 * s, .08, 3 * s), '#3f8f3a', x + Math.sin(i) * 1.2 * s, 6 * s, z + Math.cos(i) * 1.2 * s); l.rotation.set(.35, i, 0); } return; }
    add(g, new T.CylinderGeometry(.2 * s, .3 * s, 2.6 * s, 6), '#6b4a2c', x, 1.3 * s, z); add(g, new T.SphereGeometry(1.9 * s, 9, 7), kind === 'dark' ? '#3f6f34' : '#4f8a3a', x, 3.6 * s, z); add(g, new T.SphereGeometry(1.3 * s, 8, 6), '#5d9a44', x + .8 * s, 4.4 * s, z - .4 * s); }
  function rock(g, x, z, s, col) { const r = add(g, new T.DodecahedronGeometry(s, 0), col || '#8f877a', x, s * .45, z); r.scale.y = .65; r.rotation.y = x * 3; return r; }
  function label(g, text, sub, w, x, y, z, ry, bg) { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const k = c.getContext('2d'); k.fillStyle = bg || '#2f5d2a'; k.fillRect(0, 0, 512, 256); k.fillStyle = '#f5f1e6'; k.fillRect(10, 10, 492, 236); k.fillStyle = bg || '#2f5d2a'; k.fillRect(16, 16, 480, 78);
    k.fillStyle = '#ffffff'; k.font = '800 50px "Baloo 2", sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, 256, 56, 470); k.fillStyle = '#2b2b2b'; k.font = '600 30px "Martel Sans", sans-serif';
    String(sub || '').split('\n').forEach((l, i) => k.fillText(l, 256, 138 + i * 40, 470));
    const m = new T.Mesh(new T.PlaneGeometry(w, w / 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) })); m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m);
    add(g, new T.BoxGeometry(.15, y, .15), '#5a4a3a', x - w * .4 * Math.cos(ry || 0), y / 2 - .3, z + w * .4 * Math.sin(ry || 0)); add(g, new T.BoxGeometry(.15, y, .15), '#5a4a3a', x + w * .4 * Math.cos(ry || 0), y / 2 - .3, z - w * .4 * Math.sin(ry || 0)); return m; }
  // habitats: ellipse, ground, what lives there, and whether it is a lake
  const HAB = [
    { id: 'lion', name: 'Asiatic lions', sub: 'Gir lions · only wild in Gujarat\nOpen moat habitat', x: -62, z: 38, rx: 22, rz: 15, ground: '#c9b36a', animals: [['lion', 2], ['lioness', 3]], decor: 'savanna' },
    { id: 'tiger', name: 'Bengal tigers', sub: 'National animal of India\nWater moat · they love to swim', x: 62, z: 38, rx: 22, rz: 15, ground: '#7f9a4a', animals: [['tiger', 3], ['leopard', 1]], decor: 'forest', pond: [8, 4] },
    { id: 'bear', name: 'Sloth bears', sub: 'Shaggy insect-eaters\nof Indian forests', x: 0, z: 22, rx: 15, rz: 9, ground: '#8a8a5a', animals: [['bear', 2]], decor: 'rocks' },
    { id: 'savanna', name: 'African savanna', sub: 'Giraffes, zebras and a rhino\nshare the grassland', x: -58, z: -22, rx: 34, rz: 24, ground: '#c4b064', animals: [['giraffe', 3], ['zebra', 5], ['rhino', 1], ['deer', 4]], decor: 'acacia' },
    { id: 'elephant', name: 'Asian elephants', sub: 'Bath time at the pond\nevery afternoon', x: 58, z: -22, rx: 34, rz: 24, ground: '#8fa356', animals: [['elephant', 3]], decor: 'forest', pond: [11, 7] },
    { id: 'monkey', name: 'Monkey island', sub: 'Langurs and macaques\nswinging over the water', x: 0, z: -18, rx: 11, rz: 8, ground: '#6f9a4a', animals: [['monkey', 6]], decor: 'island' },
    { id: 'lake', name: 'Wetland lake', sub: 'Hippos, mugger crocodiles\nand a flock of flamingos', x: 0, z: -58, rx: 34, rz: 13, ground: '#c9b88a', animals: [['hippo', 2], ['croc', 3], ['flamingo', 8]], decor: 'lake', lake: true }];
  const blk = [[-W2 / 2, -D2 / 2, W2 / 2, -D2 / 2 + 3], [-W2 / 2, -D2 / 2, -W2 / 2 + 3, D2 / 2], [W2 / 2 - 3, -D2 / 2, W2 / 2, D2 / 2]];
  for (const h of HAB) { const m = h.id === 'monkey' ? 3 : 2.5; blk.push([h.x - h.rx - m, h.z - h.rz - m, h.x + h.rx + m, h.z + h.rz + m]); }
  let Z = null; const live = [];
  function zooVenue(poi) { const zoo = poi.zoo; live.length = 0;
    return { noDoor: true,  poi, name: zoo.name, w: W2, d: D2, bg: '#a9d8f2', exitName: `Exit · back outside ${zoo.name}`, exit: { x: 0, z: D2 / 2 - 2 }, start: { x: 0, z: D2 / 2 - 5, h: Math.PI }, blk,
      build: g => { // sunlight for an outdoor venue
        const sun = new T.DirectionalLight(0xfff2dc, .5); sun.position.set(60, 90, 40); g.add(sun);
        add(g, new T.PlaneGeometry(W2, D2), '#7fae5a', 0, 0, 0).rotation.x = -Math.PI / 2; lamp = bb.interScene.children.find(o => o.isPointLight); if (lamp) { lampK = lamp.intensity; lamp.intensity = 0; }
        // paths: a loop round the habitats and the walk from the gate
        ring(g, 92, 72, .1, 0, .03, 0, '#d9c9a2'); flat(g, 4, 18, 0, .035, D2 / 2 - 14, '#d9c9a2'); ring(g, 22, 12, .3, 0, .03, 52, '#d9c9a2');
        for (const [x, z, w, d] of [[0, 4, 120, 6], [0, -38, 150, 6], [-90, 0, 6, 120], [90, 0, 6, 120], [0, 4, 6, 70]]) { const p = add(g, new T.PlaneGeometry(w, d), '#d9c9a2', x, .032, z); p.rotation.x = -Math.PI / 2; }
        // boundary wall and trees
        for (const [x, z, w, d] of [[0, -D2 / 2, W2, 1], [-W2 / 2, 0, 1, D2], [W2 / 2, 0, 1, D2], [-55, D2 / 2, 90, 1], [55, D2 / 2, 90, 1]]) add(g, new T.BoxGeometry(w, 2.4, d), '#b8805a', x, 1.2, z);
        for (let i = 0; i < 46; i++) { const t = i / 46; const side = i % 4; const x = side < 2 ? -W2 / 2 + 5 + t * 4 * (W2 - 10) % (W2 - 10) : side === 2 ? -W2 / 2 + 5 : W2 / 2 - 5; const z = side < 2 ? (side ? D2 / 2 - 6 : -D2 / 2 + 5) : -D2 / 2 + 5 + (t * 4 * (D2 - 10)) % (D2 - 10); if (Math.abs(x) < 10 && z > 60) continue; tree(g, x, z, 1.1 + (i % 3) * .2, i % 2 ? 'dark' : ''); }
        // the gate, ticket counter and the zoo board
        for (const s of [-1, 1]) { add(g, new T.BoxGeometry(3, 8, 3), '#c9a46a', s * 9, 4, D2 / 2 - 1); add(g, new T.ConeGeometry(2.4, 3, 4), '#a8402a', s * 9, 9.5, D2 / 2 - 1).rotation.y = Math.PI / 4; }
        add(g, new T.BoxGeometry(21, 2.2, 1.4), '#c9a46a', 0, 8, D2 / 2 - 1); label(g, zoo.name.toUpperCase(), zoo.full + '\nOpen zoo · no cages', 12, 0, 6.2, D2 / 2 - 1.8, Math.PI, '#2f5d2a');
        // habitats
        for (const h of HAB) buildHab(g, h);
        // canteen, the safari station and benches
        add(g, new T.BoxGeometry(10, 3.2, 6), '#e9d8b4', -26, 1.6, 58); add(g, new T.ConeGeometry(7, 2.4, 4), '#a8402a', -26, 4.4, 58).rotation.y = Math.PI / 4; label(g, 'ZOO CANTEEN', 'Vada pav · ice cream · chai', 5, -26, 3.2, 61.2, 0, '#c0392b');
        add(g, new T.BoxGeometry(6, 2.8, 4), '#d6e4ea', 26, 1.4, 60); label(g, 'TOILETS', '', 3, 26, 3.2, 62.2, 0, '#2f7fc1');
        add(g, new T.BoxGeometry(12, .4, 6), '#bdb6a8', 30, .2, 46); add(g, new T.BoxGeometry(12, .2, 6), '#2f7d3a', 30, 3.4, 46); for (const s of [-1, 1]) add(g, new T.CylinderGeometry(.15, .15, 3.2, 6), '#555', 30 + s * 5.5, 1.8, 46 - 2.6); label(g, 'SAFARI', 'Battery-car safari through\nthe open habitats', 5, 30, 3.0, 49.2, 0, '#e67e22');
        safariCar(g, 30, 46);
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const x = Math.cos(a) * 30, z = 52 + Math.sin(a) * 16; if (Math.abs(x) < 6 && z > 60) continue; add(g, new T.BoxGeometry(2.4, .2, .7), '#8a5a36', x, .55, z).rotation.y = -a; }
        // peacocks walking the paths with the visitors
        for (let i = 0; i < 5; i++) { const pk = bb.buildAnimal('peacock', { fan: i % 2 === 0 }); g.add(pk); live.push({ g: pk, kind: 'peacock', area: { x: 0, z: 46, rx: 30, rz: 14 }, x: MR(-25, 25), z: 46 + MR(-10, 10), h: MR(0, 6.28), sp: 0, t: 0, free: true }); }
        // visitors
        for (let i = 0; i < 14; i++) { const p = bb.buildPerson(mat(['#d9483b', '#2f7fc1', '#e8a628', '#3aa66b', '#9b4fb5', '#ff6fa8', '#f4f1ea'][i % 7])); g.add(p); let x, z, k = 0; do { x = MR(-80, 80); z = MR(-60, 60); k++; } while (k < 30 && blk.some(b => x > b[0] - 1 && x < b[2] + 1 && z > b[1] - 1 && z < b[3] + 1)); live.push({ g: p, kind: 'person', area: { x: 0, z: 10, rx: 88, rz: 66 }, x, z, h: MR(0, 6.28), sp: 0, t: 0, person: true }); }
        Z = { zoo, g };
        return [{ k: 'safari', name: `Battery-car safari · ${bb.inr(price('safari'))}`, x: 30, z: 51 }, { k: 'canteen', name: 'Zoo canteen · snacks', x: -26, z: 63 },
          ...HAB.map(h => ({ k: 'info:' + h.id, name: `${h.name} · read the board`, x: h.x + (h.x > 0 ? -1 : 1) * Math.min(h.rx, 18) * .3, z: h.z + h.rz + 4.5 }))]; },
      onAction: k => { if (k === 'safari') return safari(); if (k === 'canteen') return bb.foodSheet({ name: 'Zoo canteen', extra: zoo.st, type: 'food' }); if (k === 'toilet') { bb.P.bladder = 100; bb.setDirty(); return bb.toast('🚻 Much better', '#5fb4ff'); }
        if (k.startsWith('info:')) { const h = HAB.find(q => q.id === k.slice(5)); bb.toast(`${h.name} · ${h.sub.replace('\n', ' · ')}`, '#3ddc97'); bb.emit('zoo', { kind: 'info', id: h.id }); } },
      onExit: () => { Z = null; live.length = 0; if (lamp) lamp.intensity = lampK; if (bb.CINE && bb.CINE.on) bb.CINE.stop(); } }; }
  let lamp = null, lampK = 1;
  const MR = (a, b) => a + Math.random() * (b - a);
  function buildHab(g, h) {
    // ground, then a moat (water or a dry ditch) and a low stone wall on the visitors' side: no bars, no cages
    flat(g, h.rx, h.rz, h.x, .04, h.z, h.ground);
    if (h.lake) { flat(g, h.rx * .8, h.rz * .72, h.x, .06, h.z, water); for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28; add(g, new T.CylinderGeometry(.05, .05, 1.2, 4), '#6f8a3a', h.x + Math.cos(a) * h.rx * .84, .6, h.z + Math.sin(a) * h.rz * .78); } }
    else if (h.id === 'monkey') { ring(g, h.rx + 2.5, h.rz + 2.5, .3, h.x, .05, h.z, water); }
    else ring(g, h.rx + 1.6, h.rz + 1.6, .07, h.x, .05, h.z, h.id === 'tiger' ? water : mat('#6d5a3e'));
    const wr = h.id === 'monkey' ? 2.6 : 1.8; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28, b = (i + 1) / 40 * 6.28; const ax = h.x + Math.cos(a) * (h.rx + wr), az = h.z + Math.sin(a) * (h.rz + wr), bx = h.x + Math.cos(b) * (h.rx + wr), bz = h.z + Math.sin(b) * (h.rz + wr);
      const s = add(g, new T.BoxGeometry(Math.hypot(bx - ax, bz - az) + .1, .9, .5), '#b5ab98', (ax + bx) / 2, .45, (az + bz) / 2); s.rotation.y = -Math.atan2(bz - az, bx - ax); }
    if (h.pond) { flat(g, h.pond[0], h.pond[1], h.x + h.rx * .3, .07, h.z - h.rz * .2, water); h.pondAt = { x: h.x + h.rx * .3, z: h.z - h.rz * .2, rx: h.pond[0], rz: h.pond[1] }; }
    const rnd = (k) => { const v = Math.sin(h.x * 13.1 + h.z * 7.7 + k * 3.3) * 43758.5; return v - Math.floor(v); };
    if (h.decor === 'savanna' || h.decor === 'acacia') { for (let i = 0; i < 5; i++) tree(g, h.x + (rnd(i) - .5) * h.rx * 1.4, h.z + (rnd(i + 9) - .5) * h.rz * 1.3, 1.2, 'acacia'); for (let i = 0; i < 4; i++) rock(g, h.x + (rnd(i + 20) - .5) * h.rx, h.z + (rnd(i + 30) - .5) * h.rz, 1.6 + rnd(i) * 1.6, '#a39780'); }
    if (h.decor === 'forest') for (let i = 0; i < 7; i++) tree(g, h.x + (rnd(i) - .5) * h.rx * 1.5, h.z + (rnd(i + 9) - .5) * h.rz * 1.4, 1 + rnd(i + 3) * .5, 'dark');
    if (h.decor === 'rocks') { for (let i = 0; i < 6; i++) rock(g, h.x + (rnd(i) - .5) * h.rx * 1.2, h.z + (rnd(i + 5) - .5) * h.rz, 1.5 + rnd(i) * 2); add(g, new T.BoxGeometry(5, 2.4, 3), '#6a5a48', h.x - 6, 1.2, h.z - 4); add(g, new T.BoxGeometry(3, 1.8, .2), '#2a2420', h.x - 6, .9, h.z - 2.45); }
    if (h.decor === 'island') { for (let i = 0; i < 3; i++) tree(g, h.x - 5 + i * 5, h.z + (i - 1) * 2, 1.2, i === 1 ? 'palm' : ''); add(g, new T.CylinderGeometry(.05, .05, 10, 4), '#8a6a44', h.x, 4.5, h.z).rotation.z = Math.PI / 2; for (const s of [-1, 1]) add(g, new T.BoxGeometry(.3, 5, .3), '#6b4a2c', h.x + s * 5, 2.5, h.z); }
    if (h.decor === 'lake') for (let i = 0; i < 4; i++) rock(g, h.x + (rnd(i) - .5) * h.rx * 1.5, h.z + (rnd(i + 4) > .5 ? 1 : -1) * h.rz * .85, 1.2, '#8f877a');
    // the information board facing the path
    label(g, h.name.toUpperCase(), h.sub, 4.4, h.x + (h.x > 0 ? -1 : 1) * Math.min(h.rx, 18) * .3, 2.4, h.z + h.rz + 3, 0, h.lake ? '#1f6f8b' : '#2f5d2a');
    // the animals
    for (const [kind, n0] of h.animals) { const n = Math.min(n0 * 2, n0 + 3); for (let i = 0; i < n; i++) { const a = bb.buildAnimal(kind, { male: i === 0, scale: kind === 'peacock' || kind === 'flamingo' ? 1 : 1.25 }); g.add(a); let x, z, k = 0; do { x = h.x + MR(-.75, .75) * h.rx; z = h.z + MR(-.7, .7) * h.rz; k++; } while (k < 20 && wet(h, x, z) !== wantsWater(kind));
      live.push({ g: a, kind, hab: h, area: h, x, z, h: MR(0, 6.28), sp: 0, t: MR(0, 3) }); } } }
  const wantsWater = k => k === 'hippo' || k === 'flamingo';
  function wet(h, x, z) { if (h.lake) { const dx = (x - h.x) / (h.rx * .8), dz = (z - h.z) / (h.rz * .72); return dx * dx + dz * dz < 1; } if (h.pondAt) { const dx = (x - h.pondAt.x) / h.pondAt.rx, dz = (z - h.pondAt.z) / h.pondAt.rz; return dx * dx + dz * dz < 1; } return false; }
  const inE = (a, x, z) => { const dx = (x - a.x) / a.rx, dz = (z - a.z) / a.rz; return dx * dx + dz * dz; };
  const SP = { lion: 1, lioness: 1.3, tiger: 1.3, leopard: 1.6, bear: .8, giraffe: 1.1, zebra: 1.4, rhino: .7, deer: 1.4, elephant: .8, monkey: 1.2, hippo: .5, croc: .4, flamingo: .5, peacock: .7, person: 1.2 };
  bb.onUpdate((dt, now) => { if (!Z || !bb.insideVenue) return; const pp = bb.player.pos;
    for (const a of live) { a.t -= dt; if (a.t <= 0) { a.t = MR(2, 7); const rest = Math.random() < (a.kind === 'lion' || a.kind === 'lioness' || a.kind === 'croc' ? .65 : .4); a.sp = rest ? 0 : SP[a.kind] * MR(.6, 1.2); a.graze = rest && Math.random() < .6; a.h += MR(-1.6, 1.6); }
      if (a.free && Math.hypot(pp.x - a.x, pp.z - a.z) < 3.5) { a.h = Math.atan2(a.x - pp.x, a.z - pp.z); a.sp = 1.4; }
      const nx = a.x + Math.sin(a.h) * a.sp * dt, nz = a.z + Math.cos(a.h) * a.sp * dt;
      let ok = inE(a.area, nx, nz) < (a.person ? 1 : .82); if (ok && a.hab) { const w = wet(a.hab, nx, nz); if (a.kind === 'hippo' || a.kind === 'flamingo') ok = w || Math.random() < .002; else if (a.kind !== 'croc' && a.kind !== 'elephant' && a.kind !== 'tiger') ok = !w; }
      if (ok && a.person) for (const b of blk) if (nx > b[0] && nx < b[2] && nz > b[1] && nz < b[3]) { ok = false; break; }
      if (ok) { a.x = nx; a.z = nz; } else { a.h += Math.PI * (.5 + Math.random() * .5); a.sp *= .5; }
      const sub = a.hab && wet(a.hab, a.x, a.z) ? (a.kind === 'hippo' ? -.55 : a.kind === 'elephant' ? -.3 : a.kind === 'croc' ? -.12 : a.kind === 'flamingo' ? 0 : -.2) : 0;
      a.g.position.set(a.x, sub, a.z); a.g.rotation.y = a.h;
      if (a.person) { const U = a.g.userData; if (U.legs) { const s = Math.sin(now * 7 + a.x) * .45 * (a.sp > 0 ? 1 : 0); U.legs[0].rotation.x = s; U.legs[1].rotation.x = -s; } } else bb.animGait(a, now, a.sp); } });

  /* ---------- the safari ---------- */
  function safariCar(g, x, z) { const c = new T.Group(); add(c, new T.BoxGeometry(2.4, .8, 4.6), '#2f7d3a', 0, .9, 0); add(c, new T.BoxGeometry(2.5, .12, 4.8), '#f4f1ea', 0, 2.8, 0); for (const sx of [-1.1, 1.1]) for (const sz of [-2, 2]) add(c, new T.CylinderGeometry(.06, .06, 1.9, 4), '#444', sx, 1.9, sz);
    for (let i = 0; i < 3; i++) add(c, new T.BoxGeometry(2.2, .5, .5), '#a8402a', 0, 1.4, -1.4 + i * 1.4); for (const sx of [-1.1, 1.1]) for (const sz of [-1.5, 1.5]) { const w = add(c, new T.CylinderGeometry(.38, .38, .28, 12), '#1a1a1a', sx, .38, sz); w.rotation.z = Math.PI / 2; }
    c.position.set(x, 0, z); g.add(c); g.userData.safari = c; return c; }
  const price = k => bb.cost('zoo.' + k, k === 'ticket' ? 100 : 300);
  function safari() { if (!Z) return; if (!bb.spend(price('safari'), true)) return; const car = Z.g.userData.safari; const home = { x: car.position.x, z: car.position.z, h: car.rotation.y };
    // a loop that drives right through the open habitats
    const R = [[30, 46], [70, 20], [80, -10], [62, -24], [40, -28], [20, -40], [0, -42], [-22, -40], [-50, -30], [-72, -18], [-60, -6], [-40, -14], [-30, 8], [-62, 34], [-84, 40], [-70, 56], [-30, 46], [30, 46]];
    const P = bb.CINE.poly(R);
    bb.CINE.play({ kind: 'safari', label: 'Battery-car safari', title: Z.zoo.name, dur: 48, lines: ['The guide slows down by the elephants', 'Giraffes stretch for the acacia leaves', 'A lion yawns in the shade', 'Hippos blow bubbles in the lake', 'Flamingos wade past in a pink line', 'Tigers pace by the water moat'],
      cam: (f) => { const a = P.at(f * P.len), b = P.at(Math.min(P.len, f * P.len + 6)); car.position.set(a.x, 0, a.z); car.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        return { x: a.x - Math.sin(car.rotation.y) * 6, y: 4.2, z: a.z - Math.cos(car.rotation.y) * 6, lx: b.x + Math.sin(car.rotation.y) * 10, ly: 1.5, lz: b.z + Math.cos(car.rotation.y) * 10 }; },
      onDone: () => { car.position.set(home.x, 0, home.z); car.rotation.y = home.h; bb.toast('🦒 What a ride · the guide waves goodbye', '#3ddc97'); bb.emit('zoo', { kind: 'safari', id: Z && Z.zoo.id }); bb.emit('activity', { title: 'Zoo safari' }); },
      onCancel: () => { car.position.set(home.x, 0, home.z); car.rotation.y = home.h; } }); }

  bb.poiHandlers.zoo = poi => { const zoo = poi.zoo; const t = price('ticket'); const open = bb.testMode || (bb.clock >= 9 && bb.clock < 18);
    bb.openSheet(`🦒 ${zoo.name}`, `${zoo.full} · open 9 am to 6 pm`,
      bb.rowHtml('enter', 'Walk in', `Entry ticket ${bb.inr(t)} · an open zoo with no cages: big habitats behind moats`, open ? 'Buy ticket' : 'Closed', open ? '' : 'ghost') +
      `<p class="note">Lions, tigers, elephants, giraffes, zebras, a rhino, hippos, crocodiles, flamingos, sloth bears, monkeys, spotted deer and peacocks. Take the battery-car safari through the habitats (${bb.inr(price('safari'))}).</p>`,
      s => s.onclick = e => { if (e.target.dataset.id !== 'enter') return; if (!open) return bb.toast(`${zoo.name} is open 9 am to 6 pm`, '#ff9f1c'); if (!bb.spend(t, true)) return; bb.closeSheet(); bb.enterVenue(zooVenue(poi)); bb.toast(`Welcome to ${zoo.name} 🦁`, '#3ddc97'); bb.emit('zoo', { kind: 'enter', id: zoo.id }); }); };
  bb.ZOO = { list: ZOOS, HAB };
});
