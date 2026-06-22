/* ===================================================================
   EDU circuit — Interaktion
   =================================================================== */
(function () {
  "use strict";

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("open");
      });
    });
  }

  /* ---- Aktuelles Jahr im Footer ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Reveal-on-scroll (automatisch, ohne HTML-Änderung) ---- */
  // Inhaltselemente einsammeln und – sofern noch nicht markiert – als Reveal taggen.
  var autoSel = "main h2, main h3, main p, main ul, main ol, main .figure, " +
                ".table-wrap, .calc, .callout, .formula, .contact-card, " +
                ".feature-list li, .page-head h1, .page-head .lead";
  document.querySelectorAll(autoSel).forEach(function (el) {
    if (!el.classList.contains("reveal") && !el.closest(".calc-grid") && !el.closest(".results")) {
      el.classList.add("reveal");
    }
  });

  // Gestaffelte Verzögerung pro Eltern-Container für einen sanften Kaskaden-Effekt.
  var counters = new WeakMap();
  document.querySelectorAll(".reveal").forEach(function (el) {
    var parent = el.parentElement || document.body;
    var idx = counters.get(parent) || 0;
    el.style.transitionDelay = Math.min(idx, 6) * 70 + "ms";
    counters.set(parent, idx + 1);
  });

  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach(function (el) { el.classList.add("in"); el.style.transitionDelay = "0ms"; });
  } else if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Scroll-Fortschrittsbalken oben ---- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);

  /* ---- Header-Schatten beim Scrollen ---- */
  var header = document.querySelector(".site-header");

  /* ---- „Nach oben“-Button ---- */
  var toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Nach oben scrollen");
  toTop.innerHTML = "↑";
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  document.body.appendChild(toTop);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var st = window.pageYOffset || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
      if (header) header.classList.toggle("scrolled", st > 8);
      toTop.classList.toggle("show", st > 480);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Helfer ---- */
  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    return parseFloat(String(el.value).replace(",", "."));
  }
  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function fmtV(v) { return isFinite(v) ? v.toFixed(2) + " V" : "–"; }
  function fmtO(v) {
    if (!isFinite(v)) return "–";
    return v >= 1000 ? (v / 1000).toFixed(2) + " kΩ" : v.toFixed(1) + " Ω";
  }
  function fmtA(v) {
    if (!isFinite(v)) return "–";
    return v >= 1 ? v.toFixed(3) + " A" : (v * 1000).toFixed(2) + " mA";
  }
  function fmtW(v) {
    if (!isFinite(v)) return "–";
    return v >= 1 ? v.toFixed(3) + " W" : (v * 1000).toFixed(2) + " mW";
  }
  function on(id, fn) {
    var b = document.getElementById(id);
    if (b) { b.addEventListener("click", fn); fn(); }
  }

  /* ---- Spannungsteiler: unbelastet ---- */
  on("calcSpU", function () {
    var uq = num("sp_uq"), r1 = num("sp_r1"), r2 = num("sp_r2");
    var rges = r1 + r2;
    set("sp_rges", fmtO(rges));
    set("sp_u1", fmtV(uq * r1 / rges));
    set("sp_u2", fmtV(uq * r2 / rges));
  });

  /* ---- Spannungsteiler: belastet ---- */
  on("calcSpL", function () {
    var uq = num("spl_uq"), r1 = num("spl_r1"), r2 = num("spl_r2"), r3 = num("spl_r3");
    var reff = (r2 * r3) / (r2 + r3);
    set("spl_reff", fmtO(reff));
    set("spl_u2", fmtV(uq * reff / (r1 + reff)));
    set("spl_u2unb", fmtV(uq * r2 / (r1 + r2)));
  });

  /* ---- Stromteiler ---- */
  on("calcSt", function () {
    var iq = num("st_iq"), r1 = num("st_r1"), r2 = num("st_r2");
    set("st_i1", fmtA(iq * r2 / (r1 + r2)));
    set("st_i2", fmtA(iq * r1 / (r1 + r2)));
  });

  /* ---- Überlagerung ---- */
  on("calcUe", function () {
    var u1 = num("ue_u1"), u2 = num("ue_u2");
    set("ue_total", fmtV(u1 + u2));
  });

  /* ---- Versorgung: Ohmsches Gesetz & Leistung ---- */
  on("calcVer", function () {
    var u = num("ver_u"), r = num("ver_r");
    var i = u / r;
    set("ver_i", fmtA(i));
    set("ver_p", fmtW(u * i));
  });
})();
