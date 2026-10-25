// Story chapters by city: each big city has its own chapter, picked up when you arrive there and shown in the
// mission tracker while you are in that city. Also achievements (with an unlock card) and daily rewards with a streak.
window.BBFeatures.push(function (bb) {
  const P = () => bb.P, W = bb.WORLD;
  const place = n => { const p = (W.places || []).find(q => q[0] === n); return p ? { x: p[1], z: p[2] } : null; };
  const foodIn = (zones, re) => () => { const pp = bb.ppos(); const list = bb.pois.filter(q => q.type === 'food' && q.zone && zones.includes(q.zone.id) && (!re || re.test(q.name))).sort((a, b) => Math.hypot(a.x - pp.x, a.z - pp.z) - Math.hypot(b.x - pp.x, b.z - pp.z)); return list[0] ? { x: list[0].x, z: list[0].z } : null; };
  const poiIn = (zones, type) => () => { const p = bb.pois.find(q => q.type === type && q.zone && zones.includes(q.zone.id)); return p ? { x: p.x, z: p.z } : null; };
  const actAt = (id, where) => () => { const p = bb.pois.find(q => q.type === 'activity' && q.extra === id && (!where || q.spot.name === where)); return p ? { x: p.x, z: p.z } : null; };
  // step helpers
  const S = {
    go: (t, m, n, reward = 400) => ({ t, m, kind: 'place', place: n, target: () => place(n), reward }),
    eat: (t, m, ids, zones, reward = 250) => ({ t, m, ev: 'eat', test: d => ids.includes(d[0]), target: foodIn(zones), reward }),
    inside: (t, m, n, reward = 500) => ({ t, m, ev: 'attraction', test: d => d.kind === 'enter' && d.name === n, target: () => place(n), reward }),
    adv: (t, m, id, where, reward = 600) => ({ t, m, ev: 'adventure', test: d => d.id === id, target: actAt(id, where), reward }),
    ride: (t, m, mode, zones, type, reward = 300) => ({ t, m, ev: 'travel', test: d => d.mode === mode, target: type ? poiIn(zones, type) : null, reward }),
    mall: (t, m, zones, reward = 300) => ({ t, m, ev: 'mall', test: d => d.kind === 'enter', inCity: true, target: poiIn(zones, 'mall'), reward }),
    jobs: (t, m, n, type, reward = 600) => ({ t, m, ev: 'job', test: d => !type || d.type === type || (type === 'food' && (d.type === 'delivery' || d.type === 'zomato')), inCity: true, count: n, reward }),
    watch: (t, m, sport, team, zones, reward = 800) => ({ t, m, ev: sport, test: d => d.kind === 'watched' && (!team || d.team === team), target: poiIn(zones, sport === 'cricket' ? 'cricket' : 'stadium'), reward }),
    ev: (t, m, ev, test, target, reward = 300) => ({ t, m, ev, test, target, reward })
  };
  const CH = [
    { id: 'mumbai', zones: ['mumbai'], title: 'Mumbai · New in the city', intro: 'Cousin Pappu left you his old auto. Mumbai never sleeps, and neither will you.', steps: [
      { t: 'Meet cousin Pappu', m: 'He left you his old auto. Find him at the chai tapri.', kind: 'near', target: foodIn(['mumbai'], /Chai/), near: 6, say: 'Pappu: "Bhai, welcome to Mumbai! Auto is yours. Earn, eat, explore!"', reward: 250 },
      S.jobs('First earnings', 'Do 2 jobs in Mumbai · Menu → Jobs · food delivery on a rented cycle needs no licence', 2, null, 500),
      S.ev('Bank it', 'Deposit at least ₹500 at a bank', 'deposit', v => v >= 500, poiIn(['mumbai'], 'bank'), 250),
      S.eat('Vada pav break', 'Eat a vada pav, Mumbai style', ['vadapav'], ['mumbai'], 200),
      S.ride('Ride the local', 'Take the Mumbai local from any station', 'local', ['mumbai'], 'local'),
      S.go('Postcard moment', 'Stand at the Gateway of India', 'Gateway of India', 400)] },
    { id: 'pune', zones: ['pune', 'lonavala'], title: 'Pune · City of the Peshwas', intro: 'Take the expressway over the ghats. Pune has history, misal and the best weather in Maharashtra.', steps: [
      S.go('Peshwa pride', 'Find Shaniwar Wada', 'Shaniwar Wada', 500), S.go('Sunset point', 'Visit Tiger Point', 'Tiger Point', 500),
      S.eat('Spicy start', 'Eat a misal pav', ['misal'], ['pune'], 250), S.ride('Pune Metro', 'Take the Pune Metro between two stations', 'metro', ['pune'], 'metro'),
      S.mall('Weekend at the mall', 'Visit Phoenix Marketcity', ['pune'])] },
    { id: 'ahmedabad', zones: ['ahmedabad'], title: 'Ahmedabad · Old city, new city', intro: 'Gujarat calling! Kem cho? From the Sabarmati to the pols, Amdavad is all heart.', steps: [
      S.go('Gandhi\'s home', 'Visit Sabarmati Ashram', 'Sabarmati Ashram'), S.eat('Soft and spongy', 'Eat khaman dhokla', ['dhokla', 'fafda'], ['ahmedabad'], 250),
      S.go('Evening at the lake', 'Walk around Kankaria Lake', 'Kankaria Lake'), S.ride('Ahmedabad Metro', 'Take the Ahmedabad Metro', 'metro', ['ahmedabad'], 'metro'),
      S.go('The biggest stadium', 'See the Narendra Modi Stadium', 'Narendra Modi Stadium', 500)] },
    { id: 'surat', zones: ['surat'], title: 'Surat · Diamond city', intro: 'Surat cuts most of the world\'s diamonds, and eats like there is no tomorrow.', steps: [
      S.go('Sparkle', 'See the Surat Diamond Bourse', 'Surat Diamond Bourse'), S.jobs('Busy city', 'Do 2 jobs in Surat', 2, null, 600),
      S.go('Black sand', 'Watch the sunset at Dumas Beach', 'Dumas Beach'), S.mall('Shop till you drop', 'Visit VR Surat mall', ['surat'])] },
    { id: 'jaipur', zones: ['jaipur'], title: 'Jaipur · The Pink City', intro: 'Padharo mhare des! Forts on the hills and bazaars in the old walled city.', steps: [
      S.go('Palace of winds', 'Find Hawa Mahal', 'Hawa Mahal'), S.inside('Mirror palace', 'Go inside Amber Fort', 'Amber Fort', 600),
      S.eat('Rajasthani feast', 'Eat dal baati churma', ['daalbaati', 'kachori'], ['jaipur'], 300), S.adv('Sky over the forts', 'Take a hot-air balloon ride', 'balloon', 'Amber Fort', 1200),
      S.mall('City shopping', 'Visit World Trade Park', ['jaipur'])] },
    { id: 'udaipur', zones: ['udaipur'], title: 'Udaipur · City of lakes', intro: 'White palaces reflected in Lake Pichola. Udaipur is Rajasthan\'s most romantic city.', steps: [
      S.inside('Royal halls', 'Go inside the City Palace', 'City Palace, Udaipur', 600), S.go('On the water', 'See the Lake Palace', 'Lake Palace'),
      S.eat('Sweet tooth', 'Eat ghevar', ['ghevar', 'lassi'], ['udaipur'], 250)] },
    { id: 'thar', zones: ['jodhpur', 'jaisalmer'], title: 'The desert trail · Jodhpur and Jaisalmer', intro: 'The blue city, the golden fort and the Thar desert. Fill up before you go.', steps: [
      S.go('Blue city view', 'Climb up to Mehrangarh Fort', 'Mehrangarh Fort', 500), S.adv('Fly like a fox', 'Ride the zipline at Mehrangarh', 'zip', null, 800),
      S.inside('Golden fort', 'Go inside Jaisalmer Fort', 'Jaisalmer Fort', 600), S.ev('Ship of the desert', 'Ride a camel at Sam', 'camel', () => true, () => place('Sam Sand Dunes'), 500),
      S.adv('Over the dunes', 'Go dune bashing in a jeep', 'dunes', null, 700)] },
    { id: 'goa', zones: ['panaji', 'margao', 'calangute', 'oldgoa', 'mapusa', 'arambol', 'vasco', 'palolem', 'ponda'], title: 'Goa · Susegad', intro: 'Beaches, churches and fish curry rice. Slow down, you are in Goa.', steps: [
      S.go('Old Goa lanes', 'Walk through Fontainhas Latin Quarter', 'Fontainhas Latin Quarter', 600), S.eat('Goan staple', 'Eat fish curry rice', ['xitkodi', 'ravafish', 'xacuti'], ['panaji', 'margao', 'calangute'], 300),
      S.adv('High over the sea', 'Go parasailing at Calangute', 'parasail', 'Calangute Beach', 800), S.go('Sea of milk', 'Reach Dudhsagar Falls', 'Dudhsagar Falls', 800),
      S.watch('Forca Goa', 'Watch FC Goa at Fatorda Stadium', 'football', 'goa', ['margao'], 1000)] },
    { id: 'bengaluru', zones: ['bengaluru'], title: 'Bengaluru · Garden city', intro: 'Tech parks, filter coffee and traffic. Namma Bengaluru welcomes you, guru.', steps: [
      S.go('Seat of power', 'See Vidhana Soudha', 'Vidhana Soudha'), S.eat('Crispy and golden', 'Eat a masala dosa', ['masaladosa', 'bennedosa', 'filter'], ['bengaluru'], 250),
      S.jobs('Delivery rush', 'Do 2 food deliveries in Bengaluru', 2, 'food', 700), S.ride('Namma Metro', 'Take the Namma Metro', 'metro', ['bengaluru'], 'metro'),
      S.go('Green lungs', 'Visit the Lalbagh Glasshouse', 'Lalbagh Glasshouse'), S.mall('Mall day', 'Visit Orion Mall', ['bengaluru'])] },
    { id: 'mysuru', zones: ['mysuru', 'mandya'], title: 'Mysuru · City of palaces', intro: 'Silk, sandalwood and the most lit-up palace in India.', steps: [
      S.inside('The great palace', 'Go inside Mysore Palace', 'Mysore Palace', 700), S.eat('Melt in the mouth', 'Eat Mysore pak', ['mysorepak'], ['mysuru'], 250),
      S.adv('Sunrise climb', 'Trek up Nandi Hills', 'trek', 'Nandi Hills', 600), S.go('Dancing fountains', 'Visit Brindavan Gardens', 'Brindavan Gardens')] },
    { id: 'hampi', zones: ['hosapete', 'ballari'], title: 'Hampi · Stone kingdom', intro: 'The ruins of Vijayanagara, among boulders that look placed by giants.', steps: [
      S.go('The stone chariot', 'See the Hampi Stone Chariot', 'Hampi Stone Chariot', 600), S.adv('Round boat', 'Take a coracle ride on the river', 'coracle', null, 500)] },
    { id: 'coast', zones: ['udupi', 'mangaluru', 'karwar', 'gokarna', 'murudeshwar'], title: 'Coastal Karnataka', intro: 'Temples, beaches and the spiciest ghee roast on the west coast.', steps: [
      S.go('Island of basalt', "Visit St Mary's Island", "St Mary's Island", 500), S.eat('Mangalorean special', 'Eat chicken ghee roast', ['ghee', 'udupimeals'], ['mangaluru', 'udupi'], 300),
      S.adv('Wave rider', 'Ride a jet ski at Panambur Beach', 'jetski', 'Panambur Beach', 700), S.adv('Island reef', 'Go snorkelling at St Mary\'s Island', 'snorkel', 'St Mary\'s Island', 800)] },
    { id: 'kochi', zones: ['kochi'], title: 'Kochi · Queen of the Arabian Sea', intro: 'Chinese fishing nets, spice warehouses and the yellow wave of Manjappada.', steps: [
      S.go('Old nets', 'See the Chinese fishing nets', 'Chinese Fishing Nets'), S.eat('Kerala breakfast', 'Eat appam and stew', ['appam', 'puttu'], ['kochi'], 250),
      S.ride('Kochi Metro', 'Take the Kochi Metro', 'metro', ['kochi'], 'metro'), S.mall('Lulu day out', 'Visit Lulu Mall', ['kochi']),
      S.watch('Manjappada', 'Watch Kerala Blasters at home', 'football', 'ker', ['kochi'], 1000)] },
    { id: 'keralasouth', zones: ['alappuzha', 'kottayam', 'kollam', 'varkala', 'thiruvananthapuram'], title: 'The backwaters and the capital', intro: 'Drift through the backwaters, then on to Thiruvananthapuram.', steps: [
      S.adv('Slow boat', 'Take a houseboat cruise', 'houseboat', null, 1000), S.eat('Pearl spot', 'Eat karimeen pollichathu', ['karimeen', 'sadhya'], ['alappuzha', 'kottayam', 'kollam', 'thiruvananthapuram'], 300),
      S.go('Sea breeze', 'Relax at Kovalam Beach', 'Kovalam Beach', 600), S.go('Cliff top', 'Walk along Varkala Cliff', 'Varkala Cliff')] }
  ];
  const CHAPTER_BONUS = 5000;
  // save data: { chapters: { id: { step, cnt, done } }, paused }. Old saves (one Mumbai chapter) are carried over.
  function st() { const p = P(); const s = p.story = p.story || {}; if (!s.chapters) { s.chapters = {}; if (s.step || s.done) s.chapters.mumbai = { step: s.done ? 6 : Math.min(5, s.step || 0), cnt: 0, done: !!s.done }; } return s; }
  // Beta v1.01.11: a chapter only runs once you start it (Story → Start). Chapters you were already playing carry on.
  const isOn = c => { const x = cs(c); return !x.done && (x.on || (x.step > 0 && !x.paused)); };
  const chOf = id => CH.find(c => c.id === id); const cs = c => { const s = st(); return s.chapters[c.id] = s.chapters[c.id] || { step: 0, cnt: 0, done: false }; };
  function zoneId() { const pp = bb.ppos(); const z = bb.zoneAt(pp.x, pp.z, 60); return z ? z.id : null; }
  const hereCh = () => { const z = zoneId(); return z ? CH.find(c => c.zones.includes(z)) : null; };
  const centre = c => { const z = W.zones.find(q => q.id === c.zones[0]); return { x: z.x0 + z.nx * 40, z: z.z0 + z.nz * 40 }; };
  function advance(c) { const x = cs(c); const step = c.steps[x.step]; const r = bb.price(step.reward); bb.earn(r, 'story'); bb.toast(`📖 ${bb.esc(step.t)} · done · +${bb.inr(r)}`, '#ffc93c'); x.step++; x.cnt = 0;
    if (x.step >= c.steps.length) { x.done = true; const b = bb.price(CHAPTER_BONUS); bb.earn(b, 'story'); bb.big('CHAPTER DONE', '#ffc93c'); setTimeout(() => achCard({ icon: '📖', title: c.title, desc: 'Chapter complete', reward: b }), 600); grant('ch_' + c.id); const n = CH.filter(q => cs(q).done).length; if (n >= 5) grant('chapters5'); if (n >= CH.length) grant('chaptersAll'); }
    bb.setDirty(); bb.save(); }
  // events: a step listening for this event moves on (city steps only count while you are in that chapter's city)
  const EVS = new Set(); CH.forEach(c => c.steps.forEach(s => s.ev && EVS.add(s.ev)));
  for (const ev of EVS) bb.on(ev, d => { if (st().paused) return; const z = zoneId(); for (const c of CH) { const x = cs(c); if (x.done) continue; const step = c.steps[x.step]; if (!step || step.ev !== ev) continue; if (step.inCity && !c.zones.includes(z)) continue; if (!isOn(c)) continue; if (step.test && !step.test(d)) continue;
      x.cnt = (x.cnt || 0) + 1; bb.setDirty(); if (x.cnt >= (step.count || 1)) advance(c); } });
  bb.on('discover', n => { for (const c of CH) { const x = cs(c); if (x.done || !isOn(c)) continue; const step = c.steps[x.step]; if (step && step.kind === 'place' && step.place === n) advance(c); } });
  let introSeen = {}, tk = 0;
  bb.onUpdate(dt => { tk -= dt; if (tk > 0) return; tk = .5; const s = st(); if (s.paused) return; const c = hereCh(); if (!c) return; const x = cs(c); if (x.done) return;
    if (!isOn(c)) { if (!introSeen[c.id]) { introSeen[c.id] = 1; const zn = W.zones.find(z => z.id === c.zones[0]).name; setTimeout(() => bb.toast(`📖 There are new chapters in "${bb.esc(zn)}"<br><span style="font-size:14px;font-weight:600">Phone → Bay → Story to start one</span>`, '#ffc93c'), 1500); } return; }
    if (!x.met) { x.met = 1; bb.setDirty(); }
    const step = c.steps[x.step]; if (!step) return;
    if (step.kind === 'near' && bb.player.mode === 'foot') { const t = step.target(); const pp = bb.ppos(); if (t && Math.hypot(pp.x - t.x, pp.z - t.z) < step.near) { if (step.say) bb.toast(step.say, '#ffc93c'); advance(c); } }
    if (step.kind === 'place' && P().discovered[step.place]) advance(c); });
  bb.addMission(() => { const s = st(); if (s.paused) return null; let c = hereCh(); if (c && cs(c).done) c = null;
    if (c && !isOn(c)) return { pri: 4, k: '📖 Story', t: `New chapters in ${W.zones.find(z => z.id === c.zones[0]).name}`, m: 'Phone → Bay → Story to start one' };
    if (c) { const x = cs(c); const step = c.steps[x.step]; if (!step) return null; const t = step.target && step.target(); return { pri: 30, k: `📖 ${c.title} · ${x.step + 1}/${c.steps.length}`, t: step.t, m: step.m + (step.count ? ` (${x.cnt || 0}/${step.count})` : ''), target: t ? { x: t.x, z: t.z, col: 0xffc93c } : null }; }
    // not in a story city: point to the nearest chapter you have not finished
    const pp = bb.ppos(); const nx = CH.filter(q => isOn(q)).map(q => ({ q, c: centre(q) })).sort((a, b) => Math.hypot(a.c.x - pp.x, a.c.z - pp.z) - Math.hypot(b.c.x - pp.x, b.c.z - pp.z))[0];
    if (!nx) return null; const started = cs(nx.q).step > 0; return { pri: 12, k: '📖 Story', t: `${started ? 'Continue' : 'Next chapter'}: ${nx.q.title.split(' · ')[0]}`, m: `Travel to ${W.zones.find(z => z.id === nx.q.zones[0]).name} to ${started ? 'carry on' : 'start'} its chapter`, target: { x: nx.c.x, z: nx.c.z, col: 0xffc93c } }; });

  function storySheet(open) { const s = st(); const done = CH.filter(c => cs(c).done).length;
    if (open) { const c = chOf(open); const x = cs(c); return bb.openSheet(`📖 ${bb.esc(c.title)}`, `${x.done ? 'Complete' : `Step ${x.step + 1} of ${c.steps.length}`} · chapter bonus ${bb.inr(bb.price(CHAPTER_BONUS))}`, `<p class="note" style="font-size:14px">${bb.esc(c.intro)}</p>` +
      c.steps.map((q, i) => `<div class="row"><div class="nm">${i < x.step || x.done ? '✅' : i === x.step ? '➡️' : '▫️'} ${bb.esc(q.t)}<small>${bb.esc(q.m)}</small></div><b>${bb.inr(bb.price(q.reward))}</b></div>`).join('') + (x.done ? '' : isOn(c) ? bb.rowHtml('stop', '⏸ Pause this chapter', 'Your progress is kept · start again any time', 'Pause', 'ghost') : bb.rowHtml('start', '▶ Start this chapter', 'Its goals show in the tracker while you are in the city', 'Start', '')) + bb.rowHtml('dir', `Directions to ${W.zones.find(z => z.id === c.zones[0]).name}`, 'Its steps happen in this city', 'Go', 'ghost') + bb.rowHtml('back', 'All chapters', '', 'Back', 'ghost'),
      sh => sh.onclick = e => { const id = e.target.dataset.id; if (id === 'back') storySheet(); if (id === 'start') { x.on = true; x.paused = false; bb.setDirty(); bb.save(); bb.toast(`📖 ${bb.esc(c.title)} started`, '#ffc93c'); return storySheet(open); } if (id === 'stop') { x.on = false; if (x.step > 0) x.paused = true; bb.setDirty(); return storySheet(open); } if (id === 'dir' && bb.TRAVEL) { const p = centre(c); bb.TRAVEL.go(p.x, p.z, W.zones.find(z => z.id === c.zones[0]).name); } }); }
    bb.openSheet('📖 Story', `${done} of ${CH.length} city chapters done · each step pays, each chapter pays ${bb.inr(bb.price(CHAPTER_BONUS))}`, CH.map(c => { const x = cs(c); return bb.rowHtml('c:' + c.id, `${x.done ? '✅' : x.step ? '➡️' : '📍'} ${bb.esc(c.title)}`, x.done ? 'Complete' : `${x.step}/${c.steps.length} steps · ${W.zones.find(z => z.id === c.zones[0]).name}`, 'Open', 'ghost'); }).join('') +
      bb.rowHtml('pause', s.paused ? 'Show story goals' : 'Hide story goals', 'Free roam without the story tracker', s.paused ? 'Show' : 'Hide', 'ghost'),
      sh => sh.onclick = e => { const id = e.target.dataset.id; if (!id) return; if (id === 'pause') { s.paused = !s.paused; bb.setDirty(); return storySheet(); } if (id.startsWith('c:')) storySheet(id.slice(2)); }); }
  bb.addApp({ id: 'story', label: 'Story', icon: '📖', fn: () => storySheet() });

  /* ---------- achievements, with an unlock card ---------- */
  const ACH = [['zoo', '🦒', 'Zoo day', 'Visit an open zoo'], ['safari', '🦁', 'Safari ride', 'Take a zoo safari through the habitats'], ['zoos3', '🐘', 'Zoo hopper', 'Visit 3 different zoos'], ['firstjob', '💼', 'First day at work', 'Finish any job'], ['jobs10', '💼', 'Regular', 'Finish 10 jobs'], ['jobs50', '🏅', 'Workhorse', 'Finish 50 jobs'], ['lakh', '💰', 'Lakhpati', 'Have ₹1,00,000 in cash and bank'], ['crore', '💎', 'Crorepati', 'Have ₹1,00,00,000 in cash and bank'],
    ['home', '🏡', 'Ghar ka sapna', 'Buy a home'], ['homes3', '🏘', 'Property tycoon', 'Own 3 homes'], ['states', '🗺', 'Tri-state traveller', 'Visit Maharashtra, Gujarat and Rajasthan'], ['south', '🌴', 'Down south', 'Visit Goa, Karnataka and Kerala'], ['ut', '🧭', 'UT explorer', 'Visit Daman and Silvassa'], ['places10', '📸', 'Sightseer', 'Discover 10 famous places'],
    ['places30', '📚', 'Guidebook', 'Discover 30 famous places'], ['placesAll', '🌏', 'Know your India', 'Discover every famous place'], ['lions', '🦁', 'Simba spotted', 'See lions on a Gir safari'], ['camel', '🐪', 'Ship of the desert', 'Ride a camel at Sam'], ['local', '🚉', 'Local legend', 'Ride the Mumbai local'],
    ['flight', '✈', 'Frequent flyer', 'Take a flight'], ['metro', 'Ⓜ', 'Metro rider', 'Take a metro ride'], ['heli', '🚁', 'Chopper', 'Fly in a helicopter'], ['pilot', '🪪', 'Captain', 'Get a helicopter pilot licence'], ['five', '🚨', 'Most wanted', 'Reach 5 police stars'], ['helmet', '⛑', 'Safety first', 'Buy a helmet'],
    ['matchday', '⚽', 'Matchday', 'Watch a football match in a stadium'], ['cricket', '🏏', 'Howzat', 'Watch a cricket match in a stadium'], ['fanclub', '📣', 'True fan', 'Join a fan club'], ['march', '🥁', 'Ultras', 'Walk in a fan march to the stadium'], ['jersey', '👕', 'Team colours', 'Buy a home jersey'], ['betwin', '🎲', 'Lucky day', 'Win a bet (18+)'],
    ['mall', '🛍', 'Mall rat', 'Visit a shopping mall'], ['movie', '🎬', 'Picture abhi baaki hai', 'Watch a movie at a cineplex'], ['inside5', '🛕', 'Pilgrim', 'Go inside 5 famous places'], ['adv1', '🪂', 'Thrill seeker', 'Do an adventure activity'], ['adv5', '🌊', 'Adrenaline junkie', 'Do 5 different adventure activities'],
    ['festival', '🪔', 'Festival spirit', 'Take part in a festival game'], ['invite', '🎁', 'Bring a friend', 'A friend joins with your invite'], ['ludo', '🎲', 'Ludo king', 'Win a game of Ludo'], ['quiz', '🧠', 'Quiz master', 'Score 4 or more in the quiz'], ['km100', '🛣', 'Road tripper', 'Drive 100 km'], ['km1000', '🏁', 'Highway hero', 'Drive 1,000 km'],
    ['photo', '📷', 'Content creator', 'Save a photo or clip'], ['streak7', '🔥', 'Seven days', 'Log in 7 days in a row'], ['streak30', '🔥', 'Thirty days', 'Log in 30 days in a row'], ['chapters5', '📖', 'Storyteller', 'Finish 5 city chapters'], ['chaptersAll', '👑', 'Bharat darshan', 'Finish every city chapter']]
    .concat(CH.map(c => ['ch_' + c.id, '📖', c.title.split(' · ')[0], `Finish the ${c.title.split(' · ')[0]} chapter`]));
  const AR = () => bb.price(300);
  // the unlock card: slides in, trophy glow and confetti; several unlocks queue up
  const card = document.createElement('div'); card.id = 'achPop'; card.hidden = true; document.body.appendChild(card); const queue = []; let showing = false;
  function chime() { const ac = bb.audio; if (!ac || bb.muted) return; try { const t = ac.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t + i * .09); g.gain.linearRampToValueAtTime(.12, t + i * .09 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .09 + .6); o.connect(g); g.connect(ac.destination); o.start(t + i * .09); o.stop(t + i * .09 + .7); }); } catch (e) {} }
  function achCard(a) { queue.push(a); if (!showing) nextCard(); }
  function nextCard() { const a = queue.shift(); if (!a) { showing = false; return; } showing = true; const cols = ['#ffc93c', '#ff5d73', '#3ddc97', '#5fb4ff', '#c38bff', '#ff9f1c'];
    card.innerHTML = `<div class="ac-glow"></div><div class="ac-ic">${a.icon || '🏆'}</div><div class="ac-tx"><div class="ac-k">${a.k || 'Achievement unlocked'}</div><b>${bb.esc(a.title)}</b><span>${bb.esc(a.desc)}</span></div>${a.reward ? `<div class="ac-r">+${bb.inr(a.reward)}</div>` : ''}<div class="ac-cf">${Array.from({ length: 26 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${(Math.random() * .5).toFixed(2)}s;animation-duration:${(1.4 + Math.random()).toFixed(2)}s;transform:rotate(${Math.random() * 360 | 0}deg)"></i>`).join('')}</div>`;
    card.hidden = false; card.classList.remove('out'); void card.offsetWidth; card.classList.add('in'); chime(); card.onclick = () => close(); const tm = setTimeout(close, 4200);
    function close() { clearTimeout(tm); card.classList.add('out'); setTimeout(() => { card.hidden = true; card.classList.remove('in', 'out'); nextCard(); }, 380); } }
  bb.achAdd = a => { if (!ACH.some(x => x[0] === a[0])) ACH.push(a); }; bb.grant = id => grant(id);
  function grant(id) { const p = P(); if (p.ach[id]) return; const a = ACH.find(x => x[0] === id); if (!a) return; p.ach[id] = bb.istISO(); bb.earn(AR(), 'achievement'); bb.setDirty(); achCard({ icon: a[1], title: a[2], desc: a[3], reward: AR() }); bb.emit('achievement', id); }
  const visited = () => (P().extra.states = P().extra.states || {});
  bb.on('job', () => { const n = P().stats.trips; grant('firstjob'); if (n >= 10) grant('jobs10'); if (n >= 50) grant('jobs50'); });
  bb.on('buy', d => { if (d.kind === 'home') { grant('home'); if (P().homes.length >= 3) grant('homes3'); } if (d.kind === 'helmet') grant('helmet'); });
  bb.on('zone', z => { visited()[z.st] = 1; const v = visited(); if (v.MH && v.GJ && v.RJ) grant('states'); if (v.GA && v.KA && v.KL) grant('south'); if (v.DD) grant('ut'); });
  bb.on('discover', () => { const n = Object.keys(P().discovered).length; if (n >= 10) grant('places10'); if (n >= 30) grant('places30'); if (n >= W.places.length) grant('placesAll'); });
  bb.on('safari', () => grant('lions')); bb.on('camel', () => grant('camel'));
  bb.on('travel', d => { if (d.mode === 'local') grant('local'); if (d.mode === 'flight') grant('flight'); if (d.mode === 'metro') grant('metro'); if (d.mode === 'heli') grant('heli'); });
  bb.on('heli', () => grant('heli')); bb.on('licence', id => { if (id === 'heli') grant('pilot'); });
  bb.on('football', d => { if (d.kind === 'watched') grant('matchday'); if (d.kind === 'club') grant('fanclub'); if (d.kind === 'march') grant('march'); if (d.kind === 'jersey') grant('jersey'); });
  bb.on('cricket', d => { if (d.kind === 'watched') grant('cricket'); }); bb.on('bet', d => { if (d.won) grant('betwin'); });
  bb.on('zoo', d => { const ex = bb.P.extra = bb.P.extra || {}; if (d.kind === 'enter') { grant('zoo'); const v = ex.zoos = ex.zoos || []; if (d.id && !v.includes(d.id)) v.push(d.id); if (v.length >= 3) grant('zoos3'); } if (d.kind === 'safari') grant('safari'); });
  bb.on('mall', d => { if (d.kind === 'enter') grant('mall'); if (d.kind === 'movie') grant('movie'); });
  bb.on('attraction', d => { if (d.kind !== 'enter') return; const v = P().extra.visited || {}; if (Object.keys(v).length >= 5) grant('inside5'); });
  bb.on('adventure', () => { grant('adv1'); if (Object.keys(P().extra.adv || {}).length >= 5) grant('adv5'); });
  bb.on('festivalPlay', () => grant('festival')); bb.on('invite', d => { if (d.kind === 'reward') grant('invite'); });
  bb.on('stars', n => { if (n >= 5) grant('five'); }); bb.on('media', () => grant('photo'));
  bb.on('baygame', d => { if (d.win && d.game === 'Ludo') grant('ludo'); if (d.win && d.game === 'the quiz') grant('quiz'); });
  let netT = 0; bb.onUpdate(dt => { netT -= dt; if (netT > 0) return; netT = 2; const p = P(); const net = p.cash + p.bank; if (net >= 1e5) grant('lakh'); if (net >= 1e7) grant('crore'); if (p.stats.km >= 100) grant('km100'); if (p.stats.km >= 1000) grant('km1000'); });
  function achSheet() { const p = P(); const got = ACH.filter(a => p.ach[a[0]]).length;
    bb.openSheet('🏆 Achievements', `${got} of ${ACH.length} · each one pays ${bb.inr(AR())}`, `<div class="achgrid">${ACH.map(a => `<div class="achtile${p.ach[a[0]] ? ' got' : ''}"><span>${p.ach[a[0]] ? a[1] : '🔒'}</span><b>${bb.esc(a[2])}</b><small>${bb.esc(a[3])}${p.ach[a[0]] ? '<br>' + p.ach[a[0]] : ''}</small></div>`).join('')}</div>` +
      `<h3 class="sub">Your stats</h3><div class="row"><div class="nm">Distance driven</div><b>${p.stats.km.toFixed(1)} km</b></div><div class="row"><div class="nm">Jobs done</div><b>${p.stats.trips}</b></div><div class="row"><div class="nm">Money earned</div><b>${bb.inr(p.stats.earned)}</b></div><div class="row"><div class="nm">Places discovered</div><b>${Object.keys(p.discovered).length} / ${W.places.length}</b></div><div class="row"><div class="nm">Daily streak</div><b>🔥 ${p.daily.streak || 0} day${p.daily.streak === 1 ? '' : 's'}</b></div>`); }
  bb.addApp({ id: 'ach', label: 'Achievements', icon: '🏆', group: 'settings', fn: achSheet });

  /* ---------- daily rewards with a streak ---------- */
  // Day 1 to 7 grow, then the week repeats; every 7th day pays the big one, and 14 and 30 days in a row pay extra.
  const MULT = [1, 1.5, 2, 2.5, 3.5, 4.5, 7.5];
  const base = () => bb.cost('daily.base', 200); const dayAmt = d => Math.round(base() * MULT[(d - 1) % 7] / 10) * 10;
  const milestone = d => (d === 14 ? 5000 : d === 30 ? 15000 : d % 30 === 0 ? 15000 : 0);
  const yesterday = iso => new Date(Date.parse(iso + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
  function state() { const p = P(); const d = p.daily = p.daily || { last: '', streak: 0 }; const today = bb.istISO(); const claimed = d.last === today; const next = claimed ? d.streak : (d.last === yesterday(today) ? d.streak + 1 : 1); const broken = !claimed && d.last && d.last !== yesterday(today) && d.streak > 1; return { d, today, claimed, next, broken }; }
  function claim() { const s = state(); if (s.claimed) return; s.d.streak = s.next; s.d.last = s.today; const amt = dayAmt(s.next) + milestone(s.next); bb.earn(amt, 'daily'); bb.save();
    achCard({ icon: '🔥', k: `Daily reward · day ${s.next}`, title: `${s.next} day${s.next > 1 ? 's' : ''} in a row`, desc: milestone(s.next) ? `Streak bonus ${bb.inr(milestone(s.next))} included!` : `Come back tomorrow for ${bb.inr(dayAmt(s.next + 1))}`, reward: amt });
    if (s.next >= 7) grant('streak7'); if (s.next >= 30) grant('streak30'); bb.emit('daily', s.next); }
  function dailySheet() { const s = state(); const shown = s.claimed ? s.d.streak : s.next; const wk0 = Math.floor((shown - 1) / 7) * 7;
    const tiles = Array.from({ length: 7 }, (_, i) => { const day = wk0 + i + 1; const done = day < shown || (day === shown && s.claimed); const today = day === shown && !s.claimed; return `<div class="dtile${done ? ' done' : ''}${today ? ' today' : ''}"><small>Day ${day}</small><span>${done ? '✅' : i === 6 ? '🎁' : '🪙'}</span><b>${bb.inr(dayAmt(day) + milestone(day))}</b></div>`; }).join('');
    bb.openSheet('🔥 Daily rewards', s.claimed ? `Day ${s.d.streak} claimed · come back tomorrow` : `Day ${s.next} is ready${s.broken ? ' · your streak restarted' : ''}`,
      `<div class="dstreak">🔥 <b>${s.claimed ? s.d.streak : Math.max(0, s.next - 1)}</b> day streak</div><div class="dgrid">${tiles}</div>` + (s.claimed ? `<p class="note" style="font-size:14px;text-align:center">Tomorrow: <b>${bb.inr(dayAmt(s.d.streak + 1) + milestone(s.d.streak + 1))}</b>. Miss a day and the streak starts again from day 1.</p>` : `<div class="btnrow" style="justify-content:center"><button class="go" data-claim>Claim ${bb.inr(dayAmt(s.next) + milestone(s.next))}</button></div>`) +
      `<p class="note">Day 7 of every week pays the most. 14 days in a row: +${bb.inr(5000)}. 30 days: +${bb.inr(15000)}. Days follow India time.</p>`,
      sh => sh.onclick = e => { if (e.target.dataset.claim != null) { claim(); dailySheet(); } }); }
  bb.addApp({ id: 'rewards', label: 'Rewards', icon: '🔥', fn: dailySheet });
  // offer it when the game starts (after any What's new or profile sheet closes)
  bb.onStart(() => { let tries = 0; const t = setInterval(() => { tries++; if (tries > 40) return clearInterval(t); if (state().claimed) return clearInterval(t); if (!bb.started || bb.uiLock()) return; clearInterval(t); dailySheet(); }, 1500); });
  bb.STORY = { CH, grant, achCard };
});
