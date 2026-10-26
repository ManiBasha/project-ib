// Badshah · the interludes (home city) and Act 4 · Raj (The Rule). Beta v2.04.00. All characters are fictional.
(function () {
  const B = window.BADSHAH = window.BADSHAH || { missions: [] };
  const talk = (...lines) => ({ type: 'talk', lines }), call = (...lines) => ({ type: 'call', lines }), ck = { type: 'checkpoint' };
  B.missions.push(
  /* ===================== INTERLUDES ===================== */
  { id: 'I-1', arc: 'i', title: 'Master-ji Taken', start: 'garage', nextDay: true, blurb: 'The garage is wrecked and Master-ji is gone', reward: { izzat: 30, note: 'Master-ji is safe. He upgraded all your vehicles for free.' }, steps: [
    talk(['narrator', 'Home. The garage door hangs off one hinge. Tools everywhere. Master-ji’s chair is on its side.'], ['chotu', 'His phone is at the old Collector warehouse. Bhai… there are a lot of them.']),
    ck, { type: 'fight', at: 'warehouse', n: 8, weapon: ['pistol', 'smg', 'knife', 'bat'], hp: 3, allies: ['pehelwan'], text: 'Clear the warehouse' },
    talk(['master', 'Beta! You came. I knew you would come. My knees, my knees…']),
    ck, { type: 'follow', who: 'master', at: 'safehouse', col: '#f2c14e', text: 'Get Master-ji to the safehouse' },
    talk(['master', 'You are a good child. Better than me. Better than all of them.'], ['narrator', 'He holds your hand a little too long. You don’t notice. Not yet.']),
    { type: 'give', flags: ['masterSaved'] }] },
  { id: 'I-2', arc: 'i', title: 'The Old File', start: 'cafe', nextDay: true, blurb: 'Meera has something to show you', reward: { izzat: 20, note: 'You found a locked steel box in the garage cellar. It does not open. Yet.' }, steps: [
    { type: 'meet', at: 'cafe', who: 'meera', col: '#5fb4ff', text: 'Meet Meera at the café' },
    talk(['meera', 'I am with the national crime bureau now. Look at this photo. Twenty years old. Nine men at a wedding.'], ['meera', 'The one on the left. Younger, more hair. Holding a spanner even at a wedding.'], ['you', 'That… looks like Master-ji. It can’t be.'], ['meera', 'Then prove me wrong. His cellar. Tonight. He goes to a wedding in the next town tonight. His night guard stays.']),
    ck, { type: 'stealth', at: 'garage', guards: 1, alarmStars: 0, text: 'Search the cellar without his night guard seeing you' },
    talk(['narrator', 'Under a tarpaulin: a steel box with an old lock. It won’t open. You put it back exactly where it was.']),
    { type: 'give', flags: ['doubt'] }] },
  /* ===================== ACT 4 · RAJ (THE RULE) ===================== */
  { id: 'F-01', arc: 'final', n: 1, title: 'Eight Pages', start: 'safehouse', nextDay: true, blurb: 'Lay the eight pages together', reward: { izzat: 40, note: 'The pages make a sea chart: Sagar Mahal, an island fortress in the Andaman Sea.' }, steps: [
    talk(['chotu', 'Eight pages. Turn this one. And this one. Bhai… it’s a sea chart.'], ['narrator', 'The torn edges fit like a puzzle: an island, a lighthouse, a name. Sagar Mahal.']),
    call(['vikram', 'This is my last note. If something happens to me, the man behind it all is—'], ['narrator', 'The recording ends.']),
    { type: 'give', flags: ['chart'] }] },
  { id: 'F-02', arc: 'final', n: 2, title: 'The Box', start: 'garage', blurb: 'Open the steel box', reward: { izzat: 50, note: 'Master-ji is Sarkar. He is your enemy now.' }, steps: [
    talk(['narrator', 'The Backwater Boss had a key on a string around his neck. It fits.'], ['narrator', 'Inside: Vikram’s last delivery note, signed for by Master-ji. And a memory card.']),
    call(['vikram', 'Don’t trust Master-ji. He is Sarkar. He sent me on that route, and he is sending someone to stop me.']),
    talk(['master', 'So. You found it.'], ['master', 'Your brother refused to replace the kings. You did not. You did everything I wanted, beta. Every king I could not control.'], ['master', 'Now it is all mine again. Thank you.'], ['narrator', 'He walks out. His men block the door.']),
    ck, { type: 'fight', at: 'garage', n: 6, weapon: ['pistol', 'smg', 'knife'], hp: 3, text: 'Fight your way out of the garage' },
    { type: 'give', flags: ['masterHostile'] }] },
  { id: 'F-03', arc: 'final', n: 3, title: 'Empire Under Fire', start: 'safehouse', nextDay: true, blurb: 'Sarkar hits two regions at once', reward: { izzat: 60, note: 'Your income is back, and Meera joins you openly.' }, steps: [
    call(['byaaj', 'Bhai! Sarkar froze the accounts and his men are hitting your businesses in two regions!'], ['rani', 'Plane is waiting. One region, then the next.']),
    { type: 'travel', to: 'mumbai:market', big: '✈ FLIGHT', text: 'Flying to the West' },
    ck, { type: 'defend', sites: ['mumbai:market'], waves: 2, n: 5, weapon: ['pistol', 'smg', 'bat'], hp: 3, siteDmg: 1.4, allies: ['pehelwan'], text: 'Defend your businesses in Mumbai' },
    { type: 'travel', to: 'kolkata:market', big: '✈ FLIGHT', text: 'Flying to the East' },
    ck, { type: 'defend', sites: ['kolkata:market'], waves: 2, n: 5, weapon: ['pistol', 'smg', 'knife'], hp: 3, siteDmg: 1.4, allies: ['pehelwan'], text: 'Defend your businesses in Kolkata' },
    call(['meera', 'No more off the record. I am with you, officially. Let’s finish this.'])] },
  { id: 'F-04', arc: 'final', n: 4, title: 'The Gathering', start: 'chennai:dock', nextDay: true, blurb: 'Call every ally to Chennai port', reward: { izzat: 60, note: 'Your finale crew is ready.' }, steps: [
    call(['tuka', 'Boats from Mumbai, coming round the coast.'], ['kavya', 'I’m bringing the files and two cameras.'], ['harleen', 'Trucks are loaded with fuel.'], ['kesar', 'Old maps of the islands, from the palace archive.'], ['ananya', 'Medics and real medicine.'], ['jonali', 'My rangers know boats.'], ['sana', 'His radio, his cameras, his lights: mine.'], ['meenakshi', 'Twenty paddlers who have waited a year for this.']),
    { type: 'goto', at: 'chennai:dock', text: 'Meet everyone at Chennai port' },
    talk(['master', '(on the radio) Come then, beta. I built that island for you, you know.'])] },
  { id: 'F-05', arc: 'final', n: 5, title: 'Crossing', start: 'chennai:dock', blurb: 'Sail to the Andaman Sea', reward: { izzat: 60, note: 'The fleet reached the islands.' }, steps: [
    { type: 'travel', to: 'portblair:dock', big: '⛴ THE CROSSING', text: 'Days at sea. The islands appear at dawn.' },
    { type: 'boat', at: 'portblair:sea', text: 'Take the lead speedboat' },
    ck, { type: 'waterchase', mode: 'escape', n: 3, time: 120, speed: 22, text: 'Protect the ferry · drive off Sarkar’s speedboats' },
    { type: 'waterchase', mode: 'catch', n: 2, time: 150, speed: 18, text: 'Sink the last two attack boats' }] },
  { id: 'F-06', arc: 'final', n: 6, title: 'Beachhead', start: 'portblair:dock', nextDay: true, blurb: 'Open the fortress gate', reward: { izzat: 60, note: 'The gate of Sagar Mahal is open.' }, steps: [
    { type: 'fortress', at: 'portblair:dock' },
    { type: 'choice', title: 'How do you take the beach?', flag: 'beach', options: [{ id: 'loud', label: '💥 Loud', sub: 'Pehelwan and the allies charge the beach with you' }, { id: 'quiet', label: '🤫 Quiet', sub: 'Chotu cuts the power, you slip past the guards' }] },
    ck, { type: 'fight', at: 'portblair:dock', n: 6, weapon: ['smg', 'rifle', 'pistol'], hp: 3, allies: ['pehelwan'], text: 'Take the beach defences' },
    { type: 'stealth', at: 'portblair:warehouse', guards: 3, alarmStars: 0, text: 'Reach the gate controls' }] },
  { id: 'F-07', arc: 'final', n: 7, title: 'Sagar Mahal', start: 'portblair:dock', nextDay: true, blurb: 'The final fight', reward: { izzat: 100, note: 'Master-ji is beaten.' }, steps: [
    { type: 'fortress', at: 'portblair:dock' },
    ck, { type: 'fight', at: 'portblair:dock', n: 8, weapon: ['smg', 'rifle', 'pistol', 'knife'], hp: 4, allies: ['pehelwan'], text: 'Courtyard battle · fight with your allies' },
    talk(['master', 'Look at you. I taught you to fix engines. Look what you fixed instead: a whole country.']),
    ck, { type: 'boss', at: 'portblair:dock', name: 'Sarkar (Master-ji)', flee: ['portblair:landmarkA'], hp: 18, phases: 3, goons: 4, goonWeapons: ['smg', 'rifle'], phase2Weapon: 'smg', phaseText: 'Master-ji runs for the lighthouse!' },
    talk(['master', 'Enough. Take it all. The ring, the routes, the kings’ chairs. Be Badshah. Or be your brother. Choose.'])] },
  { id: 'F-08', arc: 'final', n: 8, title: 'Badshah or Saaf', start: 'portblair:dock', blurb: 'Choose your ending', reward: { izzat: 100 }, steps: [
    { type: 'choice', title: 'Badshah or Saaf?', sub: 'This decides how the story ends', flag: 'ending', options: [
      { id: 'badshah', label: '👑 Badshah', sub: 'Take his ring and rule India Bay’s underworld', lines: [['narrator', 'The Gateway of India at night. Your crew in white. The ring is heavy.'], ['rani', 'So. Badshah. What now?'], ['you', 'Now nobody takes a truck off the road without asking me.'], ['narrator', 'Rival gangs will come for your regions. Defend them. Keep your Izzat high.']] },
      { id: 'saaf', label: '🏢 Saaf (clean)', sub: 'Hand Master-ji and the ledger to Meera and go legit', lines: [['meera', 'Sarkar is in custody. The ledger is evidence. You will testify?'], ['you', 'Every page.'], ['narrator', 'Months later: a fleet of trucks with a new name painted on the doors. VIKRAM TRANSPORT.'], ['harleen', 'First run is mine. Delhi to Leh. Honest tolls only.']] }] },
    { type: 'give', flags: ['storyDone'] }] }
  );
})();
