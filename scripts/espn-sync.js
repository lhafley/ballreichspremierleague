/**
 * espn-sync.js
 * ---------------------------------------------------------------
 * Pulls standings + team records from your ESPN fantasy league
 * and writes them to data/standings.json for the website to read.
 *
 * Your league is now PUBLIC, so this no longer needs auth cookies —
 * it's just reading public data. This script exists as a fallback
 * for the automated/manual sync in case the site's direct
 * browser-side fetch to ESPN ever gets blocked by CORS.
 *
 * Usage:
 *   node scripts/espn-sync.js
 */

const fs = require("fs");
const path = require("path");

const LEAGUE_ID = 335276;
const SEASON = new Date().getMonth() >= 6 // rough heuristic: Aug–Dec = current year season
  ? new Date().getFullYear()
  : new Date().getFullYear() - 1;

const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?view=mTeam&view=mStandings`;
console.log(`Computed SEASON: ${SEASON}, LEAGUE_ID: ${LEAGUE_ID}`);

async function fetchOnce() {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://fantasy.espn.com/",
    },
  });
  const rawText = await res.text();
  return { res, rawText };
}

async function main() {
  let res, rawText;
  const attempts = 3;

  for (let i = 1; i <= attempts; i++) {
    ({ res, rawText } = await fetchOnce());
    console.log(`Attempt ${i}: status ${res.status} ${res.statusText}, ${rawText.length} chars`);
    if (rawText && rawText.trim()) break;
    if (i < attempts) {
      const waitMs = 1500 * i;
      console.log(`Empty response — waiting ${waitMs}ms before retrying...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  if (!res.ok) {
    throw new Error(`ESPN request failed: ${res.status} ${res.statusText}`);
  }
  if (!rawText || !rawText.trim()) {
    throw new Error("ESPN returned an empty response after retries.");
  }

  const data = JSON.parse(rawText);

  const teams = (data.teams || []).map(t => ({
    id: t.id,
    name: `${t.location || ""} ${t.nickname || ""}`.trim() || t.name || `Team ${t.id}`,
    abbrev: t.abbrev,
    wins: t.record?.overall?.wins ?? 0,
    losses: t.record?.overall?.losses ?? 0,
    ties: t.record?.overall?.ties ?? 0,
    pointsFor: t.record?.overall?.pointsFor ?? 0,
    pointsAgainst: t.record?.overall?.pointsAgainst ?? 0,
    standing: t.playoffSeed ?? null,
  }));

  teams.sort((a, b) => (a.standing || 99) - (b.standing || 99));

  const output = {
    season: SEASON,
    leagueId: LEAGUE_ID,
    updatedAt: new Date().toISOString(),
    teams,
  };

  const outPath = path.join(__dirname, "..", "data", "standings.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${teams.length} teams to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
