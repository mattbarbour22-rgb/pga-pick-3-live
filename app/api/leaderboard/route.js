export const dynamic = 'force-dynamic';

const TOURN_ID = process.env.SLASH_GOLF_TOURN_ID || '033';
const YEAR = process.env.SLASH_GOLF_YEAR || '2026';
const ORG_ID = process.env.SLASH_GOLF_ORG_ID || '1';

function getArray(payload) {
  return (
    payload?.leaderboard ||
    payload?.leaderboards ||
    payload?.players ||
    payload?.data?.leaderboard ||
    payload?.data?.leaderboards ||
    payload?.data?.players ||
    payload?.data ||
    (Array.isArray(payload) ? payload : [])
  );
}

function playerName(p) {
  return (
    p.playerName ||
    p.player_name ||
    p.name ||
    p.displayName ||
    p.display_name ||
    p.player?.displayName ||
    p.player?.name ||
    [p.firstName || p.first_name || p.player?.firstName, p.lastName || p.last_name || p.player?.lastName]
      .filter(Boolean)
      .join(' ')
  );
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
  const scoreRaw =
    p.totalToPar ??
    p.total_to_par ??
    p.totalRelativeToPar ??
    p.total_score_relative_to_par ??
    p.scoreToPar ??
    p.score_to_par ??
    p.total ??
    p.score ??
    p.current_score ??
    p.currentScore;

  const score = parseScore(scoreRaw);

  const posRaw =
    p.position ??
    p.currentPosition ??
    p.current_position ??
    p.rank ??
    p.pos ??
    p.place;

  return {
    name: playerName(p),
    position: parsePos(posRaw, score),
    positionLabel: String(posRaw || ''),
    score,
    today: p.today ?? p.roundScore ?? p.round_score ?? p.currentRoundScore ?? '',
    thru: p.thru ?? p.holesThrough ?? p.holes_through ?? p.status ?? '',
    teeTime: p.teeTime ?? p.tee_time ?? p.startTime ?? p.start_time ?? ''
  };
}

export async function GET() {
  const key = process.env.SLASH_GOLF_API_KEY;
  const host = process.env.SLASH_GOLF_API_HOST || 'live-golf-data.p.rapidapi.com';

  if (!key) {
    return Response.json({
      mode: 'missing-key',
      message: 'Missing SLASH_GOLF_API_KEY',
      players: [],
      updatedAt: new Date().toISOString()
    });
  }

  // This matches the working RapidAPI page: GET leaderboards.
  const url = `https://live-golf-data.p.rapidapi.com/leaderboards?orgId=${ORG_ID}&tournId=${TOURN_ID}&year=${YEAR}`;

  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': host,
      },
      cache: 'no-store'
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json({
        mode: 'api-error',
        message: res.status === 429 ? 'RapidAPI limit reached or temporarily rate limited' : 'Could not fetch leaderboard',
        status: res.status,
        requestUrl: url,
        response: text.slice(0, 500),
        players: [],
        updatedAt: new Date().toISOString()
      });
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return Response.json({
        mode: 'api-error',
        message: 'API returned non-JSON response',
        requestUrl: url,
        response: text.slice(0, 500),
        players: [],
        updatedAt: new Date().toISOString()
      });
    }

    const raw = getArray(payload);
    const players = Array.isArray(raw)
      ? raw.map(normalize).filter(p => p.name)
      : [];

    return Response.json({
      mode: players.length ? 'live' : 'no-players',
      requestUrl: url,
      updatedAt: new Date().toISOString(),
      players,
      rawKeys: Object.keys(payload || {}),
      rawPreview: players.length ? undefined : payload
    });
  } catch (err) {
    return Response.json({
      mode: 'api-error',
      message: err?.message || String(err),
      requestUrl: url,
      players: [],
      updatedAt: new Date().toISOString()
    });
  }
}
