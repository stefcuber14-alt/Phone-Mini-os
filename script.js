// Mini Phone OS — интерфейс смартфона в браузере.
// Данные хранятся в localStorage. Реальные возможности браузера используются там, где они есть.

const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("miniPhone." + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("miniPhone." + key, JSON.stringify(value)); }
    catch { notify("Память", "Не хватает места в браузере"); }
  },
};

// ---------- Состояние ----------
let settings = store.get("settings", { dark: false, sound: true, wallpaper: "blue" });
let account = store.get("account", { name: "", mail: "" });
let phoneSetup = store.get("setup", null);
let files = store.get("files", { "readme.txt": "Добро пожаловать в Mini Phone OS!" });
let installed = store.get("installed", []);
let photos = store.get("photos", []); // [{id, dataUrl}]
let notifications = [];
let recent = [];

const WALLPAPERS = {
  blue: "linear-gradient(160deg, #3b82f6 0%, #7c3aed 50%, #db2777 100%)",
  night: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #3b0764 100%)",
  sea: "linear-gradient(160deg, #06b6d4 0%, #0ea5e9 50%, #1e3a8a 100%)",
  sun: "linear-gradient(160deg, #f97316 0%, #ef4444 50%, #7c2d12 100%)",
};

const BUILTIN = [
  { id: "files", name: "Файлы", color: "#f59e0b", kind: "files" },
  { id: "notes", name: "Заметки", color: "#eab308", kind: "notes" },
  { id: "calc", name: "Калькулятор", color: "#10b981", kind: "calc" },
  { id: "clock", name: "Часы", color: "#1f2937", kind: "clock" },
  { id: "gallery", name: "Галерея", color: "#ec4899", kind: "gallery" },
  { id: "browser", name: "Браузер", color: "#0ea5e9", kind: "browser" },
  { id: "store", name: "Магазин", color: "#8b5cf6", kind: "store" },
  { id: "settings", name: "Настройки", color: "#64748b", kind: "settings" },
  { id: "about", name: "О системе", color: "#3b82f6", kind: "about" },
];
const DOCK_IDS = ["browser", "gallery", "notes", "settings"];

const ICONS = {
  files: `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#eab308" stroke-width="2" stroke-linecap="round"/></svg>`,
  calc: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="#10b981"/><circle cx="8.5" cy="13" r="1.2" fill="#10b981"/><circle cx="12" cy="13" r="1.2" fill="#10b981"/><circle cx="15.5" cy="13" r="1.2" fill="#10b981"/><circle cx="8.5" cy="17" r="1.2" fill="#10b981"/><circle cx="12" cy="17" r="1.2" fill="#10b981"/><circle cx="15.5" cy="17" r="1.2" fill="#10b981"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  gallery: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="#fff"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`,
  browser: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="#fff" stroke-width="1.6"/></svg>`,
  store: `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 8h16l-1.5 11h-13z" fill="#fff"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="#fff" stroke-width="2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  about: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};
const FILE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="#3b82f6" stroke-width="2"/></svg>`;
const PHONE_ICON = `<svg viewBox="0 0 24 24" width="64" height="64"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="#3b82f6" stroke-width="2"/><path d="M11 18h2" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/></svg>`;

const CATALOG = [
  { id: "timer", name: "Таймер", color: "#ef4444", html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px"><h2>Таймер</h2><div id="t" style="font-size:48px">60</div><button onclick="start()" style="padding:10px 20px;font-size:16px">Старт</button><script>let n=60,id;function start(){clearInterval(id);n=60;document.getElementById('t').textContent=n;id=setInterval(()=>{n--;document.getElementById('t').textContent=n;if(n<=0){clearInterval(id);alert('Время вышло!')}},1000)}<\/script></body></html>` },
  { id: "dice", name: "Кубик", color: "#f97316", html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px"><h2>Кубик</h2><div id="d" style="font-size:72px">?</div><button onclick="document.getElementById('d').textContent=Math.floor(Math.random()*6)+1" style="padding:10px 20px;font-size:16px">Бросить</button></body></html>` },
  { id: "color", name: "Цвет", color: "#06b6d4", html: `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:20px;margin:0"><h2>Случайный цвет</h2><div id="box" style="height:200px;border-radius:16px;background:#ccc"></div><button onclick="document.getElementById('box').style.background='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')" style="margin-top:16px;padding:10px 20px;font-size:16px">Новый цвет</button></body></html>` },
];

// ---------- Экран, тема, обои, полный экран ----------
const screen = $("screen");

function applyTheme() {
  document.body.classList.toggle("dark", settings.dark);
  $("tile-dark").classList.toggle("on", settings.dark);
  $("tile-dark-text").textContent = settings.dark ? "Тёмная" : "Светлая";
}
function applyWallpaper() {
  const bg = settings.wallpaper && settings.wallpaper.startsWith("photo:")
    ? `url(${photos.find((p) => p.id === settings.wallpaper.slice(6))?.dataUrl || ""}) center / cover no-repeat`
    : WALLPAPERS[settings.wallpaper] || WALLPAPERS.blue;
  $("wallpaper").style.background = bg;
}
function applyNav() {
  screen.classList.toggle("buttons", (phoneSetup ? phoneSetup.nav : "gestures") === "buttons");
}
function setSettings(patch) {
  settings = { ...settings, ...patch };
  store.set("settings", settings);
  applyTheme();
  applyWallpaper();
  renderQuick();
}

function isFullscreen() { return !!document.fullscreenElement; }
async function toggleFullscreen() {
  try {
    if (isFullscreen()) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    notify("Экран", "Браузер не разрешил полноэкранный режим");
  }
  renderQuick();
}
document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("fullscreen", isFullscreen());
  renderQuick();
});

// ---------- Статус-бар: время, сеть, батарея ----------
function tick() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const dateCap = date.charAt(0).toUpperCase() + date.slice(1);
  $("status-time").textContent = time;
  $("lock-time").textContent = time;
  $("widget-time").textContent = time;
  $("lock-date").textContent = dateCap;
  $("widget-date").textContent = dateCap;
  $("lock-hello").textContent = account.name ? `Здравствуйте, ${account.name}` : "";
}
tick();
setInterval(tick, 1000);

