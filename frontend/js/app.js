// ─────────────────────────────────────────
// app.js — NutriInfo Frontend Logic
// ─────────────────────────────────────────

// Auto-detects whether you open from localhost or network IP (Live Server)
const API_BASE = "https://nutri-info-qsov.onrender.com";

// ── State ──────────────────────────────────────────────────────────────
const S = { history: [], log: [] };

// ── Navigation ─────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  const btn = document.querySelector(`[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "category") initCatPage();
  if (page === "nutrition") renderLog();
}

function toggleMenu() {
  document.getElementById("navLinks").classList.toggle("open");
}
function closeMenu() {
  document.getElementById("navLinks").classList.remove("open");
}

// ── Search ─────────────────────────────────────────────────────────────
document.getElementById("searchBtn").addEventListener("click", () => {
  const q = document.getElementById("searchInput").value.trim();
  if (q) analyze(q);
});

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = e.target.value.trim();
    if (q) analyze(q);
  }
});

function quickSearch(q) {
  if (document.getElementById("page-home").classList.contains("active")) {
    document.getElementById("searchInput").value = q;
    analyze(q);
  } else {
    navigate("home");
    setTimeout(() => {
      document.getElementById("searchInput").value = q;
      analyze(q);
    }, 80);
  }
}

function showPanel(id) {
  ["emptyState", "loadingState", "errorState", "resultState"].forEach((s) => {
    const el = document.getElementById(s);
    if (!el) return;
    el.style.display =
      s === id ? (id === "loadingState" ? "flex" : "block") : "none";
  });
}

// ── Loading messages ───────────────────────────────────────────────────
const LOADING_MSGS = [
  "Analyzing nutritional content…",
  "Calculating vitamins & minerals…",
  "Building health profile…",
  "Generating personalized tips…",
];
let loadTimer = null;

// ── Analyze ────────────────────────────────────────────────────────────
async function analyze(query) {
  navigate("home");
  showPanel("loadingState");
  document.getElementById("searchBtn").disabled = true;

  let mi = 0;
  const sub = document.getElementById("loadingSub");
  sub.textContent = LOADING_MSGS[0];
  loadTimer = setInterval(() => {
    mi = (mi + 1) % LOADING_MSGS.length;
    sub.textContent = LOADING_MSGS[mi];
  }, 1200);

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || `Server error ${res.status}`);
    }

    addHistory(query);
    addToLog(query, json.data);
    renderResult(json.data);
  } catch (err) {
    document.getElementById("errorState").innerHTML = `
      <div class="error-box">
        ⚠️ <strong>Analysis failed.</strong> ${err.message}<br/><br/>
        Make sure your backend is running:
        <code style="background:#f0ede4;padding:2px 8px;border-radius:4px;font-size:13px;">cd backend &amp;&amp; npm run dev</code>
      </div>`;
    showPanel("errorState");
  } finally {
    clearInterval(loadTimer);
    document.getElementById("searchBtn").disabled = false;
  }
}

// ── History ────────────────────────────────────────────────────────────
function renderHistory() {
  const strip = document.getElementById("historyStrip");
  const wrap = document.getElementById("historyWrap");
  if (!S.history.length) {
    strip.classList.remove("show");
    return;
  }
  strip.classList.add("show");
  wrap.innerHTML = S.history
    .map(
      (h, i) => `
    <span class="h-chip">
      <span class="h-chip-label" onclick="quickSearch(${JSON.stringify(h.query)})">${h.query}</span>
      <button class="h-chip-del" onclick="deleteHistory(${i})" title="Remove">×</button>
    </span>`
    )
    .join("");
}

function addHistory(q) {
  S.history = S.history.filter((h) => h.query !== q);
  S.history.unshift({ query: q, ts: Date.now() });
  if (S.history.length > 8) S.history.pop();
  renderHistory();
}

function deleteHistory(i) {
  S.history.splice(i, 1);
  renderHistory();
}

function clearAllHistory() {
  S.history = [];
  renderHistory();
}

// ── Nutrition Log ──────────────────────────────────────────────────────
function addToLog(q, data) {
  S.log.unshift({ query: q, data, ts: Date.now() });
}

function deleteLogItem(i) {
  S.log.splice(i, 1);
  renderLog();
}

function clearLog() {
  if (!S.log.length) return;
  if (confirm("Clear your entire nutrition log?")) {
    S.log = [];
    renderLog();
  }
}

