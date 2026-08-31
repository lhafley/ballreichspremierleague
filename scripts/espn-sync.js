/**
 * espn-sync.js
 * ---------------------------------------------------------------
 * Pulls standings + team records from a PRIVATE ESPN fantasy league
 * and writes them to data/standings.json for the website to read.
 *
 * Runs server-side (e.g. GitHub Actions) — never in the browser —
 * because ESPN's API blocks cross-origin browser requests and because
 * your auth cookies must never be exposed client-side.
 *
 * Required environment variables (set as GitHub Actions secrets,
 * NOT written into this file or any committed file):
 *   ESPN_S2    -> value of the "espn_s2" cookie
 *   ESPN_SWID  -> value of the "SWID" cookie, including the { } braces
 *
 * Usage:
 *   ESPN_S2="..." ESPN_SWID="{...}" node scripts/espn-sync.js
 */

const fs = require("fs");
const path = require("path");

const LEAGUE_ID = 335276;
const SEASON = new Date().getMonth() >= 6 // rough heuristic: Aug–Dec = current year season
  ? new Date().getFullYear()
  : new Date().getFullYear() - 1;

const ESPN_S2 = process.env.ESPN_S2;
const ESPN_SWID = process.env.ESPN_SWID;

if (!ESPN_S2 || !ESPN_SWID) {
  console.error("Missing ESPN_S2 or ESPN_SWID environment variables. Set them as GitHub Actions secrets.");
  process.exit(1);
}

const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?view=mTeam&view=mStandings`;

async function main() {
  const res = await fetch(url, {
    headers: {
      Cookie: `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID};`,
      "User-Agent": "Mozilla/5.0 (compatible; BallreichsPL-sync/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`ESPN request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

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
