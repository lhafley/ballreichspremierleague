# Ballreich's Premier League — League Hub

A static website for your ESPN fantasy league (#335276): manager bios, all-time
records, championship history, a live Ices tracker, and the league golf outing.

## What's in here

```
index.html               The whole site (tabs: Home, Managers, Records, Championships, Ices, Golf Outing)
styles.css                All styling
app.js                     Tab switching + data rendering + live Google Sheet pull
assets/logo.png            Your league crest
data/managers.json         Manager roster — edit this to add/update managers
data/records.json          All-time win/loss records — edit each season
data/championships.json    Champion by year — add a row each year
data/golf.json              Golf outing winners/losers by year
scripts/espn-sync.js        Node script that pulls live ESPN standings (see below)
.github/workflows/update-standings.yml   Runs the sync automatically on a schedule
```

## 1. Viewing it locally

Because the page fetches JSON files, opening `index.html` directly by double-click
won't work (browsers block local file fetches). Instead, from this folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## 2. Hosting it for real (free, via GitHub Pages)

1. Create a new **public** GitHub repo (e.g. `ballreichs-pl`).
2. Upload everything in this folder to it (drag-and-drop on github.com works, or `git push`).
3. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` / root**.
4. Your site will be live at `https://<your-username>.github.io/ballreichs-pl/` within a minute or two.

## 3. Updating content

Just edit the JSON files in `/data` and push the change — no code changes needed:
- New manager or team name change → `managers.json`
- End-of-season record update → `records.json`
- New champion → add a row to the top of `championships.json`
- New golf outing → add a row to `golf.json`

## 4. The Ices tab (already live)

The Ices tab pulls directly from your Google Sheet
(`FF Ices`) every time someone loads the page or hits **Refresh data** — no setup
needed, as long as the sheet stays shared as **"Anyone with the link can view."**
It reads the `Ice Counter`, `Ices Against`, `Ices Paid`, and `OWED` columns exactly
as they're laid out in your sheet today.

## 5. Live ESPN standings (optional — needs a one-time setup)

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
