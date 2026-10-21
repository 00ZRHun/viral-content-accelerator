(() => {
  "use strict";

  const config = window.VCA_CONFIG || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------------------------------------------------------------------
     Analytics — no PII, no network requests until configured
     --------------------------------------------------------------------- */

  function track(name, detail = {}) {
    if (!name) return;

    const payload = {
      event: name,
      ...detail,
      timestamp: new Date().toISOString(),
    };

    const analytics = config.analytics || {};
    if (analytics.enabled) {
      const layerName = analytics.dataLayerName || "dataLayer";
      const layer = window[layerName];
      if (Array.isArray(layer)) {
        layer.push(payload);
      } else {
        window[layerName] = [payload];
      }
    }

    window.dispatchEvent(new CustomEvent("vca:conversion", { detail: payload }));

    if (analytics.debug && typeof console !== "undefined") {
      console.debug("[VCA analytics]", payload);
    }
  }

  window.vcaAnalytics = { track };

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target.closest("[data-track]");
      if (!target) return;
      const name = target.getAttribute("data-track");
      track(name, {
        link_text: (target.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90),
        destination: target.getAttribute("href") || "",
      });
    },
    { capture: true },
  );

  /* ---------------------------------------------------------------------
     Header
     --------------------------------------------------------------------- */

  const header = $("[data-site-header]");
  const menuToggle = $("[data-menu-toggle]");
  const mobileMenu = $("[data-mobile-menu]");
  const main = $("#main");
  const footer = $(".site-footer");
  const enrollSection = $("#enroll");
  const finalCtaSection = $("#join");
  const mobileCta = $("[data-mobile-cta]");
  let menuOpen = false;

  function setInert(element, value) {
    if (!element) return;
    if ("inert" in element) {
      element.inert = value;
    } else if (value) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  }

  function setMenuState(open, returnFocus = true) {
    if (!menuToggle || !mobileMenu) return;
    menuOpen = open;
    menuToggle.setAttribute("aria-expanded", String(open));
    const label = $(".sr-only", menuToggle);
    if (label) label.textContent = open ? "Close menu" : "Open menu";
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    setInert(main, open);
    setInert(footer, open);
    updateMobileCta();

    if (open) {
      window.requestAnimationFrame(() => {
        const firstLink = $("a", mobileMenu);
        if (firstLink) firstLink.focus();
      });
    } else if (returnFocus) {
      menuToggle.focus();
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => setMenuState(!menuOpen));

    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => setMenuState(false, false));
    });

    document.addEventListener("keydown", (event) => {
      if (!menuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenuState(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = $$(
        'a[href], button:not([disabled]), summary, input:not([disabled])',
        header,
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const desktop = window.matchMedia("(min-width: 1025px)");
    const handleDesktop = (event) => {
      if (event.matches) setMenuState(false, false);
    };
    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", handleDesktop);
    } else if (typeof desktop.addListener === "function") {
      desktop.addListener(handleDesktop);
    }
  }

  let scrollTicking = false;

  function updateOnScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    updateActiveNav();
    updateMobileCta();
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateOnScroll);
    },
    { passive: true },
  );

  /* ---------------------------------------------------------------------
     Active section nav
     --------------------------------------------------------------------- */

  const navLinks = $$("[data-nav-link]");
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  updateOnScroll();

  function updateActiveNav() {
    if (!navLinks.length) return;
    const marker = window.scrollY + window.innerHeight * 0.34;
    let activeId = "";

    navSections.forEach((section) => {
      if (marker >= section.offsetTop && marker < section.offsetTop + section.offsetHeight) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* ---------------------------------------------------------------------
     Sticky mobile CTA
     --------------------------------------------------------------------- */

  function inView(section, threshold = 0.92) {
    if (!section) return false;
    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight * threshold && rect.bottom > 0;
  }

  function updateMobileCta() {
    if (!mobileCta) return;

    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const hide =
      !isMobile ||
      menuOpen ||
      window.scrollY < 560 ||
      inView(enrollSection) ||
      inView(finalCtaSection) ||
      inView(footer, 1);

    if (hide) {
      if (!mobileCta.hidden) {
        mobileCta.classList.remove("is-visible");
        mobileCta.hidden = true;
      }
      return;
    }

    if (mobileCta.hidden) {
      mobileCta.hidden = false;
    }
    mobileCta.classList.add("is-visible");
  }

  window.addEventListener(
    "resize",
    () => {
      window.requestAnimationFrame(updateMobileCta);
    },
    { passive: true },
  );

  $$(".desktop-nav a, .mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      track("nav_click", {
        label: (link.textContent || "").trim().replace(/\s+/g, " "),
        destination: link.getAttribute("href") || "",
      });
    });
  });

  /* ---------------------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------------------- */

  const revealElements = $$(".reveal");

  if (!("IntersectionObserver" in window) || reducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    document.documentElement.classList.add("has-reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  /* ---------------------------------------------------------------------
     One-time section analytics
     --------------------------------------------------------------------- */

  function trackSectionView(selector, eventName) {
    const section = $(selector);
    if (!section) return;

    if (!("IntersectionObserver" in window)) {
      track(eventName);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          track(eventName);
          observer.disconnect();
        });
      },
      { threshold: 0.28 },
    );

    observer.observe(section);
  }

  trackSectionView("#curriculum", "curriculum_view");
  trackSectionView("#results", "results_view");
  trackSectionView("#enroll", "pricing_view");

  /* ---------------------------------------------------------------------
     Pricing toggle
     --------------------------------------------------------------------- */

  const pricing = $("[data-pricing]");
  if (pricing) {
    const planInputs = $$("[data-plan-input]", pricing);
    const priceAmount = $("[data-price]", pricing);
    const priceUnit = $("[data-price-unit]", pricing);
    const priceNote = $("[data-price-note]", pricing);
    const enrollLink = $("[data-enroll-link]");

    const plans = {
      full: {
        amount: "$5,999",
        unit: "USD · one time",
        note: "Best value. One payment for the full four-month program.",
      },
      monthly: {
        amount: "$1,650",
        unit: "USD / month × 4",
        note: "$6,600 total · same four-month access and guarantee.",
      },
    };

    function applyPlan(plan, announce = false) {
      const details = plans[plan] || plans.full;
      if (priceAmount) priceAmount.textContent = details.amount;
      if (priceUnit) priceUnit.textContent = details.unit;
      if (priceNote) priceNote.textContent = details.note;

      if (enrollLink) {
        const nextUrl = config.enrollment && config.enrollment[plan];
        if (nextUrl) enrollLink.setAttribute("href", nextUrl);
        enrollLink.dataset.plan = plan;
      }

      if (announce) track("plan_select", { plan });
    }

    planInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) applyPlan(input.value, true);
      });
    });

    const checked = planInputs.find((input) => input.checked) || planInputs[0];
    if (checked) applyPlan(checked.value, false);
  }

  /* ---------------------------------------------------------------------
     FAQ analytics
     --------------------------------------------------------------------- */

  $$(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      const question = $("summary span", item);
      track("faq_open", {
        question: question ? question.textContent.trim() : "",
      });
    });
  });

  /* ---------------------------------------------------------------------
     Testimonial carousel
     --------------------------------------------------------------------- */

  const carousel = $("[data-carousel]");
  if (carousel) {
    const trackElement = $("[data-carousel-track]", carousel);
    const cards = trackElement ? $$(".testimonial-card", trackElement) : [];
    const previous = $("[data-carousel-prev]", carousel);
    const next = $("[data-carousel-next]", carousel);
    const dotsContainer = $("[data-carousel-dots]", carousel);
    const status = $("[data-carousel-status]", carousel);
    let currentIndex = 0;
    let ticking = false;

    const getGap = () => {
      if (!trackElement) return 16;
      const styles = window.getComputedStyle(trackElement);
      return parseFloat(styles.columnGap || styles.gap || "16") || 16;
    };

    const getStep = () => {
      if (!cards.length) return 0;
      return cards[0].getBoundingClientRect().width + getGap();
    };

    const getVisibleCount = () => {
      if (!trackElement || !cards.length) return 1;
      const step = getStep();
      if (!step) return 1;
      return Math.max(1, Math.min(cards.length, Math.round((trackElement.clientWidth + getGap()) / step)));
    };

    const getLastIndex = () => Math.max(0, cards.length - getVisibleCount());

    function updateCarousel() {
      if (!trackElement || !cards.length) return;
      const step = getStep();
      const rawIndex = step ? Math.round(trackElement.scrollLeft / step) : 0;
      currentIndex = Math.max(0, Math.min(rawIndex, getLastIndex()));
      const visible = getVisibleCount();
      const lastVisible = Math.min(currentIndex + visible, cards.length);

      if (status) {
        status.textContent = `Showing stories ${currentIndex + 1}–${lastVisible} of ${cards.length}`;
      }

      if (previous) previous.disabled = currentIndex <= 0;
      if (next) next.disabled = currentIndex >= getLastIndex();

      if (dotsContainer) {
        $$(".carousel-dot", dotsContainer).forEach((dot, index) => {
          if (index === currentIndex) {
            dot.setAttribute("aria-current", "true");
          } else {
            dot.removeAttribute("aria-current");
          }
        });
      }
      ticking = false;
    }

    function goTo(index) {
      if (!trackElement) return;
      const target = Math.max(0, Math.min(index, getLastIndex()));
      trackElement.scrollTo({
        left: getStep() * target,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }

    if (dotsContainer) {
      cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "carousel-dot";
        button.setAttribute(
          "aria-label",
          `Go to story ${index + 1} of ${cards.length}: ${card.getAttribute("aria-label") || "Member story"}`,
        );
        button.addEventListener("click", () => goTo(index));
        dotsContainer.appendChild(button);
      });
    }

    if (previous) previous.addEventListener("click", () => goTo(currentIndex - 1));
    if (next) next.addEventListener("click", () => goTo(currentIndex + 1));

    if (trackElement) {
      trackElement.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(updateCarousel);
        },
        { passive: true },
      );

      trackElement.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(currentIndex + 1);
        }
      });

      let resizeTimer;
      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            updateCarousel();
            goTo(Math.min(currentIndex, getLastIndex()));
          }, 140);
        },
        { passive: true },
      );
    }

    updateCarousel();
  }
})();
