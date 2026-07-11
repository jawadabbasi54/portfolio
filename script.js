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

  const uiLayer = qs("#globe-ui-layer");
  const codePath = qs("#code-path");
  const monitorPath = qs("#monitor-path");
  const deploymentPath = qs("#deployment-path");
  const applicationVersion = qs("#application-version");
  const telemetryPulse = qs("#telemetry-pulse");
  const typingCode = qs("#typing-code");


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
        blending: T.AdditiveBlending
      }));
      pin.scale.setScalar(config.key === "aws" ? 0.16 : 0.11);
      pin.renderOrder = 7;
      anchor.add(pin);
      anchor.userData.pin = pin;
      nodes.set(config.key, anchor);
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
        color: 0xffb15b,
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending
      }));
      pin.scale.setScalar(0.10);
      pin.renderOrder = 7;
      regionAnchor.add(pin);

      // Three subtle Availability Zone lights replace the old text cards.
      const azPins = [-1, 0, 1].map((offsetIndex) => {
        const azPin = new T.Sprite(new T.SpriteMaterial({
          map: glowOrange,
          color: 0xffc06b,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
          depthTest: true,
          blending: T.AdditiveBlending
        }));
        azPin.position.set(offsetIndex * 0.085, -0.075, 0.035 * Math.abs(offsetIndex));
        azPin.scale.setScalar(0.045);
        azPin.renderOrder = 8;
        regionAnchor.add(azPin);
        return azPin;
      });

      const arc = createArc(awsPosition, position, 0.30 + (index % 3) * 0.055, COLORS.orange, 0.12, false);
      world.add(arc.line);

      const packet = new T.Sprite(new T.SpriteMaterial({
        map: glowOrange,
        color: 0xffa33f,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending
      }));
      packet.scale.setScalar(0.08);
      packet.renderOrder = 9;
      world.add(packet);

      regionCurves.push({ ...arc, packet, offset: index * 0.11 });
      regionObjects.push({ anchor: regionAnchor, position, pin, azPins, phase: index * 0.65 });
    });

    const pinPositions = [
      [18, -32], [2, -29], [-18, -18], [26, 10], [8, 22], [-11, 27], [34, 40],
      [14, 60], [-5, 66], [40, -60], [-24, -45], [0, 0], [-36, 10], [22, 72]
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
      deploymentIntensity: 0,
      pathReady: false,
      primaryRegionIndex: 3
    };

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
      if (!uiLayer || !codePath || !monitorPath || !deploymentPath) return;
      nodeConfigs.forEach(({ key }) => setProjectedNode(key));

      const codePoints = [
        centerInStage(developerOrb),
        centerInStage(gitCluster),
        ...stageIcons.map(centerInStage),
        centerInStage(awsOrb)
      ];
      const monitorPoints = [centerInStage(awsOrb), centerInStage(cloudwatchOrb), centerInStage(alertsCluster)];
      const primaryRegion = regionObjects[overlayState.primaryRegionIndex];
      const regionPoint = primaryRegion ? projectLocalPoint(primaryRegion.position) : centerInStage(awsOrb);
      const awsPoint = centerInStage(awsOrb);
      const deploymentD = `M ${awsPoint.x.toFixed(2)} ${awsPoint.y.toFixed(2)} C ${(awsPoint.x + 94).toFixed(2)} ${(awsPoint.y + 74).toFixed(2)}, ${(regionPoint.x + 72).toFixed(2)} ${(regionPoint.y - 92).toFixed(2)}, ${regionPoint.x.toFixed(2)} ${regionPoint.y.toFixed(2)}`;

      codePath.setAttribute("d", createSmoothPath(codePoints, 24));
      monitorPath.setAttribute("d", createSmoothPath(monitorPoints, 48));
      deploymentPath.setAttribute("d", deploymentD);
      overlayState.pathReady = true;

      placeOnSvgPath(applicationVersion, codePath, overlayState.assetProgress);
      placeOnSvgPath(telemetryPulse, monitorPath, overlayState.telemetryProgress);
    }

    function prepareDeploymentStroke() {
      if (!deploymentPath || !deploymentPath.getTotalLength) return 0;
      const length = deploymentPath.getTotalLength();
      deploymentPath.style.strokeDasharray = `${length}`;
      deploymentPath.style.strokeDashoffset = `${length}`;
      return length;
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
      if (deploymentPath) deploymentPath.style.strokeDashoffset = "0";
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
      gsapApi.set(telemetryPulse, { autoAlpha: 0, scale: 0.6 });
      prepareDeploymentStroke();

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
          overlayState.deploymentIntensity = 0;
          prepareDeploymentStroke();
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
        .call(() => prepareDeploymentStroke(), null, "aws+=0.08")
        .to(deploymentPath, { strokeDashoffset: 0, duration: 1.55, ease: "expo.out" }, "aws+=0.12")
        .to(overlayState, { deploymentIntensity: 1, duration: 0.55, ease: "power4.out" }, "aws+=0.16")
        .to(overlayState, { deploymentIntensity: 0.32, duration: 1.2, ease: "power2.out" }, "aws+=0.78")
        .addLabel("observe", ">-0.15")
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
        .to([gitCluster, pipelineIcons, awsOrb, cloudwatchOrb, alertsCluster], {
          scale: 0.96,
          autoAlpha: 0.74,
          duration: 0.75,
          ease: "power2.out"
        }, ">+=0.5")
        .to([developerOrb, typingConsole], { autoAlpha: 0.72, duration: 0.45 }, "<")
        .set(stageIcons, { opacity: 0.52, scale: 0.82, filter: "saturate(.6) brightness(.72)" })
        .set(deploymentPath, { opacity: 0.95 });

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

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      clock.getDelta();

      if (autoRotate && !dragging) targetRotationY += reducedMotion ? 0 : 0.00115;
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

      // Region deployment packets remain dormant until GSAP reaches AWS.
      regionCurves.forEach((item, index) => {
        const progress = (elapsed * 0.055 + item.offset) % 1;
        item.packet.position.copy(item.curve.getPointAt(progress));
        const pulse = 0.56 + Math.sin(elapsed * 4 + index) * 0.22;
        item.packet.material.opacity = overlayState.deploymentIntensity * pulse;
        item.line.material.opacity = 0.08 + overlayState.deploymentIntensity * 0.38;
      });

      const sharedPulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8);
      regionObjects.forEach((item) => {
        const pulse = 0.55 + 0.45 * Math.sin(elapsed * 2.8 + item.phase) * sharedPulse;
        const deployBoost = overlayState.deploymentIntensity;
        item.pin.scale.setScalar(0.075 + pulse * 0.035 + deployBoost * 0.055);
        item.pin.material.opacity = 0.34 + pulse * 0.18 + deployBoost * 0.45;
        item.azPins.forEach((azPin, azIndex) => {
          const azPulse = 0.5 + 0.5 * Math.sin(elapsed * 5.2 + item.phase + azIndex * 0.7);
          azPin.scale.setScalar(0.033 + azPulse * 0.018 + deployBoost * 0.025);
          azPin.material.opacity = 0.13 + azPulse * 0.13 + deployBoost * 0.52;
        });
      });

      pulsePins.forEach((pin) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8 + pin.userData.phase);
        pin.scale.setScalar(0.05 + pulse * 0.045);
        pin.material.opacity = 0.2 + pulse * 0.48;
      });

      nodes.forEach((anchor, key) => {
        const pin = anchor.userData.pin;
        if (!pin) return;
        const emphasis = key === "aws" ? overlayState.deploymentIntensity : 0;
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.4 + anchor.position.x * 2);
        pin.scale.setScalar((key === "aws" ? 0.12 : 0.08) + pulse * 0.04 + emphasis * 0.08);
        pin.material.opacity = 0.38 + pulse * 0.34 + emphasis * 0.25;
      });

      updateOverlayPaths();
      renderer.render(scene, camera);
    }

    renderer.render(scene, camera);
    stage.classList.add("scene-ready");
    updateOverlayPaths();
    initGsapFlow();
    if (ScrollTriggerApi) ScrollTriggerApi.refresh();
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (loader) loader.setAttribute("aria-hidden", "true");
    animate();
  }

  initGlobe().catch(failScene);
})();
