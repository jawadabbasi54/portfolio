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
  const flowCopy = qs("#flow-copy");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lifecycleText = [
    "Developer writes, commits and pushes application code",
    "Bitbucket, GitHub or GitLab receives the reviewed change",
    "DevSecOps validates security, builds, tests and deploys",
    "AWS releases services across resilient regions and AZs",
    "CloudWatch streams logs, metrics and resource health",
    "Alarms notify Slack, phone and email in real time"
  ];

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

  function createCardTexture(config, anisotropy) {
    const width = 1280;
    const height = 610;
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");

    const accent = config.accent;
    const panel = ctx.createLinearGradient(0, 0, width, height);
    panel.addColorStop(0, "rgba(13,35,79,.97)");
    panel.addColorStop(0.5, "rgba(6,21,53,.95)");
    panel.addColorStop(1, "rgba(3,13,36,.98)");

    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 38;
    roundedRect(ctx, 34, 34, width - 68, height - 68, 46);
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const gloss = ctx.createLinearGradient(0, 30, 0, 250);
    gloss.addColorStop(0, "rgba(255,255,255,.2)");
    gloss.addColorStop(0.46, "rgba(255,255,255,.025)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    roundedRect(ctx, 48, 48, width - 96, 220, 35);
    ctx.fillStyle = gloss;
    ctx.fill();

    const edge = ctx.createLinearGradient(34, 34, width - 34, height - 34);
    edge.addColorStop(0, "rgba(255,255,255,.45)");
    edge.addColorStop(0.28, "rgba(255,255,255,0)");
    edge.addColorStop(0.68, "rgba(255,255,255,.07)");
    edge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge;
    roundedRect(ctx, 46, 46, width - 92, height - 92, 36);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(106, 105, 54, 0, Math.PI * 2);
    const badge = ctx.createRadialGradient(88, 82, 4, 106, 105, 58);
    badge.addColorStop(0, "#e7f4ff");
    badge.addColorStop(0.18, accent);
    badge.addColorStop(1, "#08285f");
    ctx.fillStyle = badge;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 28;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#b9e1ff";
    ctx.stroke();
    ctx.restore();

    text(ctx, String(config.number), 106, 108, 42, "#ffffff", "center", 850);
    text(ctx, config.title, 186, 104, 54, "#f7fbff", "left", 800);
    text(ctx, config.subtitle, 186, 158, 25, "#9fb9df", "left", 550);

    if (config.type === "developer") {
      roundedRect(ctx, 84, 232, 1112, 286, 30);
      ctx.fillStyle = "rgba(1,8,25,.78)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(68,153,255,.38)";
      ctx.stroke();

      ["#ff715e", "#ffbd45", "#30d158"].forEach((color, index) => {
        ctx.beginPath();
        ctx.arc(125 + index * 38, 274, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      const lines = [
        ["const", " pipeline = deploy(application);"],
        ["security", ".scan();  build();  test();"],
        ["git", ".commit('release');  git.push();"],
        ["await", " production.ready();"]
      ];
      lines.forEach((line, index) => {
        text(ctx, line[0], 126, 338 + index * 45, 26, index === 1 ? "#ffb25f" : "#60b8ff", "left", 800, "ui-monospace, SFMono-Regular, Menlo, monospace");
        text(ctx, line[1], 260, 338 + index * 45, 26, "#dceaff", "left", 600, "ui-monospace, SFMono-Regular, Menlo, monospace");
      });
    }

    if (config.type === "git") {
      const repos = [
        { code: "BB", name: "Bitbucket", color: "#438cff" },
        { code: "GH", name: "GitHub", color: "#f8fbff" },
        { code: "GL", name: "GitLab", color: "#ff8848" }
      ];
      repos.forEach((repo, index) => {
        const x = 90 + index * 394;
        roundedRect(ctx, x, 250, 340, 214, 30);
        ctx.fillStyle = "rgba(2,11,31,.78)";
        ctx.fill();
        ctx.strokeStyle = `${repo.color}9c`;
        ctx.lineWidth = 3;
        ctx.stroke();
        text(ctx, repo.code, x + 170, 322, 58, repo.color, "center", 900);
        text(ctx, repo.name, x + 170, 406, 27, "#d5e4fb", "center", 650);
      });
    }

    if (config.type === "cicd") {
      const phases = [
        ["SEC", "Security", "#c585ff"],
        ["BLD", "Build", "#6cc2ff"],
        ["TST", "Test", "#6cc2ff"],
        ["DPL", "Deploy", "#ffab55"]
      ];
      phases.forEach((phase, index) => {
        const x = 78 + index * 296;
        roundedRect(ctx, x, 250, 246, 212, 28);
        ctx.fillStyle = "rgba(2,11,31,.78)";
        ctx.fill();
        ctx.strokeStyle = `${phase[2]}a6`;
        ctx.lineWidth = 3;
        ctx.stroke();
        text(ctx, phase[0], x + 123, 322, 46, phase[2], "center", 900);
        text(ctx, phase[1], x + 123, 406, 25, "#e0ebfb", "center", 650);
        if (index < phases.length - 1) text(ctx, "→", x + 270, 354, 40, "#55b7ff", "center", 800);
      });
    }

    if (config.type === "aws") {
      text(ctx, "aws", 210, 350, 88, "#ffffff", "center", 650);
      ctx.save();
      ctx.strokeStyle = "#ff9e2f";
      ctx.lineWidth = 11;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(210, 355, 88, 0.22, 1.38);
      ctx.stroke();
      ctx.restore();
      ["EB", "λ", "ECS", "RDS", "S3", "VPC"].forEach((label, index) => {
        const x = 390 + (index % 3) * 260;
        const y = 250 + Math.floor(index / 3) * 118;
        roundedRect(ctx, x, y, 212, 88, 22);
        ctx.fillStyle = "rgba(2,11,31,.8)";
        ctx.fill();
        ctx.strokeStyle = index < 3 ? "rgba(255,156,48,.72)" : "rgba(70,153,255,.72)";
        ctx.lineWidth = 3;
        ctx.stroke();
        text(ctx, label, x + 106, y + 45, 29, index < 3 ? "#ffb15b" : "#7cc5ff", "center", 900);
      });
    }

    if (config.type === "cloudwatch") {
      roundedRect(ctx, 84, 244, 1112, 236, 30);
      ctx.fillStyle = "rgba(2,11,31,.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(51,229,255,.36)";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let y = 286; y <= 430; y += 36) {
        ctx.beginPath();
        ctx.moveTo(118, y);
        ctx.lineTo(874, y);
        ctx.strokeStyle = "rgba(88,132,194,.19)";
        ctx.stroke();
      }
      const values = [118, 105, 146, 86, 126, 66, 110, 52, 88, 34, 70, 48, 28];
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = 124 + index * 58;
        const y = 276 + value;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#36e5ff";
      ctx.lineWidth = 8;
      ctx.shadowColor = "#36e5ff";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(1036, 360, 70, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(63,220,255,.19)";
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1036, 360, 70, -Math.PI / 2, Math.PI * 1.3);
      ctx.strokeStyle = "#42e3be";
      ctx.lineWidth = 18;
      ctx.stroke();
      text(ctx, "99.9%", 1036, 360, 31, "#ffffff", "center", 900);
    }

    if (config.type === "alerts") {
      [
        ["SL", "Slack", "#4ce5e8"],
        ["☎", "Phone", "#61ef92"],
        ["✉", "Email", "#8ebaff"]
      ].forEach((item, index) => {
        const x = 88 + index * 390;
        roundedRect(ctx, x, 248, 330, 220, 30);
        ctx.fillStyle = "rgba(2,11,31,.78)";
        ctx.fill();
        ctx.strokeStyle = `${item[2]}8a`;
        ctx.lineWidth = 3;
        ctx.stroke();
        text(ctx, item[0], x + 165, 323, 58, item[2], "center", 900);
        text(ctx, item[1], x + 165, 414, 27, "#dce8fb", "center", 650);
      });
    }

    const texture = new T.CanvasTexture(c);
    texture.encoding = T.sRGBEncoding;
    texture.anisotropy = anisotropy;
    texture.minFilter = T.LinearFilter;
    texture.magFilter = T.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  function createRegionTexture(region, anisotropy) {
    const c = document.createElement("canvas");
    c.width = 840;
    c.height = 300;
    const ctx = c.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 840, 300);
    gradient.addColorStop(0, "rgba(10,34,76,.97)");
    gradient.addColorStop(1, "rgba(3,14,36,.98)");
    ctx.save();
    ctx.shadowColor = "#ff9a2d";
    ctx.shadowBlur = 24;
    roundedRect(ctx, 24, 24, 792, 252, 28);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,157,52,.84)";
    ctx.stroke();
    ctx.restore();

    text(ctx, region.code, 420, 82, 37, "#f6fbff", "center", 850);
    text(ctx, region.city, 420, 123, 24, "#a7bbd9", "center", 600);
    ["AZ a", "AZ b", "AZ c"].forEach((label, index) => {
      const x = 118 + index * 214;
      roundedRect(ctx, x, 164, 176, 66, 16);
      ctx.fillStyle = "rgba(2,11,31,.82)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,162,63,.55)";
      ctx.stroke();
      text(ctx, label, x + 88, 198, 22, "#d9e7fa", "center", 750);
    });

    const texture = new T.CanvasTexture(c);
    texture.encoding = T.sRGBEncoding;
    texture.anisotropy = anisotropy;
    texture.minFilter = T.LinearFilter;
    texture.magFilter = T.LinearFilter;
    return texture;
  }

  function createArc(start, end, lift, color, opacity = 0.72, dashed = false) {
    const radius = start.length();
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius + lift);
    const curve = new T.QuadraticBezierCurve3(start, mid, end);
    const geometry = new T.BufferGeometry().setFromPoints(curve.getPoints(90));
    const material = dashed
      ? new T.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.1, gapSize: 0.06, depthWrite: false })
      : new T.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending });
    const line = new T.Line(geometry, material);
    if (dashed) line.computeLineDistances();
    line.renderOrder = 5;
    return { curve, line, material };
  }

  function createStars(count = 1200) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new T.Color();
    for (let index = 0; index < count; index += 1) {
      const radius = 10 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      color.set(index % 8 === 0 ? 0x4f9cff : index % 13 === 0 ? 0xffa34f : 0xb7d8ff);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
    const material = new T.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.82, sizeAttenuation: true, depthWrite: false });
    return new T.Points(geometry, material);
  }

  function createRing(radius, tube, color, opacity, rotation) {
    const geometry = new T.TorusGeometry(radius, tube, 12, 220);
    const material = new T.MeshBasicMaterial({ color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
    const ring = new T.Mesh(geometry, material);
    ring.rotation.set(rotation[0], rotation[1], rotation[2]);
    ring.renderOrder = 3;
    return ring;
  }

  async function loadTexture(url, anisotropy) {
    return new Promise((resolve) => {
      new T.TextureLoader().load(
        url,
        (texture) => {
          texture.encoding = T.sRGBEncoding;
          texture.anisotropy = anisotropy;
          texture.wrapS = T.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  async function initGlobe() {
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", premultipliedAlpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.05, 8.6);

    const stars = createStars(window.innerWidth < 760 ? 650 : 1200);
    scene.add(stars);

    const world = new T.Group();
    world.rotation.set(-0.04, -0.08, -0.015);
    scene.add(world);

    const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const cityMap = await loadTexture("/assets/textures/earth_lights_2048.png?v=20260711-3", anisotropy);

    const coreUniforms = {
      uTime: { value: 0 },
      uCities: { value: cityMap || new T.Texture() },
      uHasCities: { value: cityMap ? 1 : 0 }
    };

    const coreMaterial = new T.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          vPosition = position;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uCities;
        uniform float uHasCities;
        varying vec2 vUv;
        varying vec3 vNormalV;
        varying vec3 vViewDir;
        varying vec3 vPosition;

        float lineGrid(float value, float scale, float width) {
          float f = abs(fract(value * scale) - 0.5);
          return 1.0 - smoothstep(width, width + 0.018, f);
        }

        void main() {
          float fresnel = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 2.2);
          float latitude = lineGrid(vUv.y, 18.0, 0.472);
          float longitude = lineGrid(vUv.x, 36.0, 0.476);
          float grid = max(latitude, longitude) * 0.22;

          float city = 0.0;
          if (uHasCities > 0.5) {
            vec3 citySample = texture2D(uCities, vUv).rgb;
            city = smoothstep(0.18, 0.75, max(citySample.r, max(citySample.g, citySample.b)));
          }

          float crystal = 0.5 + 0.5 * sin((vPosition.x + vPosition.y * 0.72 + vPosition.z * 0.36) * 10.0 - uTime * 0.35);
          float scan = smoothstep(0.88, 1.0, sin((vUv.y + uTime * 0.018) * 110.0) * 0.5 + 0.5);

          vec3 deep = vec3(0.007, 0.026, 0.085);
          vec3 royal = vec3(0.018, 0.13, 0.36);
          vec3 cyan = vec3(0.14, 0.75, 1.0);
          vec3 amber = vec3(1.0, 0.49, 0.11);

          vec3 color = mix(deep, royal, 0.32 + fresnel * 0.38);
          color += cyan * fresnel * 0.62;
          color += cyan * grid;
          color += mix(cyan, amber, smoothstep(0.45, 0.95, vUv.x)) * city * (1.5 + crystal * 0.32);
          color += cyan * scan * 0.035;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false
    });

    const core = new T.Mesh(new T.SphereGeometry(2.02, 128, 128), coreMaterial);
    core.renderOrder = 1;
    world.add(core);

    const wire = new T.LineSegments(
      new T.WireframeGeometry(new T.IcosahedronGeometry(2.055, 5)),
      new T.LineBasicMaterial({ color: COLORS.electric, transparent: true, opacity: 0.105, depthWrite: false, blending: T.AdditiveBlending })
    );
    wire.renderOrder = 2;
    world.add(wire);

    const glassUniforms = { uTime: { value: 0 } };
    const glass = new T.Mesh(
      new T.SphereGeometry(2.22, 96, 96),
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
            float rim = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 3.3);
            float diagonal = smoothstep(0.97, 1.0, sin((vUv.x * 1.7 + vUv.y) * 52.0 + uTime * 0.08) * 0.5 + 0.5);
            vec3 color = mix(vec3(0.10, 0.42, 1.0), vec3(0.22, 0.92, 1.0), vUv.y);
            float alpha = rim * 0.48 + diagonal * rim * 0.07;
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

    const atmosphere = new T.Mesh(
      new T.SphereGeometry(2.31, 96, 96),
      new T.ShaderMaterial({
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
          varying vec3 vNormalV;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(1.0 - max(dot(normalize(vNormalV), normalize(vViewDir)), 0.0), 4.4);
            vec3 color = mix(vec3(0.12, 0.44, 1.0), vec3(0.20, 0.94, 1.0), rim);
            gl_FragColor = vec4(color, rim * 0.38);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: T.BackSide,
        blending: T.AdditiveBlending
      })
    );
    atmosphere.renderOrder = 0;
    world.add(atmosphere);

    const innerCore = new T.Mesh(
      new T.SphereGeometry(1.72, 64, 64),
      new T.MeshBasicMaterial({ color: 0x02102d, transparent: true, opacity: 0.33, depthWrite: false })
    );
    world.add(innerCore);

    const rings = [
      createRing(2.38, 0.012, COLORS.blue, 0.5, [1.08, 0.05, 0.24]),
      createRing(2.43, 0.009, COLORS.cyan, 0.5, [0.56, -0.34, 1.1]),
      createRing(2.47, 0.011, COLORS.orange, 0.62, [1.4, 0.24, -0.48])
    ];
    rings.forEach((ring) => world.add(ring));

    const nodeConfigs = [
      { key: "developer", number: 1, title: "Developer", subtitle: "Write code · Commit & Push", type: "developer", accent: "#3c9cff", lat: 19, lon: -61, scale: [1.14, 0.55] },
      { key: "git", number: 2, title: "Git Repository", subtitle: "Bitbucket · GitHub · GitLab", type: "git", accent: "#4c9cff", lat: 49, lon: -19, scale: [1.08, 0.51] },
      { key: "cicd", number: 3, title: "CI/CD Pipeline", subtitle: "Security · Build · Test · Deploy", type: "cicd", accent: "#8468ff", lat: 30, lon: 50, scale: [1.13, 0.54] },
      { key: "aws", number: 4, title: "AWS Cloud", subtitle: "Multi-Region · Multi-AZ", type: "aws", accent: "#ff9b2f", lat: 4, lon: 2, scale: [1.24, 0.59] },
      { key: "cloudwatch", number: 5, title: "CloudWatch", subtitle: "Logs · Metrics · Alarms", type: "cloudwatch", accent: "#31dcec", lat: -31, lon: 48, scale: [1.12, 0.53] },
      { key: "alerts", number: 6, title: "Alerts & Notifications", subtitle: "Slack · Phone · Email", type: "alerts", accent: "#ff982d", lat: -34, lon: -55, scale: [1.1, 0.52] }
    ];

    const nodes = new Map();
    nodeConfigs.forEach((config) => {
      const texture = createCardTexture(config, anisotropy);
      const material = new T.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false, opacity: 0.98 });
      const sprite = new T.Sprite(material);
      sprite.position.copy(latLonToVector(config.lat, config.lon, 2.19));
      sprite.scale.set(config.scale[0], config.scale[1], 1);
      sprite.userData.baseScale = sprite.scale.clone();
      sprite.userData.config = config;
      sprite.renderOrder = 8;
      world.add(sprite);
      nodes.set(config.key, sprite);
    });

    const regions = [
      { code: "US-EAST-1", city: "N. Virginia", lat: 37, lon: -73 },
      { code: "US-WEST-2", city: "Oregon", lat: 39, lon: -48 },
      { code: "SA-EAST-1", city: "São Paulo", lat: -13, lon: -64 },
      { code: "EU-WEST-1", city: "Ireland", lat: 36, lon: -5 },
      { code: "EU-CENTRAL-1", city: "Frankfurt", lat: 21, lon: 15 },
      { code: "AP-SOUTH-1", city: "Mumbai", lat: -7, lon: 41 },
      { code: "AP-SOUTHEAST-1", city: "Singapore", lat: 10, lon: 61 },
      { code: "AP-NORTHEAST-1", city: "Tokyo", lat: 35, lon: 70 }
    ];

    const glowBlue = glowDotTexture("#45baff");
    const glowOrange = glowDotTexture("#ff9a2d");
    const regionObjects = [];
    const awsPosition = nodes.get("aws").position.clone();
    const regionCurves = [];

    regions.forEach((region, index) => {
      const position = latLonToVector(region.lat, region.lon, 2.12);
      const pin = new T.Sprite(new T.SpriteMaterial({ map: glowOrange, color: 0xffb15b, transparent: true, opacity: 0.92, depthWrite: false, depthTest: true, blending: T.AdditiveBlending }));
      pin.position.copy(position);
      pin.scale.setScalar(0.14);
      pin.renderOrder = 7;
      world.add(pin);

      const label = new T.Sprite(new T.SpriteMaterial({ map: createRegionTexture(region, anisotropy), transparent: true, depthTest: true, depthWrite: false, opacity: 0.92 }));
      const offset = position.clone().normalize().multiplyScalar(0.12).add(new T.Vector3(0, index % 2 === 0 ? 0.09 : -0.06, 0));
      label.position.copy(position.clone().add(offset));
      label.scale.set(0.52, 0.185, 1);
      label.renderOrder = 8;
      world.add(label);

      const arc = createArc(awsPosition, position, 0.34 + (index % 3) * 0.06, COLORS.orange, 0.43, false);
      world.add(arc.line);

      const packet = new T.Sprite(new T.SpriteMaterial({ map: glowOrange, color: 0xffa33f, transparent: true, opacity: 0.9, depthWrite: false, depthTest: true, blending: T.AdditiveBlending }));
      packet.scale.setScalar(0.095);
      packet.renderOrder = 9;
      world.add(packet);
      regionCurves.push({ ...arc, packet, offset: index * 0.11 });
      regionObjects.push({ pin, label, phase: index * 0.65 });
    });

    const lifecycleOrder = ["developer", "git", "cicd", "aws", "cloudwatch", "alerts"];
    const lifecycleColors = [COLORS.blue, COLORS.blue, 0x8b73ff, COLORS.orange, COLORS.cyan, COLORS.orange];
    const lifecycleCurves = [];

    for (let index = 0; index < lifecycleOrder.length; index += 1) {
      const fromKey = lifecycleOrder[index];
      const toKey = lifecycleOrder[(index + 1) % lifecycleOrder.length];
      const start = nodes.get(fromKey).position.clone();
      const end = nodes.get(toKey).position.clone();
      const arc = createArc(start, end, 0.48 + (index % 2) * 0.09, lifecycleColors[index], 0.78, index === 1);
      world.add(arc.line);

      const packet = new T.Sprite(new T.SpriteMaterial({ map: index === 3 || index === 5 ? glowOrange : glowBlue, color: lifecycleColors[index], transparent: true, opacity: 1, depthWrite: false, depthTest: true, blending: T.AdditiveBlending }));
      packet.scale.setScalar(0.13);
      packet.renderOrder = 10;
      world.add(packet);
      lifecycleCurves.push({ ...arc, packet, offset: index / lifecycleOrder.length });
    }

    const pinPositions = [
      [18, -32], [2, -29], [-18, -18], [26, 10], [8, 22], [-11, 27], [34, 40],
      [14, 60], [-5, 66], [40, -60], [-24, -45], [0, 0], [-36, 10], [22, 72]
    ];
    const pulsePins = pinPositions.map(([lat, lon], index) => {
      const pin = new T.Sprite(new T.SpriteMaterial({ map: index % 3 === 0 ? glowOrange : glowBlue, color: index % 3 === 0 ? 0xffa03d : 0x4fc2ff, transparent: true, opacity: 0.55, depthWrite: false, depthTest: true, blending: T.AdditiveBlending }));
      pin.position.copy(latLonToVector(lat, lon, 2.08));
      pin.scale.setScalar(0.08);
      pin.userData.phase = index * 0.42;
      pin.renderOrder = 7;
      world.add(pin);
      return pin;
    });

    let autoRotate = !reducedMotion;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetRotationX = world.rotation.x;
    let targetRotationY = world.rotation.y;
    let cameraZ = 8.6;

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
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", resize);
    }
    resize();

    const clock = new T.Clock();
    let currentStage = -1;

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.034);

      if (autoRotate && !dragging) targetRotationY += reducedMotion ? 0 : 0.00135;
      if (!dragging) {
        targetRotationY += velocityY;
        targetRotationX += velocityX;
        velocityX *= 0.93;
        velocityY *= 0.93;
      }

      world.rotation.y += (targetRotationY - world.rotation.y) * 0.08;
      world.rotation.x += (targetRotationX - world.rotation.x) * 0.08;
      camera.position.z += (cameraZ - camera.position.z) * 0.08;

      coreUniforms.uTime.value = elapsed;
      glassUniforms.uTime.value = elapsed;
      rings[0].rotation.z += 0.00065;
      rings[1].rotation.y -= 0.0005;
      rings[2].rotation.x += 0.00042;
      stars.rotation.y -= 0.00008;

      lifecycleCurves.forEach((item, index) => {
        const progress = (elapsed * 0.085 + item.offset) % 1;
        item.packet.position.copy(item.curve.getPointAt(progress));
        const glow = 0.75 + Math.sin(elapsed * 5 + index) * 0.2;
        item.packet.material.opacity = glow;
        item.packet.scale.setScalar(0.105 + glow * 0.045);
      });

      regionCurves.forEach((item, index) => {
        const progress = (elapsed * 0.055 + item.offset) % 1;
        item.packet.position.copy(item.curve.getPointAt(progress));
        item.packet.material.opacity = 0.55 + Math.sin(elapsed * 4 + index) * 0.22;
      });

      const sharedPulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8);
      regionObjects.forEach((item, index) => {
        const pulse = 0.55 + 0.45 * Math.sin(elapsed * 2.8 + item.phase) * sharedPulse;
        item.pin.scale.setScalar(0.105 + pulse * 0.065);
        item.pin.material.opacity = 0.54 + pulse * 0.42;
      });
      pulsePins.forEach((pin) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8 + pin.userData.phase);
        pin.scale.setScalar(0.06 + pulse * 0.065);
        pin.material.opacity = 0.3 + pulse * 0.68;
      });

      const active = Math.floor(elapsed / 3.15) % lifecycleOrder.length;
      if (active !== currentStage) {
        currentStage = active;
        if (flowCopy) flowCopy.textContent = lifecycleText[active];
      }
      lifecycleOrder.forEach((key, index) => {
        const sprite = nodes.get(key);
        const target = index === active ? 1.105 : 1;
        const current = sprite.scale.x / sprite.userData.baseScale.x;
        const scale = current + (target - current) * 0.08;
        sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(scale);
        sprite.material.opacity += ((index === active ? 1 : 0.91) - sprite.material.opacity) * 0.08;
      });

      renderer.render(scene, camera);
    }

    renderer.render(scene, camera);
    stage.classList.add("scene-ready");
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (loader) loader.setAttribute("aria-hidden", "true");
    animate();
  }

  initGlobe().catch(failScene);
})();
