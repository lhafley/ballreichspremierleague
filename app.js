/* ============================================================
   Ballreich's Premier League — app.js
   Shared across every page; each page's <body data-page="..."> tells
   this script which section(s) to initialize.
   ============================================================ */

const SHEET_ID = "1GgBvjiKJ7bSm-T6he38b0rG_sk8vhiAcL2UD_AuB5FA";
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const page = document.body.dataset.page;

// ---- HELPERS ---------------------------------------------------
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.html !== undefined) node.innerHTML = opts.html;
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach(c => c && node.appendChild(c));
  return node;
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarNode(name, photo, size, cls) {
  const box = el("div", { class: cls || "m-avatar", attrs: size ? { style: `width:${size}px;height:${size}px;` } : {} });
  if (photo) {
    box.appendChild(el("img", { attrs: { src: photo, alt: name } }));
  } else {
    box.textContent = initials(name);
  }
  return box;
}

const trophySVG = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 3h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M7 4H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 4h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M12 12v3" stroke="currentColor" stroke-width="1.6"/>
  <path d="M8 20h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M9 15h6l1 5H8l1-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;

// A couple of pages need managers.json to cross-reference (photos/teams).
// Load it once, lazily, so pages that don't need it never fetch it.
let _managersPromise = null;
function getManagers() {
  if (!_managersPromise) _managersPromise = loadJSON("data/managers.json").catch(() => []);
  return _managersPromise;
}

// ============================================================
// TEAMS PAGE
// ============================================================
if (page === "teams" || document.getElementById("managers-grid")) {
  getManagers().then(managers => {
    const grid = document.getElementById("managers-grid");
    if (!grid) return;
    managers.forEach(m => {
      const tags = m.tags.map(t => el("span", { class: "tag", text: t }));
      grid.appendChild(el("div", { class: "manager-card" }, [
        avatarNode(m.name, m.photo, 52),
        el("div", { class: "m-name", text: m.name }),
        el("div", { class: "m-team", text: m.team }),
        el("div", { class: "m-tenure", text: m.tenure }),
        m.note ? el("div", { class: "m-note", text: m.note }) : null,
        tags.length ? el("div", { class: "tag-row" }, tags) : null
      ]));
    });
  });
}

// ============================================================
// RECORD BOOK PAGE
// ============================================================
if (page === "records") {
  let recordsData = [];
  let sortState = { key: "wins", dir: "desc" };

  function renderRecords() {
    const body = document.getElementById("records-body");
    if (!body) return;
    const sorted = [...recordsData].sort((a, b) => {
      const dir = sortState.dir === "asc" ? 1 : -1;
      if (sortState.key === "name") return a.name.localeCompare(b.name) * dir;
      return (a[sortState.key] - b[sortState.key]) * dir;
    });
    body.innerHTML = "";
    sorted.forEach(r => {
      body.appendChild(el("tr", {}, [
        el("td", { class: "name", text: r.name }),
        el("td", { text: `${r.avgFinish}th` }),
        el("td", { text: `${r.wins}-${r.losses}` }),
        el("td", { class: "pct", text: `${(r.winPct * 100).toFixed(1)}%` }),
        el("td", { text: r.seasons })
      ]));
    });
    document.querySelectorAll(".sort-btn").forEach(btn => {
      btn.classList.remove("sort-asc", "sort-desc");
      if (btn.dataset.key === sortState.key) {
        btn.classList.add(sortState.dir === "asc" ? "sort-asc" : "sort-desc");
      }
    });
  }

  loadJSON("data/records.json").then(data => {
    recordsData = data.map(r => ({ ...r, winPct: r.wins / (r.wins + r.losses) }));
    renderRecords();
  }).catch(err => console.error(err));

  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      if (sortState.key === key) {
        sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      } else {
        sortState = { key, dir: key === "name" ? "asc" : "desc" };
      }
      renderRecords();
    });
  });
}

// ============================================================
// HISTORY PAGE (championship banners) — also feeds Home's reigning champ card
// ============================================================
const championshipsPromise = loadJSON("data/championships.json").catch(() => []);

