# Ballreich's Premier League — League Hub

A static, multi-page website for your ESPN fantasy league (#335276) — modeled after
the FFFFL site, rebuilt for your league: manager bios, all-time records, championship
history, a live Ices tracker, and the league golf outing.

## What's in here

```
index.html                 Home — news feed, reigning champion, league-at-a-glance, quick links
teams.html                  Every manager and team
record-book.html            All-time win/loss records (sortable)
history.html                 Championship banners, year by year
ices.html                    Live-synced Ices tracker
golf.html                     League golf outing results
styles.css                   All styling (shared across every page)
app.js                        Shared script — reads <body data-page="..."> to know what to render
assets/logo.png               Your league crest
assets/managers/              Put manager photos here (see below)
data/managers.json            Manager roster — edit to add/update managers
data/records.json             All-time win/loss records — edit each season
data/championships.json       Champion by year — add a row each year
data/golf.json                  Golf outing winners/losers by year
data/news.json                  "Around the League" homepage news feed — edit any time
scripts/espn-sync.js            Node script that pulls live ESPN standings (see below)
.github/workflows/update-standings.yml   Runs the sync automatically on a schedule
```

Every page shares the same header nav and footer (hardcoded per file, so the current
page shows as "active" in the nav) — if you rename or add a page, update the nav
links in the other five files to match.

## 1. Viewing it locally

Because pages fetch JSON files, opening `index.html` directly by double-click won't
work (browsers block local file fetches). Instead, from this folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## 2. Hosting it for real (free, via GitHub Pages)

1. Create a new **public** GitHub repo (e.g. `ballreichs-pl`).
2. Upload everything in this folder to it (drag-and-drop on github.com works, or `git push`).
3. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` / root**.
4. Your site will be live at `https://<your-username>.github.io/ballreichs-pl/` within a minute or two.

## 3. Editing content

Edit files directly on GitHub (pencil icon → edit → commit) or clone locally. Either
way, most updates are just JSON, no code:
- New manager or team name change → `managers.json`
- End-of-season record update → `records.json`
- New champion → add a row to the top of `championships.json`
- New golf outing → add a row to `golf.json`
- News blurb on the homepage → add a row to `news.json`

## 4. Adding photos

1. Create a folder `assets/managers/` in your repo (upload via "Add file → Upload files").
2. Upload each manager's photo (e.g. `luke.jpg`).
3. In `data/managers.json`, set that manager's `"photo"` field, e.g.:
   ```json
   { "name": "Luke", "photo": "assets/managers/luke.jpg", ... }
   ```
Manager cards and championship banners both pick this up automatically — no code changes.

## 5. The Ices tab (already live)

The Ices tab pulls directly from your Google Sheet
(`FF Ices`) every time someone loads the page or hits **Refresh data** — no setup
needed, as long as the sheet stays shared as **"Anyone with the link can view."**
It reads the `Ice Counter`, `Ices Against`, `Ices Paid`, and `OWED` columns exactly
as they're laid out in your sheet today.

## 6. Live ESPN standings (optional — needs a one-time setup)

Because your league is private, pulling standings requires your ESPN session
cookies (`espn_s2` and `SWID`). These act like a login password — **never put them
in a file or commit them to the repo.** Instead, store them as encrypted GitHub
Actions secrets:

1. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret.**
2. Add a secret named `ESPN_S2` with your `espn_s2` cookie value.
3. Add a second secret named `ESPN_SWID` with your `SWID` cookie value (including the `{ }`).
4. Go to the **Actions** tab → **Sync ESPN Standings** → **Run workflow** to trigger
   it manually the first time. After that, it runs automatically every Tuesday
   morning during the season (edit the `cron` line in
   `.github/workflows/update-standings.yml` to change the schedule).

Once it's run once, `data/standings.json` will exist and the Home tab will show a
live "Current season standings" panel automatically — no other changes needed.

**Where to find your cookies:** log into fantasy.espn.com in Chrome → open DevTools
(F12) → **Application** tab → **Cookies** → `https://fantasy.espn.com` → copy the
`espn_s2` and `SWID` values.

**If your cookies ever leak or expire:** log out and back into ESPN to rotate them,
then update the two GitHub secrets with the new values.

