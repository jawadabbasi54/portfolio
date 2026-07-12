(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function initNavigation() {
    const toggle = qs(".menu-toggle");
    const nav = qs(".main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    qsa("a", nav).forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
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

  const stage = qs("#globe-stage");
  const canvas = qs("#globe-canvas");
  const loader = qs("#scene-loader");
  const errorPanel = qs("#scene-error");
  const rotateButton = qs("#auto-rotate");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapApi = window.gsap;
  const ScrollTriggerApi = window.ScrollTrigger;
  if (gsapApi && ScrollTriggerApi) gsapApi.registerPlugin(ScrollTriggerApi);

  /**
   * Premium page motion outside the globe.
   * The globe timeline and WebGL scene below remain unchanged.
   */
  function initPremiumPageMotion() {
    if (!gsapApi || reducedMotion) return;

    const sectionHeadings = qsa(".section-block .section-heading");
    sectionHeadings.forEach((heading) => {
      if (!heading.querySelector(".premium-heading-line")) {
        const line = document.createElement("span");
        line.className = "premium-heading-line";
        line.setAttribute("aria-hidden", "true");
        heading.appendChild(line);
      }

      const eyebrow = heading.querySelector(":scope > p");
      const title = heading.querySelector("h2");
      const line = heading.querySelector(".premium-heading-line");
      if (!ScrollTriggerApi) return;

      const tl = gsapApi.timeline({
        scrollTrigger: {
          trigger: heading,
          start: "top 84%",
          once: true
        }
      });
      tl.fromTo(eyebrow, { autoAlpha: 0, y: 18, letterSpacing: ".34em" }, { autoAlpha: 1, y: 0, letterSpacing: ".22em", duration: .7, ease: "power4.out" })
        .fromTo(title, { autoAlpha: 0, y: 42, rotateX: -7 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1.05, ease: "expo.out" }, "-=.42")
        .fromTo(line, { scaleX: 0, autoAlpha: .2 }, { scaleX: 1, autoAlpha: 1, duration: .8, ease: "power4.out" }, "-=.66");
    });

    const cardGroups = [
      [".expertise-grid", ".glass-card"],
      [".case-study", ".case-copy, .case-metrics > div"],
      [".about-grid", ".section-heading, .about-copy"],
      [".contact-panel", ".contact-panel > div"]
    ];

    if (ScrollTriggerApi) {
      cardGroups.forEach(([triggerSelector, targetSelector]) => {
        const trigger = qs(triggerSelector);
        if (!trigger) return;
        const targets = qsa(targetSelector, trigger.closest("section") || document);
        if (!targets.length) return;
        gsapApi.fromTo(targets,
          { autoAlpha: 0, y: 44, scale: .965 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: .9,
            stagger: .11,
            ease: "expo.out",
            scrollTrigger: { trigger, start: "top 82%", once: true }
          }
        );
      });

      const experienceCards = qsa(".crystal-experience-card");
      experienceCards.forEach((card, index) => {
        gsapApi.fromTo(card,
          { autoAlpha: 0, x: index % 2 === 0 ? -54 : 54, y: 26, rotateY: index % 2 === 0 ? -3 : 3 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            duration: 1.05,
            ease: "expo.out",
            scrollTrigger: { trigger: card, start: "top 86%", once: true }
          }
        );
      });

      const timeline = qs(".crystal-timeline");
      const timelineProgress = qs(".timeline-progress");
      if (timeline && timelineProgress) {
        gsapApi.to(timelineProgress, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timeline,
            start: "top 72%",
            end: "bottom 68%",
            scrub: .55
          }
        });
      }

      const scrollRail = qs(".page-scroll-rail");
      const scrollProgress = qs(".page-scroll-progress");
      const scrollKey = qs(".page-scroll-key");
      const contact = qs("#contact");
      if (scrollRail && scrollProgress && scrollKey && contact) {
        gsapApi.to(scrollProgress, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: document.documentElement, start: "top top", endTrigger: contact, end: "bottom bottom", scrub: .35 }
        });
        gsapApi.to(scrollKey, {
          y: 176,
          ease: "none",
          scrollTrigger: { trigger: document.documentElement, start: "top top", endTrigger: contact, end: "bottom bottom", scrub: .35 }
        });
        gsapApi.to(scrollRail, {
          autoAlpha: 0,
          y: -18,
          scrollTrigger: { trigger: contact, start: "top 62%", toggleActions: "play none none reverse" },
          duration: .45,
          ease: "power2.out"
        });
      }
    }

    // A soft looping arrow cue makes the primary journey action feel alive.
    qsa(".button-primary > span, .contact-link > i").forEach((arrow, index) => {
      gsapApi.to(arrow, {
        x: 5,
        duration: .72 + index * .05,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: index * .12
      });
    });

    // Lightweight GSAP glass tilt for non-globe cards only.
    qsa(".glass-card, .case-study, .crystal-experience-card, .about-copy, .contact-panel").forEach((card) => {
      const rotateX = gsapApi.quickTo(card, "rotateX", { duration: .55, ease: "power3.out" });
      const rotateY = gsapApi.quickTo(card, "rotateY", { duration: .55, ease: "power3.out" });
      const lift = gsapApi.quickTo(card, "y", { duration: .45, ease: "power3.out" });

      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        rotateY(px * 4.2);
        rotateX(py * -3.2);
        lift(-5);
      });
      card.addEventListener("pointerleave", () => {
        rotateX(0);
        rotateY(0);
        lift(0);
      });
    });
  }

  initPremiumPageMotion();

  const uiLayer = qs("#globe-ui-layer");
  const codePath = qs("#code-path");
  const monitorPath = qs("#monitor-path");
  const deploymentPaths = qsa(".deployment-wave-path", uiLayer || document);
  const deploymentPath = deploymentPaths[0] || null;
  const feedbackPath = qs("#feedback-path");
  const applicationVersion = qs("#application-version");
  const deploymentWavePulse = qs("#deployment-wave-pulse");
  const telemetryPulse = qs("#telemetry-pulse");
  const incidentNotification = qs("#incident-notification");
  const typingCode = qs("#typing-code");
  const regionOverlayLayer = qs("#region-overlay-layer");
  const layerButtons = qsa("[data-flow-layer]", stage || document);


  let fallbackTimer = null;

  function failScene(error) {
    console.error("Interactive crystal globe failed:", error);
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (stage) stage.classList.add("scene-failed");
    if (loader) loader.setAttribute("aria-hidden", "true");
    if (errorPanel) errorPanel.hidden = false;
  }

  if (!stage || !canvas || !window.THREE || !window.WebGLRenderingContext) {
    failScene(new Error("WebGL or Three.js is unavailable."));
    return;
  }

  fallbackTimer = window.setTimeout(() => {
    if (!stage.classList.contains("scene-ready")) failScene(new Error("Scene startup timed out."));
  }, 7000);

  const T = window.THREE;
  const COLORS = {
    blue: 0x2f82ff,
    electric: 0x43b8ff,
    cyan: 0x33e6ff,
    orange: 0xff9228,
    warm: 0xffc36c,
    navy: 0x06142f,
    white: 0xf7fbff
  };

  // Layer 0 remains the complete scene. Layer 1 contains only intentionally
  // emissive objects, allowing bloom to stay off the Earth texture entirely.
  const BLOOM_LAYER = 1;
  function enableSelectiveBloom(object) {
    if (object?.layers) object.layers.enable(BLOOM_LAYER);
    return object;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function latLonToVector(lat, lon, radius) {
    const phi = T.MathUtils.degToRad(lat);
    const theta = T.MathUtils.degToRad(lon);
    return new T.Vector3(
      radius * Math.cos(phi) * Math.sin(theta),
      radius * Math.sin(phi),
      radius * Math.cos(phi) * Math.cos(theta)
    );
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function text(ctx, value, x, y, size, color, align = "left", weight = 700, family = "Inter, Arial, sans-serif") {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function glowDotTexture(color = "#43b8ff", size = 256) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.12, color);
    gradient.addColorStop(0.34, `${color}cc`);
    gradient.addColorStop(0.7, `${color}35`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new T.CanvasTexture(c);
    texture.encoding = T.sRGBEncoding;
    return texture;
  }

  /**
   * A shader-driven tube arc. It is intentionally self-contained so the globe
   * keeps its existing structure and does not require postprocessing helpers or
   * extra runtime packages.
   */
  function createFlowArc(start, end, lift, color, options = {}) {
    const radius = start.length();
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius + lift);
    const curve = new T.QuadraticBezierCurve3(start, mid, end);
    const segments = options.segments || 72;
    const tubeRadius = options.radius || 0.009;
    const geometry = new T.TubeGeometry(curve, segments, tubeRadius, 5, false);
    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new T.Color(color) },
      uOpacity: { value: options.opacity ?? 0.55 },
      uSpeed: { value: options.speed ?? 0.24 },
      uGlow: { value: options.glow ?? 1.25 },
      uFrequency: { value: options.frequency ?? 5.5 },
      uHeadSharpness: { value: options.headSharpness ?? 140.0 }
    };
    const material = new T.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uSpeed;
        uniform float uGlow;
        uniform float uFrequency;
        uniform float uHeadSharpness;
        varying vec2 vUv;

        float cyclicDistance(float a, float b) {
          float d = abs(a - b);
          return min(d, 1.0 - d);
        }

        void main() {
          float flow = fract(uTime * uSpeed);
          float headDistance = cyclicDistance(vUv.x, flow);
          float head = exp(-headDistance * headDistance * uHeadSharpness);
          float wave = 0.5 + 0.5 * sin((vUv.x * uFrequency - uTime * uSpeed * 2.4) * 6.2831853);
          wave = pow(wave, 2.2);
          float filament = 0.68 + 0.32 * sin(vUv.x * 72.0 - uTime * 7.0);
          float circumference = 0.58 + 0.42 * pow(abs(sin(vUv.y * 3.1415926)), 0.7);
          float energy = 0.34 + wave * 0.38 + head * 1.10;
          vec3 color = uColor * (1.0 + energy * uGlow + head * 1.35);
          float alpha = uOpacity * energy * filament * circumference;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: T.AdditiveBlending,
      toneMapped: false
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.renderOrder = options.renderOrder || 5;
    enableSelectiveBloom(mesh);
    return { curve, line: mesh, material, uniforms };
  }

  function createFlowPackets(curve, count, texture, color, size, speed, offset = 0) {
    return Array.from({ length: count }, (_, index) => {
      const packet = new T.Sprite(new T.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending,
        toneMapped: false
      }));
      packet.scale.setScalar(size);
      packet.renderOrder = 10;
      enableSelectiveBloom(packet);
      packet.userData.flow = {
        curve,
        speed,
        phase: offset + index / count,
        baseOpacity: 0.75,
        baseSize: size
      };
      return packet;
    });
  }

  /** Two low-cost star shells with shader twinkle and independent parallax. */
  function createStars(count = 720, options = {}) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const color = new T.Color();
    const minRadius = options.minRadius || 10;
    const maxRadius = options.maxRadius || 24;
    for (let index = 0; index < count; index += 1) {
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      color.set(index % 17 === 0 ? 0xffa34f : index % 7 === 0 ? 0x4f9cff : 0xc8e3ff);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      sizes[index] = (options.size || 1.0) * (0.65 + Math.random() * 1.25);
      phases[index] = Math.random() * Math.PI * 2;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new T.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new T.BufferAttribute(phases, 1));
    const material = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: options.opacity ?? 0.8 }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vTwinkle = 0.64 + 0.36 * sin(uTime * 1.35 + aPhase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = max(1.0, aSize * uPixelRatio * (48.0 / max(4.0, -mvPosition.z)));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uOpacity;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p) * 2.0;
          float core = 1.0 - smoothstep(0.0, 0.28, d);
          float glow = 1.0 - smoothstep(0.12, 1.0, d);
          float alpha = (core + glow * 0.62) * vTwinkle * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor * (1.1 + core * 1.6), alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false
    });
    const points = new T.Points(geometry, material);
    points.userData.parallax = options.parallax || 0.08;
    return points;
  }

  /**
   * Small, dependency-free bloom pass. It runs at reduced resolution and is
   * disabled automatically on constrained devices. The transparent alpha is
   * preserved so surrounding glassmorphism remains unchanged.
   */
  function createBloomPipeline(renderer, scene, camera, enabled, quality = "medium") {
    if (!enabled) {
      return {
        enabled: false,
        setSize() {},
        render() { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      };
    }

    try {
      const fullOptions = {
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
        format: T.RGBAFormat,
        type: T.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false
      };
      const reducedOptions = { ...fullOptions, depthBuffer: false };
      const sceneTarget = new T.WebGLRenderTarget(2, 2, fullOptions);
      const emissiveTarget = new T.WebGLRenderTarget(2, 2, fullOptions);
      const brightTarget = new T.WebGLRenderTarget(2, 2, reducedOptions);
      const blurTargetA = new T.WebGLRenderTarget(2, 2, reducedOptions);
      const blurTargetB = new T.WebGLRenderTarget(2, 2, reducedOptions);
      [sceneTarget, emissiveTarget, brightTarget, blurTargetA, blurTargetB].forEach((target) => {
        target.texture.generateMipmaps = false;
      });

      const postScene = new T.Scene();
      const postCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 2);
      postCamera.position.z = 1;
      const quad = new T.Mesh(new T.PlaneGeometry(2, 2), null);
      quad.frustumCulled = false;
      postScene.add(quad);
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `;
      const thresholdMaterial = new T.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: emissiveTarget.texture },
          uThreshold: { value: quality === "high" ? 0.54 : 0.58 },
          uKnee: { value: 0.075 }
        },
        vertexShader,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D tDiffuse;
          uniform float uThreshold;
          uniform float uKnee;
          void main() {
            vec4 source = texture2D(tDiffuse, vUv);
            float brightness = max(source.r, max(source.g, source.b));
            float soft = clamp((brightness - uThreshold + uKnee) / (2.0 * uKnee), 0.0, 1.0);
            soft = soft * soft * uKnee;
            float contribution = max(soft, brightness - uThreshold) / max(brightness, 0.0001);
            gl_FragColor = vec4(source.rgb * contribution, contribution);
          }
        `,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      const blurMaterial = new T.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: brightTarget.texture },
          uDirection: { value: new T.Vector2(1, 0) }
        },
        vertexShader,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D tDiffuse;
          uniform vec2 uDirection;
          void main() {
            vec4 color = texture2D(tDiffuse, vUv) * 0.294118;
            color += texture2D(tDiffuse, vUv + uDirection * 1.25) * 0.235294;
            color += texture2D(tDiffuse, vUv - uDirection * 1.25) * 0.235294;
            color += texture2D(tDiffuse, vUv + uDirection * 2.75) * 0.117647;
            color += texture2D(tDiffuse, vUv - uDirection * 2.75) * 0.117647;
            gl_FragColor = color;
          }
        `,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      const compositeMaterial = new T.ShaderMaterial({
        uniforms: {
          tBase: { value: sceneTarget.texture },
          tBloom: { value: blurTargetB.texture },
          uStrength: { value: quality === "high" ? 0.36 : 0.29 }
        },
        vertexShader,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D tBase;
          uniform sampler2D tBloom;
          uniform float uStrength;
          void main() {
            vec4 base = texture2D(tBase, vUv);
            vec3 bloom = texture2D(tBloom, vUv).rgb * uStrength;
            float bloomAlpha = clamp(max(bloom.r, max(bloom.g, bloom.b)) * 0.28, 0.0, 0.42);
            gl_FragColor = vec4(base.rgb + bloom, max(base.a, bloomAlpha));
          }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });

      const renderQuad = (material, target) => {
        quad.material = material;
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(postScene, postCamera);
      };

      return {
        enabled: true,
        setSize(width, height) {
          const drawing = new T.Vector2();
          renderer.getDrawingBufferSize(drawing);
          const fullWidth = Math.max(2, Math.floor(drawing.x));
          const fullHeight = Math.max(2, Math.floor(drawing.y));
          // A moderately high bloom buffer keeps orbit and marker halos tight.
          const scale = quality === "high" ? 0.42 : 0.34;
          const bloomWidth = Math.max(2, Math.floor(fullWidth * scale));
          const bloomHeight = Math.max(2, Math.floor(fullHeight * scale));
          sceneTarget.setSize(fullWidth, fullHeight);
          emissiveTarget.setSize(bloomWidth, bloomHeight);
          brightTarget.setSize(bloomWidth, bloomHeight);
          blurTargetA.setSize(bloomWidth, bloomHeight);
          blurTargetB.setSize(bloomWidth, bloomHeight);
        },
        render() {
          const previousMask = camera.layers.mask;

          // Render the complete, sharp scene with the Earth on the base layer.
          camera.layers.set(0);
          renderer.setRenderTarget(sceneTarget);
          renderer.clear();
          renderer.render(scene, camera);

          // Render only explicitly tagged emissive objects into the bloom source.
          camera.layers.set(BLOOM_LAYER);
          renderer.setRenderTarget(emissiveTarget);
          renderer.clear();
          renderer.render(scene, camera);
          camera.layers.mask = previousMask;

          thresholdMaterial.uniforms.tDiffuse.value = emissiveTarget.texture;
          renderQuad(thresholdMaterial, brightTarget);
          blurMaterial.uniforms.tDiffuse.value = brightTarget.texture;
          blurMaterial.uniforms.uDirection.value.set(1 / brightTarget.width, 0);
          renderQuad(blurMaterial, blurTargetA);
          blurMaterial.uniforms.tDiffuse.value = blurTargetA.texture;
          blurMaterial.uniforms.uDirection.value.set(0, 1 / blurTargetA.height);
          renderQuad(blurMaterial, blurTargetB);
          compositeMaterial.uniforms.tBase.value = sceneTarget.texture;
          compositeMaterial.uniforms.tBloom.value = blurTargetB.texture;
          renderQuad(compositeMaterial, null);
        }
      };
    } catch (error) {
      console.warn("Bloom disabled; direct rendering will be used.", error);
      return {
        enabled: false,
        setSize() {},
        render() { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      };
    }
  }

  function createRing(radius, tube, color, opacity, rotation, options = {}) {
    const geometry = new T.TorusGeometry(radius, tube, 10, (window.innerWidth < 760 ? Math.min(options.segments || 220, 140) : (options.segments || 220)));
    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new T.Color(color) },
      uOpacity: { value: opacity },
      uSpeed: { value: options.highlightSpeed ?? 0.08 },
      uFrequency: { value: options.highlightFrequency ?? 3.0 }
    };
    const material = new T.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uSpeed;
        uniform float uFrequency;
        varying vec2 vUv;
        void main() {
          float runner = 0.5 + 0.5 * sin((vUv.x * uFrequency - uTime * uSpeed) * 6.2831853);
          runner = pow(runner, 5.0);
          float micro = 0.82 + 0.18 * sin(vUv.x * 72.0 + uTime * 0.9);
          vec3 color = uColor * (1.1 + runner * 2.2);
          float alpha = uOpacity * micro * (0.42 + runner * 0.95);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: T.AdditiveBlending,
      toneMapped: false
    });
    const ring = new T.Mesh(geometry, material);
    ring.rotation.set(rotation[0], rotation[1], rotation[2]);
    ring.renderOrder = 3;
    enableSelectiveBloom(ring);
    ring.userData.cinematicRing = {
      baseRotation: new T.Vector3(rotation[0], rotation[1], rotation[2]),
      spin: 0,
      speed: options.speed ?? 0.02,
      wobble: options.wobble ?? 0.018,
      wobbleSpeed: options.wobbleSpeed ?? 0.35,
      phase: options.phase ?? 0
    };
    return ring;
  }

  async function loadTexture(url, anisotropy, options = {}) {
    return new Promise((resolve) => {
      new T.TextureLoader().load(
        url,
        (texture) => {
          // These maps are sampled by a custom ShaderMaterial. Three.js cannot
          // infer color conversion for arbitrary sampler uniforms, so color
          // maps stay linear here and are explicitly decoded in the shader.
          texture.encoding = T.LinearEncoding;
          texture.anisotropy = anisotropy;
          texture.wrapS = T.RepeatWrapping;
          texture.wrapT = T.ClampToEdgeWrapping;
          texture.magFilter = options.magFilter || T.LinearFilter;
          texture.minFilter = options.minFilter || T.LinearMipmapLinearFilter;
          texture.generateMipmaps = options.generateMipmaps !== false;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  async function initGlobe() {
    const deviceCores = navigator.hardwareConcurrency || 4;
    const compactViewport = window.innerWidth < 760;
    const quality = compactViewport || deviceCores <= 4 ? "low" : deviceCores >= 8 ? "high" : "medium";
    // A desktop globe needs enough drawing-buffer resolution to preserve the
    // 4K light-map detail. Keep the existing adaptive scaler, but avoid the
    // previous 1.22 DPR desktop ceiling on four-core machines.
    const pixelRatioCap = compactViewport
      ? (quality === "low" ? 1.22 : 1.45)
      : (quality === "high" ? 2.0 : quality === "medium" ? 1.72 : 1.48);

    const renderer = new T.WebGLRenderer({
      canvas,
      antialias: !compactViewport || quality !== "low",
      alpha: true,
      powerPreference: "high-performance",
      premultipliedAlpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    let adaptivePixelRatio = renderer.getPixelRatio();
    const minimumPixelRatio = compactViewport
      ? (quality === "high" ? 1.12 : quality === "medium" ? 1.0 : 0.92)
      : (quality === "high" ? 1.30 : quality === "medium" ? 1.18 : 1.10);
    let performanceElapsed = 0;
    let performanceFrames = 0;
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    // Slightly lower exposure preserves night-side contrast and prevents the
    // warm city texture from washing into large soft clusters.
    renderer.toneMappingExposure = 0.92;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.05, 8.6);

    const starsFar = createStars(quality === "high" ? 820 : quality === "medium" ? 560 : 320, {
      minRadius: 14,
      maxRadius: 28,
      size: 0.95,
      opacity: 0.72,
      parallax: 0.055
    });
    const starsNear = createStars(quality === "high" ? 260 : quality === "medium" ? 170 : 90, {
      minRadius: 8,
      maxRadius: 15,
      size: 1.35,
      opacity: 0.58,
      parallax: 0.12
    });
    const spaceDust = createStars(quality === "high" ? 150 : quality === "medium" ? 96 : 48, {
      minRadius: 5.4,
      maxRadius: 8.4,
      size: 1.62,
      opacity: 0.24,
      parallax: 0.19
    });
    [starsFar, starsNear, spaceDust].forEach((layer) => {
      layer.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      scene.add(layer);
    });

    const bloomPipeline = createBloomPipeline(
      renderer,
      scene,
      camera,
      !reducedMotion && quality !== "low",
      quality
    );

    const world = new T.Group();
    world.rotation.set(-0.04, -0.08, -0.015);
    scene.add(world);

    // Anisotropy is inexpensive for this single sphere and materially improves
    // texture detail toward the limb, so use the renderer's supported maximum.
    const anisotropy = Math.max(1, renderer.capabilities.getMaxAnisotropy());
    const [surfaceMap, lightsMap, lightMaskMap, normalMap, specularMap, roughnessMap] = await Promise.all([
      loadTexture("/assets/textures/earth_surface_4096.png?v=20260712-sharp1", anisotropy),
      loadTexture("/assets/textures/earth_lights_points_4096.png?v=20260712-sharp1", anisotropy),
      loadTexture("/assets/textures/earth_lights_4096.png?v=20260712-sharp1", anisotropy),
      loadTexture("/assets/textures/earth_normal_2048.png?v=20260712-sharp1", anisotropy),
      loadTexture("/assets/textures/earth_specular_2048.png?v=20260712-sharp1", anisotropy),
      loadTexture("/assets/textures/earth_roughness_2048.png?v=20260712-sharp1", anisotropy)
    ]);

    const coreUniforms = {
      uTime: { value: 0 },
      uSurfaceMap: { value: surfaceMap || new T.Texture() },
      uLightsMap: { value: lightsMap || new T.Texture() },
      uLightMaskMap: { value: lightMaskMap || new T.Texture() },
      uNormalMap: { value: normalMap || new T.Texture() },
      uSpecularMap: { value: specularMap || new T.Texture() },
      uRoughnessMap: { value: roughnessMap || new T.Texture() },
      uHasSurfaceMap: { value: surfaceMap ? 1 : 0 },
      uHasLightsMap: { value: lightsMap ? 1 : 0 },
      uHasLightMaskMap: { value: lightMaskMap ? 1 : 0 },
      uHasNormalMap: { value: normalMap ? 1 : 0 },
      uHasSpecularMap: { value: specularMap ? 1 : 0 },
      uHasRoughnessMap: { value: roughnessMap ? 1 : 0 }
    };

    const coreMaterial = new T.ShaderMaterial({
      uniforms: coreUniforms,
      extensions: { derivatives: true },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        varying vec3 vPositionV;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          vPositionV = mvPosition.xyz;
          vPosition = position;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uSurfaceMap;
        uniform sampler2D uLightsMap;
        uniform sampler2D uLightMaskMap;
        uniform sampler2D uNormalMap;
        uniform sampler2D uSpecularMap;
        uniform sampler2D uRoughnessMap;
        uniform float uHasSurfaceMap;
        uniform float uHasLightsMap;
        uniform float uHasLightMaskMap;
        uniform float uHasNormalMap;
        uniform float uHasSpecularMap;
        uniform float uHasRoughnessMap;
        varying vec2 vUv;
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        varying vec3 vPositionV;
        varying vec3 vPosition;

        float lineGrid(float value, float scale, float width) {
          float f = abs(fract(value * scale) - 0.5);
          return 1.0 - smoothstep(width, width + 0.010, f);
        }

        vec3 contrast(vec3 color, float amount, float pivot) {
          return clamp((color - vec3(pivot)) * amount + vec3(pivot), 0.0, 1.0);
        }

        vec3 srgbToLinear(vec3 color) {
          vec3 low = color / 12.92;
          vec3 high = pow((color + 0.055) / 1.055, vec3(2.4));
          return mix(low, high, step(vec3(0.04045), color));
        }

        vec3 perturbNormal(vec3 baseNormal, vec3 mapNormal) {
          vec3 dp1 = dFdx(vPositionV);
          vec3 dp2 = dFdy(vPositionV);
          vec2 duv1 = dFdx(vUv);
          vec2 duv2 = dFdy(vUv);
          vec3 tangent = normalize(dp1 * duv2.y - dp2 * duv1.y);
          vec3 bitangent = normalize(-dp1 * duv2.x + dp2 * duv1.x);
          mat3 tbn = mat3(tangent, bitangent, normalize(baseNormal));
          return normalize(tbn * mapNormal);
        }

        void main() {
          vec3 viewDir = normalize(vViewDir);
          vec3 normalV = normalize(vNormalV);
          if (uHasNormalMap > 0.5) {
            vec3 mappedNormal = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
            mappedNormal.xy *= 0.36;
            normalV = perturbNormal(normalV, normalize(mappedNormal));
          }

          float facing = max(dot(normalV, viewDir), 0.0);
          float fresnel = pow(1.0 - facing, 5.2);
          float latitude = lineGrid(vUv.y, 18.0, 0.4825);
          float longitude = lineGrid(vUv.x, 36.0, 0.4850);
          float grid = max(latitude, longitude);

          vec3 surface = vec3(0.003, 0.013, 0.045);
          if (uHasSurfaceMap > 0.5) {
            // A small negative LOD bias keeps coastlines and terrain crisp while
            // retaining trilinear mip filtering during rotation.
            surface = srgbToLinear(texture2D(uSurfaceMap, vUv, -0.35).rgb);
          }
          surface *= 2.45;
          surface = contrast(surface, 1.18, 0.030);
          surface = pow(max(surface, vec3(0.0)), vec3(0.90));

          vec3 city = vec3(0.0);
          if (uHasLightsMap > 0.5) {
            // The point-light map contains discrete local maxima. A stronger
            // negative mip bias prevents tiny lights from averaging into blobs.
            city = srgbToLinear(texture2D(uLightsMap, vUv, -1.15).rgb);
          }
          vec3 lightMask = vec3(0.0);
          if (uHasLightMaskMap > 0.5) {
            lightMask = srgbToLinear(texture2D(uLightMaskMap, vUv, -0.15).rgb);
          }
          float cityLuma = max(city.r, max(city.g, city.b));
          float cityPoint = smoothstep(0.0025, 0.16, cityLuma);
          float cityCore = smoothstep(0.055, 0.62, cityLuma);
          float bakedLightLuma = max(lightMask.r, max(lightMask.g, lightMask.b));
          float bakedLightMask = smoothstep(0.0018, 0.18, bakedLightLuma);
          // The diffuse map contains baked lights. Remove their broad footprint
          // with the original mask, then add only the discrete point map once.
          surface *= (1.0 - bakedLightMask * 0.965);
          vec2 cityCell = floor(vUv * vec2(2048.0, 1024.0));
          float citySeed = fract(sin(dot(cityCell, vec2(12.9898, 78.233))) * 43758.5453);
          float cityTwinkle = 0.91 + 0.09 * sin(uTime * (0.72 + citySeed * 1.25) + citySeed * 6.2831853);
          cityTwinkle = mix(1.0, cityTwinkle, cityCore);

          vec3 lightDir = normalize(vec3(-0.42, 0.28, 0.86));
          float diffuse = max(dot(normalV, lightDir), 0.0);
          vec3 halfDir = normalize(lightDir + viewDir);
          float specMask = uHasSpecularMap > 0.5 ? texture2D(uSpecularMap, vUv).r : 0.35;
          float roughness = uHasRoughnessMap > 0.5 ? texture2D(uRoughnessMap, vUv).r : 0.62;
          float specPower = mix(82.0, 18.0, roughness);
          float specular = pow(max(dot(normalV, halfDir), 0.0), specPower) * specMask;

          float scan = smoothstep(0.982, 1.0, sin((vUv.y + uTime * 0.010) * 132.0) * 0.5 + 0.5);
          float baseLuma = dot(surface, vec3(0.2126, 0.7152, 0.0722));
          vec3 color = surface * (0.88 + diffuse * 0.22);
          color += vec3(0.08, 0.30, 0.78) * specular * 0.16;
          color += vec3(0.025, 0.20, 0.52) * fresnel * 0.16;
          color += vec3(0.08, 0.48, 0.94) * grid * (0.016 + fresnel * 0.018);

          // The emissive city map is rendered as compact, high-contrast points.
          // It deliberately stays out of the bloom layer so the points remain crisp.
          vec3 cityColor = city * (3.4 + cityPoint * 3.2 + cityCore * 4.6) * cityTwinkle;
          cityColor = contrast(cityColor, 1.34, 0.012);
          color += cityColor;
          color += vec3(0.055, 0.42, 0.98) * scan * 0.010;
          color += vec3(0.006, 0.027, 0.082) * (1.0 - baseLuma) * 0.10;

          // Preserve local contrast and leave highlight roll-off to the single
          // renderer-level ACES pass. The previous second Reinhard-style curve
          // compressed bright points into flat, soft clusters.
          color = max(color - vec3(0.006, 0.008, 0.012), vec3(0.0));
          color = pow(color, vec3(0.96, 0.98, 1.00));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false
    });

    const coreSegments = quality === "high" ? 112 : quality === "medium" ? 96 : 72;
    const core = new T.Mesh(new T.SphereGeometry(2.02, coreSegments, coreSegments), coreMaterial);
    core.renderOrder = 1;
    world.add(core);

    const cloudUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: quality === "low" ? 0.022 : 0.034 }
    };
    const cloudLayer = new T.Mesh(
      new T.SphereGeometry(2.038, quality === "low" ? 64 : 88, quality === "low" ? 64 : 88),
      new T.ShaderMaterial({
        uniforms: cloudUniforms,
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormalV = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vNormalV;
          varying vec3 vViewDir;

          float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          float noise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                       mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.56;
            for (int i = 0; i < 3; i++) {
              value += noise2(p) * amplitude;
              p = p * 2.03 + vec2(3.1, 1.7);
              amplitude *= 0.48;
            }
            return value;
          }
          void main() {
            vec2 driftUv = vec2(vUv.x + uTime * 0.0021, vUv.y + sin(vUv.x * 6.2831 + uTime * 0.06) * 0.008);
            float cloudNoise = fbm(driftUv * vec2(5.2, 3.1));
            float wisps = fbm(driftUv * vec2(10.4, 5.7) + 7.4);
            float cloud = smoothstep(0.58, 0.81, cloudNoise * 0.78 + wisps * 0.30);
            float facing = max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0);
            float rim = pow(1.0 - facing, 2.4);
            vec3 color = mix(vec3(0.50, 0.72, 1.0), vec3(0.88, 0.96, 1.0), cloudNoise);
            float alpha = cloud * uOpacity * (0.54 + rim * 0.46);
            if (alpha < 0.004) discard;
            gl_FragColor = vec4(color * (1.05 + rim * 0.28), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: T.NormalBlending,
        toneMapped: false
      })
    );
    cloudLayer.renderOrder = 2;
    world.add(cloudLayer);

    const wire = new T.LineSegments(
      new T.WireframeGeometry(new T.IcosahedronGeometry(2.055, 5)),
      new T.LineBasicMaterial({ color: COLORS.electric, transparent: true, opacity: 0.065, depthWrite: false, blending: T.AdditiveBlending })
    );
    wire.renderOrder = 2;
    world.add(wire);

    const glassUniforms = { uTime: { value: 0 } };
    const glass = new T.Mesh(
      new T.SphereGeometry(2.16, 96, 96),
      new T.ShaderMaterial({
        uniforms: glassUniforms,
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormalV = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          varying vec2 vUv;
          void main() {
            float rim = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 5.1);
            float diagonal = smoothstep(0.97, 1.0, sin((vUv.x * 1.7 + vUv.y) * 52.0 + uTime * 0.08) * 0.5 + 0.5);
            vec3 color = mix(vec3(0.10, 0.42, 1.0), vec3(0.22, 0.92, 1.0), vUv.y);
            float alpha = rim * 0.105 + diagonal * rim * 0.014;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: T.BackSide,
        blending: T.AdditiveBlending
      })
    );
    glass.renderOrder = 6;
    world.add(glass);

    const atmosphereUniforms = { uTime: { value: 0 } };
    const atmosphere = new T.Mesh(
      new T.SphereGeometry(2.205, quality === "low" ? 64 : 88, quality === "low" ? 64 : 88),
      new T.ShaderMaterial({
        uniforms: atmosphereUniforms,
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormalV = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          varying vec2 vUv;
          void main() {
            vec3 normalV = normalize(vNormalV);
            vec3 viewDir = normalize(vViewDir);
            float facing = max(dot(normalV, viewDir), 0.0);
            float thickness = pow(1.0 - facing, 4.2);
            float rayleigh = pow(thickness, 1.20);
            float horizon = pow(thickness, 3.10);
            vec3 lightDir = normalize(vec3(-0.52, 0.18, 0.83));
            float mie = pow(max(dot(viewDir, lightDir), 0.0), 11.0) * thickness;
            float pulse = 0.94 + 0.06 * sin(uTime * 0.58 + vUv.y * 5.0);
            vec3 color = vec3(0.03, 0.22, 0.96) * rayleigh;
            color += vec3(0.12, 0.86, 1.0) * horizon * 0.92;
            color += vec3(0.42, 0.62, 1.0) * mie * 0.34;
            float alpha = clamp(rayleigh * 0.045 + horizon * 0.115 + mie * 0.018, 0.0, 0.17) * pulse;
            gl_FragColor = vec4(color * (0.88 + horizon * 0.30), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: T.BackSide,
        blending: T.AdditiveBlending,
        toneMapped: false
      })
    );
    atmosphere.renderOrder = 0;
    world.add(atmosphere);

    // A broader, very soft Fresnel shell creates the premium atmospheric falloff
    // visible around the reference globe without obscuring the night texture.
    const outerAtmosphere = new T.Mesh(
      new T.SphereGeometry(2.255, quality === "low" ? 48 : 64, quality === "low" ? 48 : 64),
      new T.ShaderMaterial({
        uniforms: atmosphereUniforms,
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormalV = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          void main() {
            vec3 normalV = normalize(vNormalV);
            vec3 viewDir = normalize(vViewDir);
            float thickness = pow(1.0 - max(dot(normalV, viewDir), 0.0), 6.0);
            float halo = pow(thickness, 5.2);
            float pulse = 0.92 + 0.08 * sin(uTime * 0.42);
            vec3 color = mix(vec3(0.035, 0.21, 0.95), vec3(0.16, 0.88, 1.0), halo);
            gl_FragColor = vec4(color * (0.54 + halo * 0.64), halo * 0.038 * pulse);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: T.BackSide,
        blending: T.AdditiveBlending,
        toneMapped: false
      })
    );
    outerAtmosphere.renderOrder = -1;
    world.add(outerAtmosphere);

    const innerCore = new T.Mesh(
      new T.SphereGeometry(1.72, 64, 64),
      new T.MeshBasicMaterial({ color: 0x02102d, transparent: true, opacity: 0.33, depthWrite: false })
    );
    world.add(innerCore);

    const rings = [
      createRing(2.38, 0.014, COLORS.blue, 0.46, [1.08, 0.05, 0.24], { speed: 0.030, wobble: 0.016, wobbleSpeed: 0.29, phase: 0.2, highlightSpeed: 0.055, highlightFrequency: 2.6 }),
      createRing(2.43, 0.008, COLORS.cyan, 0.42, [0.56, -0.34, 1.1], { speed: -0.022, wobble: 0.026, wobbleSpeed: 0.21, phase: 2.1, highlightSpeed: -0.042, highlightFrequency: 3.8 }),
      createRing(2.47, 0.0115, COLORS.orange, 0.58, [1.4, 0.24, -0.48], { speed: 0.018, wobble: 0.020, wobbleSpeed: 0.25, phase: 4.2, highlightSpeed: 0.072, highlightFrequency: 2.1 })
    ];
    rings.forEach((ring) => world.add(ring));

    // The core Three.js globe remains untouched. Only clean 3D anchor points
    // are added here; crisp brand icons live in the DOM overlay and are
    // projected onto these anchors every frame.
    const nodeConfigs = [
      { key: "developer", lat: 19, lon: -61, color: 0x49baff },
      { key: "git", lat: 49, lon: -19, color: 0x4f9cff },
      { key: "cicd", lat: 30, lon: 50, color: 0x8c72ff },
      { key: "aws", lat: 4, lon: 2, color: 0xff9a2d },
      { key: "cloudwatch", lat: -31, lon: 48, color: 0x31dcec },
      { key: "alerts", lat: -34, lon: -55, color: 0xff982d }
    ];

    const glowBlue = glowDotTexture("#45baff");
    const glowOrange = glowDotTexture("#ff9a2d");
    const nodes = new Map();

    nodeConfigs.forEach((config) => {
      const anchor = new T.Object3D();
      anchor.position.copy(latLonToVector(config.lat, config.lon, 2.12));
      anchor.userData.config = config;
      world.add(anchor);

      const pin = new T.Sprite(new T.SpriteMaterial({
        map: config.key === "aws" || config.key === "alerts" ? glowOrange : glowBlue,
        color: config.color,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending,
        toneMapped: false
      }));
      pin.scale.setScalar(config.key === "aws" ? 0.16 : 0.11);
      pin.renderOrder = 7;
      enableSelectiveBloom(pin);
      anchor.add(pin);

      const coreLight = new T.Mesh(
        new T.SphereGeometry(config.key === "aws" ? 0.027 : 0.018, 10, 10),
        new T.MeshBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: 0.95,
          blending: T.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        })
      );
      coreLight.renderOrder = 8;
      enableSelectiveBloom(coreLight);
      anchor.add(coreLight);
      anchor.userData.pin = pin;
      anchor.userData.coreLight = coreLight;
      nodes.set(config.key, anchor);
    });

    // Persistent blue network arcs add the global connected-system layer from
    // the reference. They remain deliberately subtle behind the DOM controls.
    const networkRoutes = [
      [[40.71, -74.01], [51.51, -0.13]],
      [[51.51, -0.13], [19.08, 72.88]],
      [[19.08, 72.88], [1.35, 103.82]],
      [[1.35, 103.82], [35.68, 139.69]],
      [[35.68, 139.69], [37.77, -122.42]],
      [[37.77, -122.42], [40.71, -74.01]],
      [[25.20, 55.27], [-33.87, 151.21]]
    ];
    const networkFlowArcs = [];
    const networkPackets = [];
    networkRoutes.forEach((route, index) => {
      const start = latLonToVector(route[0][0], route[0][1], 2.075);
      const end = latLonToVector(route[1][0], route[1][1], 2.075);
      const arc = createFlowArc(start, end, 0.20 + (index % 3) * 0.055, index % 3 === 0 ? COLORS.cyan : COLORS.blue, {
        opacity: index % 3 === 0 ? 0.22 : 0.18,
        radius: quality === "low" ? 0.005 : 0.0065,
        speed: 0.17 + index * 0.012,
        dashScale: 9 + (index % 2) * 2,
        dashRatio: 0.26,
        glow: 1.05,
        renderOrder: 4
      });
      world.add(arc.line);
      const packets = createFlowPackets(
        arc.curve,
        quality === "low" ? 1 : 2,
        glowBlue,
        index % 3 === 0 ? COLORS.cyan : COLORS.electric,
        quality === "low" ? 0.045 : 0.055,
        0.045 + index * 0.003,
        index * 0.11
      );
      packets.forEach((packet) => world.add(packet));
      networkFlowArcs.push({ ...arc, baseOpacity: arc.uniforms.uOpacity.value, index });
      networkPackets.push(...packets);
    });

    const monitoringFlowArcs = [];
    const monitoringPackets = [];
    [
      [nodes.get("aws").position, nodes.get("cloudwatch").position],
      [nodes.get("cloudwatch").position, nodes.get("alerts").position]
    ].forEach(([start, end], index) => {
      const arc = createFlowArc(start, end, 0.25 + index * 0.04, COLORS.cyan, {
        opacity: 0.28,
        radius: quality === "low" ? 0.0055 : 0.007,
        speed: 0.23,
        dashScale: 7.5,
        dashRatio: 0.32,
        glow: 1.35,
        renderOrder: 6
      });
      world.add(arc.line);
      const packets = createFlowPackets(
        arc.curve,
        quality === "low" ? 1 : 2,
        glowBlue,
        COLORS.cyan,
        quality === "low" ? 0.05 : 0.06,
        0.065,
        index * 0.37
      );
      packets.forEach((packet) => world.add(packet));
      monitoringFlowArcs.push({ ...arc, baseOpacity: arc.uniforms.uOpacity.value, index });
      monitoringPackets.push(...packets);
    });

    // AWS regions use real city coordinates. Only the three deployment-wave
    // destinations keep compact labels visible; the rest remain clean pins and
    // reveal their full detail card on hover, keyboard focus, or click.
    const regions = [
      { code: "US-EAST-1", city: "N. Virginia", lat: 38.95, lon: -77.45, featured: true, cluster: "north-america", labelOffset: [-48, -58] },
      { code: "US-WEST-2", city: "Oregon", lat: 45.52, lon: -122.68, cluster: "north-america" },
      { code: "SA-EAST-1", city: "São Paulo", lat: -23.55, lon: -46.63, cluster: "south-america" },
      { code: "EU-WEST-1", city: "Ireland", lat: 53.35, lon: -6.26, featured: true, cluster: "europe", labelOffset: [-42, -62], clusterCount: 1 },
      { code: "EU-CENTRAL-1", city: "Frankfurt", lat: 50.11, lon: 8.68, cluster: "europe" },
      { code: "AP-SOUTH-1", city: "Mumbai", lat: 19.08, lon: 72.88, featured: true, cluster: "asia-pacific", labelOffset: [36, -56], clusterCount: 2 },
      { code: "AP-SOUTHEAST-1", city: "Singapore", lat: 1.35, lon: 103.82, cluster: "asia-pacific" },
      { code: "AP-NORTHEAST-1", city: "Tokyo", lat: 35.68, lon: 139.69, cluster: "asia-pacific" }
    ];

    const waveRouteIndices = [0, 3, 5]; // US-East-1 → EU-West-1 → AP-South-1
    const regionObjects = [];
    const regionCurves = [];
    const awsPosition = nodes.get("aws").position.clone();

    regions.forEach((region, index) => {
      const position = latLonToVector(region.lat, region.lon, 2.10);
      const regionAnchor = new T.Object3D();
      regionAnchor.position.copy(position);
      world.add(regionAnchor);

      const pin = new T.Sprite(new T.SpriteMaterial({
        map: glowOrange,
        color: region.featured ? 0xffb15b : 0xffa34a,
        transparent: true,
        opacity: region.featured ? 0.62 : 0.40,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending
      }));
      pin.scale.setScalar(region.featured ? 0.105 : 0.075);
      pin.renderOrder = 7;
      enableSelectiveBloom(pin);
      regionAnchor.add(pin);

      // Three compact AZ lights appear on the globe; the readable AZ names live
      // in the hover/click card rather than permanently occupying the scene.
      const azPins = [-1, 0, 1].map((offsetIndex) => {
        const azPin = new T.Sprite(new T.SpriteMaterial({
          map: glowOrange,
          color: 0xffc06b,
          transparent: true,
          opacity: region.featured ? 0.24 : 0.11,
          depthWrite: false,
          depthTest: true,
          blending: T.AdditiveBlending
        }));
        azPin.position.set(offsetIndex * 0.078, -0.07, 0.032 * Math.abs(offsetIndex));
        azPin.scale.setScalar(region.featured ? 0.042 : 0.031);
        azPin.renderOrder = 8;
        enableSelectiveBloom(azPin);
        regionAnchor.add(azPin);
        return azPin;
      });

      regionObjects.push({
        region,
        index,
        anchor: regionAnchor,
        position,
        pin,
        azPins,
        marker: null,
        phase: index * 0.65,
        waveBoost: 0
      });
    });

    // GPU-friendly region ripples and vertical light beams. A single Points draw
    // call and a single LineSegments draw call cover every AWS region.
    const regionRipplePositions = new Float32Array(regionObjects.length * 3);
    const regionRipplePhases = new Float32Array(regionObjects.length);
    const regionRippleFeatured = new Float32Array(regionObjects.length);
    const regionBeamPositions = new Float32Array(regionObjects.length * 2 * 3);
    const regionBeamPhases = new Float32Array(regionObjects.length * 2);
    const regionBeamT = new Float32Array(regionObjects.length * 2);
    regionObjects.forEach((item, index) => {
      const surface = item.position.clone().normalize().multiplyScalar(2.12);
      const beamTop = item.position.clone().normalize().multiplyScalar(item.region.featured ? 2.58 : 2.44);
      surface.toArray(regionRipplePositions, index * 3);
      regionRipplePhases[index] = item.phase;
      regionRippleFeatured[index] = item.region.featured ? 1 : 0;
      surface.toArray(regionBeamPositions, index * 6);
      beamTop.toArray(regionBeamPositions, index * 6 + 3);
      regionBeamPhases[index * 2] = item.phase;
      regionBeamPhases[index * 2 + 1] = item.phase;
      regionBeamT[index * 2] = 0;
      regionBeamT[index * 2 + 1] = 1;
    });

    const regionRippleGeometry = new T.BufferGeometry();
    regionRippleGeometry.setAttribute("position", new T.BufferAttribute(regionRipplePositions, 3));
    regionRippleGeometry.setAttribute("aPhase", new T.BufferAttribute(regionRipplePhases, 1));
    regionRippleGeometry.setAttribute("aFeatured", new T.BufferAttribute(regionRippleFeatured, 1));
    const regionRippleUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uOpacity: { value: 1 },
      uDeployment: { value: 0 }
    };
    const regionRipplePoints = new T.Points(regionRippleGeometry, new T.ShaderMaterial({
      uniforms: regionRippleUniforms,
      vertexShader: `
        attribute float aPhase;
        attribute float aFeatured;
        varying float vPhase;
        varying float vFeatured;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vPhase = aPhase;
          vFeatured = aFeatured;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.5 + 0.5 * sin(uTime * 2.2 + aPhase);
          float size = mix(22.0, 31.0, aFeatured) * (0.86 + pulse * 0.22);
          gl_PointSize = size * uPixelRatio * (7.4 / max(4.8, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vPhase;
        varying float vFeatured;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uDeployment;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p) * 2.0;
          float wave = fract(uTime * 0.34 + vPhase * 0.11);
          float ringRadius = mix(0.18, 0.92, wave);
          float ring = 1.0 - smoothstep(0.035, 0.095, abs(d - ringRadius));
          ring *= (1.0 - wave);
          float core = 1.0 - smoothstep(0.0, 0.20, d);
          float boost = 1.0 + uDeployment * (0.35 + vFeatured * 0.75);
          vec3 color = mix(vec3(0.22, 0.64, 1.0), vec3(1.0, 0.53, 0.12), 0.72 + vFeatured * 0.18);
          float alpha = (ring * 0.72 + core * 0.34) * uOpacity * boost;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color * (1.15 + core * 0.85), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: T.AdditiveBlending,
      toneMapped: false
    }));
    regionRipplePoints.renderOrder = 9;
    enableSelectiveBloom(regionRipplePoints);
    world.add(regionRipplePoints);

    const regionBeamGeometry = new T.BufferGeometry();
    regionBeamGeometry.setAttribute("position", new T.BufferAttribute(regionBeamPositions, 3));
    regionBeamGeometry.setAttribute("aPhase", new T.BufferAttribute(regionBeamPhases, 1));
    regionBeamGeometry.setAttribute("aLineT", new T.BufferAttribute(regionBeamT, 1));
    const regionBeamUniforms = { uTime: { value: 0 }, uOpacity: { value: 0.45 }, uDeployment: { value: 0 } };
    const regionBeams = new T.LineSegments(regionBeamGeometry, new T.ShaderMaterial({
      uniforms: regionBeamUniforms,
      vertexShader: `
        attribute float aPhase;
        attribute float aLineT;
        varying float vPhase;
        varying float vLineT;
        void main() {
          vPhase = aPhase;
          vLineT = aLineT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vPhase;
        varying float vLineT;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uDeployment;
        void main() {
          float scan = 0.5 + 0.5 * sin(uTime * 4.8 - vLineT * 9.0 + vPhase);
          float fade = smoothstep(1.0, 0.08, vLineT);
          float alpha = uOpacity * fade * (0.28 + scan * 0.72) * (1.0 + uDeployment * 0.8);
          gl_FragColor = vec4(vec3(1.0, 0.46, 0.10) * (1.25 + scan * 0.85), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: T.AdditiveBlending,
      toneMapped: false
    }));
    regionBeams.renderOrder = 8;
    enableSelectiveBloom(regionBeams);
    world.add(regionBeams);

    // Three sequential deployment arcs use animated emissive tubes. The GSAP
    // deployment wave still controls their timing, so the existing interaction
    // and region-selection behavior is preserved.
    waveRouteIndices.forEach((regionIndex, step) => {
      const start = step === 0 ? awsPosition : regionObjects[waveRouteIndices[step - 1]].position;
      const end = regionObjects[regionIndex].position;
      const arc = createFlowArc(start, end, 0.34 + step * 0.055, COLORS.orange, {
        opacity: 0,
        radius: quality === "low" ? 0.007 : 0.0105,
        speed: 0.34,
        dashScale: 7.2,
        dashRatio: 0.34,
        glow: 1.75,
        renderOrder: 8
      });
      world.add(arc.line);

      const packets = createFlowPackets(
        arc.curve,
        quality === "low" ? 1 : 3,
        glowOrange,
        0xffad4d,
        quality === "low" ? 0.07 : 0.085,
        0.1,
        step * 0.19
      );
      packets.forEach((packet) => {
        packet.material.opacity = 0;
        world.add(packet);
      });

      regionCurves.push({
        ...arc,
        packet: packets[0],
        packets,
        destinationIndex: regionIndex,
        step,
        state: { progress: 0, intensity: 0 }
      });
    });

    if (regionOverlayLayer) {
      regionObjects.forEach((item) => {
        const { region, index } = item;
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = `region-marker${region.featured ? " is-featured" : " is-pin-only"}`;
        marker.dataset.regionIndex = String(index);
        marker.dataset.cluster = region.cluster;
        marker.setAttribute("aria-expanded", "false");
        marker.setAttribute("aria-label", `${region.code}, ${region.city}, three Availability Zones`);
        const clusterBadge = region.clusterCount ? `<i class="region-cluster-count">+${region.clusterCount}</i>` : "";
        const compactLabel = region.featured
          ? `<span class="region-compact-label" style="--label-x:${region.labelOffset[0]}px;--label-y:${region.labelOffset[1]}px"><strong>${region.code}</strong><small>${region.city}</small>${clusterBadge}</span>`
          : "";
        marker.innerHTML = `
          <span class="region-pin-core"><i></i></span>
          ${compactLabel}
          <span class="region-detail-card">
            <strong>${region.code}</strong>
            <small>${region.city}</small>
            <span class="region-az-row"><em>AZ-A</em><em>AZ-B</em><em>AZ-C</em></span>
          </span>`;

        marker.addEventListener("click", (event) => {
          event.stopPropagation();
          const nextOpen = !marker.classList.contains("is-open");
          qsa(".region-marker.is-open", regionOverlayLayer).forEach((openMarker) => {
            openMarker.classList.remove("is-open");
            openMarker.setAttribute("aria-expanded", "false");
          });
          marker.classList.toggle("is-open", nextOpen);
          marker.setAttribute("aria-expanded", String(nextOpen));
        });

        regionOverlayLayer.appendChild(marker);
        item.marker = marker;
      });

      stage.addEventListener("click", () => {
        qsa(".region-marker.is-open", regionOverlayLayer).forEach((marker) => {
          marker.classList.remove("is-open");
          marker.setAttribute("aria-expanded", "false");
        });
      });
    }

    const pinPositions = [
      [18, -32], [-18, -18], [26, 10], [-11, 27], [34, 40],
      [-5, 66], [-24, -45], [-36, 10]
    ];
    const pulsePins = pinPositions.map(([lat, lon], index) => {
      const pin = new T.Sprite(new T.SpriteMaterial({
        map: index % 3 === 0 ? glowOrange : glowBlue,
        color: index % 3 === 0 ? 0xffa03d : 0x4fc2ff,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending
      }));
      pin.position.copy(latLonToVector(lat, lon, 2.08));
      pin.scale.setScalar(0.07);
      pin.userData.phase = index * 0.42;
      pin.renderOrder = 7;
      enableSelectiveBloom(pin);
      world.add(pin);
      return pin;
    });

    const domNodes = new Map(
      [...qsa("[data-node]", uiLayer || document)].map((element) => [element.dataset.node, element])
    );
    const stageIcons = qsa(".pipeline-stage", uiLayer || document);
    const developerOrb = qs(".node-orb-developer", uiLayer || document);
    const typingConsole = qs("#typing-console", uiLayer || document);
    const gitCluster = qs(".icon-cluster-git", uiLayer || document);
    const pipelineIcons = qs(".pipeline-stage-icons", uiLayer || document);
    const awsOrb = qs(".node-orb-aws", uiLayer || document);
    const cloudwatchOrb = qs(".node-orb-cloudwatch", uiLayer || document);
    const alertsCluster = qs(".icon-cluster-alerts", uiLayer || document);

    const overlayState = {
      assetProgress: 0,
      telemetryProgress: 0,
      feedbackProgress: 0,
      deploymentIntensity: 0,
      deploymentWaveIndex: 0,
      deploymentWaveProgress: 0,
      activeLayer: "all",
      pathReady: false
    };

    function applyLayerMode(mode = "all") {
      overlayState.activeLayer = mode;
      stage.dataset.activeLayer = mode;

      qsa("[data-layers]", stage).forEach((element) => {
        const layers = (element.dataset.layers || "").split(/\s+/).filter(Boolean);
        const focused = mode === "all" || layers.includes(mode);
        element.classList.toggle("is-layer-muted", !focused);
        element.classList.toggle("is-layer-focused", mode !== "all" && focused);
      });

      layerButtons.forEach((button) => {
        const pressed = mode === "all" || button.dataset.flowLayer === mode;
        button.setAttribute("aria-pressed", String(pressed));
      });
    }

    function initLayerControls() {
      if (!layerButtons.length) return;
      layerButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const requested = button.dataset.flowLayer;
          applyLayerMode(overlayState.activeLayer === requested ? "all" : requested);
        });
      });
      applyLayerMode("all");
    }

    function projectLocalPoint(localPosition) {
      world.updateMatrixWorld(true);

      // Project the globe-local anchor into screen space.
      const worldPoint = localPosition.clone().applyMatrix4(world.matrixWorld);
      const projected = worldPoint.clone().project(camera);
      const rect = stage.getBoundingClientRect();
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;

      // IMPORTANT: projected.z is clip-space depth and is normally close to 1 for
      // every visible object. Using it for opacity made every DOM icon almost
      // transparent. Surface facing is the correct value for globe visibility.
      const surfaceNormal = worldPoint.clone().normalize();
      const toCamera = camera.position.clone().sub(worldPoint).normalize();
      const facing = surfaceNormal.dot(toCamera);
      const depthScale = clamp(0.78 + Math.max(0, facing) * 0.34, 0.76, 1.12);

      return { x, y, facing, depthScale, z: projected.z };
    }

    function setProjectedNode(key) {
      const anchor = nodes.get(key);
      const element = domNodes.get(key);
      if (!anchor || !element) return;

      const point = projectLocalPoint(anchor.position);
      const visibility = clamp((point.facing + 0.10) / 0.30, 0, 1);

      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
      element.style.setProperty("--node-scale", point.depthScale.toFixed(3));
      element.style.zIndex = String(Math.round(60 + point.facing * 30));
      element.style.opacity = visibility.toFixed(3);
      element.style.visibility = visibility < 0.015 ? "hidden" : "visible";
      element.style.filter = point.facing < 0.08 ? "blur(.45px)" : "none";
    }

    function updateRegionMarkers() {
      regionObjects.forEach((item) => {
        if (!item.marker) return;
        const point = projectLocalPoint(item.position);
        const visibility = item.region.featured
          ? clamp((point.facing + 0.25) / 0.18, 0, 1)
          : clamp((point.facing + 0.10) / 0.28, 0, 1);
        item.marker.style.left = `${point.x}px`;
        item.marker.style.top = `${point.y}px`;
        item.marker.style.opacity = visibility.toFixed(3);
        item.marker.style.visibility = visibility < 0.025 ? "hidden" : "visible";
        item.marker.style.zIndex = String(Math.round(54 + point.facing * 28));
        item.marker.style.setProperty("--region-scale", clamp(point.depthScale * 0.92, 0.72, 1.04).toFixed(3));
        item.marker.classList.toggle("is-backside", point.facing < (item.region.featured ? -0.22 : 0.02));
      });
    }

    function centerInStage(element) {
      if (!element) return { x: 0, y: 0 };
      const elementRect = element.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      return {
        x: elementRect.left - stageRect.left + elementRect.width / 2,
        y: elementRect.top - stageRect.top + elementRect.height / 2
      };
    }

    function createSmoothPath(points, bend = 36) {
      if (!points.length) return "";
      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const direction = index % 2 === 0 ? -1 : 1;
        const controlX = (previous.x + current.x) / 2;
        const controlY = (previous.y + current.y) / 2 + direction * bend;
        d += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      }
      return d;
    }

    function placeOnSvgPath(element, path, progress) {
      if (!element || !path || !path.getTotalLength) return;
      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) return;
      const point = path.getPointAtLength(clamp(progress, 0, 1) * length);
      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
    }

    function updateOverlayPaths() {
      if (!uiLayer || !codePath || !monitorPath || !deploymentPaths.length || !feedbackPath) return;
      nodeConfigs.forEach(({ key }) => setProjectedNode(key));
      updateRegionMarkers();

      const codePoints = [
        centerInStage(developerOrb),
        centerInStage(gitCluster),
        ...stageIcons.map(centerInStage),
        centerInStage(awsOrb)
      ];
      const monitorPoints = [centerInStage(awsOrb), centerInStage(cloudwatchOrb), centerInStage(alertsCluster)];
      const alertPoint = centerInStage(alertsCluster);
      const developerPoint = centerInStage(developerOrb);
      const stageRect = stage.getBoundingClientRect();
      const loopX = Math.max(34, Math.min(alertPoint.x, developerPoint.x) - 94);
      const loopY = Math.min(stageRect.height - 74, Math.max(alertPoint.y, developerPoint.y) + 112);
      const feedbackD = `M ${alertPoint.x.toFixed(2)} ${alertPoint.y.toFixed(2)} C ${(alertPoint.x - 86).toFixed(2)} ${(alertPoint.y + 28).toFixed(2)}, ${loopX.toFixed(2)} ${loopY.toFixed(2)}, ${loopX.toFixed(2)} ${loopY.toFixed(2)} C ${loopX.toFixed(2)} ${(developerPoint.y + 72).toFixed(2)}, ${(developerPoint.x - 80).toFixed(2)} ${(developerPoint.y + 44).toFixed(2)}, ${developerPoint.x.toFixed(2)} ${developerPoint.y.toFixed(2)}`;

      const awsPoint = centerInStage(awsOrb);
      const routePoints = waveRouteIndices.map((regionIndex) => projectLocalPoint(regionObjects[regionIndex].position));
      const routeStarts = [awsPoint, routePoints[0], routePoints[1]];
      deploymentPaths.forEach((path, index) => {
        const start = routeStarts[index];
        const end = routePoints[index];
        if (!start || !end) return;
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const lift = Math.min(128, Math.max(62, distance * 0.24)) + index * 8;
        const controlX1 = start.x + (end.x - start.x) * 0.34;
        const controlX2 = start.x + (end.x - start.x) * 0.68;
        const controlY = Math.min(start.y, end.y) - lift;
        path.setAttribute("d", `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} C ${controlX1.toFixed(2)} ${controlY.toFixed(2)}, ${controlX2.toFixed(2)} ${controlY.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
      });

      codePath.setAttribute("d", createSmoothPath(codePoints, 24));
      monitorPath.setAttribute("d", createSmoothPath(monitorPoints, 48));
      feedbackPath.setAttribute("d", feedbackD);
      overlayState.pathReady = true;

      placeOnSvgPath(applicationVersion, codePath, overlayState.assetProgress);
      placeOnSvgPath(telemetryPulse, monitorPath, overlayState.telemetryProgress);
      placeOnSvgPath(incidentNotification, feedbackPath, overlayState.feedbackProgress);
      const activeDeploymentPath = deploymentPaths[overlayState.deploymentWaveIndex] || deploymentPaths[0];
      placeOnSvgPath(deploymentWavePulse, activeDeploymentPath, overlayState.deploymentWaveProgress);
    }

    function prepareDeploymentStrokes() {
      return deploymentPaths.map((path) => {
        if (!path || !path.getTotalLength) return 0;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = "0";
        return length;
      });
    }

    function resetRegionWaveState() {
      overlayState.deploymentWaveIndex = 0;
      overlayState.deploymentWaveProgress = 0;
      regionCurves.forEach((item) => {
        item.state.progress = 0;
        item.state.intensity = 0;
        if (item.uniforms?.uOpacity) item.uniforms.uOpacity.value = 0;
        (item.packets || [item.packet]).forEach((packet) => {
          if (packet?.material) packet.material.opacity = 0;
        });
      });
      regionObjects.forEach((item) => {
        item.waveBoost = 0;
        if (item.marker) item.marker.classList.remove("is-deployment-active");
      });
    }

    function setActiveWaveRegion(regionIndex) {
      regionObjects.forEach((item, index) => {
        if (!item.marker) return;
        item.marker.classList.toggle("is-deployment-active", index === regionIndex);
      });
    }

    let deploymentWaveTimeline = null;

    function runDeploymentWave() {
      if (!deploymentPaths.length) return null;
      if (!gsapApi || reducedMotion) {
        deploymentPaths.forEach((path) => {
          path.style.strokeDashoffset = "0";
          path.style.opacity = ".72";
        });
        regionObjects.forEach((item, index) => {
          if (item.marker) item.marker.classList.toggle("is-deployment-active", waveRouteIndices.includes(index));
        });
        return null;
      }

      if (deploymentWaveTimeline) deploymentWaveTimeline.kill();
      resetRegionWaveState();
      prepareDeploymentStrokes();
      gsapApi.set(deploymentWavePulse, { autoAlpha: 0, scale: 0.55 });

      deploymentWaveTimeline = gsapApi.timeline({ defaults: { ease: "power2.inOut" } });

      regionCurves.forEach((curveItem, step) => {
        const destination = regionObjects[curveItem.destinationIndex];
        const path = deploymentPaths[step];
        const label = `region-wave-${step}`;
        deploymentWaveTimeline.addLabel(label, step === 0 ? 0 : ">-0.06");
        deploymentWaveTimeline
          .call(() => {
            overlayState.deploymentWaveIndex = step;
            overlayState.deploymentWaveProgress = 0;
            setActiveWaveRegion(curveItem.destinationIndex);
          }, null, label)
          .to(path, { strokeDashoffset: 0, opacity: 1, duration: 0.92, ease: "expo.out" }, label)
          .to(deploymentWavePulse, { autoAlpha: 1, scale: 1, duration: 0.16, ease: "back.out(2)" }, label)
          .to(overlayState, { deploymentWaveProgress: 1, duration: 0.92, ease: "power2.inOut" }, label)
          .to(curveItem.state, { progress: 1, intensity: 1, duration: 0.92, ease: "power2.inOut" }, label)
          .to(destination, { waveBoost: 1, duration: 0.22, ease: "expo.out" }, `${label}+=0.68`)
          .to(destination, { waveBoost: 0.18, duration: 0.52, ease: "power2.out" }, `${label}+=0.90`)
          .to(path, { opacity: 0.18, duration: 0.34, ease: "power2.out" }, `${label}+=0.84`)
          .to(curveItem.state, { intensity: 0.12, duration: 0.34, ease: "power2.out" }, `${label}+=0.84`);
      });

      deploymentWaveTimeline
        .to(deploymentWavePulse, { autoAlpha: 0, scale: 0.55, duration: 0.22 }, ">-0.14")
        .call(() => setActiveWaveRegion(-1), null, ">+0.18")
        .to(deploymentPaths, { opacity: 0, duration: 0.58, ease: "power2.out" }, ">+0.55");

      return deploymentWaveTimeline;
    }

    if (awsOrb) {
      awsOrb.style.cursor = "pointer";
      awsOrb.setAttribute("aria-label", "Replay multi-region deployment wave");
      awsOrb.addEventListener("click", (event) => {
        event.stopPropagation();
        applyLayerMode("deployment");
        runDeploymentWave();
      });
    }

    function setStaticOverlayState() {
      [developerOrb, typingConsole, gitCluster, pipelineIcons, awsOrb, cloudwatchOrb, alertsCluster]
        .filter(Boolean)
        .forEach((element) => {
          element.style.opacity = "1";
          element.style.transform = "none";
        });
      if (typingCode) typingCode.textContent = 'git push origin main\nsecurity.scan()\nbuild(); test(); deploy();';
      stageIcons.forEach((icon) => icon.classList.add("is-active"));
      if (applicationVersion) applicationVersion.style.opacity = "0";
      if (incidentNotification) incidentNotification.style.opacity = "0";
      deploymentPaths.forEach((path) => {
        path.style.strokeDashoffset = "0";
        path.style.opacity = ".46";
      });
      waveRouteIndices.forEach((regionIndex) => {
        const marker = regionObjects[regionIndex] && regionObjects[regionIndex].marker;
        if (marker) marker.classList.add("is-static-featured");
      });
      if (feedbackPath) feedbackPath.style.opacity = ".78";
    }

    function initGsapFlow() {
      // GSAP itself is enough to run the lifecycle animation. ScrollTrigger is
      // optional and only pauses/resumes the timeline outside the hero viewport.
      if (!uiLayer || !gsapApi || reducedMotion) {
        setStaticOverlayState();
        return null;
      }

      const codeSample = [
        'git add . && git commit -m "release v2.4.1"',
        'git push origin main',
        'security.scan({ snyk: true })',
        'pipeline.build().test().deploy("aws")'
      ].join("\n");
      const typingState = { chars: 0 };

      gsapApi.set([developerOrb, typingConsole], { autoAlpha: 0, y: 18, scale: 0.78 });
      gsapApi.set([gitCluster, pipelineIcons, awsOrb, cloudwatchOrb, alertsCluster], { autoAlpha: 0.72, scale: 0.92 });
      gsapApi.set(stageIcons, { opacity: 0.52, scale: 0.82, filter: "saturate(.6) brightness(.72)" });
      gsapApi.set(applicationVersion, { autoAlpha: 0, scale: 0.6 });
      gsapApi.set(deploymentWavePulse, { autoAlpha: 0, scale: 0.55 });
      gsapApi.set(telemetryPulse, { autoAlpha: 0, scale: 0.6 });
      gsapApi.set(incidentNotification, { autoAlpha: 0, scale: 0.55 });
      gsapApi.set(feedbackPath, { opacity: 0.34 });
      resetRegionWaveState();
      prepareDeploymentStrokes();

      const timeline = gsapApi.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: 1.25,
        defaults: { ease: "power4.out" },
        onRepeat: () => {
          typingState.chars = 0;
          if (typingCode) typingCode.textContent = "";
          overlayState.assetProgress = 0;
          overlayState.telemetryProgress = 0;
          overlayState.feedbackProgress = 0;
          overlayState.deploymentIntensity = 0;
          if (deploymentWaveTimeline) deploymentWaveTimeline.kill();
          resetRegionWaveState();
          prepareDeploymentStrokes();
          stageIcons.forEach((icon) => icon.classList.remove("is-active"));
        }
      });

      timeline
        .addLabel("trigger")
        .to(developerOrb, { autoAlpha: 1, y: 0, scale: 1, duration: 0.78, ease: "expo.out" }, "trigger")
        .to(typingConsole, { autoAlpha: 1, y: 0, scale: 1, duration: 0.86, ease: "expo.out" }, "trigger+=0.12")
        .to(typingState, {
          chars: codeSample.length,
          duration: 1.15,
          ease: "none",
          snap: { chars: 1 },
          onStart: () => { if (typingCode) typingCode.textContent = ""; },
          onUpdate: () => { if (typingCode) typingCode.textContent = codeSample.slice(0, typingState.chars); }
        }, "trigger+=0.22")
        .addLabel("pipeline", ">-0.08")
        .to(gitCluster, { autoAlpha: 1, scale: 1.08, duration: 0.46, ease: "expo.out" }, "pipeline")
        .to(gitCluster ? qsa(".brand-orb-icon", gitCluster) : [], {
          scale: 1.14,
          yoyo: true,
          repeat: 1,
          duration: 0.28,
          stagger: 0.08,
          ease: "power3.out"
        }, "pipeline+=0.12")
        .to(pipelineIcons, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "expo.out" }, "pipeline+=0.55")
        .to(applicationVersion, { autoAlpha: 1, scale: 1, duration: 0.32, ease: "back.out(2.2)" }, "pipeline+=0.06")
        .to(overlayState, {
          assetProgress: 1,
          duration: 4.85,
          ease: "none"
        }, "pipeline+=0.02")
        .to(stageIcons, {
          opacity: 1,
          scale: 1.18,
          filter: "saturate(1.2) brightness(1.18)",
          duration: 0.42,
          stagger: 0.15,
          ease: "power4.out",
          onStart: () => stageIcons.forEach((icon) => icon.classList.add("is-active"))
        }, "pipeline+=1.68")
        .to(stageIcons, {
          scale: 1,
          duration: 0.38,
          stagger: 0.15,
          ease: "power3.out"
        }, "pipeline+=2.12")
        .addLabel("aws", "pipeline+=4.72")
        .to(applicationVersion, { autoAlpha: 0, scale: 0.48, duration: 0.26, ease: "power2.in" }, "aws")
        .to(awsOrb, { autoAlpha: 1, scale: 1.18, duration: 0.48, ease: "expo.out" }, "aws-=0.05")
        .to(awsOrb, { scale: 1, duration: 0.55, ease: "elastic.out(1, .5)" }, "aws+=0.35")
        .call(() => runDeploymentWave(), null, "aws+=0.10")
        .to(overlayState, { deploymentIntensity: 1, duration: 0.55, ease: "power4.out" }, "aws+=0.16")
        .to(overlayState, { deploymentIntensity: 0.24, duration: 2.2, ease: "power2.out" }, "aws+=0.78")
        .addLabel("observe", "aws+=3.10")
        .to(telemetryPulse, { autoAlpha: 1, scale: 1, duration: 0.25 }, "observe")
        .to(overlayState, { telemetryProgress: 1, duration: 1.55, ease: "power1.inOut" }, "observe")
        .to(cloudwatchOrb, { autoAlpha: 1, scale: 1.16, duration: 0.42, ease: "expo.out" }, "observe+=0.42")
        .to(cloudwatchOrb, { scale: 1, duration: 0.45 }, "observe+=0.78")
        .to(alertsCluster, { autoAlpha: 1, scale: 1.06, duration: 0.42, ease: "expo.out" }, "observe+=1.05")
        .to(alertsCluster ? qsa(".brand-orb-icon", alertsCluster) : [], {
          scale: 1.18,
          yoyo: true,
          repeat: 1,
          duration: 0.26,
          stagger: 0.12,
          ease: "power4.out"
        }, "observe+=1.12")
        .to(telemetryPulse, { autoAlpha: 0, scale: 0.5, duration: 0.22 }, "observe+=1.48")
        .addLabel("feedback", "observe+=1.54")
        .to(feedbackPath, { opacity: 1, duration: 0.3, ease: "power2.out" }, "feedback")
        .to(incidentNotification, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, "feedback+=0.02")
        .to(overlayState, { feedbackProgress: 1, duration: 1.95, ease: "power2.inOut" }, "feedback+=0.05")
        .to(developerOrb, { scale: 1.22, duration: 0.34, ease: "expo.out" }, "feedback+=1.52")
        .to(developerOrb, { scale: 1, duration: 0.5, ease: "elastic.out(1, .5)" }, "feedback+=1.78")
        .call(() => {
          if (typingCode) typingCode.textContent = 'alert.received("production")\ninspect.logs(); fix(); push();';
        }, null, "feedback+=1.62")
        .to(typingConsole, { boxShadow: "0 0 0 1px rgba(255,146,40,.45), 0 0 34px rgba(255,139,31,.35), 0 18px 36px rgba(0,0,0,.33)", duration: 0.34 }, "feedback+=1.55")
        .to(typingConsole, { boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 0 26px rgba(33,128,255,.25), 0 18px 36px rgba(0,0,0,.33)", duration: 0.55 }, "feedback+=1.9")
        .to(incidentNotification, { autoAlpha: 0, scale: 0.55, duration: 0.24 }, "feedback+=1.9")
        .to(feedbackPath, { opacity: 0.52, duration: 0.45 }, "feedback+=1.88")
        .to([gitCluster, pipelineIcons, awsOrb, cloudwatchOrb, alertsCluster], {
          scale: 0.96,
          autoAlpha: 0.74,
          duration: 0.75,
          ease: "power2.out"
        }, ">+=0.48")
        .to([developerOrb, typingConsole], { autoAlpha: 0.72, duration: 0.45 }, "<")
        .set(stageIcons, { opacity: 0.52, scale: 0.82, filter: "saturate(.6) brightness(.72)" })
        .set(deploymentPaths, { opacity: 0 });

      if (ScrollTriggerApi) {
        ScrollTriggerApi.create({
          trigger: stage,
          start: "top 92%",
          end: "bottom 8%",
          animation: timeline,
          toggleActions: "play pause resume pause"
        });
      } else {
        timeline.play(0);
      }

      // Safety: if ScrollTrigger does not activate immediately because of an
      // unusual browser layout calculation, start the sequence once the hero is
      // already visible. This keeps localhost and Vercel behavior identical.
      window.setTimeout(() => {
        const rect = stage.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (visible && timeline.paused()) timeline.play();
      }, 120);

      return timeline;
    }

    let autoRotate = !reducedMotion;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetRotationX = world.rotation.x;
    let targetRotationY = world.rotation.y;
    let cameraZ = 8.6;
    let parallaxTargetX = 0;
    let parallaxTargetY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let sceneVisible = true;
    let frameIndex = 0;

    function setAutoRotate(enabled) {
      autoRotate = enabled;
      if (!rotateButton) return;
      rotateButton.setAttribute("aria-pressed", String(enabled));
      rotateButton.classList.toggle("is-paused", !enabled);
      rotateButton.innerHTML = enabled ? "<span>◌</span> Auto rotate" : "<span>▶</span> Resume";
    }

    if (rotateButton) rotateButton.addEventListener("click", () => setAutoRotate(!autoRotate));

    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      autoRotate = false;
      if (rotateButton) {
        rotateButton.setAttribute("aria-pressed", "false");
        rotateButton.classList.add("is-paused");
        rotateButton.innerHTML = "<span>▶</span> Resume";
      }
      canvas.setPointerCapture(event.pointerId);
      lastX = event.clientX;
      lastY = event.clientY;
      velocityX = 0;
      velocityY = 0;
    });

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      parallaxTargetX = clamp(((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2, -1, 1);
      parallaxTargetY = clamp(((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2, -1, 1);
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      velocityY = dx * 0.0048;
      velocityX = dy * 0.0035;
      targetRotationY += velocityY;
      targetRotationX += velocityX;
      targetRotationX = clamp(targetRotationX, -0.62, 0.62);
    });

    function stopDragging(event) {
      dragging = false;
      if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }

    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("pointerleave", (event) => {
      parallaxTargetX = 0;
      parallaxTargetY = 0;
      if (dragging) stopDragging(event);
    });

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      cameraZ = clamp(cameraZ + event.deltaY * 0.0027, 7.55, 10.2);
    }, { passive: false });

    function resize() {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      [starsFar, starsNear, spaceDust].forEach((layer) => {
        layer.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      });
      regionRippleUniforms.uPixelRatio.value = renderer.getPixelRatio();
      bloomPipeline.setSize(width, height);
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", resize);
    }

    if ("IntersectionObserver" in window) {
      const sceneObserver = new IntersectionObserver(([entry]) => {
        sceneVisible = entry.isIntersecting && entry.intersectionRatio > 0.02;
      }, { threshold: [0, 0.02, 0.15] });
      sceneObserver.observe(stage);
    }
    resize();

    const clock = new T.Clock();
    let elapsed = 0;

    function animate() {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      if (document.hidden || !sceneVisible) return;
      elapsed += delta;
      frameIndex += 1;
      performanceElapsed += delta;
      performanceFrames += 1;

      // Conservative adaptive DPR keeps the cinematic effects near 60 FPS.
      // Resolution changes are intentionally infrequent to avoid visible churn.
      if (performanceFrames >= 120) {
        const averageFrame = performanceElapsed / performanceFrames;
        let nextPixelRatio = adaptivePixelRatio;
        if (averageFrame > 1 / 50) nextPixelRatio = Math.max(minimumPixelRatio, adaptivePixelRatio - 0.10);
        else if (averageFrame < 1 / 58) nextPixelRatio = Math.min(pixelRatioCap, adaptivePixelRatio + 0.05);
        if (Math.abs(nextPixelRatio - adaptivePixelRatio) >= 0.045) {
          adaptivePixelRatio = nextPixelRatio;
          renderer.setPixelRatio(adaptivePixelRatio);
          resize();
        }
        performanceElapsed = 0;
        performanceFrames = 0;
      }

      const frameScale = delta * 60;
      const rotationFollow = 1 - Math.exp(-7.6 * delta);
      const parallaxFollow = 1 - Math.exp(-4.8 * delta);

      if (autoRotate && !dragging && !reducedMotion) targetRotationY += delta * 0.068;
      if (!dragging) {
        targetRotationY += velocityY * frameScale;
        targetRotationX += velocityX * frameScale;
        const inertia = Math.pow(0.93, frameScale);
        velocityX *= inertia;
        velocityY *= inertia;
      }

      world.rotation.y += (targetRotationY - world.rotation.y) * rotationFollow;
      world.rotation.x += (targetRotationX - world.rotation.x) * rotationFollow;
      camera.position.z += (cameraZ - camera.position.z) * rotationFollow;

      parallaxX += (parallaxTargetX - parallaxX) * parallaxFollow;
      parallaxY += (parallaxTargetY - parallaxY) * parallaxFollow;
      const driftWeight = dragging ? 0.12 : 1.0;
      const cinematicX = Math.sin(elapsed * 0.105) * 0.045 * driftWeight + parallaxX * 0.055;
      const cinematicY = 0.05 + Math.cos(elapsed * 0.087) * 0.030 * driftWeight - parallaxY * 0.045;
      camera.position.x += (cinematicX - camera.position.x) * parallaxFollow * 0.58;
      camera.position.y += (cinematicY - camera.position.y) * parallaxFollow * 0.58;
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      starsFar.position.set(parallaxX * starsFar.userData.parallax, -parallaxY * starsFar.userData.parallax, 0);
      starsNear.position.set(parallaxX * starsNear.userData.parallax, -parallaxY * starsNear.userData.parallax, 0);
      spaceDust.position.set(parallaxX * spaceDust.userData.parallax, -parallaxY * spaceDust.userData.parallax, 0);
      starsFar.rotation.y -= delta * 0.0042;
      starsNear.rotation.y += delta * 0.0068;
      spaceDust.rotation.y -= delta * 0.0105;
      spaceDust.rotation.z += delta * 0.0048;
      starsFar.rotation.x = parallaxY * 0.008;
      starsNear.rotation.x = parallaxY * 0.018;
      spaceDust.rotation.x = parallaxY * 0.025;
      starsFar.material.uniforms.uTime.value = elapsed;
      starsNear.material.uniforms.uTime.value = elapsed * 1.14;
      spaceDust.material.uniforms.uTime.value = elapsed * 1.37;

      coreUniforms.uTime.value = elapsed;
      cloudUniforms.uTime.value = elapsed;
      cloudLayer.rotation.y += delta * 0.0026;
      cloudLayer.rotation.z = Math.sin(elapsed * 0.055) * 0.006;
      glassUniforms.uTime.value = elapsed;
      atmosphereUniforms.uTime.value = elapsed;
      rings.forEach((ring, index) => {
        const motion = ring.userData.cinematicRing;
        motion.spin += delta * motion.speed;
        ring.material.uniforms.uTime.value = elapsed;
        ring.rotation.x = motion.baseRotation.x + Math.sin(elapsed * motion.wobbleSpeed + motion.phase) * motion.wobble;
        ring.rotation.y = motion.baseRotation.y + Math.cos(elapsed * motion.wobbleSpeed * 0.83 + motion.phase) * motion.wobble * 0.8;
        ring.rotation.z = motion.baseRotation.z + motion.spin + Math.sin(elapsed * motion.wobbleSpeed * 0.67 + motion.phase) * motion.wobble * 0.65;
        const breathing = 1 + Math.sin(elapsed * (0.42 + index * 0.08) + motion.phase) * 0.0035;
        ring.scale.setScalar(breathing);
      });

      const codeLayerVisibility = overlayState.activeLayer === "all" || overlayState.activeLayer === "code" ? 1 : 0.08;
      const deploymentLayerVisibility = overlayState.activeLayer === "all" || overlayState.activeLayer === "deployment" ? 1 : 0.08;
      const monitoringLayerVisibility = overlayState.activeLayer === "all" || overlayState.activeLayer === "monitoring" ? 1 : 0.08;

      networkFlowArcs.forEach((item, index) => {
        item.uniforms.uTime.value = elapsed + index * 0.21;
        item.uniforms.uOpacity.value = item.baseOpacity * codeLayerVisibility * (0.92 + Math.sin(elapsed * 0.9 + index) * 0.08);
      });
      monitoringFlowArcs.forEach((item, index) => {
        item.uniforms.uTime.value = elapsed + index * 0.35;
        item.uniforms.uOpacity.value = item.baseOpacity * monitoringLayerVisibility * (0.9 + Math.sin(elapsed * 1.3 + index) * 0.1);
      });

      networkPackets.forEach((packet) => {
        const flow = packet.userData.flow;
        const progress = (elapsed * flow.speed + flow.phase) % 1;
        packet.position.copy(flow.curve.getPointAt(progress));
        const pulse = 0.64 + 0.36 * Math.sin(elapsed * 5.6 + flow.phase * 12);
        packet.material.opacity = flow.baseOpacity * pulse * codeLayerVisibility;
        packet.scale.setScalar(flow.baseSize * (0.82 + pulse * 0.28));
      });
      monitoringPackets.forEach((packet) => {
        const flow = packet.userData.flow;
        const progress = (elapsed * flow.speed + flow.phase) % 1;
        packet.position.copy(flow.curve.getPointAt(progress));
        const pulse = 0.68 + 0.32 * Math.sin(elapsed * 6.4 + flow.phase * 10);
        packet.material.opacity = flow.baseOpacity * pulse * monitoringLayerVisibility;
        packet.scale.setScalar(flow.baseSize * (0.82 + pulse * 0.32));
      });

      // Region deployment packets remain dormant until GSAP reaches AWS.
      regionCurves.forEach((item, index) => {
        const progress = clamp(item.state.progress, 0, 1);
        item.uniforms.uTime.value = elapsed + index * 0.31;
        item.uniforms.uOpacity.value = item.state.intensity * 0.74 * deploymentLayerVisibility;
        (item.packets || [item.packet]).forEach((packet, packetIndex) => {
          const trail = packetIndex * 0.085;
          const packetProgress = clamp(progress - trail, 0, 1);
          packet.position.copy(item.curve.getPointAt(packetProgress));
          const started = progress > trail + 0.01 ? 1 : 0;
          const pulse = 0.72 + Math.sin(elapsed * 7 + index + packetIndex) * 0.18;
          packet.material.opacity = item.state.intensity * pulse * started * deploymentLayerVisibility;
        });
      });

      const sharedPulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8);
      regionRippleUniforms.uTime.value = elapsed;
      regionRippleUniforms.uOpacity.value = deploymentLayerVisibility * 0.74;
      regionRippleUniforms.uDeployment.value = overlayState.deploymentIntensity;
      regionBeamUniforms.uTime.value = elapsed;
      regionBeamUniforms.uOpacity.value = deploymentLayerVisibility * 0.34;
      regionBeamUniforms.uDeployment.value = overlayState.deploymentIntensity;
      regionObjects.forEach((item) => {
        const pulse = 0.55 + 0.45 * Math.sin(elapsed * 2.8 + item.phase) * sharedPulse;
        const baseSize = item.region.featured ? 0.078 : 0.058;
        const baseOpacity = item.region.featured ? 0.34 : 0.20;
        const deployBoost = item.waveBoost + overlayState.deploymentIntensity * (item.region.featured ? 0.08 : 0.03);
        item.pin.scale.setScalar(baseSize + pulse * 0.025 + deployBoost * 0.055);
        item.pin.material.opacity = (baseOpacity + pulse * 0.14 + deployBoost * 0.46) * deploymentLayerVisibility;
        item.azPins.forEach((azPin, azIndex) => {
          const azPulse = 0.5 + 0.5 * Math.sin(elapsed * 5.2 + item.phase + azIndex * 0.7);
          const azBase = item.region.featured ? 0.026 : 0.020;
          azPin.scale.setScalar(azBase + azPulse * 0.012 + deployBoost * 0.024);
          azPin.material.opacity = ((item.region.featured ? 0.10 : 0.05) + azPulse * 0.09 + deployBoost * 0.48) * deploymentLayerVisibility;
        });
      });

      pulsePins.forEach((pin) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8 + pin.userData.phase);
        pin.scale.setScalar(0.045 + pulse * 0.030);
        pin.material.opacity = 0.06 + pulse * 0.16;
      });

      nodes.forEach((anchor, key) => {
        const pin = anchor.userData.pin;
        if (!pin) return;
        const emphasis = key === "aws" ? overlayState.deploymentIntensity : 0;
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.4 + anchor.position.x * 2);
        pin.scale.setScalar((key === "aws" ? 0.12 : 0.08) + pulse * 0.04 + emphasis * 0.08);
        pin.material.opacity = 0.38 + pulse * 0.34 + emphasis * 0.25;
        if (anchor.userData.coreLight) {
          anchor.userData.coreLight.scale.setScalar(0.78 + pulse * 0.34 + emphasis * 0.24);
          anchor.userData.coreLight.material.opacity = 0.68 + pulse * 0.30;
        }
      });

      // DOM overlays need only 30fps; the WebGL scene remains at display rate.
      if (frameIndex % 2 === 0) updateOverlayPaths();
      bloomPipeline.render();
    }

    bloomPipeline.render();
    stage.classList.add("scene-ready");
    updateOverlayPaths();
    initLayerControls();
    initGsapFlow();
    if (ScrollTriggerApi) ScrollTriggerApi.refresh();
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (loader) loader.setAttribute("aria-hidden", "true");
    animate();
  }

  initGlobe().catch(failScene);
})();
