/* ============================================================
   Ballreich's Premier League — app.js
   ============================================================ */

// ---- CONFIG -------------------------------------------------
const SHEET_ID = "1GgBvjiKJ7bSm-T6he38b0rG_sk8vhiAcL2UD_AuB5FA";
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// ---- TAB NAVIGATION ------------------------------------------
const tabButtons = document.querySelectorAll("nav.tabs button");
const panels = document.querySelectorAll(".tab-panel");

function activateTab(name) {
  tabButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  panels.forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

document.querySelectorAll("[data-tab-link]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    activateTab(el.dataset.tabLink);
  });
});

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

// ---- MANAGERS ---------------------------------------------------
loadJSON("data/managers.json").then(managers => {
  const grid = document.getElementById("managers-grid");
  managers.forEach(m => {
    const tags = m.tags.map(t => el("span", { class: "tag", text: t }));
    grid.appendChild(el("div", { class: "manager-card" }, [
      el("div", { class: "m-name", text: m.name }),
      el("div", { class: "m-team", text: m.team }),
      el("div", { class: "m-tenure", text: m.tenure }),
      m.note ? el("div", { class: "m-note", text: m.note }) : null,
      tags.length ? el("div", { class: "tag-row" }, tags) : null
    ]));
  });
  document.querySelector('#hero-stats .hero-stat .num').textContent = managers.length;
}).catch(err => console.error(err));

// ---- RECORDS ---------------------------------------------------
let recordsData = [];
let sortState = { key: "wins", dir: "desc" };

loadJSON("data/records.json").then(data => {
  recordsData = data.map(r => ({ ...r, winPct: r.wins / (r.wins + r.losses) }));
  renderRecords();
}).catch(err => console.error(err));

function renderRecords() {
  const body = document.getElementById("records-body");
  const sorted = [...recordsData].sort((a, b) => {
    const dir = sortState.dir === "asc" ? 1 : -1;
    if (sortState.key === "name") return a.name.localeCompare(b.name) * dir;
    return (a[sortState.key] - b[sortState.key]) * dir;
  });
  body.innerHTML = "";
  sorted.forEach(r => {
    const tr = el("tr", {}, [
      el("td", { class: "name", text: r.name }),
      el("td", { text: `${r.avgFinish}th` }),
      el("td", { text: `${r.wins}-${r.losses}` }),
      el("td", { class: "pct", text: `${(r.winPct * 100).toFixed(1)}%` }),
      el("td", { text: r.seasons })
    ]);
    body.appendChild(tr);
  });
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.classList.remove("sort-asc", "sort-desc");
    if (btn.dataset.key === sortState.key) {
      btn.classList.add(sortState.dir === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

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

// ---- CHAMPIONSHIPS ---------------------------------------------------
loadJSON("data/championships.json").then(list => {
  const container = document.getElementById("trophy-case");
  list.forEach(c => {
    container.appendChild(el("div", { class: "trophy-row" }, [
      el("div", { class: "t-year", text: c.year }),
      el("div", {}, [
        el("span", { class: "t-champ", text: c.champion }),
        !c.active ? el("span", { class: "t-flag", text: "No longer in league" }) : null
      ])
    ]));
  });

  // Home tab summaries
  const latest = list[0];
  document.getElementById("home-latest-champ").innerHTML = `
    <div style="font-family: var(--display); font-weight:900; font-size:34px; color:var(--navy); line-height:1;">
      ${latest.champion}
    </div>
    <div style="color:var(--ink-soft); font-size:13px; margin-top:4px;">${latest.year} Season</div>
  `;

  const miniWrap = document.getElementById("home-mini-champs");
  list.slice(0, 3).forEach(c => {
    miniWrap.appendChild(el("div", { class: "mini-champ-row" }, [
      el("span", { class: "yr", text: c.year }),
      el("span", { text: c.champion })
    ]));
  });
}).catch(err => console.error(err));

// ---- GOLF OUTING ---------------------------------------------------
loadJSON("data/golf.json").then(years => {
  const wrap = document.getElementById("golf-list");
  years.forEach(y => {
    const winCol = el("div", { class: "golf-col win" }, [
      el("div", { class: "golf-col-label", text: "Winners" }),
      el("ul", {}, y.winners.map(n => el("li", { text: n })))
    ]);
    const loseCol = el("div", { class: "golf-col lose" }, [
      el("div", { class: "golf-col-label", text: "Losers" }),
      el("ul", {}, y.losers.map(n => el("li", { text: n })))
    ]);
    const block = el("div", { class: "golf-year" }, [
      el("div", { class: "golf-year-head", text: `${y.year} Outing` }),
      el("div", { class: "golf-cols" }, [winCol, loseCol]),
      y.loserNote ? el("div", { class: "golf-note", text: y.loserNote }) : null
    ]);
    wrap.appendChild(block);
  });
}).catch(err => console.error(err));

// ---- STANDINGS (from ESPN sync, if present) ---------------------------------------------------
fetch("data/standings.json")
  .then(res => (res.ok ? res.json() : null))
  .then(data => {
    if (!data || !data.teams || !data.teams.length) return;
    const wrap = document.getElementById("home-standings");
    const rows = [...data.teams]
      .sort((a, b) => (a.standing || 99) - (b.standing || 99))
      .map(t => el("div", { class: "mini-champ-row" }, [
        el("span", { class: "yr", text: t.standing ? `#${t.standing}` : "-" }),
        el("span", { text: `${t.name} (${t.wins}-${t.losses}${t.ties ? "-" + t.ties : ""})` })
      ]));
    wrap.innerHTML = "";
    rows.forEach(r => wrap.appendChild(r));
    const updated = el("p", {
      text: `Last synced ${new Date(data.updatedAt).toLocaleString()}`,
      attrs: { style: "color:var(--ink-soft); font-size:11.5px; margin-top:10px;" }
    });
    wrap.appendChild(updated);
  })
  .catch(() => { /* standings.json not present yet — leave placeholder message */ });

// ---- ICES (live from Google Sheet) ---------------------------------------------------
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
