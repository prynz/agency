/* ==========================================================================
   [AGENCY NAME] — interactions
   Vanilla JS, no dependencies. Each feature is an isolated init function.
   ========================================================================== */
(() => {
  "use strict";

  const CONFIG = Object.assign(
    { brandName: "[AGENCY NAME]", brandShort: "AN", contactEmail: "", formEndpoint: "", location: "", social: {} },
    window.SITE_CONFIG || {}
  );
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Brand config ---------- */
  function applyConfig() {
    const { brandName, brandShort, contactEmail, location, social } = CONFIG;
    $$("[data-brand]").forEach((el) => (el.textContent = brandName));
    $$("[data-brand-short]").forEach((el) => (el.textContent = brandShort));
    $$("[data-brand-label]").forEach((el) => el.setAttribute("aria-label", `${brandName} — back to top`));
    if (contactEmail) {
      $$("[data-email]").forEach((el) => {
        el.textContent = contactEmail;
        el.setAttribute("href", `mailto:${contactEmail}`);
      });
    }
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
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  }

  /* ---------- Generic sliding indicator ---------- */
  function moveIndicator(indicator, target) {
    if (!indicator || !target) return;
    indicator.style.width = `${target.offsetWidth}px`;
    indicator.style.transform = `translateX(${target.offsetLeft}px)`;
  }

  /* ---------- Navigation: sliding pill, scroll spy, header theme, mobile menu ---------- */
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
        if (l === link) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
      moveIndicator(indicator, link);
      light(link);
    };

    // initial position without animation
    if (indicator) {
      indicator.style.transition = "none";
      moveIndicator(indicator, active);
      light(active);
      requestAnimationFrame(() => requestAnimationFrame(() => (indicator.style.transition = "")));
    }

    // hover preview: indicator glides to hovered item, returns on leave
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => { moveIndicator(indicator, link); light(link); });
      link.addEventListener("click", () => setActive(link));
    });
    navLinks?.addEventListener("mouseleave", () => { moveIndicator(indicator, active); light(active); });

    // fonts loading can shift widths
    document.fonts?.ready.then(() => moveIndicator(indicator, active));
    window.addEventListener("resize", () => moveIndicator(indicator, active), { passive: true });

    // scroll spy — sections map to nav items; intermediate sections map to the nearest nav item
    const spyMap = {
      home: "home", manifesto: "home",
      services: "services", audiences: "services", verticals: "services",
      creators: "creators",
      brands: "brands", formats: "brands", process: "brands",
      about: "about", faq: "about", contact: "about",
    };
    const sections = $$("main section[id]");
    const themed = $$("[data-theme]");
    let ticking = false;

    const onScroll = () => {
      ticking = false;
      const probe = window.innerHeight * 0.35;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= probe) current = s;
      const key = spyMap[current?.id];
      const link = links.find((l) => l.dataset.section === key);
      if (link && !navLinks.matches(":hover")) setActive(link);

      // header contrast: what's under the header?
      const y = 36;
      const under = themed.find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      header.classList.toggle("on-dark", under?.dataset.theme === "dark");
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // mobile menu
    const btn = $("#menuBtn");
    const menu = $("#mobileMenu");
    const open = (state) => {
      btn.setAttribute("aria-expanded", String(state));
      btn.querySelector("span").textContent = state ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", state);
      document.body.style.overflow = state ? "hidden" : "";
      header.classList.toggle("on-dark", state || header.classList.contains("on-dark"));
      if (state) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add("is-open"));
        menu.querySelector("a")?.focus({ preventScroll: true });
      } else {
        menu.classList.remove("is-open");
        setTimeout(() => (menu.hidden = true), 400);
        onScroll();
      }
    };
    btn?.addEventListener("click", () => open(btn.getAttribute("aria-expanded") !== "true"));
    menu?.addEventListener("click", (e) => { if (e.target.closest("a")) open(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && btn?.getAttribute("aria-expanded") === "true") { open(false); btn.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) open(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const items = $$(".reveal, .network-card");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    // stagger siblings inside the same parent
    const groups = new Map();
    items.forEach((el) => {
      const list = groups.get(el.parentElement) || [];
      list.push(el);
      groups.set(el.parentElement, list);
    });
    groups.forEach((list) => list.forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 70}ms`)));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    items.forEach((el) => io.observe(el));

    $$(".network-grid img").forEach((img, i) => img.style.setProperty("--i", i));
  }

  /* ---------- Manifesto: words light up on scroll ---------- */
  function initManifesto() {
    const el = $("#manifestoText");
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
    const spans = $$(".w", el);
    if (reduceMotion) { spans.forEach((s) => s.classList.add("is-lit")); return; }

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85, end = vh * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const lit = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("is-lit", i < lit));
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Hero parallax ---------- */
  function initParallax() {
    if (reduceMotion) return;
    const el = $("[data-parallax]");
    if (!el) return;
    const img = $("img", el);
    const factor = parseFloat(el.dataset.parallax) || 0.1;
    const mq = window.matchMedia("(min-width: 901px)");
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      if (!mq.matches || y > window.innerHeight * 1.2) { if (!mq.matches) img.style.removeProperty("--parallax"); return; }
      img.style.setProperty("--parallax", `${y * factor}px`);
    };
    // let the entrance animation finish before parallax takes over
    img.addEventListener("animationend", () => (img.style.animation = "none"), { once: true });
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* ---------- Audience tabs ---------- */
  function initTabs() {
    const list = $('.audiences [role="tablist"]');
    if (!list) return;
    const tabs = $$('[role="tab"]', list);
    const indicator = $(".segmented__indicator", list);

    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
      moveIndicator(indicator, tab);
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
        else if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    const sync = () => moveIndicator(indicator, tabs.find((t) => t.getAttribute("aria-selected") === "true"));
    indicator.style.transition = "none";
    sync();
    requestAnimationFrame(() => requestAnimationFrame(() => (indicator.style.transition = "")));
    document.fonts?.ready.then(sync);
    window.addEventListener("resize", sync, { passive: true });
  }

  /* ---------- Verticals accordion ---------- */
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
    // open the special-competence row by default for orientation
    $(".vert-row--feature .vert-row__head")?.click();
  }

  /* ---------- Process line progress ---------- */
  function initProcess() {
    const wrap = $("#processSteps");
    if (!wrap) return;
    const steps = $$(".process-step", wrap);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const vertical = window.matchMedia("(max-width: 1080px)").matches;
      const p = vertical
        ? Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height))
        : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5)));
      wrap.style.setProperty("--progress", p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle("is-active", p >= (vertical ? i / steps.length : i / (steps.length - 1)) - 0.001 && p > 0));
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---------- FAQ: one open at a time ---------- */
  function initFaq() {
    const items = $$(".faq-item");
    items.forEach((d) => d.addEventListener("toggle", () => {
      if (d.open) items.forEach((o) => { if (o !== d) o.open = false; });
    }));
  }

  /* ---------- Campaign planner ---------- */
  const PLAN = {
    goal: {
      awareness: { label: "Awareness", mix: "A few reach-driven lead creators, supported by a wider ring of credible mid-size voices for frequency and relevance.", kpis: ["Reach & impressions", "View-through rate", "Share of voice", "Brand recall (if measured)"] },
      launch: { label: "Product launch", mix: "Early-access seeding with selected creators for authentic first impressions, followed by a coordinated launch-day wave.", kpis: ["Launch-window reach", "Saves & shares", "Traffic to launch page", "Comment sentiment"] },
      conversion: { label: "Performance & sales", mix: "Trusted niche creators with high audience fit, tracked links or codes and room to optimise between flights.", kpis: ["Clicks & CTR", "Conversions / code use", "Cost per acquisition", "Content reusable as ads"] },
      community: { label: "Community & loyalty", mix: "A small group of long-term ambassadors who show up repeatedly — familiarity over one-off placements.", kpis: ["Recurring engagement", "Community growth", "Qualitative feedback", "Ambassador retention"] },
    },
    vertical: {
      lifestyle: { label: "Lifestyle & Beauty", note: "Aesthetic-led storytelling, try-ons and editorial shoots where the product lives naturally in the creator’s world." },
      fitness: { label: "Fitness & Sport", note: "Credible athletes and coaches, challenge formats and honest product tests over a realistic time span." },
      tech: { label: "Tech & Digital", note: "In-depth reviews, unboxings and use-case content from creators whose audiences make buying decisions in tech." },
      gaming: { label: "Gaming & E-Sport", note: "Stream integrations, team or tournament partnerships and in-game or event activations — our special competence." },
      entertainment: { label: "Entertainment", note: "Personality-driven sketches, series and cultural moments that people share because they want to." },
      food: { label: "Food & Travel", note: "Everyday integrations, recipes and destination stories that feature the brand without breaking the moment." },
    },
    platforms: {
      instagram: "Instagram Reels, Stories & carousels",
      tiktok: "TikTok native short-form & series",
      youtube: "YouTube integrations, dedicated videos & Shorts",
      twitch: "Twitch live integrations & sponsored streams",
      podcast: "Host-read podcast spots & episode partnerships",
      events: "Live appearances, event content & meet-ups",
    },
    timeline: {
      oneoff: { label: "Single campaign", note: "One focused flight — clear brief, tight production window and a concise report." },
      quarter: { label: "Around 3 months", note: "Multiple waves over roughly three months, with learnings applied between waves." },
      longterm: { label: "Long-term partnership", note: "An ambassador or partnership programme with recurring content and a shared roadmap." },
    },
  };
  const PLAN_DEFAULT = { goal: "awareness", vertical: "lifestyle", platforms: ["instagram", "tiktok"], timeline: "quarter" };
  let planState = structuredCloneSafe(PLAN_DEFAULT);

  function structuredCloneSafe(o) { return JSON.parse(JSON.stringify(o)); }

  function planSummary() {
    const g = PLAN.goal[planState.goal], v = PLAN.vertical[planState.vertical], t = PLAN.timeline[planState.timeline];
    const p = planState.platforms.map((k) => PLAN.platforms[k].split(" ")[0]).join(", ") || "open";
    return `Campaign brief (from planner)\n— Goal: ${g.label}\n— Vertical: ${v.label}\n— Platforms: ${p}\n— Time frame: ${t.label}\n\nAbout our brand / product:\n`;
  }

  function initPlanner() {
    const form = $("#plannerForm");
    if (!form) return;
    const out = {
      title: $("#planTitle"), mix: $("#planMix"), formats: $("#planFormats"),
      vertical: $("#planVertical"), timeline: $("#planTimeline"), kpis: $("#planKpis"),
    };

    const flash = (el) => { el.classList.remove("is-updated"); void el.offsetWidth; el.classList.add("is-updated"); };
    const render = (changed) => {
      const g = PLAN.goal[planState.goal], v = PLAN.vertical[planState.vertical], t = PLAN.timeline[planState.timeline];
      out.title.textContent = `${g.label} · ${v.label}`;
      out.mix.textContent = g.mix;
      out.formats.textContent = planState.platforms.length
        ? planState.platforms.map((k) => PLAN.platforms[k]).join(" · ")
        : "No platform selected — we’ll recommend the right channels.";
      out.vertical.textContent = v.note;
      out.timeline.textContent = t.note;
      out.kpis.innerHTML = g.kpis.map((k) => `<li>${k}</li>`).join("");
      const map = { goal: [out.mix, out.kpis], vertical: [out.vertical], platforms: [out.formats], timeline: [out.timeline] };
      (map[changed] || []).forEach((el) => flash(el.closest("dd") || el));
    };

    const syncChips = () => {
      $$(".chips", form).forEach((group) => {
        const key = group.dataset.group;
        $$(".chip", group).forEach((chip) => {
          const v = chip.dataset.value;
          const on = Array.isArray(planState[key]) ? planState[key].includes(v) : planState[key] === v;
          chip.setAttribute("aria-pressed", String(on));
        });
      });
    };

    form.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const group = chip.closest(".chips");
      const key = group.dataset.group;
      const v = chip.dataset.value;
      if (group.dataset.type === "multi") {
        const set = new Set(planState[key]);
        set.has(v) ? set.delete(v) : set.add(v);
        planState[key] = Array.from(set);
      } else {
        if (planState[key] === v) return;
        planState[key] = v;
      }
      syncChips();
      render(key);
    });

    $("#plannerReset")?.addEventListener("click", () => {
      planState = structuredCloneSafe(PLAN_DEFAULT);
      syncChips();
      render("goal");
      toast("Planner reset");
    });

    $("#plannerSend")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("prefill-contact", { detail: { role: "brand", message: planSummary() } }));
    });

    syncChips();
    render();
  }

  /* ---------- Contact form ---------- */
  const DRAFT_KEY = "agency-contact-draft-v1";
  const storage = {
    get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; } },
    set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } },
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

    const currentRole = () => form.elements.role.value || "brand";

    const setRole = (role, { animate = true } = {}) => {
      const radio = $(`input[value="${role}"]`, roleSwitch);
      if (!radio) return;
      radio.checked = true;
      roleLabels.forEach((l) => l.classList.toggle("is-checked", l.contains(radio)));
      if (!animate) indicator.style.transition = "none";
      moveIndicator(indicator, radio.closest("label"));
      if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => (indicator.style.transition = "")));
      groups.forEach((g) => {
        const on = g.dataset.role === role;
        g.hidden = !on;
        g.disabled = !on;
      });
    };

    roleSwitch.addEventListener("change", () => { setRole(currentRole()); saveDraft(); });

    // links elsewhere on the page that preselect a role
    $$("[data-role-link]").forEach((a) => a.addEventListener("click", () => setRole(a.dataset.roleLink)));

    // prefill from planner
    window.addEventListener("prefill-contact", (e) => {
      const { role, message } = e.detail || {};
      if (!success.hidden) resetForm();
      if (role) setRole(role);
      const ta = form.elements.message;
      if (message) {
        const existing = ta.value.trim();
        ta.value = existing && !existing.startsWith("Campaign brief") ? `${message}${existing}` : message;
      }
      saveDraft();
      $("#contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setTimeout(() => {
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, reduceMotion ? 0 : 700);
      toast("Brief added to your message");
    });

    /* Draft persistence */
    const fieldNames = ["name", "email", "company", "website", "budget", "timing", "platform", "handle", "niche", "organisation", "partnerType", "message"];
    function saveDraft() {
      const data = { role: currentRole() };
      fieldNames.forEach((n) => { const f = form.elements[n]; if (f) data[n] = f.value; });
      storage.set(data);
    }
    function loadDraft() {
      const d = storage.get();
      if (!d) return;
      fieldNames.forEach((n) => { const f = form.elements[n]; if (f && typeof d[n] === "string") f.value = d[n]; });
      if (d.role) setRole(d.role, { animate: false });
    }
    let saveTimer;
    form.addEventListener("input", () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 300); });

    /* Validation */
    const messages = {
      valueMissing: (f) => f.type === "checkbox" ? "Please confirm to continue." : "This field is required.",
      typeMismatch: (f) => f.type === "email" ? "Please enter a valid email address." : "Please enter a valid URL (https://…).",
      tooShort: (f) => `Please write at least ${f.minLength} characters.`,
    };
    const errorFor = (f) => {
      const v = f.validity;
      if (v.valid) return "";
      for (const k of Object.keys(messages)) if (v[k]) return messages[k](f);
      return "Please check this field.";
    };
    const showError = (f) => {
      const field = f.closest(".field");
      if (!field) return true;
      const msg = errorFor(f);
      const out = $(".field-error", field);
      if (out) out.textContent = msg;
      field.classList.toggle("has-error", !!msg);
      f.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    const activeFields = () => $$("input, select, textarea", form).filter((f) => !f.disabled && f.name && f.name !== "role" && !f.classList.contains("hp"));

    form.addEventListener("blur", (e) => {
      const f = e.target;
      if (f.matches("input, textarea") && f.value !== "") showError(f);
    }, true);
    form.addEventListener("input", (e) => {
      const f = e.target;
      if (f.closest(".field")?.classList.contains("has-error")) showError(f);
    });
    form.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") showError(e.target);
    });

    /* Submit */
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
      if (form.elements.company_url.value) return; // honeypot: silently drop bots

      const payload = { role: currentRole(), submittedAt: new Date().toISOString(), page: location.href };
      fields.forEach((f) => { payload[f.name] = f.type === "checkbox" ? f.checked : f.value.trim(); });

      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      $(".btn__label", submitBtn).textContent = "Sending";

      try {
        if (CONFIG.formEndpoint) {
          const res = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          showSuccess("Thank you.", "We have received your request and will get back to you personally — usually within two working days.");
        } else {
          openMailto(payload);
          showSuccess("Almost there.", `We’ve prepared your message in your email app — just hit send. If nothing opened, write to us directly at <a href="mailto:${CONFIG.contactEmail}">${CONFIG.contactEmail}</a>.`);
        }
        storage.clear();
      } catch (err) {
        status.textContent = `Something went wrong while sending. Please try again or email us at ${CONFIG.contactEmail}.`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
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
      const href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      window.location.href = href;
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
      setRole("brand", { animate: false });
    }
    $("#formReset")?.addEventListener("click", () => { resetForm(); form.elements.name.focus(); });

    // legal placeholders
    $$("[data-legal]").forEach((a) => a.addEventListener("click", (e) => {
      if (a.getAttribute("href") === "#") { e.preventDefault(); toast("Legal pages will be added before launch."); }
    }));

    setRole("brand", { animate: false });
    loadDraft();
    document.fonts?.ready.then(() => moveIndicator(indicator, $("input:checked", roleSwitch)?.closest("label")));
    window.addEventListener("resize", () => moveIndicator(indicator, $("input:checked", roleSwitch)?.closest("label")), { passive: true });
  }

  /* ---------- Footer wordmark: scale to fit container width ---------- */
  function initWordmark() {
    const el = $(".footer__wordmark");
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const avail = el.parentElement.clientWidth - parseFloat(getComputedStyle(el.parentElement).paddingLeft) * 2;
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
  initNav();
  initReveal();
  initManifesto();
  initParallax();
  initTabs();
  initVerticals();
  initProcess();
  initFaq();
  initPlanner();
  initContact();
  initWordmark();
})();
