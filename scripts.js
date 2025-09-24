document.addEventListener("DOMContentLoaded", () => {
  // ------------------ Helpers ------------------
  function parseCount(val) {
    if (val == null) return NaN;
    let s = String(val).trim().toUpperCase().replace(/,/g, "");
    if (s.endsWith("%")) s = s.slice(0, -1);
    let mult = 1;
    if (s.endsWith("K")) { mult = 1e3; s = s.slice(0, -1); }
    else if (s.endsWith("M")) { mult = 1e6; s = s.slice(0, -1); }
    else if (s.endsWith("B")) { mult = 1e9; s = s.slice(0, -1); }
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num * mult;
  }

  function abbreviate(n) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(n < 1e10 ? 1 : 0) + "B";
    if (abs >= 1e6) return (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + "M";
    if (abs >= 1e3) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + "K";
    return Math.round(n).toString();
  }

  function getCountUpClass() {
    return (
      window.CountUp ||
      (window.countUp && window.countUp.CountUp) ||
      (window.CountUpModule && window.CountUpModule.CountUp) ||
      null
    );
  }

  // ------------- Animate a section when in view -------------
  function animateSection(section) {
    const tiles = section.querySelectorAll(".card");
    if (!tiles.length || !window.gsap) return;

    const tl = gsap.timeline();

    // 1) Tiles: fade/slide in (stagger)
    tl.from(tiles, {
      opacity: 0,
      y: 30,
      duration: 0.4,
      ease: "power2.out",
      stagger: 0.15
    });

    // 2) After tiles, stage numbers then bars (staggered)
    tl.add(() => {
      const nums  = section.querySelectorAll(".num[data-count]");
      const barsH = section.querySelectorAll(".hbar span");
      const barsV = section.querySelectorAll(".group-bars .bar");

      // Numbers: fade in then count up (staggered)
      nums.forEach((el, i) => {
        const raw    = el.getAttribute("data-count");
        const endVal = parseCount(raw);
        if (!isFinite(endVal)) return;

        const format   = (el.dataset.format || "comma").toLowerCase();
        const suffix   = el.dataset.suffix || "";
        const duration = parseFloat(el.dataset.duration) || 2;

        // Reset visible text & opacity before animation
        el.textContent = "0" + suffix;
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, delay: i * 0.2 }
        );

        const opts = { startVal: 0, duration, separator: "," };
        if (format === "abbr") {
          opts.formattingFn = (n) => abbreviate(n) + suffix;
        } else if (suffix) {
          opts.suffix = suffix;
        }

        const CountUpClass = getCountUpClass();

        // Start counting slightly after the fade
        gsap.delayedCall(0.4 + i * 0.2, () => {
          if (CountUpClass) {
            const counter = new CountUpClass(el, endVal, opts);
            if (!counter.error) counter.start();
          } else {
            // Fallback: GSAP numeric tween
            const obj = { val: 0 };
            gsap.to(obj, {
              val: endVal,
              duration,
              ease: "power2.out",
              onUpdate() {
                const v = obj.val;
                if (format === "abbr") el.textContent = abbreviate(v) + suffix;
                else if (format === "plain") el.textContent = Math.round(v) + suffix;
                else el.textContent = Math.round(v).toLocaleString() + suffix;
              }
            });
          }
        });
      });

      // Horizontal bars: fade + grow with bounce
      barsH.forEach((span, i) => {
        const target = span.dataset.width || "0%";
        gsap.to(span, {
          width: target,
          opacity: 1,
          duration: 1.2,
          ease: "back.out(1.7)",   // subtle bounce
          delay: 0.8 + i * 0.2     // after numbers begin
        });
      });

      // Vertical bars: fade + grow with bounce
      barsV.forEach((bar, i) => {
        const target = bar.dataset.height || "0%";
        gsap.to(bar, {
          height: target,
          opacity: 1,
          duration: 1.2,
          ease: "back.out(1.7)",
          delay: 0.8 + i * 0.2
        });
      });
    }, "+=0.2");
  }

  // ---- IntersectionObserver: animate each section once on scroll-in ----
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateSection(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll("section").forEach(sec => {
    if (sec.querySelector(".card")) observer.observe(sec);
  });

  // ---------------- Tooltips (Tippy.js) ----------------
  if (window.tippy) {
    tippy("[data-info]", {
      content: (ref) => ref.getAttribute("data-info"),
      theme: "light-border",
      allowHTML: true,
      interactive: true,
      maxWidth: 300
    });
  }

  // ---------------- Modals (Micromodal) ---------------
  if (window.MicroModal) {
    MicroModal.init({ awaitCloseAnimation: true, disableScroll: true });
  }
});
