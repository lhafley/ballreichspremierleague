# Ballreich's Premier League — League Hub

A static, multi-page website for your ESPN fantasy league (#335276): manager
bios, all-time records, championship history, a live Ices tracker, and the
league golf outing.

## Setting this up fresh

1. Delete everything in your GitHub repo (or just delete the repo and create a new one).
2. Unzip this folder locally.
3. On github.com, use **Add file → Upload files**, then drag in *everything* —
   all the files and folders (`assets`, `data`, and every `.html`/`.css`/`.js`
   file) — in one go, so nothing gets missed. Commit.
4. **Settings → Pages → Source → Deploy from a branch → `main` / root.**
5. Your site is live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

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
data/managers.json            Manager roster
data/records.json             All-time win/loss records
data/championships.json       Champion by year
data/golf.json                  Golf outing winners/losers by year
data/news.json                  "Around the League" homepage news feed
```

Every page shares the same header nav and footer, hardcoded in each file so
the current page shows as "active" — if you add a page, update the nav in
the other files to match.

## Editing content

Open a file on GitHub → pencil icon → edit → commit. Most updates are just
JSON, no code:
- New manager or team name change → `managers.json`
- End-of-season record update → `records.json`
- New champion → add a row to the top of `championships.json`
- New golf outing → add a row to `golf.json`
- News blurb on the homepage → add a row to `news.json`

**Careful when pasting:** always replace the *entire* file contents (select
all, delete, paste), and double check the result looks right after
committing. A partial paste is the most common way a page breaks.

## Adding photos

1. Create `assets/managers/` in your repo (Add file → Upload files).
2. Upload each manager's photo.
3. In `data/managers.json`, set that manager's `"photo"` field:
   ```json
   { "name": "Luke", "photo": "assets/managers/luke.jpg", ... }
   ```
Manager cards and championship banners pick this up automatically.

## The Ices tab

Pulls live from your Google Sheet every time someone loads the page or hits
**Refresh data** — no setup needed, as long as the sheet stays shared as
"Anyone with the link can view."

## ESPN standings

Your league is now **public**, so the Home page tries to fetch current
standings directly from ESPN in the visitor's own browser — no cookies, no
server, no setup. If ESPN allows it, it just works. If not, it fails quietly
and the page shows a placeholder instead of breaking.

If you ever want to show standings without relying on that live fetch, you
can hand-write `data/standings.json` yourself — no script needed, just this
shape:

```json
{
  "season": 2026,
  "leagueId": 335276,
  "updatedAt": "2026-09-01T12:00:00.000Z",
  "teams": [
    { "id": 1, "name": "Glass Cannon", "wins": 3, "losses": 1, "ties": 0, "standing": 1 }
  ]
}
```

## Viewing it locally (optional, for testing before you push)

Opening `index.html` by double-click won't work — the page fetches JSON
files, which browsers block from `file://`. Instead, if you have Python
installed, run this from the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