function networkLabel() {
  if (!navigator.onLine) return { short: "✕", text: "Нет сети" };
  const c = navigator.connection;
  const type = c && c.effectiveType ? c.effectiveType.toUpperCase() : "";
  return { short: type || "Wi-Fi", text: type ? `Подключено (${type})` : "Подключено" };
}
function renderNetwork() {
  const n = networkLabel();
  $("net-icon").textContent = n.short;
  $("tile-net").classList.toggle("on", navigator.onLine);
  $("tile-net-text").textContent = n.text;
}
window.addEventListener("online", renderNetwork);
window.addEventListener("offline", renderNetwork);
renderNetwork();

// Батарея: только там, где браузер её отдаёт (обычно Chrome)
if (navigator.getBattery) {
  navigator.getBattery().then((b) => {
    const update = () => {
      const pct = Math.round(b.level * 100);
      $("batt-text").textContent = pct + "%";
      $("batt-fill").setAttribute("width", String(Math.max(1, 17 * b.level)));
    };
    update();
    b.addEventListener("levelchange", update);
  });
} else {
  $("batt-text").textContent = "—";
}

// ---------- Быстрые настройки ----------
const quick = $("quick");
const openQuick = () => quick.classList.add("open");
const closeQuick = () => quick.classList.remove("open");

function renderQuick() {
  $("tile-sound").classList.toggle("on", settings.sound);
  $("tile-sound-text").textContent = settings.sound ? "Вкл" : "Выкл";
  $("tile-full").classList.toggle("on", isFullscreen());
  $("tile-full-text").textContent = isFullscreen() ? "Вкл" : "Выкл";
  $("tile-dark").classList.toggle("on", settings.dark);
  renderNotifications();
}

function notify(title, text) {
  notifications.unshift({ title, text });
  notifications = notifications.slice(0, 20);
  renderNotifications();
}
function renderNotifications() {
  const list = $("notif-list");
  list.innerHTML = "";
  if (!notifications.length) list.innerHTML = `<div class="notif">Нет уведомлений</div>`;
  notifications.forEach((n) => {
    const div = document.createElement("div");
    div.className = "notif";
    div.innerHTML = `<b></b><span></span>`;
    div.querySelector("b").textContent = n.title;
    div.querySelector("span").textContent = n.text;
    list.appendChild(div);
  });
}