function renderLog() {
  const sum = document.getElementById("logSummary");
  const con = document.getElementById("logContent");

  if (!S.log.length) {
    sum.innerHTML = "";
    con.innerHTML = `
      <div class="log-empty">
        <span style="font-size:48px">📋</span>
        <p>Your log is empty. Analyze foods on the Home page to track them here.</p>
        <button class="log-go-btn" onclick="navigate('home')">Analyze a food →</button>
      </div>`;
    return;
  }

  const tot = S.log.reduce(
    (a, item) => {
      a.cal += item.data.calories || 0;
      a.p   += item.data.macros?.protein?.g || 0;
      a.c   += item.data.macros?.carbs?.g   || 0;
      a.f   += item.data.macros?.fat?.g     || 0;
      return a;
    },
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  sum.innerHTML = `
    <div class="log-sum-cell"><div class="log-sum-val">${Math.round(tot.cal)}</div><div class="log-sum-label">Total kcal</div></div>
    <div class="log-sum-cell"><div class="log-sum-val" style="color:#2d6a4f">${Math.round(tot.p)}g</div><div class="log-sum-label">Protein</div></div>
    <div class="log-sum-cell"><div class="log-sum-val" style="color:#d4a017">${Math.round(tot.c)}g</div><div class="log-sum-label">Carbs</div></div>
    <div class="log-sum-cell"><div class="log-sum-val" style="color:#e76f51">${Math.round(tot.f)}g</div><div class="log-sum-label">Fat</div></div>
    <div class="log-sum-cell"><div class="log-sum-val">${S.log.length}</div><div class="log-sum-label">Items</div></div>`;

  const groups = {};
  S.log.forEach((item, i) => {
    const key = new Date(item.ts).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...item, idx: i });
  });

  const scMap = { Excellent: "#2d6a4f", Good: "#3d7a1a", Moderate: "#b8820c", Poor: "#c04a2a" };

  let html = '<div class="log-list">';
  Object.entries(groups).forEach(([date, items]) => {
    html += `<div class="log-date-group">${date}</div>`;
    items.forEach((item) => {
      const d  = item.data;
      const sc = scMap[d.health_label] || "#888";
      html += `
        <div class="log-item">
          <span class="log-item-emoji">${d.emoji || "🍽"}</span>
          <div class="log-item-info">
            <div class="log-item-name">${d.food_name || "Unknown food"}</div>
            <div class="log-item-meta">${d.serving_size || "—"} · ${d.category || "—"}</div>
            <div class="log-item-macros">
              <span class="log-macro-pill" style="background:#e8f5ee;color:#1b4332">P: ${d.macros?.protein?.g ?? "—"}g</span>
              <span class="log-macro-pill" style="background:#fdf6e3;color:#7a5c0a">C: ${d.macros?.carbs?.g ?? "—"}g</span>
              <span class="log-macro-pill" style="background:#fdeee9;color:#7a2d14">F: ${d.macros?.fat?.g ?? "—"}g</span>
              <span class="log-macro-pill" style="background:#f0ede4;color:#555">Score: <b style="color:${sc}">${d.health_score ?? "—"}/10</b></span>
            </div>
          </div>
          <div class="log-item-kcal">
            <div class="log-kcal-num">${d.calories ?? "—"}</div>
            <div class="log-kcal-unit">kcal</div>
          </div>
          <div class="log-item-actions">
            <button class="log-action-btn re" onclick="quickSearch(${JSON.stringify(item.query)});navigate('home');" title="Re-analyze">↗</button>
            <button class="log-action-btn del" onclick="deleteLogItem(${item.idx})" title="Delete">×</button>
          </div>
        </div>`;
    });
  });
  html += "</div>";
  con.innerHTML = html;
}

// ── Categories ─────────────────────────────────────────────────────────
function initCatPage() {
  const fr = document.getElementById("catFilterRow");
  fr.innerHTML =
    `<button class="cat-filter-btn active" onclick="filterCats('all',this)">All</button>` +
    CATS.map(
      (c) => `<button class="cat-filter-btn" onclick="filterCats('${c.id}',this)">${c.emoji} ${c.name}</button>`
    ).join("");
  renderCatGrid("all");
}

