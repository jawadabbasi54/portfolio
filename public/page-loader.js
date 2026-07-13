(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function initNavigation() {
    const toggle = qs(".menu-toggle");
    const nav = qs(".main-nav");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    qsa("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !nav.classList.contains("open")) return;
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!nav.classList.contains("open") || nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });
  }

  function initReveal() {
    const items = qsa(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 5, 4) * 65}ms`;
      observer.observe(item);
    });
  }

  initNavigation();
  initReveal();
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  window.__portfolioPageCoreInitialized = true;

  const stage = qs("#globe-stage");
  if (!stage) return;

  let runtimeRequested = false;
  const fallback = qs("#prototype-fallback");
  const loader = qs("#scene-loader");
  const errorPanel = qs("#scene-error");

  function showFallback() {
    if (fallback && !fallback.getAttribute("src")) fallback.setAttribute("src", fallback.dataset.src || "");
    stage.classList.add("scene-failed");
    if (loader) loader.setAttribute("aria-hidden", "true");
    if (errorPanel) errorPanel.hidden = false;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadGlobeRuntime() {
    if (runtimeRequested) return;
    runtimeRequested = true;
    try {
      await loadScript("/vendor/gsap.min.js?v=20260712-regions1");
      await loadScript("/vendor/ScrollTrigger.min.js?v=20260712-regions1");
      await loadScript("/vendor/three.min.js?v=20260712-regions1");
      await loadScript("/script.js?v=20260714-citylights2");
    } catch (error) {
      console.error("Interactive portfolio runtime failed:", error);
      showFallback();
    }
  }

  const desktop = window.matchMedia("(min-width: 761px)").matches;
  if (desktop) {
    if ("requestIdleCallback" in window) window.requestIdleCallback(loadGlobeRuntime, { timeout: 900 });
    else window.setTimeout(loadGlobeRuntime, 350);
  } else {
    const maybeLoadForPosition = () => {
      if (stage.getBoundingClientRect().top > window.innerHeight * 1.08) return;
      window.removeEventListener("scroll", maybeLoadForPosition);
      loadGlobeRuntime();
    };
    window.addEventListener("scroll", maybeLoadForPosition, { passive: true });
    stage.addEventListener("pointerdown", loadGlobeRuntime, { once: true, passive: true });
    stage.addEventListener("focusin", loadGlobeRuntime, { once: true });
  }
})();