$("tile-net").addEventListener("click", () => notify("Сеть", navigator.onLine ? "Интернет есть" : "Интернета нет"));
$("tile-dark").addEventListener("click", () => setSettings({ dark: !settings.dark }));
$("tile-sound").addEventListener("click", () => setSettings({ sound: !settings.sound }));
$("tile-full").addEventListener("click", toggleFullscreen);
$("clear-notif").addEventListener("click", () => { notifications = []; renderNotifications(); });

// Свайп вниз от статус-бара открывает быстрые настройки
let dragY = null;
const statusBar = $("status-bar");
statusBar.addEventListener("pointerdown", (e) => { dragY = e.clientY; });
statusBar.addEventListener("pointermove", (e) => {
  if (dragY !== null && e.clientY - dragY > 40) { openQuick(); dragY = null; }
});
statusBar.addEventListener("pointerup", () => { dragY = null; });
statusBar.addEventListener("click", () => quick.classList.contains("open") ? closeQuick() : openQuick());

// Закрытие шторки свайпом вверх по ней
let quickStartY = null;
quick.addEventListener("pointerdown", (e) => { quickStartY = e.clientY; });
quick.addEventListener("pointerup", (e) => {
  if (quickStartY !== null && quickStartY - e.clientY > 60) closeQuick();
  quickStartY = null;
});

// ---------- Разблокировка: свайп вверх с анимацией ----------
const lockScreen = $("lock-screen");
let lockStart = null;
let lockDelta = 0;
lockScreen.addEventListener("pointerdown", (e) => { lockStart = e.clientY; lockScreen.classList.add("dragging"); });
lockScreen.addEventListener("pointermove", (e) => {
  if (lockStart === null) return;
  lockDelta = Math.min(0, e.clientY - lockStart);
  lockScreen.style.transform = `translateY(${lockDelta}px)`;
  lockScreen.style.opacity = String(1 + lockDelta / 400);
});
function endLockDrag() {
  if (lockStart === null) return;
  lockScreen.classList.remove("dragging");
  lockScreen.style.transform = "";
  lockScreen.style.opacity = "";
  if (lockDelta < -80) unlock();
  lockStart = null;
  lockDelta = 0;
}
lockScreen.addEventListener("pointerup", endLockDrag);
lockScreen.addEventListener("pointercancel", endLockDrag);
lockScreen.addEventListener("click", () => { if (lockDelta === 0) unlock(); });

function unlock() {
  lockScreen.classList.add("hidden");
  if (!isFullscreen()) toggleFullscreen();
}
function lock() {
  closeApp();
  closeQuick();
  $("recents").classList.remove("open");
  lockScreen.classList.remove("hidden");
}

// ---------- Приложения ----------
const appView = $("app-view");
const appContent = $("app-content");
const appGrid = $("app-grid");
const dock = $("dock");

function allApps() {
  return [...BUILTIN, ...installed.map((a) => ({ ...a, kind: "html" }))];
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
  allApps().forEach((app) => { if (!DOCK_IDS.includes(app.id)) appGrid.appendChild(makeIcon(app)); });
  DOCK_IDS.forEach((id) => dock.appendChild(makeIcon(BUILTIN.find((a) => a.id === id))));
}

function openApp(id) {
  const app = allApps().find((a) => a.id === id);
  if (!app) return;
  recent = [id, ...recent.filter((x) => x !== id)].slice(0, 6);
  $("app-title").textContent = app.name;
  appContent.innerHTML = "";
  const builders = {
    files: buildFiles, notes: buildNotes, calc: buildCalc, clock: buildClock,
    gallery: buildGallery, browser: buildBrowser, store: buildStore,
    settings: buildSettings, about: buildAbout, html: buildHtmlApp,
  };
  builders[app.kind](appContent, app);
  $("recents").classList.remove("open");
  appView.classList.add("open");
}
function closeApp() { appView.classList.remove("open"); }
function goHome() {
  closeApp();
  closeQuick();
  $("recents").classList.remove("open");
}

function renderRecents() {
  const list = $("recents-list");
  list.innerHTML = "";
  const apps = recent.map((id) => allApps().find((a) => a.id === id)).filter(Boolean);
  if (!apps.length) {
    list.innerHTML = `<div class="recent-card">Нет недавних приложений</div>`;
    return;
  }
  apps.forEach((app, i) => {
    const card = document.createElement("div");
    card.className = "recent-card";
    card.style.animationDelay = i * 0.05 + "s";
    card.textContent = app.name;
    card.addEventListener("click", () => openApp(app.id));
    list.appendChild(card);
  });
}

