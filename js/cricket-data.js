// Cricket league data: IPL teams, their home grounds, fixtures and ball-by-ball style match results.
// Like football, everything follows the shared Bay clock, so every player sees the same scores.
window.CRICKET = (function () {
  const league = { name: 'Indian Premier League', short: 'IPL', seasonDays: 20, rounds: 18, kick: 15.5, len: 130 }; // T20 at 3:30 pm Bay time, 130 Bay minutes
  const teams = [
    { id: 'mi', name: 'Mumbai Indians', short: 'MI', zone: 'mumbai', stadium: 'Wankhede Stadium', col: '#004ba0', col2: '#d1ab3e', chant: 'Mumbai! Mumbai!' },
    { id: 'gt', name: 'Gujarat Titans', short: 'GT', zone: 'ahmedabad', stadium: 'Narendra Modi Stadium', col: '#1b2133', col2: '#c8a14c', chant: 'Aava de! Gujarat Titans!' },
    { id: 'rcb', name: 'Royal Challengers Bengaluru', short: 'RCB', zone: 'bengaluru', stadium: 'M. Chinnaswamy Stadium', col: '#d1171b', col2: '#1a1a1a', chant: 'RCB! RCB!' },
    { id: 'rr', name: 'Rajasthan Royals', short: 'RR', zone: 'jaipur', stadium: 'Sawai Mansingh Stadium', col: '#ea1a85', col2: '#254aa5', chant: 'Halla Bol! Rajasthan Royals!' },
    { id: 'csk', name: 'Chennai Super Kings', short: 'CSK', zone: 'chennai', stadium: 'MA Chidambaram Stadium (Chepauk)', col: '#f9cd05', col2: '#0081e9', chant: 'Whistle Podu! Whistle Podu!' },
    { id: 'kkr', name: 'Kolkata Knight Riders', short: 'KKR', col: '#3a225d', col2: '#d4af37' },
    { id: 'dc', name: 'Delhi Capitals', short: 'DC', zone: 'delhi', stadium: 'Arun Jaitley Stadium', col: '#17479e', col2: '#d71920', chant: 'Roar Macha! Delhi Capitals!' },
    { id: 'pbks', name: 'Punjab Kings', short: 'PBKS', zone: 'mohali', stadium: 'Maharaja Yadavindra Singh Stadium, Mullanpur', col: '#d71920', col2: '#c0c0c0', chant: 'Sadda Punjab! Punjab Kings!' },
    { id: 'srh', name: 'Sunrisers Hyderabad', short: 'SRH', zone: 'hyderabad', stadium: 'Rajiv Gandhi International Stadium', col: '#f26522', col2: '#1a1a1a', chant: 'Orange Army! Rise!' },
    { id: 'lsg', name: 'Lucknow Super Giants', short: 'LSG', zone: 'lucknow', stadium: 'Ekana Cricket Stadium', col: '#0057e2', col2: '#f26522', chant: 'Lucknow! Lucknow! Super Giants!' }
  ];
  const byId = id => teams.find(t => t.id === id);
  const homeTeams = teams.filter(t => t.stadium);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seedOf(s) { let h = 2166136261; for (const v of s) { h ^= v.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const PAIRS = (() => { const n = teams.length, out = []; let ids = teams.map((t, i) => i);
    for (let r = 0; r < n - 1; r++) { const round = []; for (let i = 0; i < n / 2; i++) { let a = ids[i], b = ids[n - 1 - i]; if ((i === 0 && r % 2) || (i > 0 && i % 2)) [a, b] = [b, a]; round.push([a, b]); } out.push(round); ids = [ids[0], ids[n - 1], ...ids.slice(1, n - 1)]; }
    return out.concat(out.map(r => r.map(([a, b]) => [b, a]))); })();
  function day(gameDay) { const S = league.seasonDays; const season = Math.floor(gameDay / S), d = ((gameDay % S) + S) % S; return { season, round: d, matchday: d < league.rounds }; }
  function fixtures(season, round) { if (round < 0 || round >= league.rounds) return []; return PAIRS[round].map(([h, a], i) => ({ home: teams[h], away: teams[a], season, round, i, sport: 'cricket' })); }
  // One innings: runs per over and the overs where wickets fell. Chasing side stops when it passes the target.
  function innings(r, target, home) { const overs = [], wk = []; let runs = 0, w = 0; const agg = .9 + r() * .35 + (home ? .05 : 0);
    for (let o = 0; o < 20 && w < 10; o++) { const death = o >= 16 ? 1.35 : o < 6 ? 1.1 : .95; let ro = Math.max(0, Math.round((6 + r() * 8) * agg * death - 2)); let fell = 0; for (let b = 0; b < 6; b++) if (r() < .045 * (o >= 16 ? 1.4 : 1)) fell++;
      fell = Math.min(fell, 10 - w); if (target != null && runs + ro >= target) { ro = target - runs + Math.floor(r() * 4); const balls = 1 + Math.floor(r() * 6); overs.push({ ro, fell: 0, balls }); runs += ro; return { runs, w, overs, balls: o * 6 + balls, done: true }; }
      overs.push({ ro, fell, balls: 6 }); runs += ro; w += fell; for (let k = 0; k < fell; k++) wk.push(o); }
    return { runs, w, overs, balls: overs.reduce((a, q) => a + q.balls, 0), done: false }; }
  const cache = new Map();
  function result(f) { const key = 'c' + f.season + ':' + f.round + ':' + f.home.id + ':' + f.away.id; if (cache.has(key)) return cache.get(key); const r = rng(seedOf(key));
    const batFirst = r() < .5 ? f.home : f.away, chase = batFirst === f.home ? f.away : f.home; const i1 = innings(r, null, batFirst === f.home), i2 = innings(r, i1.runs + 1, chase === f.home);
    const winner = i2.runs > i1.runs ? chase : i2.runs < i1.runs ? batFirst : null; const margin = !winner ? 'Match tied' : winner === chase ? `${10 - i2.w} wickets` : `${i1.runs - i2.runs} runs`;
    const res = { batFirst, chase, i1, i2, winner, margin, att: Math.round(25000 + r() * 70000), hg: winner === f.home ? 1 : 0, ag: winner === f.away ? 1 : 0 }; cache.set(key, res); return res; }
  // Match clock: first innings 0–55 Bay minutes, break to 65, chase 65–120, presentation to 130.
  function clock(h) { const m = (h - league.kick) * 60; if (m < 0) return { state: 'pre', toKick: -m }; if (m < 55) return { state: 'live', inn: 1, f: m / 55 }; if (m < 65) return { state: 'break', inn: 1, f: 1 };
    if (m < 120) return { state: 'live', inn: 2, f: (m - 65) / 55 }; return { state: 'ft', since: m - 120 }; }
  function inningsAt(inn, f) { const balls = Math.min(inn.balls, Math.floor(f * 120)); let b = 0, runs = 0, w = 0; for (const o of inn.overs) { if (b + o.balls <= balls) { runs += o.ro; w += o.fell; b += o.balls; } else { const part = balls - b; runs += Math.round(o.ro * part / o.balls); w += part >= 4 ? o.fell : 0; b = balls; break; } } return { runs, w, balls: b }; }
  const ov = b => `${Math.floor(b / 6)}.${b % 6}`;
  function scoreText(f, res, c) { if (c.state === 'pre') return `${f.home.short} v ${f.away.short} · starts 3:30 pm`;
    const a = c.inn === 1 ? inningsAt(res.i1, c.state === 'break' ? 1 : c.f) : inningsAt(res.i1, 1); const t1 = `${res.batFirst.short} ${a.runs}/${a.w}${c.inn === 1 && c.state === 'live' ? ` (${ov(a.balls)})` : ''}`;
    if (c.state === 'ft') return `${res.batFirst.short} ${res.i1.runs}/${res.i1.w} · ${res.chase.short} ${res.i2.runs}/${res.i2.w} · ${res.winner ? res.winner.short + ' won by ' + res.margin : 'tied'}`;
    if (c.inn === 1) return c.state === 'break' ? `${t1} · innings break` : t1;
    const b = inningsAt(res.i2, c.f); const need = res.i1.runs + 1 - b.runs, left = 120 - b.balls; return `${t1} · ${res.chase.short} ${b.runs}/${b.w} (${ov(b.balls)})${need > 0 ? ` · need ${need} off ${left}` : ''}`; }
  function table(season, played) { const T = new Map(teams.map(t => [t.id, { team: t, P: 0, W: 0, L: 0, NR: 0, Pts: 0, nrr: 0 }]));
    for (let r = 0; r < Math.min(played, league.rounds); r++) for (const f of fixtures(season, r)) { const s = result(f); const H = T.get(f.home.id), A = T.get(f.away.id); H.P++; A.P++;
      if (!s.winner) { H.NR++; A.NR++; H.Pts++; A.Pts++; } else { const Wn = T.get(s.winner.id), Ls = s.winner === f.home ? A : H; Wn.W++; Wn.Pts += 2; Ls.L++; }
      const d = (s.i1.runs - s.i2.runs) / 20; T.get(s.batFirst.id).nrr += d; T.get(s.chase.id).nrr -= d; }
    return [...T.values()].sort((a, b) => b.Pts - a.Pts || b.nrr - a.nrr); }
  function homeMatch(teamId, gameDay) { const d = day(gameDay); return fixtures(d.season, d.round).find(f => f.home.id === teamId) || null; }
  function nextHome(teamId, gameDay) { for (let g = gameDay; g < gameDay + 40; g++) { const f = homeMatch(teamId, g); if (f) return { f, inDays: g - gameDay }; } return null; }
  return { league, teams, homeTeams, byId, day, fixtures, result, clock, inningsAt, scoreText, table, homeMatch, nextHome };
})();
