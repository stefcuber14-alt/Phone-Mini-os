// Симуляция интерфейса смартфона в браузере.

const files = {
  "readme.txt": "Добро пожаловать в Mini Phone OS!",
  "hello.txt": "Привет, мир!",
  "todo.txt": "1. Сделать терминал\n2. Добавить заметки",
};

// Собственные значки приложений (SVG, рисуются кодом)
const ICONS = {
  terminal: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#4ade80" stroke-width="2"/><path d="M6 9l3 3-3 3M12 16h6" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  files: `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#fff"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#eab308" stroke-width="2" stroke-linecap="round"/></svg>`,
  about: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  calc: `<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="3" width="14" height="18" rx="2" fill="#fff"/><rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="#10b981"/><circle cx="8.5" cy="13" r="1.2" fill="#10b981"/><circle cx="12" cy="13" r="1.2" fill="#10b981"/><circle cx="15.5" cy="13" r="1.2" fill="#10b981"/><circle cx="8.5" cy="17" r="1.2" fill="#10b981"/><circle cx="12" cy="17" r="1.2" fill="#10b981"/><circle cx="15.5" cy="17" r="1.2" fill="#10b981"/></svg>`,
};

const FILE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="#3b82f6" stroke-width="2"/></svg>`;
const PHONE_ICON = `<svg viewBox="0 0 24 24" width="64" height="64"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="#3b82f6" stroke-width="2"/><path d="M11 18h2" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/></svg>`;

const APPS = [
  { id: "terminal", name: "Терминал", color: "#111827" },
  { id: "files", name: "Файлы", color: "#f59e0b" },
  { id: "notes", name: "Заметки", color: "#eab308" },
  { id: "about", name: "О системе", color: "#3b82f6" },
  { id: "clock", name: "Часы", color: "#1f2937" },
  { id: "calc", name: "Калькулятор", color: "#10b981" },
];
const DOCK_IDS = ["terminal", "files", "notes", "about"];

const $ = (id) => document.getElementById(id);
const lockScreen = $("lock-screen");
const home = $("home");
const appView = $("app-view");
const appTitle = $("app-title");
const appContent = $("app-content");
const appGrid = $("app-grid");
const dock = $("dock");

// Часы в строке состояния, на экране блокировки
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

// Иконки приложений
function makeIcon(app) {
  const el = document.createElement("button");
  el.className = "app";
  el.innerHTML = `<div class="app-icon" style="background:${app.color}">${ICONS[app.id]}</div><span>${app.name}</span>`;
  el.addEventListener("click", () => openApp(app.id));
  return el;
}

APPS.forEach((app) => appGrid.appendChild(makeIcon(app)));
DOCK_IDS.forEach((id) => dock.appendChild(makeIcon(APPS.find((a) => a.id === id))));

// Открытие приложения на весь экран
function openApp(id) {
  const app = APPS.find((a) => a.id === id);
  appTitle.textContent = app.name;
  appContent.innerHTML = "";
  const builders = {
    terminal: buildTerminal,
    files: buildFiles,
    notes: buildNotes,
    about: buildAbout,
    clock: buildClock,
    calc: buildCalc,
  };
  builders[id](appContent);
  appView.classList.add("open");
}

function closeApp() {
  appView.classList.remove("open");
}

$("back-btn").addEventListener("click", closeApp);

// Разблокировка экрана
function unlock() {
  lockScreen.classList.add("hidden");
}
$("unlock-btn").addEventListener("click", unlock);
lockScreen.addEventListener("click", unlock);

// Кнопка «домой» внизу экрана
$("home-indicator").addEventListener("click", () => {
  closeApp();
  lockScreen.classList.remove("hidden");
});

// Простой жест «провести вверх», чтобы разблокировать
let startY = null;
lockScreen.addEventListener("pointerdown", (e) => { startY = e.clientY; });
lockScreen.addEventListener("pointerup", (e) => {
  if (startY !== null && startY - e.clientY > 60) unlock();
  startY = null;
});

// Приложения

function buildTerminal(container) {
  container.innerHTML = `<div class="terminal-app"><div class="out">Mini OS. Введите help.\n</div><div style="display:flex"><span>$&nbsp;</span><input class="terminal-input" autocomplete="off"></div></div>`;
  const out = container.querySelector(".out");
  const input = container.querySelector(".terminal-input");

  const commands = {
    help: () => "Команды: help, ls, cat <файл>, echo <текст>, date, clear",
    ls: () => Object.keys(files).join("  "),
    cat: (args) => (args[0] in files ? files[args[0]] : `cat: ${args[0] || ""}: нет такого файла`),
    echo: (args) => args.join(" "),
    date: () => new Date().toLocaleString("ru-RU"),
    clear: () => { out.textContent = ""; return ""; },
  };

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const line = input.value.trim();
    input.value = "";
    if (!line) return;
    const [cmd, ...args] = line.split(" ");
    out.textContent += `$ ${line}\n`;
    const result = commands[cmd] ? commands[cmd](args) : `${cmd}: команда не найдена`;
    if (result) out.textContent += result + "\n";
    container.scrollTop = container.scrollHeight;
  });
  setTimeout(() => input.focus(), 350);
}

function buildFiles(container) {
  const list = document.createElement("ul");
  list.className = "list";
  for (const name of Object.keys(files)) {
    const li = document.createElement("li");
    li.innerHTML = FILE_ICON + "<span></span>";
    li.querySelector("span").textContent = name;
    li.addEventListener("click", () => {
      const view = document.createElement("div");
      view.style.whiteSpace = "pre-wrap";
      view.style.padding = "12px";
      view.textContent = files[name];
      container.innerHTML = "";
      container.appendChild(view);
    });
    list.appendChild(li);
  }
  container.appendChild(list);
}

function buildNotes(container) {
  const ta = document.createElement("textarea");
  ta.className = "notes-area";
  ta.placeholder = "Пишите здесь... текст сохраняется в браузере";
  ta.value = localStorage.getItem("miniPhone.notes") || "";
  ta.addEventListener("input", () => localStorage.setItem("miniPhone.notes", ta.value));
  container.appendChild(ta);
}

function buildAbout(container) {
  container.innerHTML = `
    <div class="about-box">
      <div class="big">${PHONE_ICON}</div>
      <h2>Mini Phone OS v0.1</h2>
      <p>Учебная симуляция интерфейса смартфона.</p>
      <p>Написана на HTML, CSS и JavaScript.</p>
    </div>`;
}

function buildClock(container) {
  container.innerHTML = `<div class="about-box"><div class="big" id="big-clock"></div></div>`;
  const big = container.querySelector("#big-clock");
  const update = () => { big.textContent = new Date().toLocaleTimeString("ru-RU"); };
  update();
  const timer = setInterval(update, 1000);
  container.dataset.timer = timer;
}

function buildCalc(container) {
  container.innerHTML = `
    <div style="text-align:right;font-size:40px;padding:12px;" id="display">0</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
      ${["7","8","9","/","4","5","6","*","1","2","3","-","0","C","=","+"]
        .map((k) => `<button data-k="${k}" style="padding:18px;font-size:20px;border:none;border-radius:12px;background:#e2e8f0;">${k}</button>`)
        .join("")}
    </div>`;
  const display = container.querySelector("#display");
  let expr = "";
  container.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (k === "C") { expr = ""; }
      else if (k === "=") {
        try { expr = String(Function(`"use strict";return (${expr})`)()); }
        catch { expr = "Ошибка"; }
      } else { expr += k; }
      display.textContent = expr || "0";
    });
  });
}