$("back-btn").addEventListener("click", closeApp);
$("nav-back").addEventListener("click", () => {
  if (quick.classList.contains("open")) closeQuick();
  else if ($("recents").classList.contains("open")) $("recents").classList.remove("open");
  else closeApp();
});
$("nav-home").addEventListener("click", goHome);
$("nav-recent").addEventListener("click", () => {
  const r = $("recents");
  if (r.classList.contains("open")) { r.classList.remove("open"); return; }
  renderRecents();
  r.classList.add("open");
});
$("home-indicator").addEventListener("click", goHome);

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
      v.style.cssText = "white-space:pre-wrap;padding:12px;background:var(--card);border-radius:12px";
      v.textContent = name.endsWith(".apk")
        ? "APK — это приложение для Android. Браузер не может его запустить, файл можно только сохранить."
        : files[name];
      container.innerHTML = "";
      container.appendChild(v);
    });
    list.appendChild(li);
  });
  container.appendChild(list);
  container.appendChild(fileUploadButton("Загрузить файл", ".txt,.apk,.html", (f, text) => {
    files[f.name] = f.name.endsWith(".apk") ? `[APK-файл, ${f.size} байт]` : text;
    store.set("files", files);
    notify("Файлы", `Загружен файл: ${f.name}`);
    buildFiles(container);
  }));
}

function fileUploadButton(label, accept, onText) {
  const up = document.createElement("label");
  up.className = "btn";
  up.style.cssText = "display:inline-block;margin-top:12px";
  up.textContent = label;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.style.display = "none";
  input.addEventListener("change", () => {
    const f = input.files[0];
    if (!f) return;
    // APK — бинарный файл: не читаем его как текст.
    if (f.name.toLowerCase().endsWith(".apk")) {
      onText(f, "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onText(f, String(reader.result ?? ""));
    reader.onerror = () => notify("Файлы", "Не удалось прочитать файл");
    reader.readAsText(f);
  });
  up.appendChild(input);
  return up;
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

// Безопасный разбор арифметики: не выполняет пользовательский текст как JavaScript.
function calculateExpression(source) {
  const tokens = source.match(/\d+(?:\.\d+)?|[()+*/-]/g) || [];
  if (tokens.join("") !== source.replace(/\s+/g, "")) throw new Error("Некорректное выражение");
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];

  function primary() {
    const t = take();
    if (t === "+") return primary();
    if (t === "-") return -primary();
    if (t === "(") {
      const value = sum();
      if (take() !== ")") throw new Error("Нет закрывающей скобки");
      return value;
    }
    if (!t || !/^\d+(?:\.\d+)?$/.test(t)) throw new Error("Ожидалось число");
    return Number(t);
  }
  function product() {
    let value = primary();
    while (peek() === "*" || peek() === "/") {
      const op = take(), right = primary();
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = take(), right = product();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }
  if (!tokens.length) throw new Error("Пустое выражение");
  const result = sum();
  if (i !== tokens.length) throw new Error("Лишние символы");
  return result;
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
        try {
          const result = calculateExpression(expr);
          expr = Number.isFinite(result) ? String(Number(result.toFixed(10))) : "Ошибка";
        } catch { expr = "Ошибка"; }
      } else expr += k;
      display.textContent = expr || "0";
    });
  });
}

// ---------- Часы ----------
function buildClock(container) {
  container.innerHTML = `<div class="about-box"><div class="big" id="big-clock"></div></div>`;
  const big = container.querySelector("#big-clock");
  const update = () => { big.textContent = new Date().toLocaleTimeString("ru-RU"); };
  update();
  const timer = setInterval(update, 1000);
  const watch = setInterval(() => {
    if (!container.isConnected) { clearInterval(timer); clearInterval(watch); }
  }, 500);
}

