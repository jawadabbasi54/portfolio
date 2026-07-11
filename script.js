import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const { prefersReducedMotion, isSmallScreen, advanceHtmlPipeline } = window.PortfolioUI;
const loader = document.getElementById('page-loader');
const fallback = document.getElementById('globe-fallback');
const canvas = document.getElementById('globe-canvas');
const shell = document.getElementById('globe-shell');
const tooltip = document.getElementById('tech-tooltip');
const pipelineStatus = document.getElementById('pipeline-status');

const techData = [
  { name: 'Git', color: '#ff745c', detail: 'GitFlow, branching strategy, pull requests, release tagging, and controlled promotion.' },
  { name: 'Docker', color: '#45a6ff', detail: 'Local development, reproducible builds, ECR images, and container delivery workflows.' },
  { name: 'Terraform', color: '#a989ff', detail: 'End-to-end AWS infrastructure as code integrated into secure deployment pipelines.' },
  { name: 'AWS', color: '#ffb95f', detail: 'Enterprise cloud architecture across compute, data, networking, security, serverless, and IoT.' },
  { name: 'Linux', color: '#e4f4f4', detail: 'Server administration, Bash automation, deployment tooling, and production troubleshooting.' },
  { name: 'CI/CD', color: '#63f1c7', detail: 'Bitbucket Pipelines, Jenkins, self-hosted runners, OIDC, scans, approvals, and releases.' }
];
const deploymentOrder = ['Git', 'CI/CD', 'Docker', 'Terraform', 'AWS'];

function makeLabelTexture(label, color) {
  const size = 256;
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(95, 72, 12, 128, 128, 118);
  grad.addColorStop(0, `${color}66`); grad.addColorStop(.55, '#0a1728ef'); grad.addColorStop(1, '#04101df2');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(18, 18, 220, 220, 62); ctx.fill();
  ctx.strokeStyle = `${color}aa`; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.font = `800 ${label.length > 4 ? 52 : 66}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 128, 130);
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = '700 16px monospace'; ctx.fillText('NODE', 128, 192);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { glowColor: { value: new THREE.Color('#57f1d2') }, coefficient: { value: .56 }, power: { value: 4.0 } },
    vertexShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 glowColor; uniform float coefficient; uniform float power; varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vec3 worldCameraToVertex=vWorldPosition-cameraPosition; vec3 viewCameraToVertex=(viewMatrix*vec4(worldCameraToVertex,0.0)).xyz; viewCameraToVertex=normalize(viewCameraToVertex); float intensity=pow(max(0.0,coefficient+dot(vNormal,viewCameraToVertex)),power); gl_FragColor=vec4(glowColor,intensity); }`
  });
}