function filterCats(id, btn) {
  document.querySelectorAll(".cat-filter-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderCatGrid(id);
}

function renderCatGrid(id) {
  const cats = id === "all" ? CATS : CATS.filter((c) => c.id === id);
  document.getElementById("catGrid").innerHTML = cats
    .map((c) => `
    <div class="cat-card" onclick="openCatDetail('${c.id}')">
      <span class="cat-emoji">${c.emoji}</span>
      <div class="cat-name">${c.name}</div>
      <div class="cat-count">${c.desc}</div>
    </div>`).join("");
}

function openCatDetail(id) {
  const cat = CATS.find((c) => c.id === id);
  if (!cat) return;
  document.getElementById("catBrowseView").style.display = "none";
  document.getElementById("catDetailView").style.display = "block";
  document.getElementById("catDetailTitle").textContent = cat.emoji + " " + cat.name;
  document.getElementById("catFoodGrid").innerHTML = cat.foods
    .map((f) => `
    <div class="cat-food-item" onclick="analyzeFromCat(${JSON.stringify(f.n)})">
      <span class="cat-food-emoji">${f.e}</span>
      <div>
        <div class="cat-food-name">${f.n}</div>
        <div class="cat-food-kcal">~${f.k} kcal</div>
      </div>
    </div>`).join("");
}

function showCatBrowse() {
  document.getElementById("catBrowseView").style.display = "block";
  document.getElementById("catDetailView").style.display = "none";
}

function analyzeFromCat(q) {
  navigate("home");
  setTimeout(() => {
    document.getElementById("searchInput").value = q;
    analyze(q);
  }, 60);
}

// ── Safe getter helpers ────────────────────────────────────────────────
function safeVal(obj, key, fallback = 0) {
  return obj && obj[key] != null ? obj[key] : fallback;
}
function safeUnit(obj, key, fallback = "") {
  return obj && obj[key] ? obj[key] : fallback;
}

// ── Render Result ──────────────────────────────────────────────────────
function renderResult(d) {
  if (!d) {
    showPanel("errorState");
    document.getElementById("errorState").innerHTML =
      `<div class="error-box">⚠️ <strong>No data returned.</strong> Please try again.</div>`;
    return;
  }

  // Safe defaults for every field
  const foodName    = d.food_name    || "Unknown Food";
  const emoji       = d.emoji        || "🍽";
  const category    = d.category     || "—";
  const serving     = d.serving_size || "—";
  const calories    = d.calories     || 0;
  const dailyPct    = d.daily_calories_pct || 0;
  const healthScore = d.health_score || 0;
  const healthLabel = d.health_label || "Moderate";
  const healthSum   = d.health_summary || "";
  const macros      = d.macros       || {};
  const nutrients   = d.nutrients    || {};
  const units       = d.nutrient_units || {};
  const badges      = d.badges       || [];
  const tips        = d.tips         || [];
  const comparison  = d.comparison   || [];

  const sClass = { Excellent: "excellent", Good: "good", Moderate: "moderate", Poor: "poor" }[healthLabel] || "moderate";
  const mC     = { protein: "#2d6a4f", carbs: "#d4a017", fat: "#e76f51", fiber: "#5f9ea0" };

  const protein = macros.protein || { g: 0, pct_calories: 0 };
  const carbs   = macros.carbs   || { g: 0, pct_calories: 0 };
  const fat     = macros.fat     || { g: 0, pct_calories: 0 };
  const fiber   = macros.fiber   || { g: 0 };

  const mMax = Math.max(protein.g, carbs.g, fat.g, 1);
  const pct  = Math.min(dailyPct, 100);
  const r    = 56, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  const rc   = (sClass === "excellent" || sClass === "good") ? "#2d6a4f" : sClass === "moderate" ? "#d4a017" : "#e76f51";

  const macroRows = [
    { key: "protein", label: "Protein", data: protein },
    { key: "carbs",   label: "Carbs",   data: carbs   },
    { key: "fat",     label: "Fat",     data: fat     },
    { key: "fiber",   label: "Fiber",   data: fiber   },
  ];

  const nKeys = [
    ["saturated_fat", "Sat. Fat"],
    ["sugar",         "Sugar"    ],
    ["sodium",        "Sodium"   ],
    ["potassium",     "Potassium"],
    ["calcium",       "Calcium"  ],
    ["iron",          "Iron"     ],
    ["vitamin_c",     "Vitamin C"],
    ["vitamin_a",     "Vitamin A"],
  ];

  document.getElementById("resultState").innerHTML = `
  <div class="result-grid">

    <!-- Left: Food Card -->
    <div class="food-card">
      <div class="food-header">
        <span class="food-emoji">${emoji}</span>
        <div class="food-name">${foodName}</div>
        <div class="food-cat-badge">${category}</div>
      </div>
      <div class="serving-info">
        <span>⚖️</span>
        <span class="serving-label">Serving size</span>
        <span class="serving-value">${serving}</span>
      </div>
      <div class="calorie-section">
        <div class="calorie-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#e8f5ee" stroke-width="10"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="${rc}"
              stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${dash} ${circ}"/>
          </svg>
          <div class="calorie-center">
            <span class="calorie-num">${calories}</span>
            <span class="calorie-unit">kcal</span>
          </div>
        </div>
        <p class="calorie-daily">${dailyPct}% of daily calories</p>
      </div>
      <div class="macros">
        ${macroRows.map(({ key, label, data }) => {
          const g  = data.g || 0;
          const bp = Math.round((g / mMax) * 100);
          const ex = key === "fiber" ? "" : ` · ${data.pct_calories || "—"}% cal`;
          return `
          <div class="macro-row">
            <div class="macro-header">
              <span class="macro-name">${label}</span>
              <span class="macro-val">${g}g${ex}</span>
            </div>
            <div class="macro-bar-bg">
              <div class="macro-bar-fill" data-w="${bp}" style="background:${mC[key]}"></div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <!-- Right: Details Panel -->
    <div class="right-panel">

      <!-- Health Score -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-icon" style="background:#e8f5ee">🏅</div>
          <span class="section-title">Health Profile</span>
        </div>
        <div class="section-body">
          <div class="health-score-wrap">
            <div class="score-circle ${sClass}">
              ${healthScore}
              <span class="score-label">/10</span>
            </div>
            <p class="score-desc">${healthSum}</p>
          </div>
          <div class="badge-row">
            ${badges.map((b) => `<span class="badge badge-${b.type || "blue"}">${b.text || ""}</span>`).join("")}
          </div>
        </div>
      </div>

      <!-- Vitamins & Minerals -->
      <div class="section-card">
        <div class="section-head">
          <div class="section-icon" style="background:#fdf6e3">💊</div>
          <span class="section-title">Vitamins & Minerals</span>
        </div>
        <div class="section-body">
          <div class="nutrient-grid">
            ${nKeys.map(([k, label]) => {
              const v = nutrients[k];
              if (v == null) return "";
              const u = units[k] || "";
              return `
              <div class="nutrient-chip">
                <div class="nutrient-chip-name">${label}</div>
                <div class="nutrient-chip-val">${v}<span class="nutrient-chip-unit"> ${u}</span></div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>

      <!-- Daily Goal Comparison -->
      ${comparison.length ? `
      <div class="section-card">
        <div class="section-head">
          <div class="section-icon" style="background:#e6f0fb">📊</div>
          <span class="section-title">Daily Goal Comparison</span>
        </div>
        <div class="section-body">
          <div class="comparison-wrap">
            ${comparison.map((c) => {
              const w = Math.min(Math.round(((c.value || 0) / (c.max || 1)) * 100), 100);
              return `
              <div class="cmp-row">
                <span class="cmp-label">${c.label || ""}</span>
                <div class="cmp-bar-wrap">
                  <div class="cmp-bar" style="width:${w}%;background:${c.color || "#2d6a4f"}"></div>
                </div>
                <span class="cmp-val">${c.value || 0}g</span>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>` : ""}

      <!-- Nutrition Tips -->
      ${tips.length ? `
      <div class="section-card">
        <div class="section-head">
          <div class="section-icon" style="background:#fdeee9">💡</div>
          <span class="section-title">Nutrition Tips</span>
        </div>
        <div class="section-body">
          <ul class="tips-list">
            ${tips.map((t, i) => `
            <li class="tip-item">
              <span class="tip-bullet">${i + 1}</span>
              <span>${t}</span>
            </li>`).join("")}
          </ul>
        </div>
      </div>` : ""}

    </div>
  </div>`;

  showPanel("resultState");

  // Animate macro bars
  requestAnimationFrame(() => {
    document.querySelectorAll(".macro-bar-fill[data-w]").forEach((b) => {
      const w = b.getAttribute("data-w");
      setTimeout(() => { b.style.width = w + "%"; }, 60);
    });
  });
}