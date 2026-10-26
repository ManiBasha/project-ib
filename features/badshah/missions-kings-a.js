// Badshah · Act 3 (Rashtra, The Highway), part 1: the kings, their allies, and the first four arcs. Beta v2.04.00.
// Places: 'town:anchor' (station, market, garage, warehouse, rooftop, office, bank, safehouse, landmarkA…), 'town:@Name'
// (a named sight), 'town:sea' / 'town:sea2' (open water), 'town:dock' (the shore), 'town:hw' (the highway outside).
// All characters, businesses and events are fictional.
(function () {
  const B = window.BADSHAH = window.BADSHAH || { missions: [] };
  B.kings = {
    dock: { name: 'The Dock King', region: 'West · Maharashtra, Goa, Gujarat', states: ['MH', 'GA', 'GJ', 'DD', 'DN', 'LD'], racket: 'Container smuggling, counterfeit goods, casino laundering', base: 'A yacht off the Gateway of India', city: 'mumbai', ally: 'tuka' },
    fixer: { name: 'The Fixer', region: 'Delhi NCR · Uttar Pradesh', states: ['DL', 'UP'], racket: 'Rigged contracts, fake permits, blackmail files', base: 'A farmhouse vault outside Delhi', city: 'delhi', ally: 'kavya' },
    raja: { name: 'The Highway Raja', region: 'The North · Punjab to Ladakh', states: ['PB', 'HR', 'CH', 'HP', 'UK', 'JK', 'LA'], racket: 'Fake tolls, fake FASTags, truck hijacking', base: 'A fortified toll plaza on a mountain highway', city: 'ludhiana', ally: 'harleen' },
    fox: { name: 'The Desert Fox', region: 'Rajasthan · Madhya Pradesh · Chhattisgarh', states: ['RJ', 'MP', 'CG'], racket: 'Antiques stolen from forts and museums', base: 'A fort hotel near Jaisalmer', city: 'jaipur', ally: 'kesar' },
    bridge: { name: 'The Bridge Master', region: 'East · Bengal, Bihar, Jharkhand, Odisha', states: ['WB', 'BR', 'JH', 'OD', 'AN'], racket: 'Fake medicine, illegal coal, bridge and ferry gangs', base: 'A Kolkata port warehouse', city: 'kolkata', ally: 'ananya' },
    tea: { name: 'The Tea Baron', region: 'The North-East and Sikkim', states: ['AS', 'AR', 'ML', 'MN', 'MZ', 'NL', 'TR', 'SK'], racket: 'Fake premium tea, a rhino-poaching ring', base: 'A tea-estate bungalow in Assam', city: 'guwahati', ally: 'jonali' },
    pearl: { name: 'The Pearl Broker', region: 'Telangana · Andhra Pradesh · Karnataka', states: ['TG', 'AP', 'KA'], racket: 'Fake pearls and diamonds, a scam call centre', base: 'A glass mansion in the Hyderabad hills', city: 'hyderabad', ally: 'sana' },
    backwater: { name: 'The Backwater Boss', region: 'Kerala · Tamil Nadu · Puducherry', states: ['KL', 'TN', 'PY'], racket: 'Sandalwood and spice smuggling, race fixing', base: 'A houseboat fleet at Alappuzha', city: 'kochi', ally: 'meenakshi' } };
  B.who = { tuka: ['Tuka', '#5fb4ff'], kavya: ['Kavya', '#ff9fd0'], harleen: ['Harleen', '#ffb347'], kesar: ['Kesar', '#e8c06a'], ananya: ['Dr. Ananya Bose', '#7fd8c8'], jonali: ['Ranger Jonali Das', '#7fd858'], sana: ['Sana', '#b49cff'], meenakshi: ['Meenakshi', '#ff7f6a'],
    dockking: ['The Dock King', '#ff5d73'], fixer: ['The Fixer', '#ff5d73'], raja: ['The Highway Raja', '#ff5d73'], fox: ['The Desert Fox', '#ff5d73'], bridgem: ['The Bridge Master', '#ff5d73'], baron: ['The Tea Baron', '#ff5d73'], pearl: ['The Pearl Broker', '#ff5d73'], bwboss: ['The Backwater Boss', '#ff5d73'], sarkar: ['Sarkar', '#ff3b3b'], tuk: ['Tuka', '#5fb4ff'] };
  // helpers
  const talk = (...lines) => ({ type: 'talk', lines }), call = (...lines) => ({ type: 'call', lines }), ck = { type: 'checkpoint' };
  const K = (arc, n, id, title, start, blurb, steps, x) => Object.assign({ id, arc, n, title, start, blurb, nextDay: [1, 3, 6, 9].includes(n), steps, reward: { izzat: n === 9 ? 0 : 10 + n * 2, note: (x && x.note) || '' } }, x || {});
  const voice = (line) => call(['vikram', line]);
  const page = (k) => ({ type: 'give', flags: ['page_' + k] });
  B.missions.push(
  /* ===================== KING 1 · THE DOCK KING (West) ===================== */
  K('dock', 1, 'DK-01', 'Gateway', 'mumbai:station', 'Meet Tuka in Mumbai', [
    talk(['narrator', 'Mumbai. The Collector’s last words led here: the docks, the yachts, the man in the white suit.']),
    { type: 'goto', at: 'mumbai:@Gateway of India', text: 'Walk to the Gateway of India' },
    { type: 'meet', at: 'mumbai:@Marine Drive', who: 'tuka', text: 'Meet Tuka on Marine Drive' },
    talk(['tuka', 'You are Vikram’s family? He bought me vada pav every time his truck came to the port.'], ['tuka', 'I drive a crane. I see which containers never get checked. Berths 7 to 12. Always the Dock King’s.'], ['you', 'Then we start there.'])], { note: 'The Dock King’s berths are marked on your map.' }),
  K('dock', 2, 'DK-02', 'Crane Job', 'navimumbai:station', 'Container-truck work at the port', [
    talk(['tuka', 'Take a container-truck run from the port. While you load, put Chotu’s trackers on the marked boxes. Don’t let the dock guards see you.']),
    { type: 'goto', at: 'navimumbai:dock', text: 'Drive to the container yard', veh: ['truck', 'lorry', 'car', 'sedan', 'suv', 'bike', 'scooter', 'auto'] },
    ck, { type: 'stealth', at: 'navimumbai:dock', guards: 3, alarmStars: 2, text: 'Slip a tracker onto the marked container' },
    { type: 'stars', text: 'Get clear of the port' },
    call(['chotu', 'Trackers are live! Three containers, three routes. One of them goes to a courier in Mumbai.'])], { note: 'Tracker routes revealed.' }),
  K('dock', 3, 'DK-03', 'Local Line', 'mumbai:station', 'Catch the cash courier', [
    call(['chotu', 'The courier just left the station in a black-and-yellow taxi with a cash bag. Follow him. Don’t get close.']),
    ck, { type: 'tail', from: 'mumbai:station', to: 'mumbai:market', veh: 'taxi', speed: 10, min: 10, max: 75, text: 'Tail the courier’s taxi' },
    { type: 'boss', at: 'mumbai:market', name: 'Courier', flee: ['mumbai:landmarkB'], hp: 3, phases: 1, dmg: 4 },
    talk(['narrator', 'The cash bag, and the courier’s phone. One number is saved as “D.K. – Lonavala truck”.'])], { note: 'You have the courier’s phone.' }),
  K('dock', 4, 'DK-04', 'Ghat Run', 'lonavala:hw', 'Hijack the counterfeit truck on the ghat', [
    call(['chotu', 'The truck of fake goods takes the expressway over the ghats. Stop it before the toll plaza.']),
    ck, { type: 'chase', at: 'lonavala:hw', to: 'pune:station', veh: 'truck', speed: 14, text: 'Stop the counterfeit truck on the ghat road', stopText: 'Truck stopped · the driver ran into the trees' },
    { type: 'goto', at: 'mumbai:garage', veh: ['truck'], text: 'Drive the truck to a safe garage in Mumbai' }], { note: 'Byaaj Bhai is selling the fake stock to people who sell it back to the brands.' }),
  K('dock', 5, 'DK-05', 'Goa Tables', 'panaji:station', 'Photograph the casino books', [
    talk(['babu', 'One VIP card, laminated, holographic, smells expensive. You are now “Mr. Kapoor from Dubai”.'], ['narrator', 'The Dock King’s casino boat is moored on the river at Panaji. Casino chips are only props here.']),
    ck, { type: 'stealth', at: 'panaji:market', guards: 4, alarmStars: 2, text: 'Get into the back office and photograph the account books' },
    { type: 'stars', text: 'Walk out calmly · lose anyone who follows' }], { note: 'Casino laundering evidence.' }),
  K('dock', 6, 'DK-06', 'Beach Ambush', 'calangute:market', 'Escape the ambush by sea', [
    talk(['narrator', 'A beach shack at sunset. The fish curry is good. The men walking up the sand are not.'], ['goon', 'Dock King says: enjoy your last sunset.']),
    ck, { type: 'fight', at: 'calangute:market', n: 3, weapon: ['knife', 'bat', 'pistol'], hp: 3, text: 'Fight your way off the beach' },
    { type: 'boat', at: 'calangute:sea', text: 'Get to the speedboat Rani left for you' },
    { type: 'waterchase', mode: 'escape', n: 2, time: 90, speed: 22, text: 'Lose the Dock King’s boats' },
    call(['rani', 'Saw your fireworks from the road. Dock the boat, I have a room for you in Goa.'])], { note: 'A Goa safehouse is yours.' }),
  K('dock', 7, 'DK-07', 'Salt Flats', 'bhuj:hw', 'Hit the night handoff on the Rann', [
    talk(['pehelwan', 'The white desert. No trees, no walls, no hiding. Good. Then they can’t hide either.'], ['narrator', 'Gir is not far. Hit an animal and Jonali will never forgive you, even though you have not met her yet.']),
    ck, { type: 'convoy', from: 'bhuj:hw', to: 'gandhidham:station', n: 3, need: 2, veh: 'truck', speed: 13, text: 'Stop the handoff convoy before the buyers arrive' },
    { type: 'fight', at: 'gandhidham:station', n: 4, weapon: ['pistol', 'bat', 'knife'], hp: 3, allies: ['pehelwan'], text: 'Deal with the buyers’ guards' }], { note: 'You have the date of the Dock King’s yacht party.' }),
  K('dock', 8, 'DK-08', 'Container Heist', 'navimumbai:station', 'Steal the King’s private container', [
    talk(['chotu', 'Cameras off in 3… 2… done.'], ['tuka', 'I lift his container onto your truck. You drive. Rani blocks the gate road.']),
    ck, { type: 'stealth', at: 'navimumbai:dock', guards: 4, alarmStars: 3, text: 'Get to Tuka’s crane without being seen' },
    { type: 'give', veh: 'truck' },
    { type: 'deliver', at: 'mumbai:garage', pursuers: 2, pursuerVeh: 'suv', time: 300, text: 'Drive the container out of the port', grabText: 'The King’s men took the truck back' }], { note: 'The Dock King’s cash reserve, and his yacht guest list.' }),
  K('dock', 9, 'DK-09', 'Yacht Party', 'mumbai:@Gateway of India', 'Showdown on the water', [
    talk(['tuka', 'The yacht is out past the Gateway. You go as party staff. White shirt, silver tray, big smile.']),
    { type: 'boat', at: 'mumbai:sea', text: 'Take the staff boat' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 150, speed: 18, text: 'The Dock King runs for it · catch his speedboat' },
    { type: 'goto', at: 'mumbai:dock', text: 'He jumped ashore · get after him' },
    { type: 'boss', at: 'mumbai:dock', name: 'The Dock King', flee: ['mumbai:@Gateway of India'], hp: 12, phases: 2, goons: 3, goonWeapons: ['pistol', 'knife'], phase2Weapon: 'pistol', phaseText: 'The Dock King’s bodyguards jump in!' },
    talk(['dockking', 'You think I am the top? Ha! Go ask the Highway…'], ['narrator', 'In his jacket, a folded page in Vikram’s handwriting. Ledger page 1.']),
    page('dock'), voice('If you found this page, you are braver than me. The containers were only the start. Follow the highway.')], { note: 'Ledger page 1. The West’s businesses and a port safehouse are yours.' }),

  /* ===================== KING 2 · THE FIXER (Delhi, UP) ===================== */
  K('fixer', 1, 'FX-01', 'Capital Arrival', 'delhi:station', 'Meet Kavya at India Gate', [
    talk(['narrator', 'Delhi. Wide roads, old walls, and a man who never touches a gun himself.']),
    { type: 'meet', at: 'delhi:@India Gate', who: 'kavya', text: 'Meet Kavya at India Gate' },
    talk(['kavya', 'Kavya. Journalist. I have chased the Fixer for six years. He sends crooked contracts, fake permits and nice men with ugly friends.'], ['kavya', 'His accountant takes cabs everywhere. Become a cab driver.'])], { note: 'The Fixer’s known contacts are marked.' }),
  K('fixer', 2, 'FX-02', 'Cab Cover', 'delhi:station', 'Drive cabs until the accountant books you', [
    talk(['kavya', 'Do a few cab rides. When he books you, take him where he asks, then follow him.']),
    { type: 'job', jobs: ['cab', 'auto'], n: 2, text: 'Do 2 cab or auto rides in Delhi', sub: 'Phone → Jobs' },
    ck, { type: 'tail', from: 'delhi:station', to: 'delhi:office', veh: 'sedan', speed: 10, text: 'The accountant took another car · tail it' }], { note: 'You know the accountant’s routine.' }),
  K('fixer', 3, 'FX-03', 'Chandni Chowk', 'delhi:market', 'Chase the runner through the lanes', [
    talk(['kavya', 'His runner has a document case. Crowds everywhere: no guns, hands only.']),
    ck, { type: 'boss', at: 'delhi:market', name: 'Runner', flee: ['delhi:landmarkB', 'delhi:landmarkC'], hp: 4, phases: 1, dmg: 4 }], { meleeOnly: true, note: 'The address of the fake-permit factory.' }),
  K('fixer', 4, 'FX-04', 'Permit Factory', 'noida:warehouse', 'Smash the fake-permit presses', [
    ck, { type: 'fight', at: 'noida:warehouse', n: 5, weapon: ['bat', 'pistol', 'knife'], hp: 3, text: 'Clear the guards at the print shop' },
    { type: 'stars', add: 2, why: 'Raid reported', text: 'The police are coming · get away' }], { note: 'Kavya has fake permit samples for her story.' }),
  K('fixer', 5, 'FX-05', 'Expressway', 'delhi:garage', 'Drive Kavya to Agra', [
    talk(['kavya', 'A whistleblower will only meet me near the Taj. The Fixer knows. Drive fast.']),
    ck, { type: 'deliver', at: 'agra:station', pursuers: 3, pursuerVeh: 'suv', time: 420, text: 'Drive Kavya to Agra', grabText: 'They forced you off the road' },
    { type: 'goto', at: 'agra:@Taj Mahal', text: 'Walk with Kavya to the viewpoint' },
    talk(['kavya', 'He gave me a tape. The Fixer’s voice, selling a contract. We have him.'])], { note: 'The whistleblower’s tape.' }),
  K('fixer', 6, 'FX-06', 'Crooked Badges', 'delhi:station', 'Escape a 4-star manhunt', [
    call(['meera', 'The Fixer framed you. Four stars, half of them on his payroll. Change your look, change your plates, then call me.']),
    ck, { type: 'stars', add: 4, why: 'Framed by the Fixer', text: 'Escape the manhunt', sub: 'Clothes shop, fake plates, respray, safehouse' },
    call(['meera', 'Good. I have the duty roster: every cop who chased you is on his list.'])], { note: 'Proof that some police are on his payroll.' }),
  K('fixer', 7, 'FX-07', 'River at Night', 'varanasi:station', 'Follow the money courier on the river', [
    talk(['kavya', 'His cash moves by boat at night, on the river. Stay in the dark and follow it.']),
    { type: 'boat', at: 'varanasi:sea', text: 'Take the boat' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 160, speed: 14, text: 'Stop the money boat' }], { note: 'The location of the vault.' }),
  K('fixer', 8, 'FX-08', 'The Vault', 'delhi:warehouse', 'Crack the farmhouse vault', [
    talk(['chotu', 'Gate is open.'], ['pehelwan', 'Guards are mine.'], ['rani', 'Engine running.']),
    ck, { type: 'stealth', at: 'delhi:warehouse', guards: 4, alarmStars: 3, text: 'Reach the vault and copy the blackmail files' },
    { type: 'fight', at: 'delhi:warehouse', n: 4, weapon: ['pistol', 'smg', 'bat'], hp: 3, allies: ['pehelwan'], text: 'Fight out of the farmhouse' },
    { type: 'deliver', at: 'delhi:safehouse', pursuers: 2, time: 300, text: 'Get the files to the safehouse' }], { note: 'The blackmail files. Kavya publishes after the Fixer falls.' }),
  K('fixer', 9, 'FX-09', 'The Last Deal', 'delhi:station', 'Stop the Fixer’s escape', [
    call(['kavya', 'He is driving to a private plane. If he flies, he is gone.']),
    ck, { type: 'chase', at: 'delhi:hw', to: 'gurugram:station', veh: 'limo', speed: 16, text: 'Stop the Fixer’s car before the airfield', stopText: 'His car is wrecked · he runs for the hangar' },
    { type: 'boss', at: 'gurugram:station', name: 'The Fixer', flee: ['gurugram:warehouse'], hp: 10, phases: 2, goons: 4, goonWeapons: ['pistol', 'smg'], phaseText: 'Bodyguards pour out of the hangar!' },
    talk(['fixer', 'I only fix things. Someone bigger breaks them.'], ['narrator', 'His briefcase holds ledger page 2.']),
    page('fixer'), voice('Delhi was where I first heard the word Sarkar. Nobody said it twice.')], { note: 'Ledger page 2. Delhi and UP businesses are yours.' }),

  /* ===================== KING 3 · THE HIGHWAY RAJA (North) ===================== */
  K('raja', 1, 'HR-01', 'Long Haul', 'delhi:hw', 'Vikram’s old route', [
    talk(['narrator', 'Vikram drove this road a hundred times. Now you do.']),
    { type: 'job', jobs: ['truck', 'driver', 'bus'], n: 1, text: 'Do one intercity or interstate run (truck, bus or car delivery)', sub: 'Phone → Jobs' },
    { type: 'meet', at: 'ludhiana:market', who: 'harleen', text: 'Stop at the highway dhaba in Ludhiana' },
    talk(['harleen', 'That photo… that is Vikram! He drove with me. Then the Raja’s men took my truck, and Vikram started asking questions.'], ['harleen', 'Same as you are now.'])], { note: 'Harleen knows the Raja’s roads.' }),
  K('raja', 2, 'HR-02', 'Fake Toll', 'ambala:hw', 'Smash the fake toll booth', [
    ck, { type: 'fight', at: 'ambala:hw', n: 4, weapon: ['bat', 'lathi', 'pistol'], hp: 3, text: 'Clear the fake toll booth' }], { note: 'The toll gang’s radio frequency.' }),
  K('raja', 3, 'HR-03', 'Tag Trail', 'chandigarh:station', 'Follow the fake-FASTag van', [
    ck, { type: 'tail', from: 'chandigarh:station', to: 'chandigarh:warehouse', veh: 'van', speed: 10, text: 'Tail the van handing out fake FASTags' }], { note: 'The van’s depot.' }),
  K('raja', 4, 'HR-04', 'Convoy', 'panipat:hw', 'Take back the stolen goods', [
    talk(['harleen', 'Ten trucks of stolen goods. Stop the front ones, I take the middle one.']),
    ck, { type: 'convoy', from: 'panipat:hw', to: 'karnal:station', n: 4, need: 3, veh: 'truck', speed: 12, text: 'Stop 3 of the convoy trucks' }], { izzat: 20, note: 'The goods went back to their owners.' }),
  K('raja', 5, 'HR-05', 'Hill Climb', 'chandigarh:garage', 'Carry the evidence up to Shimla', [
    ck, { type: 'deliver', at: 'shimla:market', pursuers: 3, pursuerVeh: 'sportsbike', time: 420, text: 'Carry Harleen’s evidence up to Shimla', grabText: 'The bikers grabbed the evidence' },
    talk(['narrator', 'A retired inspector reads the papers twice, then writes down one name: the Raja’s lieutenant.'])], { note: 'The Raja’s lieutenant is named.' }),
  K('raja', 6, 'HR-06', 'Dhaba Siege', 'ludhiana:market', 'Hold Harleen’s dhaba through the night', [
    ck, { type: 'defend', sites: ['ludhiana:market'], waves: 3, n: 4, weapon: ['bat', 'pistol', 'knife'], hp: 3, siteDmg: 1.5, allies: ['pehelwan'], text: 'Hold the dhaba' },
    talk(['harleen', 'Still standing. My truck is fixed too. I drive with you until the Raja falls.'])], { note: 'Harleen joins you for this arc.' }),
  K('raja', 7, 'HR-07', 'River Run', 'rishikesh:station', 'Catch the lieutenant on the river', [
    { type: 'boat', at: 'rishikesh:sea', text: 'Grab a speedboat on the river' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 160, speed: 16, text: 'Catch the lieutenant’s boat' }], { note: 'The code to the Raja’s toll fortress.' }),
  K('raja', 8, 'HR-08', 'Road to Leh', 'manali:hw', 'Stop the cash truck before Leh', [
    talk(['harleen', 'He is moving his war chest to Ladakh. The high road. Thin air, long drops.']),
    ck, { type: 'chase', at: 'manali:hw', to: 'leh:station', veh: 'truck', speed: 13, text: 'Stop the cash truck on the mountain road', stopText: 'The cash truck is yours' },
    voice('Harleen, if I don’t come back, tell my sibling. Tell them not to come looking.')], { note: 'The Raja’s war chest.' }),
  K('raja', 9, 'HR-09', 'Last Toll', 'leh:hw', 'Storm the toll fortress', [
    ck, { type: 'fight', at: 'leh:hw', n: 5, weapon: ['pistol', 'smg', 'bat'], hp: 3, allies: ['pehelwan'], text: 'Break through the toll plaza' },
    { type: 'boss', at: 'leh:hw', name: 'The Highway Raja', flee: ['leh:station'], hp: 12, phases: 2, goons: 3, goonWeapons: ['smg', 'pistol'], phase2Weapon: 'smg' },
    talk(['raja', 'Vikram’s truck was ordered off the road. Not by me. By the one who sends us all orders.'], ['narrator', 'Ledger page 3, folded inside a fake FASTag.']),
    page('raja'), voice('The orders always came from the same garage phone. I thought it was a mistake.')], { note: 'Ledger page 3. The North’s businesses and a Leh safehouse are yours.' }),

  /* ===================== KING 4 · THE DESERT FOX (Rajasthan, MP, Chhattisgarh) ===================== */
  K('fox', 1, 'DF-01', 'Pink City', 'jaipur:station', 'Meet Kesar at the palace museum', [
    { type: 'meet', at: 'jaipur:landmarkA', who: 'kesar', text: 'Meet Kesar at the museum' },
    talk(['kesar', 'Look at these empty cases. A bronze dancer, a jade dagger, a painted door. All gone, all in one year.'], ['kesar', 'The Desert Fox steals history and sells it to people who keep it in bathrooms.'])], { note: 'The list of stolen pieces.' }),
  K('fox', 2, 'DF-02', 'Bazaar Trail', 'jaipur:market', 'Follow the fence through the bazaar', [
    ck, { type: 'tail', from: 'jaipur:market', to: 'jaipur:printing', veh: 'auto', speed: 8, min: 8, max: 60, text: 'Follow the fence’s auto without being seen' }], { note: 'The fence’s shop is marked.' }),
  K('fox', 3, 'DF-03', 'Fort Night', 'jaipur:warehouse', 'Photograph the thieves', [
    ck, { type: 'stealth', at: 'jaipur:warehouse', guards: 4, alarmStars: 2, text: 'Sneak past the torches and photograph the crates' },
    { type: 'stars', text: 'Get away clean' }], { note: 'The thieves’ route to the west.' }),
  K('fox', 4, 'DF-04', 'Royal Disguise', 'jaipur:landmarkB', 'Swap the statue', [
    talk(['babu', 'One tourist outfit, one camera, one perfect fake statue. Swap it and smile.']),
    ck, { type: 'stealth', at: 'jaipur:landmarkB', guards: 3, alarmStars: 2, text: 'Join the tourists and swap the statue' }], { note: 'The first statue is back with Kesar.' }),
  K('fox', 5, 'DF-05', 'Lake City', 'udaipur:station', 'Boat chase on the lake', [
    { type: 'boat', at: 'udaipur:sea', text: 'Take a boat on the lake' },
    ck, { type: 'waterchase', mode: 'catch', n: 1, time: 150, speed: 15, text: 'Stop the fence’s boat before the far shore' }], { note: 'The caravan schedule.' }),
  K('fox', 6, 'DF-06', 'Sandstorm', 'jaisalmer:hw', 'Lose the Fox’s riders', [
    talk(['narrator', 'The horizon goes brown. Then it comes at you.']),
    ck, { type: 'deliver', at: 'jaisalmer:safehouse', pursuers: 3, pursuerVeh: 'pickup', time: 300, text: 'Get through the storm to a safehouse', grabText: 'The riders caught you' }], { note: 'A desert safehouse is yours.' }),
  K('fox', 7, 'DF-07', 'Caravan', 'jaisalmer:hw', 'Stop the caravan', [
    ck, { type: 'convoy', from: 'jaisalmer:hw', to: 'barmer:station', n: 3, need: 2, veh: 'pickup', speed: 11, text: 'Stop the caravan’s jeeps' }], { note: 'The crates are back, and the fort’s back entrance is known.' }),
  K('fox', 8, 'DF-08', 'Reserve Road', 'umaria:station', 'Photograph the buyers in the tiger reserve', [
    talk(['kesar', 'The buyers meet on a back road in the reserve. Go as a safari driver. Quietly: loud engines near the tigers and the deal is off.']),
    ck, { type: 'stealth', at: 'umaria:hw', guards: 3, alarmStars: 1, text: 'Photograph the handoff' }], { note: 'The buyers are identified.' }),
  K('fox', 9, 'DF-09', 'Golden Fort', 'jaisalmer:station', 'Sunset duel at the fort hotel', [
    ck, { type: 'stealth', at: 'jaisalmer:warehouse', guards: 4, alarmStars: 3, text: 'Slip in by the back entrance during the dinner show' },
    { type: 'boss', at: 'jaisalmer:rooftop', name: 'The Desert Fox', flee: ['jaisalmer:landmarkA'], hp: 13, phases: 3, goons: 3, goonWeapons: ['knife', 'smg'], phaseText: 'The Fox calls his guards!' },
    talk(['fox', 'Every treasure I took went to one buyer. He never pays in cash. He pays in favours.'], ['narrator', 'Ledger page 4, tucked in a stolen book of poems.']),
    page('fox'), voice('A kind old man helped me with my papers once. I wish I had not let him.')], { note: 'Ledger page 4. Rajasthan and central India are yours.' })
  );
})();
