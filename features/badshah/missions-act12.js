// Badshah story mode · Act 1 (Kamaai, The Hustle) and Act 2 (Ilaaka, The Turf). Beta v2.03.00.
// Places in {braces} are the home city's story anchors (features/badshah/engine.js). All characters are fictional.
window.BADSHAH = window.BADSHAH || { missions: [] };
window.BADSHAH.missions.push(
  /* ======================= ACT 1 · KAMAAI (THE HUSTLE) · Easy ======================= */
  { id: 'A1-01', title: 'Night Train', start: 'station', blurb: 'Arrive in the city', reward: { cash: 0, izzat: 5, note: 'Master-ji’s garage is your home now. Your cycle is parked outside.' }, steps: [
    { type: 'talk', lines: [['narrator', 'Midnight. The night train hisses into {city}. You have ₹500, a bag, and your brother Vikram’s old phone.'], ['narrator', 'The phone buzzes. Unknown number.']] },
    { type: 'call', lines: [['byaaj', 'Hello hello! Vikram’s little one, na? Welcome to {city}!'], ['byaaj', 'Your brother borrowed money from me. {debt}. Plus interest, plus my feelings.'], ['you', 'Vikram is dead.'], ['byaaj', 'Arre, the debt is very much alive! Pay it, slowly slowly. I am a reasonable man. Mostly.'], ['byaaj', 'Go to the old garage near the station. Master-ji knew your brother.']] },
    { type: 'goto', at: 'garage', text: 'Walk to {garage}', sub: 'Follow the marker' },
    { type: 'talk', lines: [['master', 'Vikram’s sibling? Same stubborn face. Come, come. Sit.'], ['master', 'Your brother drove for me sometimes. Good boy. Asked too many questions.'], ['master', 'You can sleep in the back room. And you will work. Everybody works here.'], ['master', 'Take that old cycle outside. Tomorrow you start earning.']] },
    { type: 'give', veh: 'cycle', flags: ['garage'] }] },
  { id: 'A1-02', title: 'First Delivery', start: 'garage', blurb: '3 food deliveries by cycle', reward: { cash: 2000, izzat: 5, note: 'Your first honest rupees in {city}.' }, steps: [
    { type: 'talk', lines: [['master', 'Phone out. I put a delivery app on it. Swiggy, Zomato, whatever pings first.'], ['master', 'Three deliveries on the cycle. Hot food, happy customer, small tip. Go!']] },
    { type: 'job', jobs: ['delivery', 'zomato'], n: 3, text: 'Do 3 food deliveries', sub: 'Phone → Jobs → Swiggy or Zomato (on your cycle)' },
    { type: 'call', lines: [['master', 'Three! Not bad. Your brother dropped two dosas on his first day.']] }] },
  { id: 'A1-03', title: 'Licence Raj', start: 'garage', blurb: 'The two-wheeler test at the RTO', reward: { cash: 1500, izzat: 5, note: 'Scooter delivery jobs are open to you now.' }, steps: [
    { type: 'talk', lines: [['master', 'A cycle is good for the legs, bad for the wallet. Get a two-wheeler licence.'], ['master', 'Take my scooter to the RTO. Cones, signals, the figure 8. Do not hit my mirrors.']] },
    { type: 'give', veh: 'scooter' },
    { type: 'lic', k: 'two', text: 'Pass the two-wheeler test at {rto}' },
    { type: 'call', lines: [['master', 'Licence! Paste it on the fridge. No, keep it. The police like it more than I do.']] }] },
  { id: 'A1-04', title: 'Interest Day', start: 'garage', nextDay: true, blurb: 'Pay ₹5,000 interest by 18:00', reward: { cash: 0, izzat: 5, note: 'Tip: cash in your pocket can be dropped if you are knocked out. Money in the bank is safe.' }, steps: [
    { type: 'call', lines: [['byaaj', 'Good morning, my favourite customer! Interest day today. ₹5,000. Bring it to the bazaar.'], ['byaaj', 'Before 18:00 Bay time, ha. After that my boys come to say hello. With their hands.']] },
    { type: 'cash', amt: 5000, text: 'Get ₹5,000 together', sub: '' },
    { type: 'pay', at: 'market', amt: 5000, debt: true, byHour: 18, late: 'late', text: 'Hand ₹5,000 to Byaaj Bhai’s man at {market}' },
    { type: 'talk', lines: [['goon', 'Correct amount. Byaaj Bhai says thank you. Next time, bring a little extra for chai.'], ['narrator', 'Keep your savings in the bank: if you are knocked out, half of the cash in your pocket falls on the street.']] },
    { type: 'goto', at: 'garage', text: 'Head back to the garage', label: 'end' },
    { type: 'end' },
    { type: 'checkpoint', label: 'late' },
    { type: 'talk', lines: [['goon', 'Eighteen hundred hours! Byaaj Bhai is very sad. When he is sad, we are sad.']] },
    { type: 'fight', at: 'market', n: 2, weapon: 'fist', hp: 3, text: 'Byaaj Bhai’s boys are here · fight them off' },
    { type: 'pay', at: 'market', amt: 5000, debt: true, text: 'Now pay the ₹5,000 at {market}' }] },
  { id: 'A1-05', title: 'Vikram’s Voice', start: 'garage', blurb: 'Three places from Vikram’s voice note', reward: { cash: 3000, izzat: 10, note: 'Diary pages 1–3: Vikram wrote about a smuggling route on the highway.' }, steps: [
    { type: 'talk', lines: [['master', 'I fixed your brother’s phone. Battery was dead. Like… never mind. Listen to it.']] },
    { type: 'call', lines: [['vikram', 'If you are hearing this, I am in trouble. I hid my diary pages where nobody looks.'], ['vikram', 'One at {landmarkA}. One at {landmarkB}. One at {landmarkC}. Behind the shop signs. Be careful who you trust.']] },
    { type: 'goto', at: 'landmarkA', text: 'Find the first diary page at {landmarkA}' },
    { type: 'talk', lines: [['narrator', 'Behind a faded sign: a folded page. “Trucks on the night highway. No papers. Same nine nicknames on every load.”']] },
    { type: 'goto', at: 'landmarkB', text: 'Find the second page at {landmarkB}' },
    { type: 'talk', lines: [['narrator', 'Page two: “They don’t steal from the highway. They own it.”']] },
    { type: 'goto', at: 'landmarkC', text: 'Find the third page at {landmarkC}' },
    { type: 'talk', lines: [['narrator', 'Page three is torn. Only one line is left: “If I don’t come back, start with Byaaj.”']] }] },
  { id: 'A1-06', title: 'Auto Raja', start: 'garage', nextDay: true, blurb: 'Auto licence and 5 rides', reward: { cash: 3000, izzat: 10, note: 'Rani’s number is in your phone. She drives like the road owes her money.' }, steps: [
    { type: 'talk', lines: [['master', 'The auto pays better than the cycle. Get the auto licence, then drive.'], ['master', 'Five rides. Meter down, no arguments, no detours. Mostly.']] },
    { type: 'give', veh: 'auto' },
    { type: 'lic', k: 'three', text: 'Pass the auto rickshaw test at {rto}' },
    { type: 'job', jobs: ['auto'], n: 5, text: 'Give 5 auto rides', sub: 'Phone → Jobs → Auto taxi' },
    { type: 'call', lines: [['rani', 'Oi, auto-wala. You took the long way to my stop. Twice.'], ['rani', 'Race me to {market}. If you win, I tip. If you lose, you pay.']] },
    { type: 'race', from: 'garage', to: 'market', rival: 'rani', rivalVeh: 'scooter', rivalPace: .62, text: 'Race Rani to {market}' },
    { type: 'talk', lines: [['rani', 'Hmm. You can drive. I let you win, obviously.'], ['rani', 'Save my number. One day you will need a getaway driver.']] }] },
  { id: 'A1-07', title: 'Wheels', start: 'garage', nextDay: true, blurb: 'Buy a used car and fix it', reward: { cash: 0, izzat: 10, note: 'You have your own car. Master-ji vouched for your car licence.' }, steps: [
    { type: 'talk', lines: [['master', 'Time for four wheels. I spoke to the showroom. Small discount, big dent.'], ['master', 'I also spoke to the RTO. You have the car licence now. Don’t make me regret it.']] },
    { type: 'give', lic: ['lmv'] },
    { type: 'buy', types: ['car', 'sedan', 'suv', 'mpv', 'taxi'], dent: 70, text: 'Buy a car at {showroom} (a hatchback is about ₹45,000)' },
    { type: 'repair', text: 'Get the dent fixed at {mechanic}' },
    { type: 'call', lines: [['master', 'Fixed? Good. Petrol, tyres, insurance: a car eats money. Feed it with jobs.']] }] },
  { id: 'A1-08', title: 'Goons at the Garage', start: 'garage', blurb: 'Defend the garage, then lose the police', reward: { cash: 5000, izzat: 15, note: 'You kept the cricket bat. Bins and haystacks are good places to hide.' }, steps: [
    { type: 'talk', lines: [['narrator', 'Glass breaks. Three men with sticks are smashing Master-ji’s tools.'], ['goon', 'Byaaj Bhai says: faster payments, or slower garage!'], ['master', 'Take the bat. Under the counter. GO!']] },
    { type: 'give', weapons: ['bat'] },
    { type: 'checkpoint' },
    { type: 'fight', at: 'garage', n: 3, weapon: ['fist', 'bat', 'fist'], hp: 3, text: 'Defend the garage · beat the 3 goons', sub: 'Switch to the bat with Q' },
    { type: 'stars', add: 1, why: 'Fight reported', text: 'Someone called the police · lose them', sub: 'Get out of sight, then hide in a garbage bin (E)' },
    { type: 'talk', lines: [['master', 'You hid in a bin? Smart. Smelly, but smart.']] }] },
  { id: 'A1-09', title: 'The Final Payment', start: 'garage', nextDay: true, blurb: 'Clear Vikram’s debt', reward: { cash: 10000, izzat: 20, note: 'The debt is cleared. Byaaj Bhai is scared of you now.' }, steps: [
    { type: 'call', lines: [['byaaj', 'Final payment day, ha? Bring everything that is left to my office.'], ['byaaj', 'And… be careful. Somebody else heard you are carrying a lot of cash.']] },
    { type: 'cash', amt: 'debtLeft', text: 'Have everything that is left ({left})', sub: 'Pay in parts any time: Phone → Badshah → Pay' },
    { type: 'checkpoint' },
    { type: 'talk', lines: [['master', 'Take the car. Don’t stop for anybody. Rani is around if you need her.']] },
    { type: 'deliver', at: 'office', pursuers: 2, time: 300, text: 'Drive the money bag to {office}', grabText: 'They boxed you in and took the bag' },
    { type: 'pay', at: 'office', amt: 'debt', debt: true, text: 'Hand the money to Byaaj Bhai' },
    { type: 'talk', lines: [['byaaj', 'Full and final! Wah. Your brother would be proud. Or worried. Probably both.']] }] },
  { id: 'A1-10', title: 'The Diary', start: 'office', nextDay: true, blurb: 'What Byaaj Bhai knows', reward: { cash: 0, izzat: 20, note: 'Byaaj Bhai keeps your books now. Act 2 begins: take back {city}.' }, steps: [
    { type: 'talk', lines: [['byaaj', 'Sit, sit. Close the door. I… I must tell you something.'], ['byaaj', 'I don’t own this city. I just collect. For The Collector.'], ['you', 'Who does The Collector work for?'], ['byaaj', 'Nine bosses. They split India like a cake. The Navratna. Vikram found their highway route.'], ['narrator', 'Inside the last diary page, nine nicknames. And one line in Vikram’s hand: “They own the highways.”'], ['byaaj', 'Look… I am good with numbers. Bad with courage. Let me keep your books. Every boss needs an accountant.']] },
    { type: 'give', crew: ['byaaj'], flags: ['act2'] }] },
  /* ======================= ACT 2 · ILAAKA (THE TURF) · Moderate ======================= */
  { id: 'A2-01', title: 'Front Door', start: 'garage', nextDay: true, after: ['A1-10'], slack: 1.25, blurb: 'Open a business', reward: { cash: 20000, izzat: 15, note: 'Your business earns every day. Collect it in Phone → Business.' }, steps: [
    { type: 'call', lines: [['byaaj', 'Lesson one in being a boss: a clean front door. A chai stall, a dhaba, something people see.'], ['byaaj', 'You will need about ₹50,000. Then open it where people walk.']] },
    { type: 'cash', amt: 50000, text: 'Save ₹50,000 for a business' },
    { type: 'biz', text: 'Open a chai stall or a dhaba (Phone → Business)' }] },
  { id: 'A2-02', title: 'The Hacker', start: 'garage', slack: 1.25, blurb: 'Rescue Chotu', reward: { cash: 25000, izzat: 20, note: 'Chotu joined your crew.' }, steps: [
    { type: 'call', lines: [['byaaj', 'There is a boy at the {cafe}. He hacked The Collector’s phones for fun. Now they are breaking his fingers for fun.']] },
    { type: 'goto', at: 'cafe', text: 'Get to the {cafe}' },
    { type: 'checkpoint' },
    { type: 'fight', at: 'cafe', n: 5, weapon: ['fist', 'bat', 'knife', 'bat', 'fist'], hp: 4, dmg: 6, text: 'Clear the 5 goons' },
    { type: 'talk', lines: [['chotu', 'Bhai! Thank you! I only changed their ringtones to old Bollywood songs. And read their messages. A little.'], ['you', 'Come with me.']] },
    { type: 'follow', who: 'chotu', at: 'garage', text: 'Take Chotu to safety at {garage}' },
    { type: 'give', crew: ['chotu'], flags: ['enemyMap'] },
    { type: 'talk', lines: [['chotu', 'I put a little something on your phone. When The Collector’s boys gather, you’ll know.']] }] },
  { id: 'A2-03', title: 'Akhada', start: 'akhada', nextDay: true, slack: 1.25, blurb: 'A bout with Pehelwan', reward: { cash: 20000, izzat: 20, note: 'Pehelwan joined your crew. Your punches hit 10% harder.' }, steps: [
    { type: 'talk', lines: [['pehelwan', 'You are the one who beat Byaaj Bhai’s boys? With a cricket bat? Hmph.'], ['pehelwan', 'Here, we use our hands. Three rounds. Win two, and I walk with you.']] },
    { type: 'bout', at: 'akhada', name: 'Pehelwan', hp: 7, dmg: 6 },
    { type: 'talk', lines: [['pehelwan', 'Ha! Good hands. Bad footwork. I will fix your footwork. You will fix my boredom.']] },
    { type: 'give', crew: ['pehelwan'], flags: ['pehelwan'] }] },
  { id: 'A2-04', title: 'Street Kings', start: 'garage', slack: 1.25, blurb: 'Night races against The Collector’s racers', reward: { cash: 30000, izzat: 20, note: 'Rani joined your crew as the getaway driver.' }, steps: [
    { type: 'call', lines: [['rani', 'Remember me? The Collector’s boys race on our streets every night. Three races. Beat them twice, I am yours.']] },
    { type: 'race', from: 'garage', to: 'market', rival: 'Collector’s racer', rivalVeh: 'sportsbike', rivalPace: .72, text: 'Race 1 · to {market}' },
    { type: 'checkpoint' },
    { type: 'race', from: 'market', to: 'station', rival: 'Collector’s racer', rivalVeh: 'sports', rivalPace: .72, text: 'Race 2 · to {station}' },
    { type: 'talk', lines: [['rani', 'Two wins! Okay, okay. I said I am yours. As a driver. Don’t get ideas.']] },
    { type: 'give', crew: ['rani'] }] },
  { id: 'A2-05', title: 'Secret App', start: 'chotu', nextDay: true, slack: 1.25, blurb: 'Chotu’s present', reward: { cash: 10000, izzat: 10, note: 'The secret phone app is on your phone: safehouses, scanner, fake plates and more.' }, steps: [
    { type: 'talk', lines: [['chotu', 'Give me your phone. Don’t look. Okay, look.'], ['chotu', 'Bay Underground. Safehouses, a police scanner, a guy who sells things from his scooter. Don’t ask.']] },
    { type: 'unlock', what: 'underground' },
    { type: 'goto', at: 'safehouse', text: 'Check out your first safehouse at {safehouse}' }] },
  { id: 'A2-06', title: 'Protection', start: 'market', slack: 1.25, blurb: 'Free three shops from extortion', reward: { cash: 40000, izzat: 25, note: 'The shopkeepers of {market} pay you a small cut now.' }, steps: [
    { type: 'talk', lines: [['shop', 'Every week the Collector’s men take half our earnings. Three shops are being squeezed right now.'], ['you', 'Not anymore.']] },
    { type: 'defend', sites: ['shops.0', 'shops.1', 'shops.2'], sequential: true, waves: 1, n: 3, weapon: ['bat', 'knife', 'fist'], hp: 3, siteDmg: 1.2, text: 'Drive the collectors off before they wreck the shop' },
    { type: 'give', flags: ['protection'] }] },
  { id: 'A2-07', title: 'Paper Trail', start: 'garage', slack: 1.25, blurb: 'Photograph The Collector’s ledger', reward: { cash: 30000, izzat: 20, note: 'You have photos of The Collector’s ledger.' }, steps: [
    { type: 'call', lines: [['chotu', 'I killed the cameras at {warehouse} for ten minutes. Get in, photograph the ledger on the table, get out. Stay out of the torch beams.']] },
    { type: 'goto', at: 'warehouse', r: 30, text: 'Get close to {warehouse}' },
    { type: 'checkpoint' },
    { type: 'stealth', at: 'warehouse', guards: 3, alarmStars: 2, text: 'Sneak in and photograph the ledger' },
    { type: 'stars', text: 'Get away clean', sub: 'Lose any police that came' }] },
  { id: 'A2-08', title: 'Meera', start: 'garage', nextDay: true, slack: 1.25, blurb: 'Inspector Meera Joshi', reward: { cash: 20000, izzat: 15, note: 'Inspector Meera Joshi’s number is in your phone.' }, steps: [
    { type: 'talk', lines: [['meera', 'Inspector Meera Joshi. You’re the one going around with a camera and a cricket bat.'], ['meera', 'Hands where I can see them— oh, you’re running. Of course you are.']] },
    { type: 'stars', add: 3, why: 'Inspector Meera Joshi', text: 'Escape Meera’s 3-star chase', sub: 'Safehouses, bins, a change of clothes, a respray' },
    { type: 'call', lines: [['meera', 'Nice escape. Listen. I don’t want you. I want who you are chasing.'], ['meera', 'Keep my number. And stop hiding in bins, people complain.']] }] },
  { id: 'A2-09', title: 'Burnt', start: 'bizsite', nextDay: true, slack: 1.25, blurb: 'Rebuild, then take the supply truck', reward: { cash: 60000, izzat: 25, note: 'Your business is rebuilt and The Collector lost a truck full of stock.' }, steps: [
    { type: 'talk', lines: [['narrator', 'Smoke. Your business is a black shell. A note is pinned to the door: “Stay small.”'], ['byaaj', 'Rebuilding costs ₹30,000. I already did the maths. I always do the maths.']] },
    { type: 'cashpay', amt: 30000, what: 'rebuilding', text: 'Pay ₹30,000 to rebuild' },
    { type: 'call', lines: [['chotu', 'The Collector’s supply truck is leaving town right now. Stop it, bring it to the garage.']] },
    { type: 'checkpoint' },
    { type: 'goto', at: 'highway', r: 60, text: 'Get to the highway outside town' },
    { type: 'chase', at: 'highway', to: 'station', veh: 'truck', speed: 13, text: 'Stop The Collector’s supply truck', stopText: 'The truck is stopped · the driver ran' },
    { type: 'goto', at: 'garage', text: 'Drive the truck to {garage}', veh: ['truck'] }] },
  { id: 'A2-10', title: 'Babu', start: 'printing', slack: 1.25, blurb: 'Recruit the forger', reward: { cash: 20000, izzat: 15, note: 'Babu joined your crew: fake plates and a free respray when you need them.' }, steps: [
    { type: 'talk', lines: [['babu', 'Documents, number plates, wedding cards. All original. Original fakes.'], ['babu', 'Do two little drop-offs for me and I am your man.']] },
    { type: 'goto', at: 'station', time: 160, text: 'Drop-off 1 · {station}' },
    { type: 'goto', at: 'bank', time: 160, text: 'Drop-off 2 · {bank}' },
    { type: 'give', crew: ['babu'], flags: ['fakeplates'] }] },
  { id: 'A2-11', title: 'Siege', start: 'garage', nextDay: true, slack: 1.25, blurb: 'Three places attacked at once', reward: { cash: 100000, izzat: 30, note: 'A second safehouse is yours.' }, steps: [
    { type: 'call', lines: [['chotu', 'Bhai! They are hitting the garage, your business and the bazaar. All at once!'], ['pehelwan', 'I take the business.'], ['rani', 'Bazaar is mine.'], ['master', 'And the old man needs his garage. Please.']] },
    { type: 'checkpoint' },
    { type: 'defend', sites: ['garage', 'bizsite', 'market'], allyHeld: true, waves: 3, n: 4, weapon: ['bat', 'knife', 'pistol', 'bat'], hp: 4, siteDmg: 1.5, allies: ['pehelwan'], text: 'Hold {garage} through 3 waves' },
    { type: 'talk', lines: [['rani', 'Bazaar is clear.'], ['pehelwan', 'Business is still standing. I am a little bit on fire, but fine.']] }] },
  { id: 'A2-12', title: 'Collector’s Fall', start: 'warehouse', nextDay: true, slack: 1.25, blurb: 'Take {city} back', reward: { cash: 200000, izzat: 50, note: '{city} is yours. The story continues with the eight kings in the next updates.' }, steps: [
    { type: 'talk', lines: [['collector', 'You. The cycle delivery boy. You took my shops, my truck, my patience.'], ['collector', 'Catch me if you can.']] },
    { type: 'checkpoint' },
    { type: 'boss', at: 'warehouse', name: 'The Collector', flee: ['market', 'rooftop'], hp: 10, phases: 2, goons: 3, goonWeapons: ['bat', 'knife', 'pistol'], phase2Weapon: 'pistol', dmg: 7, phaseText: 'The Collector pulls a gun and calls his men!' },
    { type: 'talk', lines: [['collector', 'Enough… enough. You think I matter? I am a clerk with a gun.'], ['collector', 'Your brother knew too much about the highway route. The king of this region will finish what he started.'], ['meera', 'I’ll take him from here. Nice work. Off the record.']] },
    { type: 'give', flags: ['homeCityWon'] }] }
);
// amounts that depend on the debt
for (const m of window.BADSHAH.missions) for (const s of m.steps) if (s.amt === 'debtLeft') s.debtLeft = true;
