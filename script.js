const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");
const counterElements = document.querySelectorAll("[data-counter]");
const parallaxRoot = document.querySelector("[data-parallax-root]");
const progressBar = document.getElementById("scroll-progress");
const navLinks = document.querySelectorAll(".site-nav a");
const sections = document.querySelectorAll("section[id]");
const dustCanvas = document.getElementById("dust-canvas");

function setupRevealObserver() {
  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
  });

  revealElements.forEach((element) => observer.observe(element));
}

function animateCounter(element) {
  if (element.dataset.animated === "true") {
    return;
  }

  element.dataset.animated = "true";

  const target = Number(element.dataset.counter);
  const suffix = element.dataset.suffix || "";

  if (!Number.isFinite(target)) {
    return;
  }

  if (prefersReducedMotion) {
    element.textContent = `${target}${suffix}`;
    return;
  }

  const duration = 1500;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function setupCounterObserver() {
  if (prefersReducedMotion) {
    counterElements.forEach((element) => animateCounter(element));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.6,
  });

  counterElements.forEach((element) => observer.observe(element));
}

function setupParallax() {
  if (!parallaxRoot || prefersReducedMotion) {
    return;
  }

  const layers = parallaxRoot.querySelectorAll("[data-depth]");

  const applyOffset = (offsetX, offsetY) => {
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 1;
      layer.style.setProperty("--move-x", `${offsetX / depth}px`);
      layer.style.setProperty("--move-y", `${offsetY / depth}px`);
    });
  };

  parallaxRoot.addEventListener("mousemove", (event) => {
    const bounds = parallaxRoot.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left - bounds.width / 2;
    const offsetY = event.clientY - bounds.top - bounds.height / 2;
    applyOffset(offsetX, offsetY);
  });

  parallaxRoot.addEventListener("mouseleave", () => {
    applyOffset(0, 0);
  });
}

function setupScrollProgress() {
  if (!progressBar) {
    return;
  }

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupNavHighlight() {
  if (!sections.length || !navLinks.length) {
    return;
  }

  const updateActive = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActive(entry.target.id);
      }
    });
  }, {
    rootMargin: "-40% 0px -45% 0px",
    threshold: 0,
  });

  sections.forEach((section) => observer.observe(section));
}

function setupDust() {
  if (!dustCanvas || prefersReducedMotion) {
    return;
  }

  const context = dustCanvas.getContext("2d");
  const particles = [];
  const particleCount = 38;

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    dustCanvas.width = window.innerWidth * ratio;
    dustCanvas.height = window.innerHeight * ratio;
    dustCanvas.style.width = `${window.innerWidth}px`;
    dustCanvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createParticle = () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2.6 + 0.8,
    speedX: (Math.random() - 0.5) * 0.18,
    speedY: Math.random() * 0.26 + 0.05,
    opacity: Math.random() * 0.26 + 0.08,
  });

  const populate = () => {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(createParticle());
    }
  };

  const draw = () => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.y > window.innerHeight + 20) {
        particle.y = -20;
        particle.x = Math.random() * window.innerWidth;
      }

      if (particle.x < -20) {
        particle.x = window.innerWidth + 20;
      }

      if (particle.x > window.innerWidth + 20) {
        particle.x = -20;
      }

      context.beginPath();
      context.fillStyle = `rgba(255, 244, 229, ${particle.opacity})`;
      context.shadowColor = "rgba(240, 201, 139, 0.35)";
      context.shadowBlur = 16;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });

    requestAnimationFrame(draw);
  };

  resize();
  populate();
  draw();

  window.addEventListener("resize", () => {
    resize();
    populate();
  });
}

setupRevealObserver();
setupCounterObserver();
setupParallax();
setupScrollProgress();
setupNavHighlight();
setupDust();
