// Badshah · Act 3, part 2: the Bridge Master, the Tea Baron, the Pearl Broker and the Backwater Boss. Beta v2.04.00.
// Wildlife only appears as something to protect; poachers are the villains. All characters are fictional.
(function () {
  const B = window.BADSHAH = window.BADSHAH || { missions: [] };
  const talk = (...lines) => ({ type: 'talk', lines }), call = (...lines) => ({ type: 'call', lines }), ck = { type: 'checkpoint' };
  const K = (arc, n, id, title, start, blurb, steps, x) => Object.assign({ id, arc, n, title, start, blurb, nextDay: [1, 3, 6, 9].includes(n), steps, reward: { izzat: n === 9 ? 0 : 10 + n * 2, note: (x && x.note) || '' } }, x || {});
  const voice = (line) => call(['vikram', line]);
  const page = (k) => ({ type: 'give', flags: ['page_' + k] });
  B.missions.push(
  /* ===================== KING 5 · THE BRIDGE MASTER (East) ===================== */
  K('bridge', 1, 'BM-01', 'City of Joy', 'howrah:station', 'Meet Dr. Ananya Bose', [
    { type: 'goto', at: 'kolkata:@Howrah Bridge', text: 'Cross Howrah Bridge' },
    { type: 'meet', at: 'kolkata:market', who: 'ananya', text: 'Meet Dr. Ananya at her clinic' },
    talk(['ananya', 'Three of my patients took tablets that were chalk and colour. One nearly died. The pharmacies all buy from the same port warehouse.'], ['ananya', 'The Bridge Master’s warehouse.'])], { note: 'The fake-medicine shops are marked.' }),
  K('bridge', 2, 'BM-02', 'Pharmacy Sting', 'kolkata:market', 'Buy samples undercover', [
    { type: 'goto', at: 'kolkata:shops.0', time: 120, text: 'Buy a sample at the first pharmacy' },
    { type: 'goto', at: 'kolkata:shops.1', time: 120, text: 'Buy a sample at the second pharmacy' },
    { type: 'goto', at: 'kolkata:shops.2', time: 120, text: 'Buy a sample at the third pharmacy' },
    { type: 'goto', at: 'kolkata:market', time: 180, text: 'Get the samples to Ananya’s lab before closing' }], { note: 'The lab proves the medicine is fake.' }),
  K('bridge', 3, 'BM-03', 'Ferry Crossing', 'howrah:dock', 'Chase the courier across the river', [
    { type: 'boat', at: 'kolkata:sea', text: 'Take a speedboat on the Hooghly' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 160, speed: 16, text: 'Stop the courier’s boat between the ferries' }], { note: 'The warehouse paperwork.' }),
  K('bridge', 4, 'BM-04', 'Coal Roads', 'dhanbad:hw', 'Stop the illegal coal convoy', [
    ck, { type: 'convoy', from: 'dhanbad:hw', to: 'asansol:station', n: 4, need: 3, veh: 'lorry', speed: 11, text: 'Stop the coal lorries before they cross over' }], { note: 'The coal money ledger.' }),
  K('bridge', 5, 'BM-05', 'Festival Crowd', 'kolkata:market', 'Protect Ananya in the crowd', [
    talk(['ananya', 'The dealer is in the market crowd. I want to look him in the eye.'], ['you', 'Stay behind me. No guns here, too many people.']),
    ck, { type: 'fight', at: 'kolkata:market', n: 3, weapon: ['knife', 'fist', 'lathi'], hp: 3, text: 'Stop the three men going for Ananya (hands only)' },
    { type: 'boss', at: 'kolkata:market', name: 'Medicine dealer', flee: ['kolkata:landmarkB'], hp: 4, phases: 1 }], { meleeOnly: true, note: 'The dealer’s supplier list.' }),
  K('bridge', 6, 'BM-06', 'Mangroves', 'gosaba:dock', 'Chase the supplier through the mangroves', [
    talk(['narrator', 'The Sundarbans: tigers in the trees, crocodiles in the water. Stay out of the marked tiger zones.']),
    { type: 'boat', at: 'gosaba:sea', text: 'Take a boat into the mangroves' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 200, speed: 15, text: 'Catch the supplier’s boat' }], { note: 'The port warehouse location.' }),
  K('bridge', 7, 'BM-07', 'Monsoon Bridge', 'howrah:hw', 'Stop the last shipment in the storm', [
    ck, { type: 'chase', at: 'howrah:hw', to: 'kolkata:station', veh: 'truck', speed: 13, text: 'Stop the shipment truck across the bridge', stopText: 'The last shipment is stopped' }], { note: 'An inside contact at the port.' }),
  K('bridge', 8, 'BM-08', 'Tiger Hill Sunrise', 'darjeeling:station', 'The sunrise meeting is a trap', [
    { type: 'goto', at: 'darjeeling:@Tiger Hill', text: 'Meet the contact at Tiger Hill at sunrise' },
    talk(['narrator', 'The contact smiles. Behind him, car doors open.']),
    ck, { type: 'deliver', at: 'siliguri:safehouse', pursuers: 3, time: 420, text: 'Escape down the hill roads', grabText: 'They caught you on the bends' }], { note: 'The warehouse access codes.' }),
  K('bridge', 9, 'BM-09', 'Port Showdown', 'kolkata:station', 'Showdown at the port warehouse', [
    ck, { type: 'fight', at: 'kolkata:warehouse', n: 6, weapon: ['pistol', 'smg', 'knife'], hp: 3, allies: ['pehelwan'], text: 'Fight into the burning warehouse' },
    { type: 'boss', at: 'kolkata:warehouse', name: 'The Bridge Master', flee: ['kolkata:dock'], hp: 13, phases: 3, goons: 3, goonWeapons: ['smg', 'pistol'] },
    talk(['bridgem', 'Ask the old mechanic how he paid for that garage.'], ['narrator', 'Ledger page 5. The handwriting at the bottom is not Vikram’s.']),
    page('bridge'), voice('The money for the routes went through a garage account. A garage. Why a garage?')], { note: 'Ledger page 5. The East’s businesses and a Kolkata safehouse are yours.' }),

  /* ===================== KING 6 · THE TEA BARON (North-East, Sikkim) ===================== */
  K('tea', 1, 'TB-01', 'Gateway of the East', 'guwahati:station', 'Meet Ranger Jonali Das', [
    { type: 'meet', at: 'guwahati:dock', who: 'jonali', text: 'Meet Ranger Jonali by the Brahmaputra' },
    talk(['jonali', 'I protect rhinos. Someone is selling their horns inside tea crates. The crates come from the Tea Baron’s estates.'], ['jonali', 'You hunt the man. I protect the animals. Deal?'])], { note: 'The Baron’s estates are marked.' }),
  K('tea', 2, 'TB-02', 'Estate Hand', 'jorhat:station', 'Tag the fake tea crates', [
    { type: 'job', jobs: ['truck', 'driver', 'baycart'], n: 1, text: 'Take one tea-truck or delivery run', sub: 'Phone → Jobs' },
    ck, { type: 'stealth', at: 'jorhat:warehouse', guards: 3, alarmStars: 1, text: 'Tag the crates without the supervisor noticing' }], { note: 'The export route.' }),
  K('tea', 3, 'TB-03', 'Poacher Patrol', 'kohora:station', 'Stop the poachers before they reach the rhinos', [
    talk(['jonali', 'Three poacher teams in the grass. Stop them. Do not hurt a single animal, or I will hurt you.']),
    ck, { type: 'fight', at: 'kohora:hw', n: 3, weapon: ['rifle', 'knife', 'pistol'], hp: 3, allies: ['jonali'], text: 'Stop the first poacher team' },
    { type: 'fight', at: 'kohora:market', n: 3, weapon: ['rifle', 'knife', 'lathi'], hp: 3, text: 'Stop the second team' }], { note: 'The poachers’ radio. The rhinos are safe tonight.' }),
  K('tea', 4, 'TB-04', 'Majuli Run', 'jorhat:dock', 'Chase the poacher boss to Majuli', [
    { type: 'boat', at: 'majuli:sea', text: 'Take a boat on the Brahmaputra' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 200, speed: 15, text: 'Catch the poacher boss’s boat' }], { note: 'The name of the horn dealer.' }),
  K('tea', 5, 'TB-05', 'Living Roots', 'shillong:station', 'Ambush in the fog', [
    { type: 'goto', at: 'sohra:market', text: 'Meet the informant at Sohra' },
    talk(['narrator', 'Rain, then fog, then shapes in the fog.']),
    ck, { type: 'fight', at: 'sohra:market', n: 4, weapon: ['knife', 'pistol'], hp: 3, text: 'Fight through the ambush' },
    { type: 'deliver', at: 'shillong:safehouse', pursuers: 2, time: 360, text: 'Get back to Shillong' }], { note: 'A hidden airstrip is on the map.' }),
  K('tea', 6, 'TB-06', 'Ranger Post', 'kohora:station', 'Hold the ranger post', [
    ck, { type: 'defend', sites: ['kohora:market'], waves: 3, n: 4, weapon: ['rifle', 'knife', 'pistol'], hp: 3, siteDmg: 1.5, allies: ['jonali'], text: 'Hold Jonali’s ranger post through the night' }], { note: 'Jonali joins you for the rest of this arc.' }),
  K('tea', 7, 'TB-07', 'Mountain Pass', 'bomdila:hw', 'Stop the horn shipment', [
    ck, { type: 'convoy', from: 'bomdila:hw', to: 'tawang:station', n: 3, need: 2, veh: 'pickup', speed: 11, text: 'Stop the shipment on the mountain road' }], { note: 'Evidence for Jonali’s case.' }),
  K('tea', 8, 'TB-08', 'Gangtok Heights', 'gangtok:station', 'Chase the lieutenant on the hairpins', [
    ck, { type: 'chase', at: 'gangtok:hw', to: 'namchi:station', veh: 'sportsbike', speed: 15, text: 'Catch the lieutenant on his motorbike', stopText: 'He came off his bike' }], { note: 'The bungalow’s security plan.' }),
  K('tea', 9, 'TB-09', 'The Bungalow', 'golaghat:station', 'Showdown in the tea rows', [
    ck, { type: 'fight', at: 'golaghat:warehouse', n: 6, weapon: ['rifle', 'smg', 'knife'], hp: 3, allies: ['jonali'], text: 'Break into the bungalow' },
    { type: 'boss', at: 'golaghat:warehouse', name: 'The Tea Baron', flee: ['golaghat:market'], hp: 14, phases: 3, goons: 3, goonWeapons: ['rifle', 'pistol'] },
    talk(['baron', 'Your brother came here too. Same questions. Same end, if your Master-ji wants it.'], ['narrator', 'Ledger page 6, pressed between tea leaves.']),
    page('tea'), voice('If anything happens, do not go back to the garage.')], { note: 'Ledger page 6. The North-East’s businesses and an estate safehouse are yours.' }),

  /* ===================== KING 7 · THE PEARL BROKER (Telangana, AP, Karnataka) ===================== */
  K('pearl', 1, 'PB-01', 'City of Pearls', 'hyderabad:station', 'Meet Sana', [
    { type: 'goto', at: 'hyderabad:@Charminar', text: 'Walk to Charminar' },
    { type: 'meet', at: 'hyderabad:cafe', who: 'sana', text: 'Meet Sana at the café' },
    talk(['sana', 'Chotu says you are a menace. I like menaces. The Pearl Broker sells fake pearls by day and runs a scam call centre by night.'])], { note: 'The Broker’s shops are marked.' }),
  K('pearl', 2, 'PB-02', 'Fake Shine', 'hyderabad:market', 'Swap the pearl box', [
    { type: 'job', jobs: ['baycart', 'delivery', 'zomato'], n: 1, text: 'Take one courier or delivery job to get on the Broker’s list', sub: 'Phone → Jobs' },
    ck, { type: 'stealth', at: 'hyderabad:printing', guards: 3, alarmStars: 2, text: 'Swap the box for Chotu’s tracked fakes' }], { note: 'The buyer network is revealed.' }),
  K('pearl', 3, 'PB-03', 'Rooftops', 'hyderabad:market', 'Catch the courier in the old city', [
    ck, { type: 'boss', at: 'hyderabad:market', name: 'Courier', flee: ['hyderabad:landmarkB', 'hyderabad:rooftop'], hp: 4, phases: 1 }], { note: 'The call-centre address.' }),
  K('pearl', 4, 'PB-04', 'Scam Floor', 'bengaluru:office', 'Hold the floor while Sana copies the data', [
    ck, { type: 'defend', sites: ['bengaluru:office'], waves: 3, n: 4, weapon: ['bat', 'pistol', 'knife'], hp: 3, siteDmg: 1.4, text: 'Hold the floor while the data copies' }], { izzat: 25, note: 'The victims’ money is traced and returned.' }),
  K('pearl', 5, 'PB-05', 'Traffic Jam', 'bengaluru:market', 'Escape through Bengaluru traffic', [
    ck, { type: 'deliver', at: 'bengaluru:safehouse', pursuers: 3, pursuerVeh: 'suv', time: 360, text: 'Lose the Broker’s men in traffic', grabText: 'They boxed you in' }], { note: 'A Bengaluru safehouse is yours.' }),
  K('pearl', 6, 'PB-06', 'Boulder Ruins', 'hosapete:station', 'Photograph the buyers among the boulders', [
    ck, { type: 'stealth', at: 'hosapete:hw', guards: 4, alarmStars: 2, text: 'Photograph the meeting without the lookouts seeing you' }], { note: 'The diamond van schedule.' }),
  K('pearl', 7, 'PB-07', 'Vizag Docks', 'visakhapatnam:station', 'Rescue Sana', [
    call(['chotu', 'They took Sana! Her phone is at the Vizag docks.']),
    ck, { type: 'fight', at: 'visakhapatnam:dock', n: 6, weapon: ['pistol', 'smg', 'knife'], hp: 3, text: 'Storm the dock warehouse' },
    { type: 'follow', who: 'sana', at: 'visakhapatnam:safehouse', text: 'Get Sana to safety' }], { note: 'Part of the mansion alarm codes.' }),
  K('pearl', 8, 'PB-08', 'Diamond Run', 'hyderabad:hw', 'Stop the diamond van', [
    ck, { type: 'convoy', from: 'hyderabad:hw', to: 'hyderabad:station', n: 3, need: 3, veh: 'van', speed: 13, text: 'Stop the armoured van and both escorts' }], { note: 'The mansion’s full layout.' }),
  K('pearl', 9, 'PB-09', 'Glass Mansion', 'hyderabad:station', 'Showdown at the glass mansion', [
    talk(['sana', 'I cut the power in stages. Cross each room before the backup comes on.']),
    ck, { type: 'stealth', at: 'hyderabad:rooftop', guards: 4, alarmStars: 3, text: 'Cross the laser rooms in the dark' },
    { type: 'boss', at: 'hyderabad:rooftop', name: 'The Pearl Broker', flee: ['hyderabad:warehouse'], hp: 14, phases: 3, goons: 3, goonWeapons: ['smg', 'rifle'] },
    talk(['pearl', 'The ninth one is someone you already trust.'], ['narrator', 'Ledger page 7, sealed in a velvet pearl box.']),
    page('pearl'), voice('The ninth name is not a name. It is a title. Sarkar.')], { note: 'Ledger page 7. The southern businesses and a Hyderabad safehouse are yours.' }),

  /* ===================== KING 8 · THE BACKWATER BOSS (Kerala, Tamil Nadu, Puducherry) ===================== */
  K('backwater', 1, 'BB-01', 'Queen of the Sea', 'kochi:station', 'Meet Meenakshi at the fishing nets', [
    { type: 'meet', at: 'kochi:@Chinese', who: 'meenakshi', text: 'Meet Meenakshi by the fishing nets' },
    talk(['meenakshi', 'I captain a snake boat. Last season the race was fixed. The Backwater Boss bets on the result he buys.'])], { note: 'The Boss’s houseboats are marked.' }),
  K('backwater', 2, 'BB-02', 'Houseboat Cover', 'alappuzha:station', 'Find the smuggling houseboats', [
    { type: 'boat', at: 'alappuzha:sea', text: 'Take the work boat' },
    { type: 'goto', at: 'alappuzha:sea2', veh: ['speedboat'], text: 'Check the moored houseboats down the water' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 160, speed: 13, text: 'A smuggler boat bolts · stop it' }], { note: 'The registration numbers of three smuggling boats.' }),
  K('backwater', 3, 'BB-03', 'Race Day', 'alappuzha:dock', 'Beat the fixed team', [
    talk(['meenakshi', 'Paddle like you mean it! Well, you are steering the support boat. Same thing.']),
    { type: 'boat', at: 'alappuzha:sea', text: 'Get in the boat' },
    ck, { type: 'goto', at: 'alappuzha:sea2', veh: ['speedboat'], time: 120, text: 'Reach the finish buoy before the fixed team' }], { izzat: 25, note: 'The betting ring is exposed.' }),
  K('backwater', 4, 'BB-04', 'Spice Route', 'munnar:station', 'Follow the spice truck', [
    ck, { type: 'tail', from: 'munnar:station', to: 'munnar:warehouse', veh: 'pickup', speed: 9, text: 'Follow the spice truck down the hairpins' }], { note: 'The sandalwood route.' }),
  K('backwater', 5, 'BB-05', 'Sandalwood Road', 'coimbatore:hw', 'Stop the sandalwood trucks', [
    ck, { type: 'convoy', from: 'coimbatore:hw', to: 'salem:station', n: 3, need: 2, veh: 'truck', speed: 12, text: 'Stop the sandalwood trucks before the port road' }], { note: 'The Chennai contact’s name.' }),
  K('backwater', 6, 'BB-06', 'Marina Chase', 'chennai:station', 'Catch the contact on the beach road', [
    ck, { type: 'chase', at: 'chennai:hw', to: 'chennai:dock', veh: 'sedan', speed: 15, text: 'Stop the contact before he reaches the port' }], { note: 'The money man’s address.' }),
  K('backwater', 7, 'BB-07', 'French Quarter', 'puducherry:station', 'Steal the money man’s laptop', [
    talk(['babu', 'Linen shirt, straw hat, guidebook. You are a tourist now.']),
    ck, { type: 'stealth', at: 'puducherry:landmarkA', guards: 3, alarmStars: 2, text: 'Take the laptop from the villa unseen' }], { note: 'The Boss’s fleet plan.' }),
  K('backwater', 8, 'BB-08', 'Land’s End', 'nagercoil:station', 'Escape the ambush at the southern tip', [
    { type: 'goto', at: 'nagercoil:@Kanyakumari', text: 'Go to Kanyakumari at sunrise' },
    talk(['narrator', 'Three seas meet here. So do three boats full of the Boss’s men.']),
    { type: 'boat', at: 'nagercoil:sea', text: 'Get to a fishing boat' },
    ck, { type: 'waterchase', mode: 'escape', n: 3, time: 120, speed: 20, text: 'Escape along the coast' }], { note: 'The lead houseboat’s location.' }),
  K('backwater', 9, 'BB-09', 'Floating Fortress', 'alappuzha:station', 'Showdown on the houseboats', [
    { type: 'boat', at: 'alappuzha:sea', text: 'Get to your boat' },
    ck, { type: 'waterchase', mode: 'catch', n: 2, time: 180, speed: 14, text: 'Take out the escort boats' },
    { type: 'goto', at: 'alappuzha:dock', text: 'The Boss jumped to the bank · go after him' },
    { type: 'boss', at: 'alappuzha:dock', name: 'The Backwater Boss', flee: ['alappuzha:market'], hp: 14, phases: 3, goons: 3, goonWeapons: ['knife', 'smg'] },
    talk(['bwboss', 'Ask your Master-ji about Vikram’s last delivery…'], ['narrator', 'Ledger page 8. All eight pages are yours.']),
    page('backwater'), voice('I signed for the last delivery myself. The man who handed me the keys was smiling.')], { note: 'Ledger page 8. Kerala and Tamil Nadu are yours.' })
  );
})();
