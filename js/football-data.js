// Football league data: teams, stadiums, the fixture list and match results.
// Everything is worked out from the shared Bay clock, so every player sees the same fixtures,
// the same live scores and the same league table.
// Teams of the Indian Super League (club line-up as of mid 2026; change it here if the league changes).
window.FOOTBALL = (function () {
  const league = {
    name: 'Indian Super League', short: 'ISL',
    seasonDays: 24,   // one season lasts 24 Bay days: 22 match rounds, then 2 days of champions' celebrations
    rounds: 22,       // double round robin for 12 teams
    kick: 19.5,       // kick-off at 7:30 pm Bay time
    len: 105          // Bay minutes from kick-off to full time, including a 15-minute half-time break
  };
  const teams = [
    // Home teams: their stadiums are on the map.
    { id: 'mum', name: 'Mumbai City FC', short: 'MCFC', zone: 'mumbai', stadium: 'Mumbai Football Arena', col: '#6cb4ee', col2: '#0b2a5b', fans: 'Mumbai City fan club', chant: 'Mumbai City! Mumbai City!' },
    { id: 'goa', name: 'FC Goa', short: 'FCG', zone: 'margao', stadium: 'Fatorda Stadium', col: '#ff7a1a', col2: '#1d3f9a', fans: 'FC Goa fan club', chant: 'Forca Goa! Forca Goa!' },
    { id: 'blr', name: 'Bengaluru FC', short: 'BFC', zone: 'bengaluru', stadium: 'Sree Kanteerava Stadium', col: '#1f4fbf', col2: '#ffffff', fans: 'West Block Blues', chant: 'West Block Blues! Bengaluru!' },
    { id: 'ker', name: 'Kerala Blasters FC', short: 'KBFC', zone: 'kochi', stadium: 'Jawaharlal Nehru Stadium, Kochi', col: '#ffd23a', col2: '#1d3f9a', fans: 'Manjappada', chant: 'Manjappada! Kerala Blasters!' },
    // Visiting teams: their cities join the map in later regions.
    { id: 'mbsg', name: 'Mohun Bagan Super Giant', short: 'MBSG', col: '#1e8a4c', col2: '#8b1e2d' },
    { id: 'ebfc', name: 'East Bengal FC', short: 'EBFC', col: '#d6262f', col2: '#f2c14e' },
    { id: 'msc', name: 'Mohammedan SC', short: 'MSC', col: '#1a1a1a', col2: '#ffffff' },
    { id: 'cfc', name: 'Chennaiyin FC', short: 'CFC', zone: 'chennai', stadium: 'Jawaharlal Nehru Stadium, Chennai', col: '#2a62c9', col2: '#f2c14e', fans: 'Supermachans', chant: 'Supermachans! Chennaiyin!' },
    { id: 'neu', name: 'NorthEast United FC', short: 'NEUFC', col: '#c8102e', col2: '#1a1a1a' },
    { id: 'jfc', name: 'Jamshedpur FC', short: 'JFC', col: '#e03c31', col2: '#ffffff' },
    { id: 'ofc', name: 'Odisha FC', short: 'OFC', zone: 'bhubaneswar', stadium: 'Kalinga Stadium', col: '#6b2fa0', col2: '#f2c14e', fans: 'Juggernauts fan club', chant: 'Juggernauts! Odisha!' },
    { id: 'pfc', name: 'Punjab FC', short: 'PFC', zone: 'delhi', stadium: 'Jawaharlal Nehru Stadium, Delhi', col: '#e8573e', col2: '#ffffff', fans: 'Punjab FC fan club', chant: 'Sher-e-Punjab! Punjab FC!' }
  ];
  const byId = id => teams.find(t => t.id === id);
  const homeTeams = teams.filter(t => t.stadium);

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seedOf(...k) { let h = 2166136261; for (const v of k.join('|')) { h ^= v.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Round-robin pairings (circle method), home and away swapped in the second half of the season.
  const PAIRS = (() => { const n = teams.length, out = []; let ids = teams.map((t, i) => i);
    for (let r = 0; r < n - 1; r++) { const round = []; for (let i = 0; i < n / 2; i++) { let a = ids[i], b = ids[n - 1 - i]; if ((i === 0 && r % 2) || (i > 0 && i % 2)) [a, b] = [b, a]; round.push([a, b]); }
      out.push(round); ids = [ids[0], ids[n - 1], ...ids.slice(1, n - 1)]; }
    return out.concat(out.map(r => r.map(([a, b]) => [b, a]))); })();

  // Which season and round a Bay day belongs to. The season order of rounds is shuffled per season.
  function day(gameDay) { const season = Math.floor(gameDay / league.seasonDays), d = ((gameDay % league.seasonDays) + league.seasonDays) % league.seasonDays; return { season, round: d, matchday: d < league.rounds }; }
  function fixtures(season, round) { if (round < 0 || round >= league.rounds) return []; return PAIRS[round].map(([h, a], i) => ({ home: teams[h], away: teams[a], season, round, i })); }
  function poisson(l, r) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r(); } while (p > L && k < 9); return k - 1; }
  const cache = new Map();
  function result(f) { const key = f.season + ':' + f.round + ':' + f.home.id + ':' + f.away.id; if (cache.has(key)) return cache.get(key);
    const r = rng(seedOf(key)); const hg = poisson(f.home.stadium ? 1.55 : 1.4, r), ag = poisson(1.1, r); const goals = [];
    for (let i = 0; i < hg; i++) goals.push({ m: 1 + Math.floor(r() * 90), team: f.home.id }); for (let i = 0; i < ag; i++) goals.push({ m: 1 + Math.floor(r() * 90), team: f.away.id });
    goals.sort((a, b) => a.m - b.m); const scorers = ['the captain', 'the number 10', 'a young winger', 'the centre-back', 'a substitute', 'the left-back', 'the playmaker'];
    for (const g of goals) g.by = scorers[Math.floor(r() * scorers.length)];
    const res = { hg, ag, goals, att: Math.round(18000 + r() * 42000) }; cache.set(key, res); return res; }
  // Match clock from Bay hours: -> { state: 'pre'|'live'|'ht'|'ft', min }
  function clock(h) { const k = league.kick; const m = (h - k) * 60; if (m < 0) return { state: 'pre', min: 0, toKick: -m };
    if (m < 45) return { state: 'live', min: Math.floor(m) + 1 }; if (m < 60) return { state: 'ht', min: 45 }; if (m < league.len) return { state: 'live', min: Math.min(90, Math.floor(m - 15) + 1) }; return { state: 'ft', min: 90, since: m - league.len }; }
  function scoreAt(res, f, min) { let h = 0, a = 0; for (const g of res.goals) if (g.m <= min) { if (g.team === f.home.id) h++; else a++; } return [h, a]; }
  // League table after the given number of finished rounds.
  function table(season, played) { const T = new Map(teams.map(t => [t.id, { team: t, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }]));
    for (let r = 0; r < Math.min(played, league.rounds); r++) for (const f of fixtures(season, r)) { const s = result(f), H = T.get(f.home.id), A = T.get(f.away.id);
      H.P++; A.P++; H.GF += s.hg; H.GA += s.ag; A.GF += s.ag; A.GA += s.hg; if (s.hg > s.ag) { H.W++; A.L++; H.Pts += 3; } else if (s.hg < s.ag) { A.W++; H.L++; A.Pts += 3; } else { H.D++; A.D++; H.Pts++; A.Pts++; } }
    return [...T.values()].sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || a.team.name.localeCompare(b.team.name)); }
  // Today's match at a home team's stadium, if any.
  function homeMatch(teamId, gameDay) { const d = day(gameDay); return fixtures(d.season, d.round).find(f => f.home.id === teamId) || null; }
  function nextHome(teamId, gameDay) { for (let g = gameDay; g < gameDay + 60; g++) { const f = homeMatch(teamId, g); if (f) return { f, inDays: g - gameDay }; } return null; }
  return { league, teams, homeTeams, byId, day, fixtures, result, clock, scoreAt, table, homeMatch, nextHome };
})();