async function initGlobe() {
  try {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050914, isSmallScreen ? .034 : .024);
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    camera.position.set(isSmallScreen ? 0 : -.1, .1, isSmallScreen ? 9.5 : 8.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmallScreen, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1.45 : 1.8));
    renderer.setSize(shell.clientWidth, shell.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(shell.clientWidth, shell.clientHeight), .58, .7, .67);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .045;
    controls.enablePan = false; controls.enableZoom = false;
    controls.rotateSpeed = .34;
    controls.autoRotate = !prefersReducedMotion; controls.autoRotateSpeed = .22;
    controls.minPolarAngle = Math.PI * .28; controls.maxPolarAngle = Math.PI * .72;

    scene.add(new THREE.AmbientLight(0x6d90a8, .5));
    const sun = new THREE.DirectionalLight(0xc7fff5, 3.1); sun.position.set(-4, 2.8, 5); scene.add(sun);
    const rim = new THREE.PointLight(0x5e79ff, 32, 20, 2); rim.position.set(4, -2, -3); scene.add(rim);

    const loader3d = new THREE.TextureLoader();
    const loadTexture = (url, colorSpace = false) => new Promise((resolve, reject) => loader3d.load(url, (texture) => {
      if (colorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      resolve(texture);
    }, undefined, reject));
    const [earthMap, bumpMap, nightMap, cloudMap, starMap] = await Promise.all([
      loadTexture('assets/earth-color.png', true), loadTexture('assets/earth-bump.png'), loadTexture('assets/earth-night.png'), loadTexture('assets/earth-clouds.png'), loadTexture('assets/star.png', true)
    ]);

    const ecosystem = new THREE.Group();
    ecosystem.rotation.z = -.07;
    scene.add(ecosystem);

    const earthGroup = new THREE.Group();
    ecosystem.add(earthGroup);
    const radius = 1.58;
    const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, isSmallScreen ? 64 : 96, isSmallScreen ? 48 : 72), new THREE.MeshStandardMaterial({
      map: earthMap, bumpMap, bumpScale: .075, roughness: .72, metalness: .03,
      emissive: new THREE.Color('#67e8cd'), emissiveMap: nightMap, emissiveIntensity: 1.65
    }));
    earth.rotation.y = -1.65; earthGroup.add(earth);

    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 72, 54), new THREE.MeshPhongMaterial({
      alphaMap: cloudMap, color: 0xc5fff8, transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    earthGroup.add(clouds);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.13, 72, 54), makeAtmosphereMaterial());
    earthGroup.add(atmosphere);

    // Earth wireframe adds the engineered / networked feel without hiding the natural surface.
    const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(radius * 1.022, 30, 18)), new THREE.LineBasicMaterial({ color: 0x68e8cf, transparent: true, opacity: .026, blending: THREE.AdditiveBlending }));
    earthGroup.add(grid);

    // Parallax star field.
    const starCount = isSmallScreen ? 650 : 1300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = THREE.MathUtils.randFloat(10, 34); const theta = Math.random() * Math.PI * 2; const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starPositions[i*3] = r * Math.sin(phi) * Math.cos(theta); starPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta); starPositions[i*3+2] = r * Math.cos(phi);
    }
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ map: starMap, color: 0xbfefff, size: isSmallScreen ? .09 : .075, transparent: true, opacity: .72, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(stars);

    // Faint network constellations.
    const constellationPositions = [];
    const constellationCount = isSmallScreen ? 18 : 36;
    for (let i = 0; i < constellationCount; i++) {
      const z = THREE.MathUtils.randFloat(-18, -8); const x = THREE.MathUtils.randFloatSpread(22); const y = THREE.MathUtils.randFloatSpread(13);
      constellationPositions.push(x,y,z, x+THREE.MathUtils.randFloatSpread(2.4), y+THREE.MathUtils.randFloatSpread(1.3), z+THREE.MathUtils.randFloatSpread(.5));
    }
    const constellations = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(constellationPositions,3)), new THREE.LineBasicMaterial({ color: 0x66e5d4, transparent:true, opacity:.09, blending:THREE.AdditiveBlending }));
    scene.add(constellations);

    const orbitGroups = [];
    const iconMeshes = [];
    const ringTilts = [
      [.92,.08,.15],[-.76,.21,-.17],[.42,.92,.08],[-.25,-.86,.48],[1.12,-.32,.8],[-1.0,.56,-.55]
    ];

    techData.forEach((tech, index) => {
      const group = new THREE.Group();
      group.rotation.set(...ringTilts[index]);
      const orbitRadius = 2.12 + index * .12;
      ecosystem.add(group);

      const ringMaterial = new THREE.MeshBasicMaterial({ color: tech.color, transparent: true, opacity: .17, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(orbitRadius, .007, 5, isSmallScreen ? 110 : 180), ringMaterial);
      group.add(ring);

      // Continuous directional data particles.
      const particleCount = isSmallScreen ? 22 : 38;
      const positions = new Float32Array(particleCount * 3);
      const phase = new Float32Array(particleCount);
      for (let p=0; p<particleCount; p++) phase[p] = (p/particleCount) * Math.PI * 2;
      const particleGeo = new THREE.BufferGeometry(); particleGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
      const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: tech.color, size: .035, transparent: true, opacity: .68, depthWrite: false, blending: THREE.AdditiveBlending }));
      group.add(particles);

      const iconMaterial = new THREE.SpriteMaterial({ map: makeLabelTexture(tech.name, tech.color), transparent: true, depthWrite: false, blending: THREE.NormalBlending });
      const icon = new THREE.Sprite(iconMaterial); icon.scale.set(.47,.47,.47); icon.userData = { tech, angle: index * .88 + .4, speed: .08 + index*.009, radius: orbitRadius, group };
      group.add(icon); iconMeshes.push(icon);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: starMap, color: tech.color, transparent: true, opacity: .38, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.set(.72,.72,.72); icon.add(halo); halo.position.z = -.01; icon.userData.halo = halo;
      orbitGroups.push({ group, ring, particles, phase, positions, orbitRadius, tech, icon });
    });

    const deploymentPulse = new THREE.Mesh(new THREE.SphereGeometry(.065, 18, 18), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity: 0, blending:THREE.AdditiveBlending, depthWrite:false }));
    const pulseGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map:starMap, color:0x7affd9, transparent:true, opacity:.8, blending:THREE.AdditiveBlending, depthWrite:false }));
    pulseGlow.scale.set(.8,.8,.8); deploymentPulse.add(pulseGlow); scene.add(deploymentPulse);
    let pulseSegment = 0, segmentStart = performance.now(), startPosition = new THREE.Vector3(), endPosition = new THREE.Vector3();
    let pulseInitialized = false;
    const earthGlow = new THREE.PointLight(0x5affc5, 0, 7, 2); scene.add(earthGlow);

    function getIconByName(name) { return iconMeshes.find((icon) => icon.userData.tech.name === name); }
    function setPulseSegment(now) {
      const fromName = deploymentOrder[pulseSegment];
      const toName = deploymentOrder[pulseSegment + 1];
      const fromIcon = getIconByName(fromName);
      fromIcon.getWorldPosition(startPosition);
      if (toName) getIconByName(toName).getWorldPosition(endPosition); else endPosition.set(0,0,0);
      deploymentPulse.material.color.set(fromIcon.userData.tech.color);
      pulseGlow.material.color.set(fromIcon.userData.tech.color);
      deploymentPulse.material.opacity = 1;
      pipelineStatus.textContent = `DEPLOYING · ${fromName.toUpperCase()}${toName ? ` → ${toName.toUpperCase()}` : ' → PRODUCTION'}`;
      const htmlIndex = deploymentOrder.indexOf(fromName);
      advanceHtmlPipeline(Math.max(0, htmlIndex));
      segmentStart = now;
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(10,10);
    let hovered = null;
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      tooltip.style.left = `${event.clientX - rect.left}px`; tooltip.style.top = `${event.clientY - rect.top}px`;
    });
    canvas.addEventListener('pointerleave', () => { pointer.set(10,10); tooltip.classList.remove('visible'); hovered = null; });

    const clock = new THREE.Clock();
    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .01 }).observe(shell);

    function animate(now) {
      requestAnimationFrame(animate);
      if (!visible && document.visibilityState !== 'visible') return;
      const elapsed = clock.getElapsedTime();
      earth.rotation.y += prefersReducedMotion ? 0 : .00055;
      clouds.rotation.y += prefersReducedMotion ? 0 : .00072;
      grid.rotation.y -= prefersReducedMotion ? 0 : .00016;
      stars.rotation.y = elapsed * .004; constellations.rotation.y = -elapsed * .003;

      orbitGroups.forEach((orbit, index) => {
        const { icon, particles, phase, positions, orbitRadius } = orbit;
        const angle = icon.userData.angle + elapsed * icon.userData.speed;
        icon.position.set(Math.cos(angle)*orbitRadius, Math.sin(angle)*orbitRadius, 0);
        icon.userData.halo.material.opacity = hovered === icon ? .86 : .3 + Math.sin(elapsed*2+index)*.08;
        icon.scale.setScalar(hovered === icon ? .57 : .47);
        for (let p=0; p<phase.length; p++) {
          const a = phase[p] + elapsed * (.17 + index*.018);
          positions[p*3] = Math.cos(a)*orbitRadius; positions[p*3+1] = Math.sin(a)*orbitRadius; positions[p*3+2] = 0;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      });

      // Recurring deployment pulse: Git -> CI/CD -> Docker -> Terraform -> AWS -> Earth.
      if (!pulseInitialized) { setPulseSegment(now); pulseInitialized = true; }
      const segmentDuration = 1250;
      let t = Math.min((now - segmentStart)/segmentDuration, 1);
      t = t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
      const curveLift = new THREE.Vector3(0, .35 * Math.sin(Math.PI*t), .32 * Math.sin(Math.PI*t));
      deploymentPulse.position.lerpVectors(startPosition,endPosition,t).add(curveLift);
      deploymentPulse.scale.setScalar(1 + Math.sin(t*Math.PI)*.8);
      if (t >= 1) {
        pulseSegment++;
        if (pulseSegment >= deploymentOrder.length) {
          earthGlow.intensity = 28; atmosphere.material.uniforms.coefficient.value = .8;
          pipelineStatus.textContent = 'DEPLOYMENT · HEALTHY';
          setTimeout(() => { earthGlow.intensity = 0; atmosphere.material.uniforms.coefficient.value = .56; }, 780);
          pulseSegment = 0;
        }
        setPulseSegment(now);
      }
      earthGlow.intensity *= .94;

      raycaster.setFromCamera(pointer,camera);
      const hit = raycaster.intersectObjects(iconMeshes,false)[0]?.object || null;
      if (hit !== hovered) {
        hovered = hit;
        if (hovered) {
          const { tech } = hovered.userData;
          tooltip.innerHTML = `<strong style="color:${tech.color}">${tech.name}</strong><span>${tech.detail}</span>`;
          tooltip.classList.add('visible'); canvas.style.cursor = 'pointer'; controls.autoRotate = false;
        } else {
          tooltip.classList.remove('visible'); canvas.style.cursor = 'grab'; controls.autoRotate = !prefersReducedMotion;
        }
      }
      controls.update();
      composer.render();
    }

    function resize() {
      const width = shell.clientWidth, height = shell.clientHeight;
      camera.aspect = width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height,false); composer.setSize(width,height);
    }
    new ResizeObserver(resize).observe(shell); resize();
    fallback.style.display = 'none';
    requestAnimationFrame(animate);
  } catch (error) {
    console.error('3D globe failed to initialize:', error);
    pipelineStatus.textContent = 'ECOSYSTEM · STATIC MODE';
  } finally {
    setTimeout(() => loader.classList.add('is-hidden'), 320);
  }
}

initGlobe();
