const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");
const counterElements = document.querySelectorAll("[data-counter]");
const parallaxRoot = document.querySelector("[data-parallax-root]");
const dustCanvas = document.getElementById("dust-canvas");

function animateCounters() {
  counterElements.forEach((element) => {
    const target = Number(element.dataset.counter);
    const suffix = element.dataset.suffix || "";

    if (!Number.isFinite(target)) {
      return;
    }

    const duration = 1500;
    const start = performance.now();

    const update = (currentTime) => {
      const progress = Math.min((currentTime - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = `${value}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  });
}

function setupRevealObserver() {
  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    animateCounters();
    return;
  }

  let countersStarted = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);

      if (!countersStarted && document.querySelector(".hero__metrics")?.contains(entry.target)) {
        countersStarted = true;
        animateCounters();
      }
    });
  }, {
    threshold: 0.22,
  });

  revealElements.forEach((element) => observer.observe(element));

  const heroMetrics = document.querySelector(".hero__metrics");
  if (heroMetrics) {
    const metricsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          animateCounters();
          metricsObserver.disconnect();
        }
      });
    }, {
      threshold: 0.55,
    });

    metricsObserver.observe(heroMetrics);
  }
}

function setupParallax() {
  if (!parallaxRoot || prefersReducedMotion) {
    return;
  }

  const layers = parallaxRoot.querySelectorAll("[data-depth]");

  const applyTransform = (offsetX, offsetY) => {
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0;
      const x = offsetX / depth;
      const y = offsetY / depth;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  parallaxRoot.addEventListener("mousemove", (event) => {
    const bounds = parallaxRoot.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left - bounds.width / 2;
    const offsetY = event.clientY - bounds.top - bounds.height / 2;
    applyTransform(offsetX, offsetY);
  });

  parallaxRoot.addEventListener("mouseleave", () => {
    applyTransform(0, 0);
  });
}

function setupDust() {
  if (!dustCanvas || prefersReducedMotion) {
    return;
  }

  const context = dustCanvas.getContext("2d");
  const particles = [];
  const particleCount = 42;

  const resize = () => {
    dustCanvas.width = window.innerWidth * window.devicePixelRatio;
    dustCanvas.height = window.innerHeight * window.devicePixelRatio;
    dustCanvas.style.width = `${window.innerWidth}px`;
    dustCanvas.style.height = `${window.innerHeight}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  const createParticle = () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2.8 + 0.8,
    speedX: (Math.random() - 0.5) * 0.22,
    speedY: Math.random() * 0.3 + 0.08,
    opacity: Math.random() * 0.35 + 0.12,
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
      context.fillStyle = `rgba(255, 248, 239, ${particle.opacity})`;
      context.shadowColor = "rgba(255, 225, 194, 0.45)";
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
setupParallax();
setupDust();
