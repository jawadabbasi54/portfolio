(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const loader = document.getElementById('page-loader');
  const year = document.getElementById('year');
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const commandCenter = document.getElementById('command-center');
  const commandDepth = document.getElementById('command-center-depth');
  const commandArt = document.querySelector('.command-center-art');
  const pipelineStatus = document.getElementById('pipeline-status');
  const tooltip = document.getElementById('tech-tooltip');
  const hotspots = [...document.querySelectorAll('.system-hotspot')];

  if (year) year.textContent = String(new Date().getFullYear());

  const hideLoader = () => loader?.classList.add('is-hidden');
  if (commandArt?.complete) {
    window.setTimeout(hideLoader, 420);
  } else {
    commandArt?.addEventListener('load', () => window.setTimeout(hideLoader, 260), { once: true });
    window.setTimeout(hideLoader, 1800);
  }

  const handleHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  handleHeader();
  window.addEventListener('scroll', handleHeader, { passive: true });

  if (menuButton && nav) {
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
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.reveal').forEach((node, index) => {
      node.style.transitionDelay = `${Math.min((index % 4) * 65, 195)}ms`;
      revealObserver.observe(node);
    });
  } else {
    document.querySelectorAll('.reveal').forEach((node) => node.classList.add('in-view'));
  }

  const counters = [...document.querySelectorAll('[data-counter]')];
  const runCounter = (element) => {
    const target = Number(element.dataset.counter || 0);
    const duration = prefersReducedMotion ? 1 : 1050;
    const started = performance.now();
    const render = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(runCounter);
  }

  if (!prefersReducedMotion && finePointer) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (event) => {
      if (glow) glow.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
    }, { passive: true });

    document.querySelectorAll('.magnetic').forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.075;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.075;
        item.style.transform = `translate3d(${x}px,${y}px,0)`;
      });
      item.addEventListener('pointerleave', () => { item.style.transform = ''; });
    });

    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 4.4}deg) rotateY(${x * 5.2}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Lower-page delivery pipeline.
  const pipelineStages = [...document.querySelectorAll('.pipeline-stage')];
  const pipelineBar = document.querySelector('.pipeline-progress span');
  let htmlStage = 0;
  const advanceHtmlPipeline = (index) => {
    if (!pipelineStages.length || !pipelineBar) return;
    htmlStage = index % pipelineStages.length;
    pipelineStages.forEach((stage, i) => stage.classList.toggle('active', i <= htmlStage));
    const progress = `${(htmlStage / Math.max(pipelineStages.length - 1, 1)) * 100}%`;
    if (window.innerWidth <= 800) {
      pipelineBar.style.height = progress;
      pipelineBar.style.width = '100%';
    } else {
      pipelineBar.style.width = progress;
      pipelineBar.style.height = '100%';
    }
  };
  advanceHtmlPipeline(0);
  if (!prefersReducedMotion && pipelineStages.length) {
    window.setInterval(() => advanceHtmlPipeline((htmlStage + 1) % pipelineStages.length), 1550);
  }

  const details = {
    GitHub: 'Developers push reviewed code through controlled branches, pull requests, and release tags.',
    'CI/CD': 'The delivery pipeline builds, tests, packages, approves, and deploys every application change.',
    Security: 'SAST, DAST, dependency, vulnerability, and secrets checks protect the DevSecOps path.',
    Terraform: 'A separate pipeline plans and provisions version-controlled AWS architecture automatically.',
    AWS: 'Secure cloud infrastructure receives application and infrastructure changes through controlled deployment stages.',
    Services: 'Elastic Beanstalk, Lambda, RDS, S3, VPC, and Auto Scaling run the production platform.',
    CloudWatch: 'Dashboards, logs, metrics, and alarms continuously measure application and AWS resource health.',
    Alerts: 'CloudWatch alarms immediately notify Slack, phone, and email for rapid operational response.'
  };

  const statusText = {
    GitHub: 'APP DELIVERY · GITHUB PUSH',
    'CI/CD': 'APP DELIVERY · BUILD / TEST',
    Security: 'DEVSECOPS · SECURITY SCAN',
    Terraform: 'INFRA PIPELINE · TERRAFORM PLAN',
    AWS: 'DEPLOYMENT · AWS CLOUD',
    Services: 'PRODUCTION · SERVICES UPDATED',
    CloudWatch: 'OBSERVABILITY · METRICS / LOGS',
    Alerts: 'ALARM EVENT · SLACK / PHONE / EMAIL'
  };

  const lowerStageMap = { GitHub: 0, 'CI/CD': 1, Security: 1, Terraform: 3, AWS: 4, Services: 4, CloudWatch: 4, Alerts: 4 };
  const routes = [
    ['GitHub', 'CI/CD', 'Security', 'AWS', 'Services', 'CloudWatch', 'Alerts'],
    ['GitHub', 'Terraform', 'AWS', 'Services', 'CloudWatch', 'Alerts']
  ];
  let routeIndex = 0;
  let stageIndex = 0;
  let stageTimer = null;

  const activateStage = (name) => {
    hotspots.forEach((spot) => spot.classList.toggle('is-active', spot.dataset.stage === name));
    commandCenter?.classList.toggle('alert-event', name === 'Alerts');
    commandCenter?.classList.toggle('security-event', name === 'Security');
    commandCenter?.classList.toggle('terraform-event', name === 'Terraform');
    if (pipelineStatus) pipelineStatus.textContent = statusText[name] || name.toUpperCase();
    advanceHtmlPipeline(lowerStageMap[name] ?? 0);
  };

  const nextStage = () => {
    const route = routes[routeIndex];
    activateStage(route[stageIndex]);
    stageIndex += 1;
    if (stageIndex >= route.length) {
      stageIndex = 0;
      routeIndex = (routeIndex + 1) % routes.length;
    }
  };

  if (hotspots.length) {
    nextStage();
    if (!prefersReducedMotion) stageTimer = window.setInterval(nextStage, 1180);
  }

  const showTooltip = (spot, event) => {
    if (!tooltip || !commandCenter) return;
    const name = spot.dataset.stage;
    const centerRect = commandCenter.getBoundingClientRect();
    const spotRect = spot.getBoundingClientRect();
    const pointerX = event?.clientX ?? spotRect.right;
    const pointerY = event?.clientY ?? spotRect.top;
    const left = Math.min(pointerX - centerRect.left + 14, centerRect.width - 260);
    const top = Math.max(12, Math.min(pointerY - centerRect.top + 14, centerRect.height - 115));
    tooltip.innerHTML = `<strong>${name}</strong><span>${details[name] || ''}</span>`;
    tooltip.style.left = `${Math.max(12, left)}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');
  };

  hotspots.forEach((spot) => {
    spot.addEventListener('pointerenter', (event) => {
      if (stageTimer) window.clearInterval(stageTimer);
      activateStage(spot.dataset.stage);
      showTooltip(spot, event);
    });
    spot.addEventListener('pointermove', (event) => showTooltip(spot, event));
    spot.addEventListener('pointerleave', () => {
      tooltip?.classList.remove('visible');
      if (!prefersReducedMotion) {
        window.clearInterval(stageTimer);
        stageTimer = window.setInterval(nextStage, 1180);
      }
    });
    spot.addEventListener('focus', () => {
      activateStage(spot.dataset.stage);
      showTooltip(spot);
    });
    spot.addEventListener('blur', () => tooltip?.classList.remove('visible'));
  });

  // Subtle depth follows the pointer while preserving the exact prototype composition.
  if (!prefersReducedMotion && finePointer && commandCenter && commandDepth) {
    commandCenter.addEventListener('pointermove', (event) => {
      const rect = commandCenter.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      commandDepth.style.transform = `perspective(1200px) rotateX(${-y * 1.8}deg) rotateY(${x * 2.4}deg) translate3d(${x * 5}px,${y * 4}px,0)`;
    });
    commandCenter.addEventListener('pointerleave', () => {
      commandDepth.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' && stageTimer) {
      window.clearInterval(stageTimer);
      stageTimer = null;
    } else if (document.visibilityState === 'visible' && !prefersReducedMotion && !stageTimer) {
      stageTimer = window.setInterval(nextStage, 1180);
    }
  });
})();
