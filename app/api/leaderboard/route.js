export const dynamic = 'force-dynamic';

const TOURN_ID = process.env.SLASH_GOLF_TOURN_ID || '033';
const YEAR = process.env.SLASH_GOLF_YEAR || '2026';

function getArray(payload) {
  return payload?.leaderboard || payload?.leaderboards || payload?.players || payload?.data?.leaderboard || payload?.data?.players || (Array.isArray(payload) ? payload : []);
}

function playerName(p) {
  return p.playerName || p.player_name || p.name || p.displayName || p.display_name || p.player?.displayName || p.player?.name || [p.firstName || p.player?.firstName, p.lastName || p.player?.lastName].filter(Boolean).join(' ');
}

function parseScore(v) {
  if (v === null || v === undefined || v === '') return 0;
  const s = String(v).trim().toUpperCase();
  if (s === 'E' || s === 'EVEN') return 0;
  if (s.includes('CUT') || s === 'MC' || s === 'WD' || s === 'DQ') return 999;
  const n = Number(s.replace('+', ''));
  return Number.isFinite(n) ? n : 0;
}

function parsePos(v, score) {
  if (score === 999) return 999;
  const s = String(v || '').trim().toUpperCase();
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : 999;
}

function normalize(p) {
  const scoreRaw = p.totalToPar ?? p.total_to_par ?? p.scoreToPar ?? p.score_to_par ?? p.total ?? p.score ?? p.current_score;
  const score = parseScore(scoreRaw);
  const posRaw = p.position ?? p.currentPosition ?? p.current_position ?? p.rank ?? p.pos ?? p.place;
  return {
    name: playerName(p),
    position: parsePos(posRaw, score),
    positionLabel: String(posRaw || ''),
    score,
    today: p.today ?? p.roundScore ?? p.round_score ?? '',
    thru: p.thru ?? p.holesThrough ?? p.holes_through ?? p.status ?? '',
    teeTime: p.teeTime ?? p.tee_time ?? p.startTime ?? p.start_time ?? ''
  };
}

export async function GET() {
  const key = process.env.SLASH_GOLF_API_KEY;
  if (!key) {
    return Response.json({ mode: 'missing-key', players: [], updatedAt: new Date().toISOString(), message: 'Missing SLASH_GOLF_API_KEY' });
  }

  const endpoints = [
    `https://live-golf-data.p.rapidapi.com/leaderboards?tournId=${TOURN_ID}&year=${YEAR}`,
    `https://api.slashgolf.dev/leaderboards?tournId=${TOURN_ID}&year=${YEAR}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': process.env.SLASH_GOLF_API_HOST || 'live-golf-data.p.rapidapi.com',
          'Authorization': `Bearer ${key}`
        },
        cache: 'no-store'
      });
      if (!res.ok) continue;
      const payload = await res.json();
      const players = getArray(payload).map(normalize).filter(p => p.name);
      if (players.length) {
        return Response.json({ mode: 'live', players, updatedAt: new Date().toISOString(), source: url });
      }
    } catch {}
  }

  return Response.json({ mode: 'api-error', players: [], updatedAt: new Date().toISOString(), message: 'Could not fetch leaderboard' });
}
