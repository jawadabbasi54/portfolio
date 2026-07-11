(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 800px)').matches;
  const loader = document.getElementById('page-loader');

  document.getElementById('year').textContent = String(new Date().getFullYear());
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));

  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' });
  document.querySelectorAll('.reveal').forEach((node, index) => {
    node.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
    revealObserver.observe(node);
  });

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.counter);
      const duration = prefersReducedMotion ? 1 : 1100;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: .6 });
  document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));

  if (!prefersReducedMotion && window.matchMedia('(pointer:fine)').matches) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (event) => {
      glow.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
    }, { passive: true });
    document.querySelectorAll('.magnetic').forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        item.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px, ${(event.clientY - rect.top - rect.height / 2) * .08}px)`;
      });
      item.addEventListener('pointerleave', () => item.style.transform = '');
    });
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const r = card.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - .5;
        const y = (event.clientY - r.top) / r.height - .5;
        card.style.transform = `rotateX(${-y * 4.5}deg) rotateY(${x * 5.5}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }

  const pipelineStages = [...document.querySelectorAll('.pipeline-stage')];
  const pipelineBar = document.querySelector('.pipeline-progress span');
  let htmlStage = 0;
  function advanceHtmlPipeline(index) {
    htmlStage = index % pipelineStages.length;
    pipelineStages.forEach((stage, i) => stage.classList.toggle('active', i <= htmlStage));
    const progress = `${(htmlStage / (pipelineStages.length - 1)) * 100}%`;
    if (window.innerWidth <= 800) {
      pipelineBar.style.height = progress;
      pipelineBar.style.width = '100%';
    } else {
      pipelineBar.style.width = progress;
      pipelineBar.style.height = '100%';
    }
  }
  advanceHtmlPipeline(0);
  setInterval(() => advanceHtmlPipeline((htmlStage + 1) % pipelineStages.length), prefersReducedMotion ? 8000 : 1450);

  window.PortfolioUI = { prefersReducedMotion, isSmallScreen, advanceHtmlPipeline };
  window.setTimeout(() => loader?.classList.add('is-hidden'), 3500);
})();
