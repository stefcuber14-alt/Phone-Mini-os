// Симуляция интерфейса смартфона в браузере.
// Всё хранится в localStorage: настройки, файлы, заметки, установленные приложения.

const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("miniPhone." + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem("miniPhone." + key, JSON.stringify(value)); },
};

// ---------- Состояние ----------
let settings = store.get("settings", { dark: false, sound: true });
let files = store.get("files", { "readme.txt": "Добро пожаловать в Mini Phone OS!" });
let installed = store.get("installed", []); // [{id, name, color, html}]
let notifications = [];

// Встроенные приложения
const BUILTIN = [
  { id: "files", name: "Файлы", color: "#f59e0b", kind: "files" },
  { id: "notes", name: "Заметки", color: "#eab308", kind: "notes" },
  { id: "calc", name: "Калькулятор", color: "#10b981", kind: "calc" },
  { id: "clock", name: "Часы", color: "#1f2937", kind: "clock" },
  { id: "store", name: "Магазин", color: "#8b5cf6", kind: "store" },
  { id: "settings", name: "Настройки", color: "#64748b", kind: "settings" },
  { id: "about", name: "О системе", color: "#3b82f6", kind: "about" },
];
const DOCK_IDS = ["files", "notes", "store", "settings"];

// Значки встроенных приложений (SVG, рисуются кодом)
const ICONS = {
  files: `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#eab308" stroke-width="2" stroke-linecap="round"/></svg>`,
  calc: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="#10b981"/><circle cx="8.5" cy="13" r="1.2" fill="#10b981"/><circle cx="12" cy="13" r="1.2" fill="#10b981"/><circle cx="15.5" cy="13" r="1.2" fill="#10b981"/><circle cx="8.5" cy="17" r="1.2" fill="#10b981"/><circle cx="12" cy="17" r="1.2" fill="#10b981"/><circle cx="15.5" cy="17" r="1.2" fill="#10b981"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  store: `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 8h16l-1.5 11h-13z" fill="#fff"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="#fff" stroke-width="2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  about: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};
const FILE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="#3b82f6" stroke-width="2"/></svg>`;
const PHONE_ICON = `<svg viewBox="0 0 24 24" width="64" height="64"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="#3b82f6" stroke-width="2"/><path d="M11 18h2" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/></svg>`;

// Готовые HTML-приложения для магазина
const CATALOG = [
  {
    id: "timer", name: "Таймер", color: "#ef4444",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px">
      <h2>Таймер</h2><div id="t" style="font-size:48px">60</div>
      <button onclick="start()" style="padding:10px 20px;font-size:16px">Старт</button>
      <script>let n=60,id;function start(){clearInterval(id);n=60;document.getElementById('t').textContent=n;
      id=setInterval(()=>{n--;document.getElementById('t').textContent=n;if(n<=0){clearInterval(id);alert('Время вышло!')}},1000)}</script>
      </body></html>`,
  },
  {
    id: "dice", name: "Кубик", color: "#f97316",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px">
      <h2>Кубик</h2><div id="d" style="font-size:72px">?</div>
      <button onclick="document.getElementById('d').textContent=Math.floor(Math.random()*6)+1" style="padding:10px 20px;font-size:16px">Бросить</button>
      </body></html>`,
  },
  {
    id: "color", name: "Цвет", color: "#06b6d4",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px;margin:0">
      <h2>Случайный цвет</h2>
      <div id="box" style="height:200px;border-radius:16px;background:#ccc"></div>
      <button onclick="const c='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');document.getElementById('box').style.background=c" style="margin-top:16px;padding:10px 20px;font-size:16px">Новый цвет</button>
      </body></html>`,
  },
];

// ---------- Часы ----------
function tick() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  $("status-time").textContent = time;
  $("lock-time").textContent = time;
  $("lock-date").textContent = date.charAt(0).toUpperCase() + date.slice(1);
}
tick();
setInterval(tick, 1000);

// ---------- Тема ----------
function applyTheme() {
  document.body.classList.toggle("dark", settings.dark);
}
applyTheme();

// ---------- Уведомления ----------
function notify(title, text) {
  notifications.unshift({ title, text });
  renderShade();
}
function renderShade() {
  const list = $("notif-list");
  list.innerHTML = "";
  if (!notifications.length) {
    list.innerHTML = `<div class="notif">Нет уведомлений</div>`;
  }
  notifications.forEach((n) => {
    const div = document.createElement("div");
    div.className = "notif";
    div.innerHTML = `<b></b><span></span>`;
    div.querySelector("b").textContent = n.title;
    div.querySelector("span").textContent = n.text;
    list.appendChild(div);
  });
  $("tg-dark").classList.toggle("on", settings.dark);
  $("tg-sound").classList.toggle("on", settings.sound);
}

// Шторка: открыть/закрыть и жест «потянуть вниз»
const shade = $("shade");
function openShade() { shade.classList.add("open"); }
function closeShade() { shade.classList.remove("open"); }
let dragStartY = null;
const statusBar = $("status-bar");
statusBar.addEventListener("pointerdown", (e) => { dragStartY = e.clientY; });
statusBar.addEventListener("pointermove", (e) => {
  if (dragStartY !== null && e.clientY - dragStartY > 40) { openShade(); dragStartY = null; }
});
statusBar.addEventListener("pointerup", () => { dragStartY = null; });
statusBar.addEventListener("click", () => {
  shade.classList.contains("open") ? closeShade() : openShade();
});
$("tg-dark").addEventListener("click", () => {
  settings.dark = !settings.dark;
  store.set("settings", settings);
  applyTheme();
  renderShade();
});
$("tg-sound").addEventListener("click", () => {
  settings.sound = !settings.sound;
  store.set("settings", settings);
  renderShade();
});
$("clear-notif").addEventListener("click", () => { notifications = []; renderShade(); });
renderShade();

// ---------- Экраны и приложения ----------
const lockScreen = $("lock-screen");
const appView = $("app-view");
const appContent = $("app-content");
const appGrid = $("app-grid");
const dock = $("dock");

function allApps() {
  return [
    ...BUILTIN,
    ...installed.map((a) => ({ ...a, kind: "html" })),
  ];
}

function makeIcon(app) {
  const el = document.createElement("button");
  el.className = "app";
  const icon = ICONS[app.id] || `<span style="font-size:22px;font-weight:700">${(app.name || "?")[0]}</span>`;
  el.innerHTML = `<div class="app-icon" style="background:${app.color}">${icon}</div><span></span>`;
  el.querySelector("span:last-child").textContent = app.name;
  el.addEventListener("click", () => openApp(app.id));
  return el;
}

function renderHome() {
  appGrid.innerHTML = "";
  dock.innerHTML = "";
  allApps().forEach((app) => {
    if (DOCK_IDS.includes(app.id)) return;
    appGrid.appendChild(makeIcon(app));
  });
  DOCK_IDS.forEach((id) => {
    const app = BUILTIN.find((a) => a.id === id);
    dock.appendChild(makeIcon(app));
  });
}

function openApp(id) {
  const app = allApps().find((a) => a.id === id);
  if (!app) return;
  $("app-title").textContent = app.name;
  appContent.innerHTML = "";
  const builders = {
    files: buildFiles, notes: buildNotes, calc: buildCalc, clock: buildClock,
    store: buildStore, settings: buildSettings, about: buildAbout, html: buildHtmlApp,
  };
  builders[app.kind](appContent, app);
  appView.classList.add("open");
}

function closeApp() { appView.classList.remove("open"); }
$("back-btn").addEventListener("click", closeApp);

// Разблокировка и кнопка «домой»
function unlock() { lockScreen.classList.add("hidden"); }
$("unlock-btn").addEventListener("click", unlock);
lockScreen.addEventListener("click", unlock);
$("home-indicator").addEventListener("click", () => {
  closeApp();
  closeShade();
  lockScreen.classList.remove("hidden");
});
let lockStartY = null;
lockScreen.addEventListener("pointerdown", (e) => { lockStartY = e.clientY; });
lockScreen.addEventListener("pointerup", (e) => {
  if (lockStartY !== null && lockStartY - e.clientY > 60) unlock();
  lockStartY = null;
});

// ---------- Файлы ----------
function buildFiles(container) {
  const list = document.createElement("ul");
  list.className = "list";
  const names = Object.keys(files);
  if (!names.length) list.innerHTML = `<li>Файлов нет</li>`;
  names.forEach((name) => {
    const li = document.createElement("li");
    li.innerHTML = FILE_ICON + "<span></span>";
    li.querySelector("span").textContent = name;
    li.addEventListener("click", () => {
      const v = document.createElement("div");
      v.style.whiteSpace = "pre-wrap";
      v.style.padding = "12px";
      v.style.background = "var(--card)";
      v.style.borderRadius = "12px";
      if (name.endsWith(".apk")) {
        v.textContent = "APK — это приложение для Android. Браузер не может его запустить, файл можно только сохранить.";
      } else {
        v.textContent = files[name];
      }
      container.innerHTML = "";
      container.appendChild(v);
    });
    list.appendChild(li);
  });
  container.appendChild(list);

  const up = document.createElement("label");
  up.className = "btn";
  up.style.display = "inline-block";
  up.style.marginTop = "12px";
  up.textContent = "Загрузить файл";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,.apk,.html";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const f = input.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      files[f.name] = f.name.endsWith(".apk") ? `[APK-файл, ${f.size} байт]` : String(reader.result);
      store.set("files", files);
      notify("Файлы", `Загружен файл: ${f.name}`);
      buildFiles(container);
    };
    reader.readAsText(f);
  });
  up.appendChild(input);
  container.appendChild(up);
}

// ---------- Заметки ----------
function buildNotes(container) {
  const ta = document.createElement("textarea");
  ta.className = "notes-area";
  ta.placeholder = "Пишите здесь... текст сохраняется в браузере";
  ta.value = store.get("notes", "");
  ta.addEventListener("input", () => store.set("notes", ta.value));
  container.appendChild(ta);
}

// ---------- Калькулятор ----------
function buildCalc(container) {
  container.innerHTML = `
    <div class="calc-display">0</div>
    <div class="calc-grid">
      ${["7","8","9","/","4","5","6","*","1","2","3","-","0","C","=","+"]
        .map((k) => `<button data-k="${k}">${k}</button>`).join("")}
    </div>`;
  const display = container.querySelector(".calc-display");
  let expr = "";
  container.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (k === "C") expr = "";
      else if (k === "=") {
        try { expr = String(Function(`"use strict";return (${expr})`)()); }
        catch { expr = "Ошибка"; }
      } else expr += k;
      display.textContent = expr || "0";
    });
  });
}

// ---------- Часы (приложение) ----------
function buildClock(container) {
  container.innerHTML = `<div class="about-box"><div class="big" id="big-clock"></div></div>`;
  const big = container.querySelector("#big-clock");
  const update = () => { big.textContent = new Date().toLocaleTimeString("ru-RU"); };
  update();
  const timer = setInterval(update, 1000);
  // Таймер остановится, когда приложение закроют
  const watch = setInterval(() => {
    if (!container.isConnected) { clearInterval(timer); clearInterval(watch); }
  }, 500);
}

// ---------- Магазин ----------
function buildStore(container) {
  const head = document.createElement("div");
  head.innerHTML = `<p>Установите приложение или загрузите свой HTML-файл.</p>`;
  container.appendChild(head);

  CATALOG.forEach((app) => {
    const row = document.createElement("div");
    row.className = "card";
    const isInstalled = installed.some((a) => a.id === app.id);
    row.innerHTML = `<div><b></b><small>HTML-приложение</small></div>`;
    row.querySelector("b").textContent = app.name;
    const btn = document.createElement("button");
    btn.className = "btn" + (isInstalled ? " ghost" : "");
    btn.textContent = isInstalled ? "Удалить" : "Установить";
    btn.addEventListener("click", () => {
      if (isInstalled) uninstall(app.id);
      else install({ id: app.id, name: app.name, color: app.color, html: app.html });
      container.innerHTML = "";
      buildStore(container);
    });
    row.appendChild(btn);
    container.appendChild(row);
  });

  const up = document.createElement("label");
  up.className = "btn";
  up.style.display = "inline-block";
  up.style.marginTop = "12px";
  up.textContent = "Загрузить свой HTML";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".html,.apk";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const f = input.files[0];
    if (!f) return;
    if (f.name.endsWith(".apk")) {
      files[f.name] = `[APK-файл, ${f.size} байт]`;
      store.set("files", files);
      notify("Магазин", "APK сохранён в Файлы, но запустить его в браузере нельзя");
      container.innerHTML = "";
      buildStore(container);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const id = "custom-" + Date.now();
      install({ id, name: f.name.replace(/\.html?$/i, ""), color: "#0ea5e9", html: String(reader.result) });
      container.innerHTML = "";
      buildStore(container);
    };
    reader.readAsText(f);
  });
  up.appendChild(input);
  container.appendChild(up);
}

function install(app) {
  installed = installed.filter((a) => a.id !== app.id);
  installed.push(app);
  store.set("installed", installed);
  renderHome();
  notify("Магазин", `Установлено: ${app.name}`);
}

function uninstall(id) {
  const app = installed.find((a) => a.id === id);
  installed = installed.filter((a) => a.id !== id);
  store.set("installed", installed);
  renderHome();
  if (app) notify("Магазин", `Удалено: ${app.name}`);
}

// Запуск установленного HTML-приложения в песочнице
function buildHtmlApp(container, app) {
  const frame = document.createElement("iframe");
  frame.className = "app-frame";
  frame.setAttribute("sandbox", "allow-scripts");
  frame.srcdoc = app.html;
  container.appendChild(frame);
}

// ---------- Настройки ----------
function buildSettings(container) {
  const row = (label, control) => {
    const r = document.createElement("div");
    r.className = "settings-row";
    r.innerHTML = `<span></span>`;
    r.querySelector("span").textContent = label;
    r.appendChild(control);
    return r;
  };

  const dark = document.createElement("input");
  dark.type = "checkbox";
  dark.checked = settings.dark;
  dark.addEventListener("change", () => {
    settings.dark = dark.checked;
    store.set("settings", settings);
    applyTheme();
    renderShade();
  });
  container.appendChild(row("Тёмная тема", dark));

  const sound = document.createElement("input");
  sound.type = "checkbox";
  sound.checked = settings.sound;
  sound.addEventListener("change", () => {
    settings.sound = sound.checked;
    store.set("settings", settings);
    renderShade();
  });
  container.appendChild(row("Звук уведомлений", sound));

  const reset = document.createElement("button");
  reset.className = "btn";
  reset.textContent = "Сбросить всё";
  reset.addEventListener("click", () => {
    if (!confirm("Удалить все данные Mini Phone OS?")) return;
    Object.keys(localStorage).filter((k) => k.startsWith("miniPhone.")).forEach((k) => localStorage.removeItem(k));
    location.reload();
  });
  container.appendChild(row("Сброс системы", reset));
}

// ---------- О системе ----------
function buildAbout(container) {
  container.innerHTML = `
    <div class="about-box">
      <div class="big">${PHONE_ICON}</div>
      <h2>Mini Phone OS v0.2</h2>
      <p>Учебная симуляция интерфейса смартфона.</p>
      <p>Написана на HTML, CSS и JavaScript.</p>
    </div>`;
}

// Запуск: приложения и главный экран
renderHome();
