# PGA Pick 3 Live - No Lib Folder Version

This version has NO `lib` folder to make GitHub upload easier.

Imported entries: 70

Upload these to GitHub at the repo root:

- app
- package.json
- README.md

Optional but included:
- data

Vercel environment variables:
- SLASH_GOLF_API_KEY
- SLASH_GOLF_TOURN_ID = 033
- SLASH_GOLF_YEAR = 2026


## API fix included

This version changes the Slash Golf call to:

/leaderboard?orgId=1&tournId=033&year=2026

Required Vercel variables:

SLASH_GOLF_API_KEY
SLASH_GOLF_API_HOST = live-golf-data.p.rapidapi.com
SLASH_GOLF_TOURN_ID = 033
SLASH_GOLF_YEAR = 2026
SLASH_GOLF_ORG_ID = 1