if (page === "history") {
  Promise.all([championshipsPromise, getManagers()]).then(([list, managers]) => {
    const container = document.getElementById("banner-case");
    if (!container) return;
    const byName = Object.fromEntries(managers.map(m => [m.name.toLowerCase(), m]));

    list.forEach(c => {
      const mgr = byName[c.champion.toLowerCase()];
      const photoBox = el("div", { class: "cb-photo" });
      if (mgr && mgr.photo) {
        photoBox.appendChild(el("img", { attrs: { src: mgr.photo, alt: c.champion } }));
      } else {
        photoBox.textContent = initials(c.champion);
      }

      container.appendChild(el("div", { class: `champ-banner${c.active ? "" : " inactive"}` }, [
        el("div", { class: "cb-year", text: c.year }),
        photoBox,
        el("div", { class: "cb-info" }, [
          el("div", { class: "cb-name", text: c.champion }),
          mgr ? el("div", { class: "cb-team", text: mgr.team }) : null,
          !c.active ? el("div", { class: "cb-flag", text: c.note || "No longer in league" }) : null
        ]),
        el("div", { class: "cb-trophy", html: trophySVG })
      ]));
    });
  });
}

// ============================================================
// GOLF OUTING PAGE
// ============================================================
if (page === "golf") {
  loadJSON("data/golf.json").then(years => {
    const wrap = document.getElementById("golf-list");
    if (!wrap) return;
    years.forEach(y => {
      const winCol = el("div", { class: "golf-col win" }, [
        el("div", { class: "golf-col-label", text: "Winners" }),
        el("ul", {}, y.winners.map(n => el("li", { text: n })))
      ]);
      const loseCol = el("div", { class: "golf-col lose" }, [
        el("div", { class: "golf-col-label", text: "Losers" }),
        el("ul", {}, y.losers.map(n => el("li", { text: n })))
      ]);
      wrap.appendChild(el("div", { class: "golf-year" }, [
        el("div", { class: "golf-year-head", text: `${y.year} Outing` }),
        el("div", { class: "golf-cols" }, [winCol, loseCol]),
        y.loserNote ? el("div", { class: "golf-note", text: y.loserNote }) : null
      ]));
    });
  }).catch(err => console.error(err));
}

