/* ==========================================================================
   [AGENCY NAME] — interactions & storytelling
   Vanilla JS, no dependencies. Each feature is an isolated init function.
   ========================================================================== */
(() => {
  "use strict";

  const CONFIG = Object.assign(
    { brandName: "[AGENCY NAME]", contactEmail: "", formEndpoint: "", location: "", social: {} },
    window.SITE_CONFIG || {}
  );
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Single rAF-throttled scroll loop shared by all scroll-driven features */
  const scrollHandlers = [];
  const onScroll = (fn) => { scrollHandlers.push(fn); fn(); };
  let scrollTicking = false;
  const runScroll = () => { scrollTicking = false; scrollHandlers.forEach((fn) => fn()); };
  window.addEventListener("scroll", () => { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(runScroll); } }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(runScroll), { passive: true });

  /* ---------- Brand config ---------- */
  function applyConfig() {
    const { brandName, contactEmail, location, social } = CONFIG;
    $$("[data-brand]").forEach((el) => (el.textContent = brandName));
    $$("[data-brand-label]").forEach((el) => el.setAttribute("aria-label", `${brandName} — back to top`));
    if (contactEmail) $$("[data-email]").forEach((el) => { el.textContent = contactEmail; el.href = `mailto:${contactEmail}`; });
    if (location) $$("[data-location]").forEach((el) => (el.textContent = location));
    $$("[data-social]").forEach((el) => {
      const url = social[el.dataset.social];
      if (url && url !== "#") { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
    });
    document.title = document.title.replace("[AGENCY NAME]", brandName);
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Image fallbacks ---------- */
  function initImageFallbacks() {
    const fail = (img) => {
      const host = img.closest(".media");
      if (host) host.classList.add("is-fallback");
      else img.style.visibility = "hidden";
    };
    $$("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail(img);
      else img.addEventListener("error", () => fail(img), { once: true });
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3000);
  }

  function moveIndicator(indicator, target) {
    if (!indicator || !target) return;
    indicator.style.width = `${target.offsetWidth}px`;
    indicator.style.transform = `translateX(${target.offsetLeft}px)`;
  }
  function placeWithoutTransition(indicator, target) {
    if (!indicator) return;
    indicator.style.transition = "none";
    moveIndicator(indicator, target);
    requestAnimationFrame(() => requestAnimationFrame(() => (indicator.style.transition = "")));
  }

  /* ==========================================================================
     ROLE — the visitor's chosen path personalises the whole story
     ========================================================================== */
  const ROLE_KEY = "agency-role-v1";
  const ROLES = ["brand", "creator", "partner"];
  const ROLE_COPY = {
    "": "We connect brands with creators their audience already trusts — and turn that fit into campaigns, collaborations and partnerships that last.",
    brand: "You want to reach people who no longer watch ads. We find the creators your audience already trusts — and turn that fit into campaigns that actually work.",
    creator: "You’ve built an audience that trusts you. We connect you with brands that fit your voice — and turn reach into fair, long-term partnerships.",
    partner: "You have fans, events or a team worth backing. We find sponsors who add real value — and activate the partnership with creators.",
  };
  const SERVICE_HINT = {
    brand: "Highlighted: what brands use most.",
    creator: "Highlighted: what matters most for creators.",
    partner: "Highlighted: what teams, events & rights holders need.",
  };
  let currentRole = "";
  const roleListeners = [];
  const onRole = (fn) => roleListeners.push(fn);

  function setRole(role, { silent = false } = {}) {
    if (!ROLES.includes(role) || role === currentRole) return;
    currentRole = role;
    document.body.dataset.role = role;
    document.body.classList.add("has-role");
    try { localStorage.setItem(ROLE_KEY, role); } catch { /* storage unavailable */ }
    roleListeners.forEach((fn) => fn(role));
    if (!silent) toast(`Story adapted for ${role === "brand" ? "brands" : role === "creator" ? "creators" : "partners"} ✓`);
  }

  function initRole() {
    const sub = $("#heroSub");
    const buttons = $$(".path-btn");

    onRole((role) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setRole === role)));
      if (sub) {
        sub.classList.add("is-swapping");
        setTimeout(() => { sub.textContent = ROLE_COPY[role]; sub.classList.remove("is-swapping"); }, 250);
      }
      $$(".service-card").forEach((c) => c.classList.toggle("is-for-you", (c.dataset.roles || "").split(" ").includes(role)));
      $$('[data-role-text="services"]').forEach((el) => (el.textContent = SERVICE_HINT[role]));
    });

    // any element with data-set-role switches the path (hero buttons, CTAs …)
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-set-role]");
      if (el) setRole(el.dataset.setRole);
    });

    let saved = "";
    try { saved = localStorage.getItem(ROLE_KEY) || ""; } catch { /* ignore */ }
    if (ROLES.includes(saved)) setRole(saved, { silent: true });
  }

  /* ==========================================================================
     NAVIGATION, STORY RAIL, PROGRESS
     ========================================================================== */
  function initNav() {
    const header = $("#siteHeader");
    const links = $$(".nav-link");
    const indicator = $(".nav-indicator");
    const navLinks = $("#navLinks");
    let active = links[0];

    const light = (link) => links.forEach((l) => l.classList.toggle("is-lit", l === link));
    const setActive = (link) => {
      if (!link || link === active) return;
      active = link;
      links.forEach((l) => {
        l.classList.toggle("is-active", l === link);
        if (l === link) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
      });
      moveIndicator(indicator, link);
      light(link);
    };
    placeWithoutTransition(indicator, active);
    light(active);
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => { moveIndicator(indicator, link); light(link); });
      link.addEventListener("click", () => setActive(link));
    });
    navLinks?.addEventListener("mouseleave", () => { moveIndicator(indicator, active); light(active); });
    document.fonts?.ready.then(() => moveIndicator(indicator, active));
    window.addEventListener("resize", () => moveIndicator(indicator, active), { passive: true });

    const navMap = {
      home: "home", shift: "home", match: "home",
      services: "services", verticals: "services", formats: "services",
      creators: "creators",
      process: "brands", brands: "brands",
      about: "about", contact: "about",
    };
    const chapters = $$("[data-chapter-section]");
    const railLinks = $$("#storyRail a");
    const rail = $("#storyRail");
    const bar = $("#scrollProgress");

    onScroll(() => {
      const probe = window.innerHeight * 0.4;
      let current = chapters[0];
      for (const s of chapters) if (s.getBoundingClientRect().top <= probe) current = s;
      const id = current?.id;
      const link = links.find((l) => l.dataset.section === navMap[id]);
      if (link && !navLinks.matches(":hover")) setActive(link);
      railLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.chapter === id));
      rail?.classList.toggle("on-light", current?.dataset.theme === "light");

      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max) : 0})`;
    });

    // mobile menu
    const btn = $("#menuBtn");
    const menu = $("#mobileMenu");
    const open = (state) => {
      btn.setAttribute("aria-expanded", String(state));
      btn.querySelector("span").textContent = state ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", state);
      document.body.style.overflow = state ? "hidden" : "";
      if (state) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add("is-open"));
        menu.querySelector("a")?.focus({ preventScroll: true });
      } else {
        menu.classList.remove("is-open");
        setTimeout(() => (menu.hidden = true), 400);
      }
    };
    btn?.addEventListener("click", () => open(btn.getAttribute("aria-expanded") !== "true"));
    menu?.addEventListener("click", (e) => { if (e.target.closest("a")) open(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btn?.getAttribute("aria-expanded") === "true") { open(false); btn.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) open(false); });
    void header;
  }

  /* ==========================================================================
     MOTION: reveal, scramble, cursor, magnetic, spotlight, hero parallax
     ========================================================================== */
  function initReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) { items.forEach((el) => el.classList.add("is-in")); return; }
    const groups = new Map();
    items.forEach((el) => { const l = groups.get(el.parentElement) || []; l.push(el); groups.set(el.parentElement, l); });
    groups.forEach((l) => l.forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`)));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    items.forEach((el) => io.observe(el));
  }

  // "Decoding" effect for HUD labels when they enter the viewport
  function initScramble() {
    const els = $$("[data-scramble]");
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const glyphs = "!<>-_/[]{}=+*^?#0123456789ABCDEFXZ";
    const run = (el) => {
      const final = el.dataset.final || el.textContent;
      el.dataset.final = final;
      el.setAttribute("aria-label", final);
      const start = performance.now();
      const dur = 700;
      const tick = (now) => {
        const p = clamp((now - start) / dur);
        const reveal = Math.floor(p * final.length);
        let out = "";
        for (let i = 0; i < final.length; i++) {
          const ch = final[i];
          out += i < reveal || ch === " " ? ch : glyphs[(Math.random() * glyphs.length) | 0];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
    }), { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  function initCursor() {
    if (!finePointer || reduceMotion) return;
    document.documentElement.classList.add("has-cursor");
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px, ${y}px)`; }, { passive: true });
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const interactive = e.target.closest("a, button, .chip, label, summary, [tabindex='0']");
      cursor.classList.toggle("has-label", !!labelled);
      cursor.classList.toggle("is-hover", !!interactive && !labelled);
      label.textContent = labelled ? labelled.dataset.cursor : "";
    });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-hover", "has-label"));
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  function initSpotlight() {
    $$(".spot").forEach((el) => el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
  }

  function initHeroParallax() {
    if (!finePointer || reduceMotion) return;
    const hero = $(".hero");
    const img = $(".hero__photo img");
    const video = $("#heroVideo");
    if (!hero || !img) return;
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      img.style.setProperty("--px", `${nx * -18}px`);
      img.style.setProperty("--py", `${ny * -12}px`);
      video?.style.setProperty("--vx", `${nx * 14}px`);
      video?.style.setProperty("--vy", `${ny * 10}px`);
    });
  }

  /* ---------- Hero video: respect reduced motion / data saver, pause off-screen ---------- */
  function initHeroVideo() {
    const video = $("#heroVideo");
    if (!video) return;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduceMotion || saveData) {
      video.removeAttribute("autoplay");
      video.pause();
      if (saveData) { $$("source", video).forEach((s) => s.remove()); video.load(); }
      return;
    }
    const play = () => video.play().catch(() => { /* autoplay blocked: poster stays visible */ });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => (en.isIntersecting ? play() : video.pause()), { threshold: 0.05 }).observe(video);
    } else play();
    document.addEventListener("visibilitychange", () => (document.hidden ? video.pause() : play()));
  }

  /* ==========================================================================
     CHAPTER 01 — sticky "shift" story
     ========================================================================== */
  function initShift() {
    const section = $("#shift");
    if (!section || reduceMotion) { $$(".frame").forEach((f) => f.classList.add("is-active")); return; }
    const frames = $$(".frame", section);
    const bars = $$(".shift__bar i", section);
    let current = -1;
    onScroll(() => {
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = clamp(-r.top / (total || 1));
      const idx = Math.min(frames.length - 1, Math.floor(p * frames.length));
      bars.forEach((b, i) => b.style.setProperty("--fill", clamp(p * frames.length - i).toFixed(3)));
      if (idx !== current) {
        current = idx;
        section.dataset.frame = String(idx);
        frames.forEach((f, i) => { f.classList.toggle("is-active", i === idx); f.classList.toggle("is-past", i < idx); });
      }
    });
  }

  /* ==========================================================================
     CHAPTER 02 — the match network
     ========================================================================== */
  const NODES = {
    agency: {
      kicker: "The connection", title: "We sit in the middle.",
      lead: "We understand what each side needs — and only connect them when it genuinely fits.",
      bring: ["Curation & judgement", "Contracts & processes", "Creative direction"],
      get: ["Matches that last", "Happy partners on all sides"],
    },
    brand: {
      kicker: "Brands", title: "You want to reach people — for real.",
      lead: "Your audience scrolls past ads. It doesn’t scroll past people it trusts.",
      bring: ["Your product & story", "Goals, budget & timing"],
      get: ["Curated creators who fit", "Concept & execution", "Transparent reporting"],
    },
    creator: {
      kicker: "Creators", title: "You have an audience that trusts you.",
      lead: "Turn that trust into partnerships you’re proud to show — without selling out.",
      bring: ["Your voice & content", "Your community"],
      get: ["Brand deals that fit you", "Fair rates & contracts", "Long-term partners"],
    },
    partner: {
      kicker: "Partners", title: "You have fans, events or a team.",
      lead: "Teams, athletes, events and publishers — we find sponsors who add real value.",
      bring: ["Your assets & reach", "Your fans & events"],
      get: ["Sponsors who fit", "Activation with creators", "Partner management"],
    },
  };
  function initMatch() {
    const net = $("#network");
    if (!net) return;
    const nodes = $$(".node", net);
    const lines = $$(".network__line", net);
    const panel = $("#nodePanel");
    const cta = $("#npCta");
    let selected = "agency";

    const show = (key) => {
      selected = key;
      const d = NODES[key];
      nodes.forEach((n) => n.classList.toggle("is-active", n.dataset.node === key));
      lines.forEach((l) => l.classList.toggle("is-active", key === "agency" || l.dataset.node === key));
      $("#npKicker").textContent = d.kicker;
      $("#npTitle").textContent = d.title;
      $("#npLead").textContent = d.lead;
      $("#npBring").innerHTML = d.bring.map((t) => `<li>${t}</li>`).join("");
      $("#npGet").innerHTML = d.get.map((t) => `<li>${t}</li>`).join("");
      cta.hidden = key === "agency";
      cta.innerHTML = currentRole === key
        ? `That’s my path ✓`
        : `That’s me <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>`;
      panel.classList.remove("is-updating"); void panel.offsetWidth; panel.classList.add("is-updating");
    };
    nodes.forEach((n) => {
      n.addEventListener("click", () => show(n.dataset.node));
      n.addEventListener("mouseenter", () => { if (finePointer) show(n.dataset.node); });
    });
    cta.addEventListener("click", () => { setRole(selected); show(selected); });
    onRole((role) => {
      nodes.forEach((n) => n.classList.toggle("is-mine", n.dataset.node === role));
      show(role);
    });
    show(currentRole || "agency");
    if (currentRole) nodes.forEach((n) => n.classList.toggle("is-mine", n.dataset.node === currentRole));
  }

  /* ==========================================================================
     CHAPTER 04 — verticals accordion
     ========================================================================== */
  function initVerticals() {
    const rows = $$(".vert-row");
    rows.forEach((row) => {
      const btn = $(".vert-row__head", row);
      btn.addEventListener("click", () => {
        const open = !row.classList.contains("is-open");
        rows.forEach((r) => { r.classList.remove("is-open"); $(".vert-row__head", r).setAttribute("aria-expanded", "false"); });
        row.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
    $(".vert-row--feature .vert-row__head")?.click();
  }

  /* ==========================================================================
     CHAPTER 05 — draggable gallery
     ========================================================================== */
  function initGallery() {
    const g = $("#gallery");
    if (!g) return;
    const progress = $("#galProgress");
    const step = () => (g.querySelector(".format-card")?.offsetWidth || 300) + 16;
    $("#galPrev")?.addEventListener("click", () => g.scrollBy({ left: -step(), behavior: "smooth" }));
    $("#galNext")?.addEventListener("click", () => g.scrollBy({ left: step(), behavior: "smooth" }));
    g.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); g.scrollBy({ left: step(), behavior: "smooth" }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); g.scrollBy({ left: -step(), behavior: "smooth" }); }
    });
    const update = () => {
      const max = g.scrollWidth - g.clientWidth;
      const visible = g.clientWidth / g.scrollWidth;
      const p = max > 0 ? g.scrollLeft / max : 1;
      progress.style.transform = `scaleX(${clamp(visible + (1 - visible) * p)})`;
    };
    g.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    // mouse drag (touch uses native scrolling)
    let down = false, startX = 0, startLeft = 0, moved = false;
    g.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startLeft = g.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; g.classList.add("is-dragging"); }
      g.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      g.classList.remove("is-dragging");
      if (moved) {
        const s = step();
        g.scrollTo({ left: Math.round(g.scrollLeft / s) * s, behavior: "smooth" });
      }
    });
  }

  /* ==========================================================================
     CHAPTER 06 — creator match scan
     ========================================================================== */
  function initScan() {
    const card = $("#scanCard");
    if (!card) return;
    const items = $$("#scanList li");
    const status = $("#scanStatus");
    const finish = () => { items.forEach((li) => li.classList.add("is-on")); status.textContent = "Match found"; };
    if (reduceMotion || !("IntersectionObserver" in window)) { finish(); return; }
    let timers = [];
    const play = () => {
      timers.forEach(clearTimeout); timers = [];
      card.classList.add("is-scanning");
      items.forEach((li) => li.classList.remove("is-on"));
      status.textContent = "Analysing match…";
      items.forEach((li, i) => timers.push(setTimeout(() => li.classList.add("is-on"), 700 + i * 650)));
      timers.push(setTimeout(() => { status.textContent = "Match found"; }, 700 + items.length * 650));
    };
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) play();
      else { card.classList.remove("is-scanning"); timers.forEach(clearTimeout); }
    }), { threshold: 0.35 });
    io.observe(card);
    card.addEventListener("click", play);
  }

  /* ==========================================================================
     CHAPTER 07 — process timeline
     ========================================================================== */
  function initProcess() {
    const wrap = $("#processSteps");
    if (!wrap) return;
    const steps = $$(".process-step", wrap);
    const num = $("#processNum");
    onScroll(() => {
      const r = wrap.getBoundingClientRect();
      const anchor = window.innerHeight * 0.55;
      const p = clamp((anchor - r.top) / r.height);
      wrap.style.setProperty("--progress", p.toFixed(3));
      let cur = -1;
      steps.forEach((s, i) => {
        const sr = s.getBoundingClientRect();
        const on = sr.top < anchor;
        s.classList.toggle("is-active", on);
        if (on) cur = i;
      });
      steps.forEach((s, i) => s.classList.toggle("is-current", i === cur));
      if (num) num.textContent = String(Math.max(cur, 0) + 1).padStart(2, "0");
    });
  }

  /* ==========================================================================
     CHAPTER 08 — role-based planner
     ========================================================================== */
  const PLANNERS = {
    brand: {
      groups: [
        { key: "goal", label: "What is your main goal?", options: [["awareness", "Awareness"], ["launch", "Product launch"], ["conversion", "Performance & sales"], ["community", "Community & loyalty"]] },
        { key: "vertical", label: "Which vertical?", options: [["lifestyle", "Lifestyle & Beauty"], ["fitness", "Fitness & Sport"], ["tech", "Tech & Digital"], ["gaming", "Gaming & E-Sport"], ["entertainment", "Entertainment"], ["food", "Food & Travel"]] },
        { key: "platforms", label: "Which platforms?", multi: true, options: [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["twitch", "Twitch"], ["podcast", "Podcasts"], ["events", "Events & live"]] },
        { key: "timeline", label: "What time frame?", options: [["oneoff", "Single campaign"], ["quarter", "Around 3 months"], ["longterm", "Long-term partnership"]] },
      ],
      defaults: { goal: "awareness", vertical: "lifestyle", platforms: ["instagram", "tiktok"], timeline: "quarter" },
      data: {
        goal: {
          awareness: { mix: "A few reach-driven lead creators, supported by a wider ring of credible mid-size voices for frequency.", kpis: ["Reach", "View-through rate", "Share of voice"] },
          launch: { mix: "Early-access seeding for authentic first impressions, followed by a coordinated launch-day wave.", kpis: ["Launch reach", "Saves & shares", "Launch-page traffic"] },
          conversion: { mix: "Trusted niche creators with high audience fit, tracked links or codes and room to optimise between flights.", kpis: ["CTR", "Conversions", "Cost per acquisition"] },
          community: { mix: "A small group of long-term ambassadors who show up repeatedly — familiarity over one-off placements.", kpis: ["Recurring engagement", "Community growth", "Sentiment"] },
        },
        vertical: {
          lifestyle: "Aesthetic-led storytelling, try-ons and editorial shoots where the product lives naturally in the creator’s world.",
          fitness: "Credible athletes and coaches, challenge formats and honest product tests over a realistic time span.",
          tech: "In-depth reviews, unboxings and use-case content from creators whose audiences make buying decisions in tech.",
          gaming: "Stream integrations, team or tournament partnerships and event activations — our special competence.",
          entertainment: "Personality-driven sketches, series and cultural moments that people share because they want to.",
          food: "Everyday integrations, recipes and destination stories that feature the brand without breaking the moment.",
        },
        platforms: { instagram: "Reels, Stories & carousels", tiktok: "native short-form & series", youtube: "YouTube integrations & Shorts", twitch: "Twitch live integrations", podcast: "host-read podcast spots", events: "live & event content" },
        timeline: { oneoff: "One focused flight — clear brief, tight production, concise report.", quarter: "Several waves over ~3 months, with learnings applied between them.", longterm: "An ambassador programme with recurring content and a shared roadmap." },
      },
      compute(s, L) {
        const d = this.data, g = d.goal[s.goal];
        return {
          title: `${L.goal} · ${L.vertical}`,
          rows: [
            ["Creator mix", g.mix],
            ["Formats", s.platforms.length ? s.platforms.map((k) => d.platforms[k]).join(" · ") : "Open — we’ll recommend the right channels."],
            ["Vertical angle", d.vertical[s.vertical]],
            ["Set-up", d.timeline[s.timeline]],
          ],
          tags: g.kpis,
          summary: `Hi! I'm reaching out as a brand.\n— Goal: ${L.goal}\n— Vertical: ${L.vertical}\n— Platforms: ${L.platforms || "open"}\n— Time frame: ${L.timeline}\n\nAbout our brand / product:\n`,
        };
      },
    },
    creator: {
      groups: [
        { key: "stage", label: "Where are you right now?", options: [["starting", "Just starting out"], ["growing", "Growing steadily"], ["established", "Established"]] },
        { key: "platforms", label: "Where is your audience?", multi: true, options: [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["twitch", "Twitch"], ["podcast", "Podcast"]] },
        { key: "topic", label: "What’s your main topic?", options: [["lifestyle", "Lifestyle & Beauty"], ["fitness", "Fitness & Sport"], ["tech", "Tech"], ["gaming", "Gaming & Streaming"], ["entertainment", "Entertainment"], ["food", "Food & Travel"]] },
        { key: "wish", label: "What do you want most?", options: [["first", "First brand deals"], ["steady", "More consistent deals"], ["management", "Full management"], ["ambassador", "Long-term ambassadorships"]] },
      ],
      defaults: { stage: "growing", platforms: ["instagram", "tiktok"], topic: "lifestyle", wish: "steady" },
      data: {
        stage: {
          starting: "Sharpen your positioning first: a clear niche, a simple media kit and 2–3 showcase pieces brands can picture themselves in.",
          growing: "Build a repeatable deal flow: a professional media kit, rate logic and a shortlist of brands that genuinely fit.",
          established: "Protect and grow your value: strategic brand portfolio, better terms and fewer, bigger, longer partnerships.",
        },
        wish: {
          first: { plan: "Project-based support for your first deals — pitch, pricing and contract check.", tags: ["Media kit", "Pricing", "Contract check"] },
          steady: { plan: "Active matching with brands in your niche and a pipeline that doesn’t depend on luck.", tags: ["Deal flow", "Negotiation", "Brand fit"] },
          management: { plan: "Full representation: we handle inbound, outbound, negotiation and admin — you create.", tags: ["Representation", "Admin", "Strategy"] },
          ambassador: { plan: "Long-term partnerships with clear roadmaps instead of one-off posts.", tags: ["Ambassadorships", "Roadmap", "Exclusivity"] },
        },
        topic: {
          lifestyle: "Fashion, beauty and lifestyle brands value aesthetic consistency — your feed is your portfolio.",
          fitness: "Sport & wellbeing brands look for credibility — honest testing and real routines win.",
          tech: "Tech brands want expertise — reviews and deep-dives with a trusted point of view.",
          gaming: "Gaming is our special competence: stream integrations, publishers, peripherals, teams and events.",
          entertainment: "Entertainment brands buy personality — formats and series that feel like you.",
          food: "Food & travel partners want authentic everyday moments and destinations that fit your story.",
        },
      },
      compute(s, L) {
        const d = this.data, w = d.wish[s.wish];
        return {
          title: `${L.stage} · ${L.topic}`,
          rows: [
            ["Your next step", d.stage[s.stage]],
            ["How we’d help", w.plan],
            ["Your niche", d.topic[s.topic]],
            ["Channels", L.platforms || "Tell us where your audience lives."],
          ],
          tags: w.tags,
          summary: `Hi! I'm reaching out as a creator.\n— Stage: ${L.stage}\n— Platforms: ${L.platforms || "—"}\n— Topic: ${L.topic}\n— Looking for: ${L.wish}\n\nA bit about me and my channel:\n`,
        };
      },
    },
    partner: {
      groups: [
        { key: "type", label: "What are you?", options: [["team", "Team / Club"], ["athlete", "Athlete"], ["event", "Event / Tournament"], ["publisher", "Publisher / Org"]] },
        { key: "assets", label: "What can partners activate?", multi: true, options: [["kit", "Jersey / Kit"], ["social", "Social & content"], ["live", "Live events"], ["naming", "Naming rights"], ["community", "Community / Discord"]] },
        { key: "goal", label: "What do you need?", options: [["first", "First sponsor"], ["more", "More / better sponsors"], ["activation", "Activation ideas"]] },
      ],
      defaults: { type: "team", assets: ["kit", "social"], goal: "first" },
      data: {
        type: {
          team: "Package what fans see and feel — match days, content, players and community — into clear sponsor tiers.",
          athlete: "Your personal brand is the asset: performance, story and channels, packaged for the right brands.",
          event: "Turn your event into a platform: on-site visibility plus content that lives before and after the day.",
          publisher: "Combine reach, IP and community into partnership products brands can plug into.",
        },
        goal: {
          first: { plan: "Build your sponsorship deck, value your assets realistically and approach brands that fit.", tags: ["Deck", "Valuation", "Outreach"] },
          more: { plan: "Review existing deals, upgrade packages and open conversations with stronger-fitting sponsors.", tags: ["Package upgrade", "Renewals", "New sponsors"] },
          activation: { plan: "Make partnerships visible: creator collaborations, content series and live activations.", tags: ["Creators", "Content", "Live activation"] },
        },
        assets: { kit: "kit visibility", social: "social & content", live: "live moments", naming: "naming rights", community: "community access" },
      },
      compute(s, L) {
        const d = this.data, g = d.goal[s.goal];
        return {
          title: `${L.type} · ${L.goal}`,
          rows: [
            ["Your angle", d.type[s.type]],
            ["Plan", g.plan],
            ["Assets", s.assets.length ? s.assets.map((k) => d.assets[k]).join(" · ") : "Let’s map what you have together."],
            ["Plus", "Creator activations that carry the partnership far beyond the venue or kit."],
          ],
          tags: g.tags,
          summary: `Hi! I'm reaching out as a partner.\n— Type: ${L.type}\n— Assets: ${L.assets || "—"}\n— Need: ${L.goal}\n\nAbout us:\n`,
        };
      },
    },
  };

  function initPlanner() {
    const form = $("#plannerForm");
    if (!form) return;
    const tabs = $$("[data-role-tab]");
    const indicator = $("#pathTabs .segmented__indicator");
    const out = { title: $("#planTitle"), rows: $("#planRows"), tags: $("#planTags") };
    const states = {};
    let role = "brand";

    const labelsFor = (cfg, s) => {
      const L = {};
      cfg.groups.forEach((g) => {
        const map = Object.fromEntries(g.options);
        L[g.key] = Array.isArray(s[g.key]) ? s[g.key].map((v) => map[v]).join(", ") : map[s[g.key]];
      });
      return L;
    };

    const renderForm = () => {
      const cfg = PLANNERS[role];
      const s = states[role];
      form.innerHTML = cfg.groups.map((g, i) => `
        <fieldset class="planner__step">
          <legend><span>0${i + 1}</span>${g.label}${g.multi ? "<em>Select multiple</em>" : ""}</legend>
          <div class="chips" data-group="${g.key}" data-type="${g.multi ? "multi" : "single"}">
            ${g.options.map(([v, l]) => {
              const on = g.multi ? s[g.key].includes(v) : s[g.key] === v;
              return `<button type="button" class="chip" data-value="${v}" aria-pressed="${on}">${l}</button>`;
            }).join("")}
          </div>
        </fieldset>`).join("");
      form.classList.remove("is-swapping"); void form.offsetWidth; form.classList.add("is-swapping");
    };

    const renderResult = (flash = true) => {
      const cfg = PLANNERS[role];
      const res = cfg.compute(states[role], labelsFor(cfg, states[role]));
      out.title.textContent = res.title;
      out.rows.innerHTML = res.rows.map(([dt, dd]) => `<div><dt>${dt}</dt><dd${flash ? ' class="is-updated"' : ""}>${dd}</dd></div>`).join("");
      out.tags.innerHTML = res.tags.map((t) => `<li>${t}</li>`).join("");
      return res;
    };

    const selectTab = (r, { focus = false } = {}) => {
      role = r;
      if (!states[r]) states[r] = JSON.parse(JSON.stringify(PLANNERS[r].defaults));
      tabs.forEach((t) => {
        const on = t.dataset.roleTab === r;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) { moveIndicator(indicator, t); if (focus) t.focus(); }
      });
      renderForm();
      renderResult();
    };

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => { selectTab(t.dataset.roleTab); setRole(t.dataset.roleTab); });
      t.addEventListener("keydown", (e) => {
        const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        selectTab(next.dataset.roleTab, { focus: true });
      });
    });

    form.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const group = chip.closest(".chips");
      const key = group.dataset.group;
      const v = chip.dataset.value;
      const s = states[role];
      if (group.dataset.type === "multi") {
        const set = new Set(s[key]);
        set.has(v) ? set.delete(v) : set.add(v);
        s[key] = Array.from(set);
        chip.setAttribute("aria-pressed", String(set.has(v)));
      } else {
        if (s[key] === v) return;
        s[key] = v;
        $$(".chip", group).forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      }
      renderResult();
    });

    $("#plannerReset")?.addEventListener("click", () => {
      states[role] = JSON.parse(JSON.stringify(PLANNERS[role].defaults));
      renderForm(); renderResult();
      toast("Planner reset");
    });
    $("#plannerSend")?.addEventListener("click", () => {
      const res = renderResult(false);
      window.dispatchEvent(new CustomEvent("prefill-contact", { detail: { role, message: res.summary } }));
    });

    onRole((r) => { if (r !== role) selectTab(r); });
    selectTab(currentRole || "brand");
    placeWithoutTransition(indicator, tabs.find((t) => t.getAttribute("aria-selected") === "true"));
    const sync = () => moveIndicator(indicator, tabs.find((t) => t.getAttribute("aria-selected") === "true"));
    document.fonts?.ready.then(sync);
    window.addEventListener("resize", sync, { passive: true });
  }

  /* ---------- FAQ: one open at a time ---------- */
  function initFaq() {
    const items = $$(".faq-item");
    items.forEach((d) => d.addEventListener("toggle", () => { if (d.open) items.forEach((o) => { if (o !== d) o.open = false; }); }));
  }

  /* ==========================================================================
     CHAPTER 10 — contact form
     ========================================================================== */
  const DRAFT_KEY = "agency-contact-draft-v1";
  const storage = {
    get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; } },
    set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* ignore */ } },
    clear() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } },
  };

  function initContact() {
    const form = $("#contactForm");
    if (!form) return;
    const roleSwitch = $("#roleSwitch");
    const indicator = $(".segmented__indicator", roleSwitch);
    const roleLabels = $$("label", roleSwitch);
    const groups = $$(".role-fields", form);
    const success = $("#formSuccess");
    const status = $("#formStatus");
    const submitBtn = $("#submitBtn");
    const formRole = () => form.elements.role.value || "brand";

    const setFormRole = (role, { animate = true } = {}) => {
      const radio = $(`input[value="${role}"]`, roleSwitch);
      if (!radio) return;
      radio.checked = true;
      roleLabels.forEach((l) => l.classList.toggle("is-checked", l.contains(radio)));
      if (animate) moveIndicator(indicator, radio.closest("label"));
      else placeWithoutTransition(indicator, radio.closest("label"));
      groups.forEach((g) => { const on = g.dataset.role === role; g.hidden = !on; g.disabled = !on; });
    };
    roleSwitch.addEventListener("change", () => { setFormRole(formRole()); setRole(formRole()); saveDraft(); });
    onRole((r) => { if (r !== formRole()) setFormRole(r); });

    window.addEventListener("prefill-contact", (e) => {
      const { role, message } = e.detail || {};
      if (!success.hidden) resetForm();
      if (role) { setFormRole(role); setRole(role, { silent: true }); }
      const ta = form.elements.message;
      if (message) {
        const existing = ta.value.trim();
        ta.value = existing && !existing.startsWith("Hi! I'm reaching out") ? `${message}${existing}` : message;
      }
      saveDraft();
      $("#contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setTimeout(() => { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); }, reduceMotion ? 0 : 900);
      toast("Your plan was added to the message ✓");
    });

    const fieldNames = ["name", "email", "company", "website", "budget", "timing", "platform", "handle", "niche", "organisation", "partnerType", "message"];
    function saveDraft() {
      const data = { role: formRole() };
      fieldNames.forEach((n) => { const f = form.elements[n]; if (f) data[n] = f.value; });
      storage.set(data);
    }
    function loadDraft() {
      const d = storage.get();
      if (!d) return;
      fieldNames.forEach((n) => { const f = form.elements[n]; if (f && typeof d[n] === "string") f.value = d[n]; });
    }
    let saveTimer;
    form.addEventListener("input", () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 300); });

    const messages = {
      valueMissing: (f) => (f.type === "checkbox" ? "Please confirm to continue." : "This field is required."),
      typeMismatch: (f) => (f.type === "email" ? "Please enter a valid email address." : "Please enter a valid URL (https://…)."),
      tooShort: (f) => `Please write at least ${f.minLength} characters.`,
    };
    const errorFor = (f) => {
      if (f.validity.valid) return "";
      for (const k of Object.keys(messages)) if (f.validity[k]) return messages[k](f);
      return "Please check this field.";
    };
    const showError = (f) => {
      const field = f.closest(".field");
      if (!field) return true;
      const msg = errorFor(f);
      const o = $(".field-error", field);
      if (o) o.textContent = msg;
      field.classList.toggle("has-error", !!msg);
      f.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    const activeFields = () => $$("input, select, textarea", form).filter((f) => !f.disabled && f.name && f.name !== "role" && !f.classList.contains("hp"));
    form.addEventListener("blur", (e) => { const f = e.target; if (f.matches("input, textarea") && f.value !== "") showError(f); }, true);
    form.addEventListener("input", (e) => { if (e.target.closest(".field")?.classList.contains("has-error")) showError(e.target); });
    form.addEventListener("change", (e) => { if (e.target.type === "checkbox") showError(e.target); });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      const fields = activeFields();
      const invalid = fields.filter((f) => !showError(f));
      if (invalid.length) {
        invalid[0].focus();
        status.textContent = invalid.length === 1 ? "Please check the highlighted field." : `Please check the ${invalid.length} highlighted fields.`;
        return;
      }
      if (form.elements.company_url.value) return; // honeypot

      const payload = { role: formRole(), submittedAt: new Date().toISOString(), page: location.href };
      fields.forEach((f) => { payload[f.name] = f.type === "checkbox" ? f.checked : f.value.trim(); });
      submitBtn.disabled = true;
      $(".btn__label", submitBtn).textContent = "Sending…";
      try {
        if (CONFIG.formEndpoint) {
          const res = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          showSuccess("Thank you.", "We have received your request and will get back to you personally — usually within two working days.");
        } else {
          openMailto(payload);
          showSuccess("Almost there.", `We’ve prepared your message in your email app — just hit send. If nothing opened, write to us at <a href="mailto:${CONFIG.contactEmail}">${CONFIG.contactEmail}</a>.`);
        }
        storage.clear();
      } catch {
        status.textContent = `Something went wrong while sending. Please try again or email us at ${CONFIG.contactEmail}.`;
      } finally {
        submitBtn.disabled = false;
        $(".btn__label", submitBtn).textContent = "Send request";
      }
    });

    function openMailto(p) {
      const labels = { name: "Name", email: "Email", company: "Company", website: "Website", budget: "Budget", timing: "Timing", platform: "Main platform", handle: "Channel", niche: "Topic", organisation: "Organisation", partnerType: "Type" };
      const roleName = { brand: "Brand", creator: "Creator", partner: "Partner" }[p.role];
      const lines = [`Role: ${roleName}`];
      Object.keys(labels).forEach((k) => { if (p[k]) lines.push(`${labels[k]}: ${p[k]}`); });
      lines.push("", p.message || "");
      const subject = `New ${roleName.toLowerCase()} enquiry — ${p.company || p.organisation || p.handle || p.name}`;
      window.location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    }
    function showSuccess(title, html) {
      $("#successTitle").textContent = title;
      $("#successText").innerHTML = html;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    }
    function resetForm() {
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("has-error"));
      $$(".field-error", form).forEach((o) => (o.textContent = ""));
      status.textContent = "";
      success.hidden = true;
      form.hidden = false;
      setFormRole(currentRole || "brand", { animate: false });
    }
    $("#formReset")?.addEventListener("click", () => { resetForm(); form.elements.name.focus(); });
    $$("[data-legal]").forEach((a) => a.addEventListener("click", (e) => {
      if (a.getAttribute("href") === "#") { e.preventDefault(); toast("Legal pages will be added before launch."); }
    }));

    loadDraft();
    setFormRole(currentRole || "brand", { animate: false });
    const sync = () => moveIndicator(indicator, $("input:checked", roleSwitch)?.closest("label"));
    document.fonts?.ready.then(sync);
    window.addEventListener("resize", sync, { passive: true });
  }

  /* ---------- Footer wordmark: scale to container width ---------- */
  function initWordmark() {
    const el = $(".footer__wordmark");
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const parent = el.parentElement;
      const avail = parent.clientWidth - parseFloat(getComputedStyle(parent).paddingLeft) * 2;
      el.style.fontSize = `${Math.min(220, (avail / el.scrollWidth) * 100 * 0.99)}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit, { passive: true });
  }

  /* ---------- Boot ---------- */
  document.documentElement.classList.remove("no-js");
  applyConfig();
  initImageFallbacks();
  initRole();
  initNav();
  initReveal();
  initScramble();
  initCursor();
  initMagnetic();
  initSpotlight();
  initHeroParallax();
  initHeroVideo();
  initShift();
  initMatch();
  initVerticals();
  initGallery();
  initScan();
  initProcess();
  initPlanner();
  initFaq();
  initContact();
  initWordmark();
})();