// ---------- Галерея ----------
function buildGallery(container) {
  if (!photos.length) {
    container.innerHTML = `<p>Фото пока нет.</p>`;
  } else {
    const grid = document.createElement("div");
    grid.className = "gallery";
    photos.forEach((p) => {
      const img = document.createElement("img");
      img.src = p.dataUrl;
      img.alt = "Фото";
      img.addEventListener("click", () => buildPhoto(container, p));
      grid.appendChild(img);
    });
    container.appendChild(grid);
  }
  const add = document.createElement("label");
  add.className = "btn";
  add.style.cssText = "display:inline-block;margin-top:12px";
  add.textContent = "Добавить фото";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  input.addEventListener("change", () => {
    const f = input.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Сжимаем картинку, чтобы она поместилась в память браузера
      compressImage(String(reader.result), 900, (dataUrl) => {
        photos.push({ id: String(Date.now()), dataUrl });
        store.set("photos", photos);
        notify("Галерея", "Фото добавлено");
        buildGallery(container);
      });
    };
    reader.readAsDataURL(f);
  });
  add.appendChild(input);
  container.appendChild(add);
}

function buildPhoto(container, p) {
  container.innerHTML = "";
  const v = document.createElement("div");
  v.className = "photo-view";
  v.innerHTML = `<img alt="Фото"><div style="margin-top:12px"></div>`;
  v.querySelector("img").src = p.dataUrl;
  const row = v.querySelector("div");
  const wall = document.createElement("button");
  wall.className = "btn";
  wall.textContent = "Сделать обоями";
  wall.addEventListener("click", () => {
    setSettings({ wallpaper: "photo:" + p.id });
    notify("Обои", "Обои изменены");
  });
  const del = document.createElement("button");
  del.className = "btn ghost";
  del.style.marginLeft = "8px";
  del.textContent = "Удалить";
  del.addEventListener("click", () => {
    photos = photos.filter((x) => x.id !== p.id);
    store.set("photos", photos);
    if (settings.wallpaper === "photo:" + p.id) setSettings({ wallpaper: "blue" });
    buildGallery(container);
  });
  const back = document.createElement("button");
  back.className = "btn ghost";
  back.style.marginTop = "8px";
  back.textContent = "К галерее";
  back.addEventListener("click", () => buildGallery(container));
  row.append(wall, del, document.createElement("br"), back);
  container.appendChild(v);
}

// Уменьшение изображения перед сохранением
function compressImage(src, maxSide, done) {
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const context = c.getContext("2d");
      if (!context) throw new Error("Canvas недоступен");
      context.drawImage(img, 0, 0, c.width, c.height);
      done(c.toDataURL("image/jpeg", 0.8));
    } catch {
      notify("Галерея", "Не удалось обработать это изображение");
    }
  };
  img.onerror = () => notify("Галерея", "Не удалось открыть это изображение");
  img.src = src;
}

// ---------- Браузер ----------
function buildBrowser(container) {
  container.innerHTML = `
    <div class="browser-bar">
      <input id="url" placeholder="Введите адрес, например wikipedia.org" autocomplete="off">
      <button class="btn" id="go">Открыть</button>
    </div>
    <div class="browser-note">Многие сайты запрещают показ во встроенном окне. Тогда откройте их в новой вкладке.</div>
    <button class="btn ghost" id="newtab" style="margin-bottom:8px">Открыть в новой вкладке</button>
    <iframe class="app-frame" id="frame" title="Браузер"></iframe>`;
  const input = container.querySelector("#url");
  const frame = container.querySelector("#frame");
  const toUrl = (raw) => {
    let u = raw.trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  };
  const go = () => {
    const u = toUrl(input.value);
    if (!u) return;
    frame.src = u;
  };
  container.querySelector("#go").addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  container.querySelector("#newtab").addEventListener("click", () => {
    const u = toUrl(input.value);
    if (u) window.open(u, "_blank", "noopener");
  });
}