// ============================================================
// ICES PAGE
// ============================================================
if (page === "ices") {
  async function fetchIcesData() {
    const res = await fetch(SHEET_GVIZ_URL);
    if (!res.ok) throw new Error("Sheet request failed");
    const text = await res.text();
    const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
    if (!match) throw new Error("Unexpected sheet response format");
    const json = JSON.parse(match[1]);
    const cols = json.table.cols.map(c => (c.label || "").trim().toLowerCase());
    const rows = json.table.rows || [];

    const idx = {
      name: cols.findIndex(c => c.includes("ice counter")),
      against: cols.findIndex(c => c.includes("against")),
      paid: cols.findIndex(c => c.includes("paid")),
      owed: cols.findIndex(c => c.includes("owed")),
    };

    return rows
      .map(r => {
        const cell = (i) => (i >= 0 && r.c[i] ? r.c[i].v : null);
        const name = cell(idx.name);
        if (!name) return null;
        return {
          name: String(name),
          against: Number(cell(idx.against)) || 0,
          paid: Number(cell(idx.paid)) || 0,
          owed: Number(cell(idx.owed)) || 0,
        };
      })
      .filter(Boolean);
  }

  function renderIces(data) {
    const content = document.getElementById("ices-content");
    if (!data.length) {
      content.innerHTML = `<div class="ices-empty">No Ices on record yet. Someone's due for a rough week.</div>`;
      return;
    }
    const sorted = [...data].sort((a, b) => b.against - a.against);
    const table = el("table", { class: "ices" }, [
      el("thead", {}, [
        el("tr", {}, [
          el("th", { text: "Manager" }),
          el("th", { text: "Ices Against" }),
          el("th", { text: "Ices Paid" }),
          el("th", { text: "Owed" }),
        ])
      ]),
    ]);
    const tbody = el("tbody");
    sorted.forEach(r => {
      tbody.appendChild(el("tr", {}, [
        el("td", { class: "name", text: r.name }),
        el("td", { class: "num-cell", text: r.against }),
        el("td", { class: "num-cell", text: r.paid }),
        el("td", { class: `num-cell owed-cell${r.owed > 0 ? " has-owed" : ""}`, text: r.owed }),
      ]));
    });
    table.appendChild(tbody);
    content.innerHTML = "";
    content.appendChild(table);
  }

  function setIcesStatus(state, message) {
    const status = document.getElementById("ices-status");
    if (!status) return;
    status.classList.toggle("err", state === "error");
    status.innerHTML = `<span class="dot"></span>${message}`;
  }

  async function refreshIces() {
    setIcesStatus("loading", "Loading…");
    try {
      const data = await fetchIcesData();
      renderIces(data);
      const now = new Date();
      setIcesStatus("ok", `Synced with Google Sheet · ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (err) {
      console.error(err);
      document.getElementById("ices-content").innerHTML =
        `<div class="ices-error">Couldn't reach the sheet right now. Make sure it's still shared as "Anyone with the link can view," then hit Refresh.</div>`;
      setIcesStatus("error", "Sync failed");
    }
  }

  document.getElementById("ices-refresh").addEventListener("click", refreshIces);
  refreshIces();
}

// ============================================================
// HOME PAGE
// ============================================================
if (page === "home") {
  // News feed
  loadJSON("data/news.json").then(items => {
    const list = document.getElementById("news-list");
    if (!list) return;
    items.forEach(n => {
      list.appendChild(el("div", { class: "news-item" }, [
        el("div", { class: "n-date", text: n.date }),
        el("div", {}, [
          el("div", { class: "n-headline", text: n.headline }),
          el("div", { class: "n-body", text: n.body })
        ])
      ]));
    });
  }).catch(err => console.error(err));

  // Reigning champion + glance grid (needs championships + managers + records)
  Promise.all([championshipsPromise, getManagers(), loadJSON("data/records.json").catch(() => [])])
    .then(([champs, managers, records]) => {
      const latest = champs[0];
      const mgr = managers.find(m => m.name.toLowerCase() === latest?.champion?.toLowerCase());

      const reigningWrap = document.getElementById("reigning-card");
      if (reigningWrap && latest) {
        const photo = avatarNode(latest.champion, mgr?.photo, 76, "rc-photo");
        reigningWrap.appendChild(el("div", { class: "reigning-card" }, [
          photo,
          el("div", {}, [
            el("div", { class: "rc-eyebrow", text: `${latest.year} CHAMPION` }),
            el("div", { class: "rc-name", text: latest.champion }),
            mgr ? el("div", { class: "rc-team", text: mgr.team }) : null
          ])
        ]));
      }

      const glance = document.getElementById("glance-grid");
      if (glance) {
        const seasons = Math.max(...records.map(r => r.seasons), champs.length);
        const stats = [
  { num: managers.length || 12, label: "Teams" },
  { num: seasons, label: "Seasons Tracked" },
  { num: champs.length, label: "Champions Crowned" },
  { num: 2012, label: "League Founded" },
  { num: 47, label: "2025 Total Ices" }
];
        stats.forEach(s => {
          glance.appendChild(el("div", { class: "glance-item" }, [
            el("div", { class: "g-num", text: s.num }),
            el("div", { class: "g-label", text: s.label })
          ]));
        });
      }
    });

  // Current season standings — manually maintained in data/standings.json.
  // (Live pulling from ESPN's API isn't reliable enough to depend on — it
  // redirects/blocks browser and script requests inconsistently.)
  function renderStandings(data) {
    const wrap = document.getElementById("home-standings");
    if (!wrap || !data || !data.teams || !data.teams.length) return;
    const rows = [...data.teams]
      .sort((a, b) => (a.standing || 99) - (b.standing || 99))
      .map(t => el("div", { class: "mini-champ-row" }, [
        el("span", { class: "yr", text: t.standing ? `#${t.standing}` : "-" }),
        el("span", { text: `${t.name} (${t.wins}-${t.losses}${t.ties ? "-" + t.ties : ""})` })
      ]));
    wrap.innerHTML = "";
    rows.forEach(r => wrap.appendChild(r));
    if (data.updatedAt) {
      wrap.appendChild(el("p", {
        text: `Updated ${new Date(data.updatedAt).toLocaleDateString()}`,
        attrs: { style: "color:var(--ink-soft); font-size:11.5px; margin-top:10px;" }
      }));
    }
  }

  fetch("data/standings.json")
    .then(res => (res.ok ? res.json() : null))
    .then(data => data && renderStandings(data))
    .catch(() => { /* standings.json not present or empty — leave placeholder message */ });
}
