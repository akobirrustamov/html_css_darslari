/* ============================================================
   deck.js — dars prezentatsiyasi dvigateli
   • slayd navigatsiyasi (klaviatura, tugma, hash, swipe)
   • sintaksis bo'yash (HTML / CSS) — tashqi kutubxonasiz
   • live kod muharriri (yozasiz — natija darhol chiqadi)
   • mavzu (kunduzgi/tungi), overview, nusxa olish
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 0. Yordamchilar ---------- */
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ============================================================
     1. SINTAKSIS BO'YASH
     ============================================================ */

  /* --- HTML --- */
  function hlHtml(src) {
    let out = "", i = 0;
    const re = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[a-zA-Z][\w-]*(?:"[^"]*"|'[^']*'|[^>"'])*\/?>/g;
    let m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(i, m.index));
      const tok = m[0];
      i = m.index + tok.length;

      if (tok.slice(0, 4) === "<!--") {
        out += '<span class="t-com">' + esc(tok) + "</span>";
      } else if (/^<!DOCTYPE/i.test(tok)) {
        out += '<span class="t-doctype">' + esc(tok) + "</span>";
      } else {
        out += hlTag(tok);
      }
    }
    out += esc(src.slice(i));
    return out;
  }

  function hlTag(tok) {
    // <div class="a" id='b'>  /  </div>  /  <img ... />
    const open = tok.match(/^<\/?/)[0];
    const closeM = tok.match(/\/?>$/);
    const close = closeM ? closeM[0] : ">";
    let body = tok.slice(open.length, tok.length - close.length);

    const nameM = body.match(/^[a-zA-Z][\w-]*/);
    const name = nameM ? nameM[0] : "";
    let rest = body.slice(name.length);

    let out = '<span class="t-punc">' + esc(open) + "</span>";
    out += '<span class="t-tag">' + esc(name) + "</span>";

    // atributlar
    let j = 0, o = "";
    const ar = /([a-zA-Z_@:\-\[\]][\w:.\-\[\]]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g;
    let am;
    while ((am = ar.exec(rest))) {
      o += esc(rest.slice(j, am.index));
      o += '<span class="t-attr">' + esc(am[1]) + "</span>";
      if (am[2]) o += '<span class="t-punc">' + esc(am[2]) + "</span>";
      if (am[3]) o += '<span class="t-str">' + esc(am[3]) + "</span>";
      j = am.index + am[0].length;
    }
    // qiymatsiz atributlar (required, checked ...)
    let tail = rest.slice(j);
    tail = esc(tail).replace(/\b([a-zA-Z][\w-]*)\b/g, '<span class="t-attr">$1</span>');
    out += o + tail;
    out += '<span class="t-punc">' + esc(close) + "</span>";
    return out;
  }

  /* --- CSS --- */
  function hlCss(src) {
    let out = "", i = 0, depth = 0;
    const re = /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|@[\w-]+|[{}();]|#[0-9a-fA-F]{3,8}\b|::?[a-zA-Z][\w-]*(?:\([^)]*\))?|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|ex|pt|dvh|svh)?\b|[A-Za-z_-][\w-]*/g;
    let m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(i, m.index));
      const t = m[0];
      i = m.index + t.length;

      if (t.slice(0, 2) === "/*") { out += '<span class="t-com">' + esc(t) + "</span>"; continue; }
      if (t[0] === '"' || t[0] === "'") { out += '<span class="t-str">' + esc(t) + "</span>"; continue; }
      if (t[0] === "@") { out += '<span class="t-at">' + esc(t) + "</span>"; continue; }
      if (t === "{") { depth++; out += '<span class="t-punc">{</span>'; continue; }
      if (t === "}") { depth--; if (depth < 0) depth = 0; out += '<span class="t-punc">}</span>'; continue; }
      if (t === "(" || t === ")" || t === ";") { out += '<span class="t-punc">' + t + "</span>"; continue; }
      if (t[0] === "#") { out += '<span class="t-color">' + esc(t) + "</span>"; continue; }
      if (t[0] === ":") { out += '<span class="t-pseudo">' + esc(t) + "</span>"; continue; }
      if (/^-?[\d.]/.test(t)) { out += '<span class="t-num">' + esc(t) + "</span>"; continue; }

      // so'z: xossami yoki qiymatmi?
      const after = src.slice(i).match(/^\s*:/);
      if (depth > 0 && after) out += '<span class="t-prop">' + esc(t) + "</span>";
      else if (depth > 0)     out += '<span class="t-val">' + esc(t) + "</span>";
      else                    out += '<span class="t-sel">' + esc(t) + "</span>";
    }
    out += esc(src.slice(i));
    return out;
  }

  /* --- aralash (to'liq hujjat: <style> ichida CSS) --- */
  function hlMix(src) {
    const parts = src.split(/(<style[^>]*>[\s\S]*?<\/style>)/g);
    return parts.map((p) => {
      const m = p.match(/^(<style[^>]*>)([\s\S]*?)(<\/style>)$/);
      if (!m) return hlHtml(p);
      return hlTag(m[1]) + hlCss(m[2]) + hlTag(m[3]);
    }).join("");
  }

  function highlight(code, lang) {
    if (lang === "css") return hlCss(code);
    if (lang === "html") return hlMix(code);
    if (lang === "mix" || lang === "js") return hlMix(code);
    return esc(code);
  }

  /* Kod bloklarini tayyorlash: matnni tozalab, bo'yaydi, "Nusxa" tugmasi qo'shadi */
  function dedent(s) {
    s = s.replace(/^\n/, "").replace(/\s+$/, "");
    const lines = s.split("\n").filter((l) => l.trim());
    let min = Infinity;
    lines.forEach((l) => { const m = l.match(/^[ \t]*/)[0].length; if (m < min) min = m; });
    if (!isFinite(min) || min === 0) return s;
    return s.split("\n").map((l) => l.slice(min)).join("\n");
  }

  function initCode() {
    $$("pre.code").forEach((pre) => {
      if (pre.dataset.done) return;
      pre.dataset.done = "1";
      const codeEl = pre.querySelector("code") || pre;
      const raw = dedent(codeEl.textContent);
      const lang = pre.dataset.lang || "html";
      codeEl.innerHTML = highlight(raw, lang);

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Nusxa";
      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(raw).then(() => {
          btn.textContent = "✓ Olindi";
          btn.classList.add("is-done");
          setTimeout(() => { btn.textContent = "Nusxa"; btn.classList.remove("is-done"); }, 1400);
        });
      });
      pre.appendChild(btn);
    });
  }

  /* ============================================================
     2. LIVE KOD MUHARRIRI
     ============================================================ */
  function initLive() {
    $$(".live").forEach((box) => {
      if (box.dataset.done) return;
      box.dataset.done = "1";

      const ta = $("textarea", box);
      const frame = $("iframe", box);
      if (!ta || !frame) return;

      const start = dedent(ta.value);
      ta.value = start;
      ta.spellcheck = false;
      ta.setAttribute("autocapitalize", "off");
      ta.setAttribute("autocorrect", "off");

      // Tab tugmasi — 2 probel
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const s = ta.selectionStart, en = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 2;
          render();
        }
        e.stopPropagation(); // deck navigatsiyasiga tegmasin
      });

      const wrapDoc = (code) => {
        // Agar to'liq hujjat bo'lsa — o'zini beramiz, aks holda o'raymiz
        if (/<html[\s>]/i.test(code)) return code;
        const base = box.dataset.reset === "off" ? "" :
          "*{box-sizing:border-box}body{margin:0;padding:16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#16181d;background:#fff}";
        return "<!doctype html><html lang=\"uz\"><head><meta charset=\"utf-8\">" +
               "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
               "<base href=\"" + location.href + "\">" +
               (base ? "<style>" + base + "</style>" : "") +
               "</head><body>" + code + "</body></html>";
      };

      let timer;
      const render = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { frame.srcdoc = wrapDoc(ta.value); }, 250);
      };

      ta.addEventListener("input", render);
      frame.srcdoc = wrapDoc(start);

      const reset = $(".live-reset", box);
      if (reset) reset.addEventListener("click", () => { ta.value = start; render(); });
    });
  }

  /* ============================================================
     3. QUIZ (javobni ko'rsatish)
     ============================================================ */
  function initQuiz() {
    $$(".quiz .q").forEach((q) => {
      if (q.dataset.done) return;
      q.dataset.done = "1";
      const b = $("button", q);
      if (!b) return;
      b.addEventListener("click", () => {
        q.classList.toggle("open");
        b.textContent = q.classList.contains("open") ? "Javobni yashirish" : "Javobni ko'rish";
      });
    });
  }

  /* ============================================================
     4. MAVZU (light / dark)
     ============================================================ */
  function initTheme() {
    const KEY = "dars-theme";
    const saved = localStorage.getItem(KEY);
    if (saved) document.documentElement.dataset.theme = saved;

    $$("[data-theme-toggle]").forEach((btn) => {
      const sync = () => {
        const dark = document.documentElement.dataset.theme === "dark";
        btn.textContent = dark ? "☀" : "☾";
        btn.title = dark ? "Kunduzgi rejim" : "Tungi rejim";
      };
      sync();
      btn.addEventListener("click", () => {
        const dark = document.documentElement.dataset.theme === "dark";
        document.documentElement.dataset.theme = dark ? "light" : "dark";
        localStorage.setItem(KEY, dark ? "light" : "dark");
        sync();
      });
    });
  }

  /* ============================================================
     5. DECK — slayd navigatsiyasi
     ============================================================ */
  function initDeck() {
    const stage = $(".deck-stage");
    if (!stage) return;

    const slides = $$(".slide", stage);
    if (!slides.length) return;

    const total = slides.length;
    const counter = $(".counter");
    const bar = $(".deck-progress");
    const prevBtns = $$("[data-prev]");
    const nextBtns = $$("[data-next]");
    const key = "dars-pos-" + (document.body.dataset.lesson || location.pathname);

    let cur = 0;

    function show(n, push) {
      cur = Math.max(0, Math.min(total - 1, n));
      slides.forEach((s, k) => s.classList.toggle("is-active", k === cur));
      if (counter) counter.textContent = (cur + 1) + " / " + total;
      if (bar) bar.style.width = ((cur + 1) / total * 100) + "%";
      prevBtns.forEach((b) => (b.disabled = cur === 0));
      nextBtns.forEach((b) => (b.disabled = cur === total - 1));
      stage.scrollTop = 0;
      if (push !== false) history.replaceState(null, "", "#" + (cur + 1));
      localStorage.setItem(key, String(cur));
      $$(".ov-item").forEach((it, k) => it.classList.toggle("cur", k === cur));
      // faol slayd ichidagi iframe'larni "uyg'otish"
      $$(".live iframe", slides[cur]).forEach((f) => { if (!f.srcdoc) f.dispatchEvent(new Event("wake")); });
    }

    const go = (d) => show(cur + d);

    prevBtns.forEach((b) => b.addEventListener("click", () => go(-1)));
    nextBtns.forEach((b) => b.addEventListener("click", () => go(1)));

    /* Klaviatura */
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "textarea" || tag === "input" || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "ArrowRight": case "PageDown": case " ": case "n":
          e.preventDefault(); go(1); break;
        case "ArrowLeft": case "PageUp": case "p":
          e.preventDefault(); go(-1); break;
        case "Home": e.preventDefault(); show(0); break;
        case "End":  e.preventDefault(); show(total - 1); break;
        case "o": case "O": toggleOverview(); break;
        case "f": case "F":
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
          break;
        case "Escape": closeOverview(); break;
      }
    });

    /* Swipe (telefon uchun) */
    let sx = 0, sy = 0;
    stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    /* Overview */
    const ov = $(".deck-overview");
    const ovGrid = $(".ov-grid");
    if (ovGrid) {
      slides.forEach((s, k) => {
        const h = s.querySelector("h1, h2");
        const b = document.createElement("button");
        b.className = "ov-item";
        b.type = "button";
        b.innerHTML = "<b>Slayd " + (k + 1) + "</b><span>" + esc(h ? h.textContent.trim() : "…") + "</span>";
        b.addEventListener("click", () => { show(k); closeOverview(); });
        ovGrid.appendChild(b);
      });
    }
    function toggleOverview() { if (ov) ov.classList.toggle("open"); }
    function closeOverview() { if (ov) ov.classList.remove("open"); }
    $$("[data-overview]").forEach((b) => b.addEventListener("click", toggleOverview));
    if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) closeOverview(); });

    /* Boshlang'ich holat: #hash → saqlangan → 0 */
    let start = 0;
    const h = parseInt(location.hash.replace("#", ""), 10);
    if (h >= 1 && h <= total) start = h - 1;
    else {
      const saved = parseInt(localStorage.getItem(key), 10);
      if (saved >= 0 && saved < total) start = saved;
    }
    show(start);

    window.addEventListener("hashchange", () => {
      const n = parseInt(location.hash.replace("#", ""), 10);
      if (n >= 1 && n <= total && n - 1 !== cur) show(n - 1);
    });
  }

  /* ============================================================
     6. Ishga tushirish
     ============================================================ */
  function boot() {
    initTheme();
    initCode();
    initLive();
    initQuiz();
    initDeck();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