// ---------- Магазин ----------
function buildStore(container) {
  const intro = document.createElement("p");
  intro.textContent = "Установите приложение или загрузите свой HTML-файл.";
  container.appendChild(intro);

  CATALOG.forEach((app) => {
    const isInstalled = installed.some((a) => a.id === app.id);
    const row = document.createElement("div");
    row.className = "card";
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

  container.appendChild(fileUploadButton("Загрузить свой HTML", ".html,.apk", (f, text) => {
    if (f.name.endsWith(".apk")) {
      files[f.name] = `[APK-файл, ${f.size} байт]`;
      store.set("files", files);
      notify("Магазин", "APK сохранён в Файлы, но запустить его в браузере нельзя");
    } else {
      install({ id: "custom-" + Date.now(), name: f.name.replace(/\.html?$/i, ""), color: "#0ea5e9", html: text });
    }
    container.innerHTML = "";
    buildStore(container);
  }));
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

// HTML-приложение в изолированной песочнице
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
  const info = (text) => {
    const s = document.createElement("span");
    s.style.opacity = "0.7";
    s.textContent = text;
    return s;
  };

  container.appendChild(row("Аккаунт", info(account.name || "не указан")));
  container.appendChild(row("Язык", info(phoneSetup ? phoneSetup.language : "Русский")));
  container.appendChild(row("Навигация", info(phoneSetup && phoneSetup.nav === "buttons" ? "Три кнопки" : "Жесты")));

  const dark = document.createElement("input");
  dark.type = "checkbox";
  dark.checked = settings.dark;
  dark.addEventListener("change", () => setSettings({ dark: dark.checked }));
  container.appendChild(row("Тёмная тема", dark));

  const sound = document.createElement("input");
  sound.type = "checkbox";
  sound.checked = settings.sound;
  sound.addEventListener("change", () => setSettings({ sound: sound.checked }));
  container.appendChild(row("Звук уведомлений", sound));

  const title = document.createElement("div");
  title.style.cssText = "margin:14px 0 6px;font-weight:600";
  title.textContent = "Обои";
  container.appendChild(title);
  const choices = document.createElement("div");
  choices.className = "wallpaper-choices";
  Object.keys(WALLPAPERS).forEach((key) => {
    const b = document.createElement("button");
    b.style.background = WALLPAPERS[key];
    b.className = settings.wallpaper === key ? "selected" : "";
    b.addEventListener("click", () => setSettings({ wallpaper: key }));
    choices.appendChild(b);
  });
  container.appendChild(choices);

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
      <h2>Mini Phone OS v0.4</h2>
      <p>Учебная симуляция интерфейса смартфона.</p>
      <p>Написана на HTML, CSS и JavaScript.</p>
    </div>`;
}

// ---------- Мастер первого запуска ----------
const LANGUAGES = ["Русский", "English", "Deutsch"];
let setupStep = 1;
let chosen = { language: "Русский", nav: "gestures" };

function renderSetupChoices() {
  const langBox = $("lang-choices");
  langBox.innerHTML = "";
  LANGUAGES.forEach((lang) => {
    const b = document.createElement("button");
    b.className = "choice" + (chosen.language === lang ? " selected" : "");
    b.textContent = lang;
    b.addEventListener("click", () => { chosen.language = lang; renderSetupChoices(); });
    langBox.appendChild(b);
  });
  const navBox = $("nav-choices");
  navBox.innerHTML = "";
  [["gestures", "Жесты", "Полоска внизу экрана"], ["buttons", "Три кнопки", "Назад, домой, недавние"]].forEach(([key, title, text]) => {
    const b = document.createElement("button");
    b.className = "choice" + (chosen.nav === key ? " selected" : "");
    b.innerHTML = `<b></b><br><small></small>`;
    b.querySelector("b").textContent = title;
    b.querySelector("small").textContent = text;
    b.addEventListener("click", () => { chosen.nav = key; renderSetupChoices(); });
    navBox.appendChild(b);
  });
}
function showSetupStep(n) {
  setupStep = n;
  document.querySelectorAll(".setup-step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === n);
  });
  $("setup-back").style.visibility = n === 1 ? "hidden" : "visible";
  $("setup-next").textContent = n === 3 ? "Готово" : "Далее";
}
function finishSetup() {
  account = { name: $("acc-name").value.trim(), mail: $("acc-mail").value.trim() };
  phoneSetup = { language: chosen.language, nav: chosen.nav };
  store.set("account", account);
  store.set("setup", phoneSetup);
  $("setup").classList.remove("open");
  applyNav();
  tick();
}
$("setup-next").addEventListener("click", () => {
  if (setupStep < 3) showSetupStep(setupStep + 1);
  else finishSetup();
});
$("setup-back").addEventListener("click", () => { if (setupStep > 1) showSetupStep(setupStep - 1); });

// ---------- Запуск ----------
applyTheme();
applyWallpaper();
applyNav();
renderHome();
renderQuick();
if (!phoneSetup) {
  renderSetupChoices();
  showSetupStep(1);
  $("setup").classList.add("open");
}
