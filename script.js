(() => {
  "use strict";

  const SMASH_URL = "https://fromsmash.com/ringforgestudiodownload";
  const LOCAL_ZIP = "downloads/RingForgeStudio.zip";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Download button: prefer the local zip if it's on the site ---------- */
  (async () => {
    try {
      const res = await fetch(LOCAL_ZIP, { method: "HEAD", cache: "no-store" });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.includes("text/html")) return;
      const size = Number(res.headers.get("content-length") || 0);
      for (const id of ["downloadBtn", "downloadBtn2"]) {
        const a = document.getElementById(id);
        a.href = LOCAL_ZIP;
        a.setAttribute("download", "RingForgeStudio.zip");
        a.removeAttribute("target");
      }
      const mb = size ? ` · ${(size / 1048576).toFixed(1)} MB` : "";
      document.getElementById("downloadNote").innerHTML =
        `Free download · RingForgeStudio.zip${mb} · <a href="${SMASH_URL}" target="_blank" rel="noopener">mirror on Smash</a>`;
    } catch { /* stay on the Smash link */ }
  })();

  /* ---------- Sound (tiny WebAudio synth, no files) ---------- */
  let soundOn = true;
  try { soundOn = localStorage.getItem("rf-sound") !== "off"; } catch {}
  let ctx = null;
  const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

  function blip(freqs, dur = 0.08, type = "square", vol = 0.06) {
    if (!soundOn) return;
    try {
      const ac = audio();
      let t = ac.currentTime;
      for (const f of freqs) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.2);
        o.connect(g).connect(ac.destination);
        o.start(t); o.stop(t + dur * 2.4);
        t += dur;
      }
    } catch {}
  }
  const ringSound = () => blip([1318.5, 1975.5], 0.06, "square", 0.05);
  const oneUpSound = () => blip([523, 659, 784, 1046, 784, 1046], 0.09, "square", 0.05);
  const loseSound = () => blip([880, 740, 622, 523, 440], 0.05, "sawtooth", 0.04);

  const soundBtn = document.getElementById("soundToggle");
  const paintSound = () => {
    soundBtn.textContent = soundOn ? "♪ ON" : "♪ OFF";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  };
  paintSound();
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    try { localStorage.setItem("rf-sound", soundOn ? "on" : "off"); } catch {}
    paintSound();
    if (soundOn) ringSound();
  });

  /* ---------- HUD ---------- */
  const $score = document.getElementById("score");
  const $time = document.getElementById("time");
  const $rings = document.getElementById("rings");
  const $ringsLabel = document.getElementById("rings-label");
  let score = 0, rings = 0, nextOneUp = 100;
  const start = Date.now();

  function renderHud() {
    $score.textContent = score;
    $rings.textContent = rings;
    $ringsLabel.classList.toggle("flash", rings === 0);
  }
  setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000);
    $time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, 1000);
  renderHud();

  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg, ms = 1600) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  /* ---------- Starfield ---------- */
  const canvas = document.getElementById("stars");
  const c2d = canvas.getContext("2d");
  let stars = [];
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((innerWidth * innerHeight) / 5000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      z: Math.random() * 0.9 + 0.1, t: Math.random() * Math.PI * 2,
    }));
  }
  let warp = 1;
  function drawStars() {
    c2d.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of stars) {
      s.x -= s.z * 0.6 * warp;
      if (s.x < -10) { s.x = innerWidth + 10; s.y = Math.random() * innerHeight; }
      s.t += 0.03;
      const a = 0.35 + Math.sin(s.t) * 0.25 + s.z * 0.4;
      c2d.fillStyle = `rgba(200,215,255,${a})`;
      const len = warp > 1.5 ? s.z * warp * 4 : 0;
      c2d.fillRect(s.x, s.y, s.z * 2 + len, s.z * 2);
    }
    warp += (1 - warp) * 0.04;
    requestAnimationFrame(drawStars);
  }
  sizeCanvas();
  addEventListener("resize", sizeCanvas);
  if (!reduceMotion) drawStars(); else { warp = 0; drawStars(); }

  // Scroll fast = warp speed
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const dy = Math.abs(scrollY - lastY);
    lastY = scrollY;
    warp = Math.min(12, warp + dy * 0.05);
  }, { passive: true });

  /* ---------- Collectible rings ---------- */
  const layer = document.getElementById("ringLayer");

  function sparkle(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      const ang = (i / n) * Math.PI * 2;
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(ang) * 34 + "px");
      s.style.setProperty("--dy", Math.sin(ang) * 34 + "px");
      layer.appendChild(s);
      setTimeout(() => s.remove(), 520);
    }
  }

  function collect(x, y) {
    rings++; score += 10;
    ringSound();
    sparkle(x, y);
    if (rings >= nextOneUp) {
      nextOneUp += 100;
      score += 1000;
      oneUpSound();
      toast("1UP!");
    }
    renderHud();
  }

  function spawnRing() {
    const r = document.createElement("span");
    r.className = "fring";
    r.style.left = Math.random() * (innerWidth - 60) + 20 + "px";
    r.style.top = Math.random() * (innerHeight - 160) + 90 + "px";
    r.style.animationDelay = `${-Math.random()}s, ${-Math.random() * 3}s`;
    const grab = (e) => {
      e.preventDefault();
      const b = r.getBoundingClientRect();
      collect(b.left + b.width / 2, b.top + b.height / 2);
      r.remove();
      setTimeout(spawnRing, 1500 + Math.random() * 2500);
    };
    r.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") grab(e); });
    r.addEventListener("pointerdown", grab);
    layer.appendChild(r);
  }
  const ringCount = innerWidth < 680 ? 6 : 12;
  for (let i = 0; i < ringCount; i++) setTimeout(spawnRing, i * 180);

  // Clicking the big hero ring = jackpot
  document.querySelector(".big-ring").parentElement.addEventListener("click", (e) => {
    for (let i = 0; i < 10; i++) setTimeout(() => collect(e.clientX + (Math.random() - .5) * 80, e.clientY + (Math.random() - .5) * 80), i * 60);
  });
  document.querySelector(".hero-art").style.pointerEvents = "auto";
  document.querySelector(".hero-art").style.cursor = "pointer";

  // Press H to "get hit" and scatter your rings
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "h" || e.target.closest("input,textarea") || rings === 0) return;
    const lost = Math.min(rings, 24);
    rings = 0; renderHud(); loseSound();
    const cx = innerWidth / 2, cy = innerHeight / 2;
    for (let i = 0; i < lost; i++) {
      const el = document.createElement("span");
      el.className = "lost-ring";
      layer.appendChild(el);
      let x = cx, y = cy;
      let vx = Math.cos((i / lost) * Math.PI * 2) * (4 + (i % 2) * 2);
      let vy = -Math.abs(Math.sin((i / lost) * Math.PI * 2)) * 8 - 3;
      let life = 0;
      const step = () => {
        vy += 0.35; x += vx; y += vy;
        if (y > innerHeight - 20) { y = innerHeight - 20; vy *= -0.7; }
        el.style.left = x + "px"; el.style.top = y + "px";
        el.style.opacity = life > 90 ? (life % 6 < 3 ? 0 : 1) : 1;
        if (++life < 140) requestAnimationFrame(step); else el.remove();
      };
      step();
    }
  });

  /* ---------- Palette playground ---------- */
  const PALETTES = [
    { name: "Daybreak",  c: ["#5ec8ff", "#a6e3ff", "#3ddc84", "#1e9e57", "#c47a2c", "#8a4f1a", "#ffffff"] },
    { name: "Midnight",  c: ["#0a0f3d", "#1b2470", "#2bc4a9", "#147a6a", "#5a4fb8", "#33297a", "#ffe9a8"] },
    { name: "Sunset",    c: ["#ff8a5c", "#ffc27a", "#e05a7a", "#a0305a", "#7a3b2e", "#4a2018", "#fff1c9"] },
    { name: "Toxic",     c: ["#1a1030", "#2c1a50", "#b6ff3b", "#5fae0f", "#7c2fd1", "#4b1a87", "#e8ffb0"] },
    { name: "Crystal",   c: ["#cdeafe", "#eef8ff", "#7fd3ff", "#3b8fd1", "#a7b6d9", "#6c7aa3", "#ffffff"] },
    { name: "Lava",      c: ["#2a0a0a", "#4a1010", "#ff5a1f", "#c02a0a", "#5a2a1a", "#331208", "#ffd36b"] },
  ];
  // tile types: 0 sky, 1 sky light, 2 grass, 3 grass dark, 4 dirt, 5 dirt dark, 6 cloud/highlight
  const COLS = 24, ROWS = 12;
  function buildMap(cols) {
    const map = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const ground = 8 + Math.round(Math.sin(x / 3.2) * 1.4);
        let t;
        if (y < ground) {
          t = ((x * 7 + y * 3) % 11 === 0 && y < 4) ? 6 : (y < 5 ? 0 : 1);
          if (x >= 9 && x <= 13 && y === 5) t = 3;        // floating platform
          if ((y === 2 && x >= 3 && x <= 5) || (y === 1 && x === 4)) t = 6; // cloud
        } else if (y === ground) t = 2;
        else if (y === ground + 1) t = 3;
        else t = (x + y) % 2 ? 4 : 5;                       // checker dirt
        row.push(t);
      }
      map.push(row);
    }
    return map;
  }

  const levelEl = document.getElementById("level");
  const palettesEl = document.getElementById("palettes");
  const readout = document.getElementById("cursorReadout");
  let cols = innerWidth < 680 ? 16 : COLS;
  let map, current = 0, tiles = [];
  const ringSet = new Set(["10,4", "11,4", "12,4"]);

  function renderLevel() {
    levelEl.innerHTML = "";
    levelEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    tiles = [];
    map.forEach((row, y) => row.forEach((t, x) => {
      const d = document.createElement("div");
      d.className = "tile" + (ringSet.has(`${x},${y}`) ? " ring" : "");
      d.dataset.x = x; d.dataset.y = y;
      levelEl.appendChild(d);
      tiles.push(d);
    }));
    paint();
  }
  function paint() {
    const pal = PALETTES[current].c;
    tiles.forEach((d) => { d.style.backgroundColor = pal[map[d.dataset.y][d.dataset.x]]; });
  }

  PALETTES.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "palette" + (i === 0 ? " active" : "");
    b.innerHTML = `<span class="swatches">${p.c.map((c) => `<i style="background:${c}"></i>`).join("")}</span>${p.name}`;
    b.addEventListener("click", () => setPalette(i));
    palettesEl.appendChild(b);
  });
  function setPalette(i) {
    current = i;
    [...palettesEl.children].forEach((b, j) => b.classList.toggle("active", j === i));
    paint();
    blip([660, 990], 0.05, "triangle", 0.06);
  }

  levelEl.addEventListener("click", (e) => {
    const d = e.target.closest(".tile"); if (!d) return;
    const x = +d.dataset.x, y = +d.dataset.y;
    if (e.shiftKey) {
      const k = `${x},${y}`;
      ringSet.has(k) ? ringSet.delete(k) : ringSet.add(k);
      d.classList.toggle("ring");
      ringSound();
      return;
    }
    map[y][x] = (map[y][x] + 1) % 7;
    d.style.backgroundColor = PALETTES[current].c[map[y][x]];
    blip([440 + map[y][x] * 80], 0.04, "square", 0.04);
  });
  levelEl.addEventListener("pointermove", (e) => {
    const d = e.target.closest(".tile"); if (!d) return;
    const x = +d.dataset.x, y = +d.dataset.y;
    const addr = (0xFF0000 + (y * 0x80 + x)) & 0xFFFF;
    readout.textContent = `X ${String(x).padStart(2, "0")} · Y ${String(y).padStart(2, "0")} · $${addr.toString(16).toUpperCase().padStart(4, "0")}`;
  });

  document.getElementById("shuffleBtn").addEventListener("click", () => {
    const rnd = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    PALETTES[current] = { ...PALETTES[current], c: PALETTES[current].c.map(rnd) };
    const btn = palettesEl.children[current];
    btn.querySelector(".swatches").innerHTML = PALETTES[current].c.map((c) => `<i style="background:${c}"></i>`).join("");
    paint();
    blip([300, 600, 900], 0.04, "square", 0.05);
  });
  const ORIGINAL = PALETTES.map((p) => ({ ...p, c: [...p.c] }));
  document.getElementById("resetBtn").addEventListener("click", () => {
    ORIGINAL.forEach((p, i) => {
      PALETTES[i] = { ...p, c: [...p.c] };
      palettesEl.children[i].querySelector(".swatches").innerHTML = p.c.map((c) => `<i style="background:${c}"></i>`).join("");
    });
    map = buildMap(cols);
    renderLevel();
    blip([900, 600, 300], 0.04, "square", 0.05);
  });

  map = buildMap(cols);
  renderLevel();
  addEventListener("resize", () => {
    const n = innerWidth < 680 ? 16 : COLS;
    if (n !== cols) { cols = n; map = buildMap(cols); renderLevel(); }
  });

  /* ---------- Konami code → super mode ---------- */
  const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === CODE[pos] ? pos + 1 : (k === CODE[0] ? 1 : 0);
    if (pos === CODE.length) {
      pos = 0;
      const on = document.body.classList.toggle("super");
      if (on) {
        rings += 50; score += 5000; renderHud();
        warp = 14;
        toast("SUPER MODE!", 2000);
        oneUpSound();
        for (let i = 0; i < 8; i++) setTimeout(spawnRing, i * 100);
      } else {
        toast("NORMAL MODE");
      }
    }
  });
})();
