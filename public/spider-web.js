(() => {
  "use strict";

  const canvas = document.getElementById("spider-web-background");
  if (!canvas) return;

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = navigator.deviceMemory || 4;
  const saveData = Boolean(navigator.connection?.saveData);
  const lowPower = coarsePointer || deviceMemory <= 4 || saveData;
  const staticMode = reducedMotion || coarsePointer || saveData || deviceMemory <= 2;
  const pointer = { x: -1000, y: -1000, active: false };
  const particles = [];
  const spatialBuckets = new Map();

  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let animationFrame = 0;
  let lastFrame = 0;
  let resizeTimer = 0;
  let globeIsInteracting = false;
  let globeIsVisible = false;
  let frameIndex = 0;

  // The visual character stays the same, but the ambient canvas is intentionally
  // kept below the Three.js globe's render priority.
  const NORMAL_FRAME_INTERVAL = 1000 / (lowPower ? 10 : 24);
  const IDLE_FRAME_INTERVAL = 1000 / (lowPower ? 8 : 18);
  const GLOBE_VISIBLE_FRAME_INTERVAL = 1000 / (lowPower ? 6 : 10);
  const GRID_SIZE = 150;
  const MAX_CONNECTIONS = 4;

  const palette = [
    {
      core: "rgba(106, 181, 255, .95)",
      glowInner: "rgba(106, 181, 255, .76)",
      glowOuter: "rgba(42, 125, 255, 0)",
      line: "92, 159, 255"
    },
    {
      core: "rgba(255, 171, 77, .96)",
      glowInner: "rgba(255, 171, 77, .78)",
      glowOuter: "rgba(255, 126, 31, 0)",
      line: "255, 156, 54"
    },
    {
      core: "rgba(174, 207, 255, .90)",
      glowInner: "rgba(174, 207, 255, .68)",
      glowOuter: "rgba(99, 153, 255, 0)",
      line: "126, 177, 255"
    }
  ];

  const glowSprites = palette.map((item) => createGlowSprite(item));

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function createGlowSprite(item) {
    const size = 44;
    const sprite = document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const spriteContext = sprite.getContext("2d");
    const center = size / 2;
    const gradient = spriteContext.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, item.core);
    gradient.addColorStop(.18, item.glowInner);
    gradient.addColorStop(1, item.glowOuter);
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, size, size);
    return sprite;
  }

  function desiredParticleCount() {
    const area = width * height;
    const responsiveCount = Math.round(area / 34000);
    const upperLimit = lowPower ? (width < 760 ? 26 : 34) : width < 760 ? 38 : width < 1280 ? 46 : 56;
    return Math.max(width < 760 ? 20 : 28, Math.min(upperLimit, responsiveCount));
  }

  function createParticle(index) {
    const warm = index % 11 === 0;
    const pale = !warm && index % 5 === 0;
    const paletteIndex = warm ? 1 : pale ? 2 : 0;

    return {
      x: random(0, width),
      y: random(0, height),
      vx: random(-0.12, 0.12),
      vy: random(-0.09, 0.09),
      radius: warm ? random(1.25, 2.1) : random(.75, 1.55),
      paletteIndex,
      phase: random(0, Math.PI * 2),
      drift: random(.55, 1.15)
    };
  }

  function rebuildParticles() {
    const count = desiredParticleCount();
    while (particles.length < count) particles.push(createParticle(particles.length));
    if (particles.length > count) particles.length = count;
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);

    // Rendering the full-screen ambient layer at retina 2x competes heavily
    // with WebGL. 1.25x remains visually crisp because the particles are soft.
    const ratioCap = coarsePointer || width < 760 ? 1 : 1.25;
    pixelRatio = Math.min(window.devicePixelRatio || 1, ratioCap);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    rebuildParticles();
    drawFrame(performance.now(), false);
  }

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }

  function updateParticle(particle, elapsed) {
    const pulse = Math.sin(elapsed * .0012 * particle.drift + particle.phase);
    particle.x += particle.vx + pulse * .015;
    particle.y += particle.vy + Math.cos(elapsed * .001 + particle.phase) * .012;

    if (pointer.active) {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distanceSquared = dx * dx + dy * dy;
      const influenceRadius = 190;
      if (distanceSquared < influenceRadius * influenceRadius && distanceSquared > 1) {
        const distance = Math.sqrt(distanceSquared);
        const strength = (1 - distance / influenceRadius) * .016;
        particle.x += dx * strength;
        particle.y += dy * strength;
      }
    }

    const margin = 42;
    if (particle.x < -margin) particle.x = width + margin;
    if (particle.x > width + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = height + margin;
    if (particle.y > height + margin) particle.y = -margin;
  }

  function bucketKey(column, row) {
    return `${column}:${row}`;
  }

  function rebuildSpatialGrid() {
    spatialBuckets.clear();

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const column = Math.floor(particle.x / GRID_SIZE);
      const row = Math.floor(particle.y / GRID_SIZE);
      const key = bucketKey(column, row);
      const bucket = spatialBuckets.get(key);
      if (bucket) bucket.push(index);
      else spatialBuckets.set(key, [index]);
    }
  }

  function drawConnections() {
    const maxDistance = width < 760 ? 112 : 142;
    const maxDistanceSquared = maxDistance * maxDistance;
    const visitedPairs = new Set();

    context.globalCompositeOperation = "source-over";
    context.lineWidth = .72;

    for (let first = 0; first < particles.length; first += 1) {
      const a = particles[first];
      const column = Math.floor(a.x / GRID_SIZE);
      const row = Math.floor(a.y / GRID_SIZE);
      let connections = 0;

      for (let offsetX = -1; offsetX <= 1 && connections < MAX_CONNECTIONS; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1 && connections < MAX_CONNECTIONS; offsetY += 1) {
          const bucket = spatialBuckets.get(bucketKey(column + offsetX, row + offsetY));
          if (!bucket) continue;

          for (let bucketIndex = 0; bucketIndex < bucket.length; bucketIndex += 1) {
            const second = bucket[bucketIndex];
            if (second === first) continue;

            const low = Math.min(first, second);
            const high = Math.max(first, second);
            const pairKey = `${low}:${high}`;
            if (visitedPairs.has(pairKey)) continue;
            visitedPairs.add(pairKey);

            const b = particles[second];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > maxDistanceSquared) continue;

            const distance = Math.sqrt(distanceSquared);
            const alpha = (1 - distance / maxDistance) * .24;
            const warmConnection = a.paletteIndex === 1 || b.paletteIndex === 1;
            const lineColor = warmConnection ? palette[1].line : palette[0].line;
            context.strokeStyle = `rgba(${lineColor}, ${warmConnection ? alpha * .82 : alpha})`;

            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
            connections += 1;
            if (connections >= MAX_CONNECTIONS) break;
          }
        }
      }
    }
  }

  function drawParticle(particle, elapsed) {
    const twinkle = .72 + Math.sin(elapsed * .0023 * particle.drift + particle.phase) * .28;
    const radius = particle.radius * (1 + twinkle * .22);
    const spriteSize = Math.max(12, radius * 9.4);

    context.globalAlpha = .54 + twinkle * .34;
    context.drawImage(
      glowSprites[particle.paletteIndex],
      particle.x - spriteSize / 2,
      particle.y - spriteSize / 2,
      spriteSize,
      spriteSize
    );
  }

  function drawFrame(elapsed, updatePositions = true) {
    context.clearRect(0, 0, width, height);

    if (updatePositions && !reducedMotion) {
      for (let index = 0; index < particles.length; index += 1) {
        updateParticle(particles[index], elapsed);
      }
    }

    rebuildSpatialGrid();
    drawConnections();

    context.globalCompositeOperation = "lighter";
    for (let index = 0; index < particles.length; index += 1) {
      drawParticle(particles[index], elapsed);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  function render(elapsed = 0) {
    animationFrame = requestAnimationFrame(render);

    // Freeze the ambient layer while the user drags the globe. The last frame
    // stays visible, but the WebGL scene receives the full frame budget.
    if (globeIsInteracting) return;

    const interval = globeIsVisible
      ? GLOBE_VISIBLE_FRAME_INTERVAL
      : pointer.active ? NORMAL_FRAME_INTERVAL : IDLE_FRAME_INTERVAL;
    if (!staticMode && elapsed - lastFrame < interval) return;
    lastFrame = elapsed;
    frameIndex += 1;

    drawFrame(elapsed, true);

    if (staticMode) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }

  function setGlobeInteraction(active) {
    globeIsInteracting = active;
    if (!active) lastFrame = 0;
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  // The background yields completely during globe manipulation without
  // modifying the globe's own pointer handlers.
  const globeCanvas = document.getElementById("globe-canvas");
  if (globeCanvas) {
    globeCanvas.addEventListener("pointerdown", () => setGlobeInteraction(true), { passive: true });
    globeCanvas.addEventListener("pointerup", () => setGlobeInteraction(false), { passive: true });
    globeCanvas.addEventListener("pointercancel", () => setGlobeInteraction(false), { passive: true });
    globeCanvas.addEventListener("lostpointercapture", () => setGlobeInteraction(false), { passive: true });
  }
  const globeStage = document.getElementById("globe-stage");
  if (globeStage && "IntersectionObserver" in window) {
    const globeObserver = new IntersectionObserver(([entry]) => {
      globeIsVisible = entry.isIntersecting && entry.intersectionRatio > 0.02;
    }, { threshold: [0, 0.02, 0.2] });
    globeObserver.observe(globeStage);
  }
  window.addEventListener("pointerup", () => setGlobeInteraction(false), { passive: true });

  window.addEventListener("resize", scheduleResize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!document.hidden && !animationFrame) {
      lastFrame = 0;
      animationFrame = requestAnimationFrame(render);
    }
  });

  resize();
  animationFrame = requestAnimationFrame(render);
})();
