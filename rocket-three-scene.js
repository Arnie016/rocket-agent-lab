import * as THREE from "./vendor/three.module.js";

const PART_SELECT_COLOR = new THREE.Color("#5df2c1");
const PART_HOVER_COLOR = new THREE.Color("#8fddff");
const WHITE = new THREE.Color("#eef5ff");
const textureLoader = new THREE.TextureLoader();

const atlasRects = {
  stainless: [0.02, 0.02, 0.24, 0.36],
  painted: [0.34, 0.02, 0.42, 0.36],
  whitePanels: [0.78, 0.02, 0.2, 0.36],
  engineHeat: [0.02, 0.4, 0.26, 0.25],
  thermalTiles: [0.31, 0.4, 0.26, 0.25],
  frost: [0.62, 0.4, 0.18, 0.25],
  concrete: [0.02, 0.67, 0.55, 0.18],
  gantry: [0.58, 0.82, 0.38, 0.16],
};

function makeSeedAtlasTexture(size = 1254) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6f7c86";
  ctx.fillRect(0, 0, size, size);
  Object.entries(atlasRects).forEach(([name, rect], index) => {
    const [x, y, w, h] = rect;
    const px = x * size;
    const py = y * size;
    const pw = w * size;
    const ph = h * size;
    const hue = (index * 37) % 360;
    const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    grad.addColorStop(0, `hsl(${hue} 25% 72%)`);
    grad.addColorStop(0.5, name === "thermalTiles" ? "#15191f" : `hsl(${hue} 18% 42%)`);
    grad.addColorStop(1, name === "engineHeat" ? "#8d4c2d" : `hsl(${hue} 20% 58%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    for (let line = py + 8; line < py + ph; line += 18) {
      ctx.beginPath();
      ctx.moveTo(px, line);
      ctx.lineTo(px + pw, line + 4);
      ctx.stroke();
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const atlas = makeSeedAtlasTexture();

textureLoader.load("./assets/textures/rocket-material-atlas.png", (loaded) => {
  atlas.image = loaded.image;
  atlas.needsUpdate = true;
});

function atlasTexture(name) {
  const [x, y, w, h] = atlasRects[name] || atlasRects.stainless;
  const texture = atlas.clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.offset.set(x, 1 - y - h);
  texture.repeat.set(w, h);
  return texture;
}

function color(hex, fallback = "#ffffff") {
  return new THREE.Color(hex || fallback);
}

function makeCanvasTexture(draw, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSurfaceNoiseTexture(kind = "panel", size = 256) {
  return makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = kind === "thermal" ? "#111111" : "#808080";
    ctx.fillRect(0, 0, s, s);
    const image = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = Math.random() * 42 - 21;
      image.data[i] = Math.max(0, Math.min(255, image.data[i] + n));
      image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + n));
      image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + n));
    }
    ctx.putImageData(image, 0, 0);
    ctx.strokeStyle = kind === "thermal" ? "rgba(210,210,210,0.22)" : "rgba(245,245,245,0.35)";
    ctx.lineWidth = 1;
    for (let y = 0; y < s; y += kind === "concrete" ? 42 : 34) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(s, y + 0.5);
      ctx.stroke();
    }
    for (let x = 0; x < s; x += kind === "concrete" ? 48 : 28) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, s);
      ctx.stroke();
    }
    if (kind === "brushed") {
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      for (let x = 0; x < s; x += 3) {
        ctx.beginPath();
        ctx.moveTo(x + Math.random() * 2, 0);
        ctx.lineTo(x + Math.random() * 2, s);
        ctx.stroke();
      }
    }
    if (kind === "concrete") {
      const scorch = ctx.createRadialGradient(s * 0.48, s * 0.45, 0, s * 0.48, s * 0.45, s * 0.32);
      scorch.addColorStop(0, "rgba(0,0,0,0.78)");
      scorch.addColorStop(0.55, "rgba(0,0,0,0.26)");
      scorch.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = scorch;
      ctx.fillRect(0, 0, s, s);
    }
  }, size);
}

const proceduralMaps = {
  brushed: makeSurfaceNoiseTexture("brushed", 256),
  panel: makeSurfaceNoiseTexture("panel", 256),
  thermal: makeSurfaceNoiseTexture("thermal", 256),
  concrete: makeSurfaceNoiseTexture("concrete", 512),
};

function makeScorchTexture(size = 512) {
  return makeCanvasTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const ring = ctx.createRadialGradient(s / 2, s / 2, s * 0.02, s / 2, s / 2, s * 0.5);
    ring.addColorStop(0, "rgba(0,0,0,0.72)");
    ring.addColorStop(0.22, "rgba(27,18,13,0.58)");
    ring.addColorStop(0.48, "rgba(93,56,25,0.28)");
    ring.addColorStop(0.75, "rgba(0,0,0,0.12)");
    ring.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 170; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * s * 0.46;
      const length = 18 + Math.random() * 90;
      ctx.save();
      ctx.translate(s / 2 + Math.cos(angle) * distance, s / 2 + Math.sin(angle) * distance);
      ctx.rotate(angle + (Math.random() - 0.5) * 0.8);
      ctx.fillStyle = `rgba(${50 + Math.random() * 120}, ${26 + Math.random() * 60}, ${12 + Math.random() * 28}, ${0.05 + Math.random() * 0.12})`;
      ctx.fillRect(0, -1.5, length, 3 + Math.random() * 5);
      ctx.restore();
    }
  }, size);
}

const scorchTexture = makeScorchTexture(512);

function applyAerospaceShader(material, options = {}) {
  const tint = new THREE.Color(options.tint || "#ffffff");
  const heat = options.heat || 0;
  const frost = options.frost || 0;
  const panelStrength = options.panelStrength ?? 0.05;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTint = { value: tint };
    shader.uniforms.uHeat = { value: heat };
    shader.uniforms.uFrost = { value: frost };
    shader.uniforms.uPanelStrength = { value: panelStrength };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorldPos = worldPosition.xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uTint;\nuniform float uHeat;\nuniform float uFrost;\nuniform float uPanelStrength;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float verticalSeam = smoothstep(0.975, 1.0, abs(sin(vWorldPos.y * 0.42)));
        float radialRivet = smoothstep(0.992, 1.0, abs(sin((vWorldPos.x + vWorldPos.z) * 7.5)));
        diffuseColor.rgb *= mix(vec3(1.0), uTint, 0.18);
        diffuseColor.rgb *= 1.0 - verticalSeam * uPanelStrength;
        diffuseColor.rgb += radialRivet * uPanelStrength * 0.7;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.91, 1.0), uFrost);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.34, 0.12), uHeat);
      `);
  };
  material.customProgramCacheKey = () => `aerospace-${options.tint || "white"}-${heat}-${frost}-${panelStrength}`;
  return material;
}

function materialTextureKind(part) {
  const text = `${part.id} ${part.name} ${part.type}`.toLowerCase();
  if (/engine|nozzle|merlin|raptor|f-1|rutherford|vulcain|rd-107|rs-25/.test(text)) return "engineHeat";
  if (/heat|thermal|tiles|orbiter|flap|grid/.test(text)) return "thermalTiles";
  if (/tank|core|stage|booster|s-ic|s-ii|s-ivb|super-heavy|ship/.test(text) && /starship|super-heavy|ship|lvm3|ariane/.test(text)) return "stainless";
  if (/tank|core|stage|booster|s-ic|s-ii|s-ivb|first-stage|second-stage/.test(text)) return "painted";
  if (/payload|fairing|command|crew|orion|escape/.test(text)) return "whitePanels";
  return "painted";
}

function makeSmokeTexture() {
  return makeCanvasTexture((ctx, size) => {
    const gradient = ctx.createRadialGradient(size * 0.48, size * 0.5, 4, size * 0.5, size * 0.52, size * 0.48);
    gradient.addColorStop(0, "rgba(255,255,255,0.72)");
    gradient.addColorStop(0.35, "rgba(190,199,204,0.42)");
    gradient.addColorStop(0.68, "rgba(92,98,104,0.18)");
    gradient.addColorStop(1, "rgba(40,44,52,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

function makeFlameTexture() {
  return makeCanvasTexture((ctx, size) => {
    const gradient = ctx.createRadialGradient(size * 0.5, size * 0.18, 0, size * 0.5, size * 0.52, size * 0.48);
    gradient.addColorStop(0, "rgba(255,255,222,1)");
    gradient.addColorStop(0.2, "rgba(255,205,94,0.92)");
    gradient.addColorStop(0.5, "rgba(255,107,42,0.52)");
    gradient.addColorStop(0.78, "rgba(83,184,255,0.2)");
    gradient.addColorStop(1, "rgba(83,184,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(size * 0.5, size * 0.54, size * 0.22, size * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function makeMetalMaterial(part) {
  const base = color(part.color);
  const isStainless = /starship|super-heavy|ship|flaps|grid/i.test(`${part.id} ${part.name}`);
  const isDark = base.getHSL({}).l < 0.25;
  const kind = materialTextureKind(part);
  const map = atlasTexture(kind);
  const mat = new THREE.MeshStandardMaterial({
    color: base,
    map,
    bumpMap: /stainless|engineHeat/i.test(kind) ? proceduralMaps.brushed : /thermal/i.test(kind) ? proceduralMaps.thermal : proceduralMaps.panel,
    bumpScale: /engineHeat|thermal/i.test(kind) ? 0.055 : 0.032,
    metalness: isStainless ? 0.74 : 0.32,
    roughness: kind === "engineHeat" ? 0.34 : isStainless ? 0.24 : 0.48,
    envMapIntensity: isStainless ? 1.28 : 0.78,
  });
  applyAerospaceShader(mat, {
    tint: part.accent || part.color || "#ffffff",
    heat: kind === "engineHeat" ? 0.1 : 0,
    frost: /tank|lox|cryogenic|hydrogen|oxygen/i.test(`${part.id} ${part.name}`) ? 0.06 : 0,
    panelStrength: kind === "thermalTiles" ? 0.09 : 0.052,
  });
  mat.userData.baseColor = base.clone();
  mat.userData.dark = isDark;
  return mat;
}

function materialWithShader(params, options) {
  const mat = new THREE.MeshStandardMaterial(params);
  applyAerospaceShader(mat, options);
  if (params.color) mat.userData.baseColor = color(params.color);
  return mat;
}

function partRadius(part) {
  const radius = Math.max(part.r0 || 1, part.r1 || 1);
  return {
    bottom: part.r0 || radius,
    top: part.r1 || radius,
    max: radius,
  };
}

function setPartId(object, id) {
  object.traverse((child) => {
    child.userData.partId = id;
  });
}

function addRing(group, radius, y, material, thickness = 0.035) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 72), material);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  group.add(ring);
  return ring;
}

function addStringers(group, part, radius, material) {
  const count = radius > 4 ? 12 : radius > 2.2 ? 8 : 6;
  const height = Math.max(1.2, part.height * 0.72);
  const geometry = new THREE.BoxGeometry(0.035, height, 0.075);
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const rail = new THREE.Mesh(geometry, material);
    rail.position.set(Math.cos(a) * (radius + 0.018), 0, Math.sin(a) * (radius + 0.018));
    rail.rotation.y = -a;
    group.add(rail);
  }
}

function addSaturnMarkings(group, part, radius) {
  if (!/saturn|s-ic|s-ii|s-ivb|launch-escape/i.test(`${part.id} ${part.name}`)) return;
  const black = materialWithShader({
    color: "#11151c",
    map: atlasTexture("thermalTiles"),
    bumpMap: proceduralMaps.thermal,
    bumpScale: 0.055,
    roughness: 0.55,
    metalness: 0.12,
  }, {
    tint: "#e7f1ff",
    panelStrength: 0.08,
  });
  const stripeCount = part.height > 20 ? 4 : 2;
  for (let i = 0; i < stripeCount; i += 1) {
    const a = (i / stripeCount) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.28, part.height * 0.82, 0.05), black);
    panel.position.set(Math.cos(a) * (radius + 0.035), 0, Math.sin(a) * (radius + 0.035));
    panel.rotation.y = Math.PI / 2 - a;
    group.add(panel);
  }
}

function addWindows(group, part, radius) {
  if (!/command|payload-bay|nose|fairing/i.test(`${part.id} ${part.name}`)) return;
  const glass = new THREE.MeshStandardMaterial({
    color: "#5fc9ff",
    emissive: "#0a3d66",
    emissiveIntensity: 0.35,
    metalness: 0.1,
    roughness: 0.12,
  });
  const count = part.id === "payload-bay" ? 4 : 3;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + 0.35;
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.04), glass);
    windowMesh.position.set(Math.cos(a) * (radius + 0.04), part.height * 0.18, Math.sin(a) * (radius + 0.04));
    windowMesh.rotation.y = Math.PI / 2 - a;
    group.add(windowMesh);
  }
}

function engineLayout(part) {
  if (part.engineCount) {
    const count = Math.max(1, Math.min(33, part.engineCount));
    if (count === 1) return [[0, 0]];
    const rings = [[0, 0]];
    const inner = Math.min(count - 1, 8);
    for (let i = 0; i < inner; i += 1) {
      const a = (i / inner) * Math.PI * 2;
      rings.push([Math.cos(a) * 1.15, Math.sin(a) * 1.15]);
    }
    const remaining = count - rings.length;
    for (let i = 0; i < remaining; i += 1) {
      const a = (i / remaining) * Math.PI * 2;
      rings.push([Math.cos(a) * 2.25, Math.sin(a) * 2.25]);
    }
    return rings;
  }
  if (part.id === "merlins") {
    return [
      [0, 0],
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 1.04, Math.sin(a) * 1.04];
      }),
    ];
  }
  if (part.id === "raptors") {
    return [
      [0, 0],
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return [Math.cos(a) * 1.35, Math.sin(a) * 1.35];
      }),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
      return [Math.cos(a) * 2.45, Math.sin(a) * 2.45];
      }),
    ];
  }
  if (part.id === "rd-107") {
    return [
      [-1.05, -1.05],
      [1.05, -1.05],
      [-1.05, 1.05],
      [1.05, 1.05],
      [0, 0],
    ];
  }
  if (part.id === "rutherford-engines") {
    return [
      [0, 0],
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 1.2, Math.sin(a) * 1.2];
      }),
    ];
  }
  if (part.id === "rs-25-engines") {
    return [
      [-1.05, -0.75],
      [1.05, -0.75],
      [-1.05, 0.75],
      [1.05, 0.75],
    ];
  }
  if (part.id === "ssme-cluster") {
    return [
      [-0.95, -0.58],
      [0.95, -0.58],
      [0, 0.98],
    ];
  }
  if (part.id === "srb-nozzles") {
    return [
      [-1.2, 0],
      [1.2, 0],
    ];
  }
  if (part.id === "lvm3-s200-nozzles") {
    return [
      [-1.35, 0],
      [1.35, 0],
    ];
  }
  if (part.id === "vulcain-engine") return [[0, 0]];
  return [
    [0, 0],
    ...Array.from({ length: 4 }, (_, i) => {
      const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      return [Math.cos(a) * 1.45, Math.sin(a) * 1.45];
    }),
  ];
}

function addEngineCluster(group, part) {
  if (!/engine|merlin|raptor|f-1|nozzle|rutherford|vulcain|rd-107|rs-25/i.test(`${part.id} ${part.name}`)) return;
  const nozzleMat = materialWithShader({
    color: "#2b3038",
    map: atlasTexture("engineHeat"),
    bumpMap: proceduralMaps.brushed,
    bumpScale: 0.08,
    metalness: 0.86,
    roughness: 0.24,
  }, {
    tint: "#ff7c2d",
    heat: 0.16,
    panelStrength: 0.085,
  });
  const glowMat = materialWithShader({
    color: "#ffbc62",
    emissive: "#ff6d2f",
    emissiveIntensity: 0.9,
    roughness: 0.3,
  }, {
    tint: "#ffbe64",
    heat: 0.24,
    panelStrength: 0.02,
  });
  const radius = partRadius(part).max;
  const layout = engineLayout(part);
  const scale = radius / 4.8;
  for (const [x, z] of layout) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * scale, 0.48 * scale, 1.28 * scale, 28), nozzleMat);
    nozzle.position.set(x * scale, -part.height / 2 - 0.42 * scale, z * scale);
    group.add(nozzle);
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.2 * scale, 0.08, 18), glowMat);
    throat.position.set(x * scale, -part.height / 2 - 1.09 * scale, z * scale);
    group.add(throat);
  }
}

function addFins(group, part) {
  if (!/grid-fins|flaps/i.test(part.id)) return;
  const mat = materialWithShader({
    color: color(part.accent, "#8fddff"),
    map: atlasTexture("thermalTiles"),
    bumpMap: proceduralMaps.thermal,
    bumpScale: 0.052,
    metalness: 0.58,
    roughness: 0.36,
    transparent: true,
    opacity: 0.92,
  }, {
    tint: part.accent || "#8fddff",
    heat: /flap/i.test(part.id) ? 0.05 : 0,
    panelStrength: 0.08,
  });
  const radius = partRadius(part).max;
  const isGrid = part.id === "grid-fins";
  const dimensions = isGrid ? [1.05, 0.18, 1.25] : [1.8, 0.22, 3.2];
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), mat);
    fin.position.set(Math.cos(a) * (radius + dimensions[0] * 0.48), isGrid ? 0 : -part.height * 0.18, Math.sin(a) * (radius + dimensions[0] * 0.48));
    fin.rotation.y = -a;
    group.add(fin);
    if (isGrid) {
      for (let rib = -1; rib <= 1; rib += 1) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.04), mat);
        line.position.set(fin.position.x, fin.position.y + rib * 0.16, fin.position.z);
        line.rotation.copy(fin.rotation);
        group.add(line);
      }
    }
  }
}

function addSideBoosters(group, part) {
  if (!/boosters|strap-on|side boosters/i.test(`${part.id} ${part.name}`)) return;
  const label = `${part.id} ${part.name}`;
  const radii = partRadius(part);
  const boosterCount = part.boosterCount || (/four|soyuz|strap-on/i.test(label) ? 4 : 2);
  const boosterRadius = Math.max(0.24, radii.max * (boosterCount === 4 ? 0.34 : 0.42));
  const offset = radii.max + boosterRadius * 1.25;
  const height = part.height * (boosterCount === 4 ? 1.02 : 0.96);
  const shell = materialWithShader({
    color: color(part.color, "#eef4f8"),
    map: atlasTexture(materialTextureKind(part)),
    bumpMap: proceduralMaps.panel,
    bumpScale: 0.034,
    metalness: 0.25,
    roughness: 0.48,
  }, {
    tint: part.accent || "#eef4f8",
    frost: /cryogenic|tank|booster/i.test(`${part.id} ${part.name}`) ? 0.04 : 0,
    panelStrength: 0.058,
  });
  const dark = materialWithShader({ color: "#1a1f27", map: atlasTexture("engineHeat"), bumpMap: proceduralMaps.brushed, bumpScale: 0.055, metalness: 0.52, roughness: 0.36 }, { tint: "#ff8a3d", heat: 0.08, panelStrength: 0.05 });
  const accent = materialWithShader({ color: color(part.accent, "#f6b14a"), metalness: 0.34, roughness: 0.38 }, { tint: part.accent || "#f6b14a", panelStrength: 0.035 });
  const angles = boosterCount === 4
    ? [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]
    : [0, Math.PI];

  angles.forEach((a, index) => {
    const side = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(boosterRadius * 0.82, boosterRadius, height, 36),
      shell,
    );
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(boosterRadius * 0.84, Math.max(1.4, height * 0.09), 36),
      shell,
    );
    nose.position.y = height / 2 + Math.max(0.7, height * 0.045);
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(boosterRadius * 0.34, boosterRadius * 0.52, boosterRadius * 0.9, 24),
      dark,
    );
    nozzle.position.y = -height / 2 - boosterRadius * 0.35;
    side.add(body, nose, nozzle);
    addRing(side, boosterRadius * 1.01, height * 0.12, accent, 0.018);
    side.position.set(Math.cos(a) * offset, boosterCount === 4 ? -part.height * 0.02 : 0, Math.sin(a) * offset);
    side.rotation.z = boosterCount === 4 ? (index % 2 === 0 ? -0.08 : 0.08) : 0;
    group.add(side);
  });
}

function addOrbiterShape(group, part) {
  if (!/orbiter/i.test(`${part.id} ${part.name}`)) return;
  const radius = partRadius(part).max;
  const hull = materialWithShader({ color: "#eef5ff", map: atlasTexture("whitePanels"), bumpMap: proceduralMaps.panel, bumpScale: 0.035, metalness: 0.16, roughness: 0.44 }, { tint: "#8fddff", panelStrength: 0.06 });
  const belly = materialWithShader({ color: "#11151c", map: atlasTexture("thermalTiles"), bumpMap: proceduralMaps.thermal, bumpScale: 0.07, metalness: 0.28, roughness: 0.5 }, { tint: "#ff7847", heat: 0.04, panelStrength: 0.1 });
  const glass = new THREE.MeshStandardMaterial({
    color: "#5fc9ff",
    emissive: "#0a3d66",
    emissiveIntensity: 0.36,
    roughness: 0.12,
  });
  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.8, part.height * 0.82, radius * 0.7), hull);
  fuselage.position.set(radius * 1.05, 0, 0);
  const blackBelly = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.84, part.height * 0.66, 0.05), belly);
  blackBelly.position.set(radius * 1.05, -part.height * 0.04, radius * 0.37);
  const wingGeo = new THREE.BoxGeometry(radius * 1.7, part.height * 0.055, radius * 0.72);
  const wingA = new THREE.Mesh(wingGeo, hull);
  wingA.position.set(radius * 1.08, -part.height * 0.18, radius * 0.68);
  wingA.rotation.y = -0.26;
  const wingB = wingA.clone();
  wingB.position.z = -radius * 0.68;
  wingB.rotation.y = 0.26;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.14, part.height * 0.23, radius * 0.9), hull);
  tail.position.set(radius * 1.1, part.height * 0.34, -radius * 0.12);
  tail.rotation.x = 0.18;
  const windows = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.48, part.height * 0.045, 0.04), glass);
  windows.position.set(radius * 1.06, part.height * 0.3, radius * 0.37);
  group.add(fuselage, blackBelly, wingA, wingB, tail, windows);
}

function addPayloadMassIndicator(group, part) {
  if (!/payload|fairing|bay|spacecraft|orion|command module|orbiter|crew/i.test(`${part.id} ${part.name} ${part.type}`)) return;
  const radius = partRadius(part).max * 0.45;
  const massMat = new THREE.MeshStandardMaterial({
    color: "#f6b14a",
    emissive: "#5c2a09",
    emissiveIntensity: 0.2,
    metalness: 0.2,
    roughness: 0.32,
    transparent: true,
    opacity: 0.58,
  });
  const marker = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.45, Math.max(0.6, part.height * 0.24), radius * 1.45), massMat);
  marker.position.y = Math.max(-part.height * 0.2, part.height * 0.02);
  marker.userData.payloadMass = true;
  group.add(marker);
}

function addCutawayTanks(group, part) {
  const ids = [
    "s-ic",
    "s-ii",
    "s-ivb",
    "first-stage",
    "second-stage",
    "super-heavy",
    "ship-tanks",
    "soyuz-core",
    "soyuz-third-stage",
    "shuttle-external-tank",
    "electron-first-stage",
    "sls-core",
    "icps",
    "ariane-core",
    "ariane-upper-stage",
    "lvm3-boosters",
    "lvm3-core",
    "lvm3-cryogenic",
  ];
  if (!ids.includes(part.id)) return;
  const radius = partRadius(part).max * 0.64;
  const loxMat = materialWithShader({
    color: "#9fd8ff",
    map: atlasTexture("frost"),
    bumpMap: proceduralMaps.panel,
    bumpScale: 0.025,
    emissive: "#0d4264",
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.34,
    roughness: 0.2,
  }, {
    tint: "#b7f4ff",
    frost: 0.32,
    panelStrength: 0.035,
  });
  const fuelMat = materialWithShader({
    color: "#ffbd66",
    map: atlasTexture("engineHeat"),
    bumpMap: proceduralMaps.brushed,
    bumpScale: 0.018,
    emissive: "#5c2a09",
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.32,
    roughness: 0.2,
  }, {
    tint: "#ffbd66",
    heat: 0.08,
    panelStrength: 0.03,
  });
  const tankA = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, part.height * 0.36, 32), loxMat);
  tankA.position.set(radius * 0.25, part.height * 0.19, 0);
  const tankB = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, part.height * 0.3, 32), fuelMat);
  tankB.position.set(radius * 0.25, -part.height * 0.19, 0);
  tankA.userData.fuelTank = true;
  tankA.userData.baseY = tankA.position.y;
  tankA.userData.baseHeight = part.height * 0.36;
  tankB.userData.fuelTank = true;
  tankB.userData.baseY = tankB.position.y;
  tankB.userData.baseHeight = part.height * 0.3;
  group.add(tankA, tankB);
}

function createPartMesh(part) {
  const group = new THREE.Group();
  group.name = part.id;
  const radii = partRadius(part);
  const material = makeMetalMaterial(part);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(0.08, radii.top), Math.max(0.08, radii.bottom), part.height, 64, Math.max(2, Math.round(part.height / 10))),
    material,
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const accent = materialWithShader({
    color: color(part.accent, "#9fc7e8"),
    map: atlasTexture("gantry"),
    bumpMap: proceduralMaps.brushed,
    bumpScale: 0.032,
    metalness: 0.45,
    roughness: 0.38,
  }, {
    tint: part.accent || "#9fc7e8",
    panelStrength: 0.035,
  });
  const ringRadiusTop = Math.max(0.12, radii.top + 0.012);
  const ringRadiusBottom = Math.max(0.12, radii.bottom + 0.012);
  addRing(group, ringRadiusTop, part.height / 2, accent);
  addRing(group, ringRadiusBottom, -part.height / 2, accent);
  if (part.height > 8) {
    const bands = Math.min(6, Math.max(2, Math.round(part.height / 12)));
    for (let i = 1; i < bands; i += 1) {
      addRing(group, radii.max + 0.008, -part.height / 2 + (part.height * i) / bands, accent, 0.022);
    }
  }
  if (part.height > 10) addStringers(group, part, radii.max, accent);
  addSaturnMarkings(group, part, radii.max);
  addWindows(group, part, radii.max);
  addEngineCluster(group, part);
  addFins(group, part);
  addSideBoosters(group, part);
  addOrbiterShape(group, part);
  addPayloadMassIndicator(group, part);
  addCutawayTanks(group, part);

  group.position.y = part.mid;
  group.userData.partId = part.id;
  group.userData.baseY = part.mid;
  group.userData.part = part;
  setPartId(group, part.id);
  return group;
}

function createTower() {
  const group = new THREE.Group();
  const mat = materialWithShader({ color: "#263241", map: atlasTexture("gantry"), bumpMap: proceduralMaps.brushed, bumpScale: 0.065, metalness: 0.58, roughness: 0.42 }, { tint: "#8fddff", panelStrength: 0.06 });
  const armMat = materialWithShader({ color: "#d47c38", map: atlasTexture("gantry"), bumpMap: proceduralMaps.brushed, bumpScale: 0.055, metalness: 0.4, roughness: 0.45 }, { tint: "#f6b14a", heat: 0.04, panelStrength: 0.045 });
  const legGeo = new THREE.CylinderGeometry(0.12, 0.14, 78, 10);
  const positions = [[-8, 0], [-11, 0], [-8, -3], [-11, -3]];
  for (const [x, z] of positions) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x, 39, z);
    group.add(leg);
  }
  for (let y = 6; y < 76; y += 8) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 3.6), mat);
    deck.position.set(-9.5, y, -1.5);
    group.add(deck);
    const braceA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 9.2, 0.12), mat);
    braceA.position.set(-9.5, y + 3.8, -1.5);
    braceA.rotation.z = 0.56;
    group.add(braceA);
    const braceB = braceA.clone();
    braceB.rotation.z = -0.56;
    group.add(braceB);
  }
  for (const y of [18, 34, 52]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.34, 0.28), armMat);
    arm.position.set(-4.8, y, -0.4);
    arm.rotation.z = -0.06;
    group.add(arm);
  }
  return group;
}

function createBuildings() {
  const group = new THREE.Group();
  const mats = [
    materialWithShader({ color: "#182532", map: atlasTexture("concrete"), bumpMap: proceduralMaps.concrete, bumpScale: 0.035, metalness: 0.22, roughness: 0.78 }, { tint: "#8fddff", panelStrength: 0.035 }),
    materialWithShader({ color: "#23394a", map: atlasTexture("gantry"), bumpMap: proceduralMaps.brushed, bumpScale: 0.04, metalness: 0.2, roughness: 0.72 }, { tint: "#9fc7e8", panelStrength: 0.04 }),
    materialWithShader({ color: "#26313d", map: atlasTexture("concrete"), bumpMap: proceduralMaps.concrete, bumpScale: 0.03, metalness: 0.18, roughness: 0.8 }, { tint: "#f6b14a", panelStrength: 0.035 }),
  ];
  const specs = [
    [-34, 3.2, -42, 15, 6, 10],
    [32, 2.4, -38, 13, 4.8, 9],
    [-45, 1.8, 24, 18, 3.6, 8],
    [44, 2.6, 20, 12, 5.2, 7],
  ];
  specs.forEach(([x, y, z, w, h, d], index) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats[index % mats.length]);
    box.position.set(x, y, z);
    box.receiveShadow = true;
    group.add(box);
  });
  return group;
}

function createStars(count = 520) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const r = 420 + Math.random() * 260;
    const theta = Math.random() * Math.PI * 2;
    const y = 40 + Math.random() * 520;
    positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: "#ffffff", size: 1.25, transparent: true, opacity: 0.0, sizeAttenuation: true });
  return new THREE.Points(geometry, mat);
}

function createSmokePool(texture, count = 72) {
  const group = new THREE.Group();
  const mat = new THREE.SpriteMaterial({
    map: texture,
    color: "#d6dce3",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(mat.clone());
    sprite.userData.seed = Math.random() * 1000;
    sprite.visible = false;
    group.add(sprite);
  }
  return group;
}

function createFlameStack(texture) {
  const group = new THREE.Group();
  const colors = ["#fff3b0", "#ff9c3d", "#4fb8ff"];
  colors.forEach((c, index) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      color: c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    sprite.scale.set(6 - index * 1.3, 15 + index * 5, 1);
    sprite.position.y = -7 - index * 3.8;
    group.add(sprite);
  });
  return group;
}

function createShockDiamonds() {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 2 ? "#4fb8ff" : "#fff2a8",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1 + i * 0.22, 2.4 + i * 0.45, 32, 1, true), material);
    cone.rotation.x = Math.PI;
    cone.position.y = -8.5 - i * 3.35;
    cone.userData.seed = i * 17;
    group.add(cone);
  }
  return group;
}

function createAeroPressureGroup() {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 2 ? "#8fddff" : "#f6b14a",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7.5 + i * 1.8, 0.045, 8, 96), material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 12 + i * 9.4;
    ring.userData.baseRadius = 7.5 + i * 1.8;
    ring.userData.seed = i * 0.7;
    group.add(ring);
  }
  return group;
}

export function createRocketScene(options) {
  const { canvas, getState, getRocket, normalizeParts, simSnapshot } = options;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor("#07111e", 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#07111e", 0.0045);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
  const target = new THREE.Vector3(0, 32, 0);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const ambient = new THREE.HemisphereLight("#cfe9ff", "#17120c", 1.5);
  const sun = new THREE.DirectionalLight("#fff1d4", 3.2);
  sun.position.set(-55, 82, 48);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -40;
  const rim = new THREE.PointLight("#74cfff", 2.8, 260);
  rim.position.set(42, 38, -48);
  scene.add(ambient, sun, rim);

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(190, 240, 5, 96),
    materialWithShader({
      color: "#121a20",
      map: atlasTexture("concrete"),
      bumpMap: proceduralMaps.concrete,
      bumpScale: 0.045,
      metalness: 0.12,
      roughness: 0.86,
    }, {
      tint: "#8fddff",
      panelStrength: 0.025,
    }),
  );
  ground.position.y = -4.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 22, 2.2, 64),
    materialWithShader({
      color: "#202a32",
      map: atlasTexture("concrete"),
      bumpMap: proceduralMaps.concrete,
      bumpScale: 0.06,
      metalness: 0.32,
      roughness: 0.62,
    }, {
      tint: "#f6b14a",
      panelStrength: 0.036,
    }),
  );
  pad.position.y = -1.7;
  pad.receiveShadow = true;
  scene.add(pad);

  const padRing = new THREE.Mesh(
    new THREE.TorusGeometry(21, 0.32, 8, 96),
    materialWithShader({
      color: "#556575",
      map: atlasTexture("gantry"),
      bumpMap: proceduralMaps.brushed,
      bumpScale: 0.045,
      metalness: 0.52,
      roughness: 0.36,
    }, {
      tint: "#8fddff",
      panelStrength: 0.045,
    }),
  );
  padRing.rotation.x = Math.PI / 2;
  padRing.position.y = -0.55;
  scene.add(padRing);

  const scorch = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 54, 1, 1),
    new THREE.MeshBasicMaterial({
      map: scorchTexture,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }),
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.y = -0.48;
  scene.add(scorch);

  const tower = createTower();
  const buildings = createBuildings();
  scene.add(tower, buildings);

  const stars = createStars();
  scene.add(stars);

  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: "#d9e8f2", transparent: true, opacity: 0.24, roughness: 1 });
  for (let i = 0; i < 16; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), cloudMat.clone());
    cloud.scale.set(16 + (i % 5) * 4, 1.8 + (i % 3), 5 + (i % 4));
    cloud.position.set((i % 4) * 55 - 82, 58 + (i % 5) * 18, Math.floor(i / 4) * 48 - 80);
    cloud.userData.base = cloud.position.clone();
    cloudGroup.add(cloud);
  }
  scene.add(cloudGroup);

  const weatherGroup = new THREE.Group();
  const rainMat = new THREE.LineBasicMaterial({
    color: "#9fc7e8",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  for (let i = 0; i < 90; i += 1) {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.55, -6.5, 0),
    ]);
    const streak = new THREE.Line(geom, rainMat.clone());
    streak.position.set((Math.random() - 0.5) * 190, Math.random() * 120 + 4, (Math.random() - 0.5) * 150);
    streak.userData.seed = Math.random() * 1000;
    weatherGroup.add(streak);
  }
  scene.add(weatherGroup);

  const smokeTexture = makeSmokeTexture();
  const flameTexture = makeFlameTexture();
  const smokePool = createSmokePool(smokeTexture);
  const flameGroup = createFlameStack(flameTexture);
  const shockDiamonds = createShockDiamonds();
  const aeroPressure = createAeroPressureGroup();
  const stageFlash = new THREE.Mesh(
    new THREE.TorusGeometry(10, 0.12, 8, 112),
    new THREE.MeshBasicMaterial({
      color: "#f6b14a",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(smokePool);

  const rocketRoot = new THREE.Group();
  const rocketGroup = new THREE.Group();
  rocketRoot.add(rocketGroup);
  scene.add(rocketRoot);
  scene.add(aeroPressure);
  rocketRoot.add(flameGroup, shockDiamonds, stageFlash);

  const debrisGroup = new THREE.Group();
  const debrisMats = [
    new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending }),
    new THREE.MeshBasicMaterial({ color: "#ff7847", transparent: true, opacity: 0, blending: THREE.AdditiveBlending }),
    new THREE.MeshBasicMaterial({ color: "#74808d", transparent: true, opacity: 0 }),
  ];
  for (let i = 0; i < 84; i += 1) {
    const fragment = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 5) * 0.045, 8, 6), debrisMats[i % debrisMats.length].clone());
    fragment.userData.seed = Math.random() * 1000;
    fragment.userData.speed = 0.45 + Math.random() * 1.9;
    fragment.userData.angle = Math.random() * Math.PI * 2;
    fragment.userData.lift = 0.35 + Math.random() * 1.45;
    fragment.visible = false;
    debrisGroup.add(fragment);
  }
  scene.add(debrisGroup);

  let activeRocketId = null;
  let partNodes = new Map();
  let pickables = [];
  let lastSize = { width: 0, height: 0 };
  let hoverId = null;

  function rebuildRocket() {
    const rocket = getRocket();
    activeRocketId = rocket.id;
    rocketGroup.clear();
    partNodes = new Map();
    pickables = [];
    const parts = normalizeParts(rocket);
    for (const part of parts) {
      const node = createPartMesh(part);
      rocketGroup.add(node);
      partNodes.set(part.id, node);
      node.traverse((child) => {
        if (child.isMesh) pickables.push(child);
      });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    if (width !== lastSize.width || height !== lastSize.height) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      lastSize = { width, height };
    }
  }

  function launchLift(sim, state) {
    if (state.launchStatus === "countdown") return 0;
    if (state.launchStatus === "idle") return 0;
    if (state.launchStatus === "failed") return Math.min(40, Math.pow(Math.max(0, state.failure?.t || 0), 0.72) * 1.25);
    return Math.min(520, Math.pow(Math.max(0, sim.altitude), 0.72) * 7.2);
  }

  function updatePartMaterials(state, sim) {
    const thermalIndex = typeof state.heatShieldPercent === "number"
      ? (sim.q / 92) * Math.min(1.55, sim.velocity / 3100) / Math.max(0.35, state.heatShieldPercent / 100)
      : 0;
    const heatStress = Math.max(0, Math.min(1, (sim.q - 34) / 58 + thermalIndex * 0.38));
    for (const [id, node] of partNodes.entries()) {
      const selected = id === state.selectedPartId;
      const hovered = id === hoverId;
      const heatExposed = /fairing|payload|bay|flap|grid|orbiter|command|crew|orion|boosters|nose/i.test(id);
      node.traverse((child) => {
        if (!child.isMesh || !child.material?.userData?.baseColor) return;
        child.material.color.copy(child.material.userData.baseColor);
        child.material.emissive = child.material.emissive || new THREE.Color("#000000");
        if (state.cameraMode === "ir") {
          const irHot = heatExposed ? Math.max(0.16, heatStress) : Math.max(0.03, heatStress * 0.25);
          child.material.color.set(new THREE.Color().lerpColors(new THREE.Color("#190047"), new THREE.Color("#fff2a8"), irHot));
          child.material.emissive.set(irHot > 0.62 ? "#ff7847" : "#5df2c1").multiplyScalar(irHot * 0.38);
        } else if (heatExposed && heatStress > 0.08) {
          child.material.emissive.set("#ff7847").multiplyScalar(heatStress * 0.22);
        } else if (selected) {
          child.material.emissive.copy(PART_SELECT_COLOR).multiplyScalar(0.12);
        } else if (hovered) {
          child.material.emissive.copy(PART_HOVER_COLOR).multiplyScalar(0.09);
        } else {
          child.material.emissive.set("#000000");
        }
        if (selected && heatExposed && heatStress > 0.08) {
          child.material.emissive.add(PART_SELECT_COLOR.clone().multiplyScalar(0.08));
        }
      });
    }
  }

  function updateRocketAssembly(sim, state) {
    const rocket = getRocket();
    const parts = normalizeParts(rocket);
    const lift = launchLift(sim, state);
    const ignitionShake = state.launchStatus === "countdown" && state.launchClock > 2.7 ? Math.sin(state.launchClock * 42) * 0.055 : 0;
    const inspection = !!state.cutaway || !!state.showLabels || state.controlPulse > 0;
    const focusPulse = state.controlPulse > 0 ? 0.5 + Math.sin(state.cuePulse * 0.22) * 0.5 : 0;
    rocketRoot.position.y = lift;
    rocketRoot.position.x = ignitionShake;
    rocketRoot.rotation.z = state.launchStatus === "running"
      ? Math.sin(sim.t * 0.08) * (state.windFactor + state.guidanceError) * 0.015 + Math.min(0.16, sim.t / 180 * 0.16)
      : 0;

    for (const part of parts) {
      const node = partNodes.get(part.id);
      if (!node) continue;
      const index = part.index || 0;
      const split = state.explode ? (index % 2 === 0 ? -1 : 1) * (1.4 + index * 0.22) : 0;
      const radial = state.explode ? (index % 3 - 1) * 0.7 : 0;
      const failure = state.failure ? Math.max(0, state.cuePulse - state.failure.pulse) * 0.018 : 0;
      node.position.set(split + failure * (index % 2 === 0 ? -1 : 1) * 12, part.mid + (state.explode ? index * 0.22 : 0) + failure * index, radial + failure * (index % 3 - 1) * 5);
      node.rotation.x = state.failure ? failure * (index % 2 ? 0.7 : -0.55) : 0;
      node.rotation.z = state.failure ? failure * (index % 2 ? -0.4 : 0.36) : 0;
      node.traverse((child) => {
        if (!child.isMesh) return;
        const tankLike = child.material?.transparent && child.material.opacity < 0.4;
        if (child.userData.fuelTank) {
          const level = Math.max(0.06, Math.min(1, state.fuelPercent / 100));
          const baseHeight = child.userData.baseHeight || 1;
          const baseY = child.userData.baseY || 0;
          const bottom = baseY - baseHeight / 2;
          child.scale.y = level;
          child.position.y = bottom + (baseHeight * level) / 2;
          child.visible = inspection;
          if (child.material) child.material.opacity = 0.34 + (state.controlFocus === "fuel" ? focusPulse * 0.32 : 0);
          return;
        }
        if (child.userData.payloadMass) {
          const payloadScale = Math.max(0.34, Math.min(1.18, state.payloadT / Math.max(1, rocket.maxPayloadT)));
          child.scale.setScalar(payloadScale);
          child.visible = inspection;
          if (child.material) child.material.opacity = 0.58 + (state.controlFocus === "payload" ? focusPulse * 0.28 : 0);
          return;
        }
        if (tankLike) child.visible = inspection;
        if (!tankLike && child.material?.userData?.baseColor) {
          const related = part.id === state.selectedPartId
            || (state.controlFocus === "fuel" && /tank|core|stage|booster|s-ic|s-ii|s-ivb|first-stage|second-stage|super-heavy|ship-tanks/i.test(`${part.id} ${part.name}`))
            || (state.controlFocus === "payload" && /payload|fairing|bay|spacecraft|orion|command|orbiter|crew/i.test(`${part.id} ${part.name} ${part.type}`));
          child.material.opacity = state.cutaway ? 0.58 : inspection && related ? 0.68 : 1;
        }
        if (!tankLike && child.material) child.material.transparent = inspection;
      });
    }
  }

  function updateFlames(sim, state, rocket) {
    const ignition = state.launchStatus === "countdown" ? Math.max(0, (state.launchClock - 2.65) / 1.15) : 1;
    const active = state.launchStatus === "running" || state.launchStatus === "countdown";
    const bottom = normalizeParts(rocket)[0]?.bottom || 0;
    flameGroup.position.set(0, bottom - 1.5, 0);
    flameGroup.visible = active;
    flameGroup.children.forEach((sprite, index) => {
      const pulse = 0.78 + Math.sin((state.cuePulse + index * 16) * 0.24) * 0.18;
      const scale = Math.max(0, ignition) * (state.launchStatus === "running" ? 1 + sim.thrustCurve * 0.48 : 0.78);
      sprite.material.opacity = Math.min(0.88, scale * (0.54 - index * 0.08));
      sprite.scale.set((5.6 + index * 1.3) * pulse * scale, (17 + index * 6) * pulse * scale, 1);
    });
  }

  function updateShockDiamonds(sim, state, rocket) {
    const ignition = state.launchStatus === "countdown" ? Math.max(0, (state.launchClock - 2.5) / 1.3) : 1;
    const active = state.launchStatus === "running" || state.launchStatus === "countdown";
    const bottom = normalizeParts(rocket)[0]?.bottom || 0;
    shockDiamonds.visible = active;
    shockDiamonds.position.set(0, bottom - 1.4, 0);
    shockDiamonds.children.forEach((diamond, index) => {
      const flicker = 0.78 + Math.sin((state.cuePulse + diamond.userData.seed) * 0.2) * 0.18;
      const stageBoost = state.launchStatus === "running" ? 0.7 + sim.thrustCurve * 0.58 : 0.62;
      const scale = Math.max(0, ignition) * flicker * stageBoost;
      diamond.scale.setScalar(scale * (1 + index * 0.08));
      diamond.material.opacity = active ? Math.min(0.34, scale * (0.3 - index * 0.028)) : 0;
    });
  }

  function updatePhysicsEffects(sim, state, rocket) {
    let qIntensity = Math.max(0, Math.min(1, (sim.q - 18) / 74));
    if (/drag|wind|guidance/.test(state.controlFocus || "")) qIntensity = Math.max(qIntensity, 0.52);
    const lift = launchLift(sim, state);
    aeroPressure.visible = qIntensity > 0.02 && launchLift(sim, state) < 210;
    aeroPressure.position.y = lift + rocket.heightM * 0.34;
    aeroPressure.rotation.y = state.angle * 0.35;
    aeroPressure.children.forEach((ring, index) => {
      const pulse = 1 + Math.sin(state.cuePulse * 0.055 + ring.userData.seed) * 0.08;
      ring.scale.setScalar((0.76 + index * 0.075 + qIntensity * 0.35) * pulse);
      ring.material.opacity = qIntensity * (0.22 - index * 0.024);
    });

    const stageTimes = [70, 118, 138];
    const nearest = stageTimes.reduce((best, value) => (Math.abs(sim.t - value) < Math.abs(sim.t - best) ? value : best), stageTimes[0]);
    const stagePulse = state.launchStatus === "running" ? Math.max(0, 1 - Math.abs(sim.t - nearest) / 7.5) : 0;
    const parts = normalizeParts(rocket);
    const stageIndex = nearest < 90 ? Math.max(1, Math.floor(parts.length * 0.36)) : Math.max(2, Math.floor(parts.length * 0.66));
    const boundary = parts[Math.min(parts.length - 1, stageIndex)]?.bottom || rocket.heightM * 0.35;
    stageFlash.visible = stagePulse > 0.01;
    stageFlash.position.y = boundary;
    stageFlash.scale.setScalar(0.82 + stagePulse * 1.55);
    stageFlash.material.opacity = stagePulse * 0.72;
  }

  function updateFailureDebris(sim, state, rocket) {
    if (!state.failure) {
      debrisGroup.visible = false;
      debrisGroup.children.forEach((fragment) => {
        fragment.visible = false;
        fragment.material.opacity = 0;
      });
      return;
    }
    const elapsed = Math.max(0, state.cuePulse - state.failure.pulse);
    const age = Math.min(1, elapsed / 105);
    const parts = normalizeParts(rocket);
    const reason = (state.failure.reason || "").toLowerCase();
    const baseY = reason.includes("stage")
      ? rocket.heightM * 0.48
      : reason.includes("max-q") || reason.includes("heat") || reason.includes("wind")
        ? rocket.heightM * 0.62
        : reason.includes("delta-v") || reason.includes("velocity")
          ? rocket.heightM * 0.78
          : parts[0]?.top || rocket.heightM * 0.18;
    const lift = launchLift(sim, state);
    debrisGroup.visible = true;
    debrisGroup.position.set(0, lift + baseY, 0);
    debrisGroup.children.forEach((fragment, index) => {
      const seed = fragment.userData.seed;
      const angle = fragment.userData.angle + Math.sin(seed) * 0.35;
      const radius = fragment.userData.speed * elapsed * 0.11;
      const vertical = fragment.userData.lift * elapsed * 0.075 - age * age * 26;
      fragment.visible = true;
      fragment.position.set(Math.cos(angle) * radius, vertical + Math.sin(index) * 1.6, Math.sin(angle) * radius);
      fragment.scale.setScalar(1 + age * (index % 4));
      fragment.material.opacity = Math.max(0, (1 - age) * (index % 3 === 2 ? 0.42 : 0.82));
    });
  }

  function updateSmoke(sim, state) {
    const lift = launchLift(sim, state);
    const active = state.launchStatus === "running" || (state.launchStatus === "countdown" && state.launchClock > 2.3);
    smokePool.children.forEach((sprite, index) => {
      if (!active) {
        sprite.visible = false;
        sprite.material.opacity = 0;
        return;
      }
      const seed = sprite.userData.seed;
      const t = (state.cuePulse * 0.018 + seed) % 10;
      const ring = index % 18;
      const a = (ring / 18) * Math.PI * 2 + seed;
      const drift = Math.min(42, t * 5.5);
      sprite.visible = true;
      sprite.position.set(Math.cos(a) * drift + Math.sin(seed) * 3, -2 + Math.min(lift, 16) - t * 1.2, Math.sin(a) * drift + Math.cos(seed) * 3);
      const size = 7 + t * 3.4 + (index % 5) * 1.2;
      sprite.scale.set(size, size, 1);
      sprite.material.opacity = Math.max(0, Math.min(0.36, (1 - t / 10) * (state.launchStatus === "countdown" ? 0.22 : 0.42)));
    });
  }

  function updateEnvironment(sim, state) {
    const rocket = getRocket();
    const parts = normalizeParts(rocket);
    const baseY = parts[0]?.bottom || 0;
    ground.position.y = baseY - 3.4;
    pad.position.y = baseY - 1.1;
    padRing.position.y = baseY + 0.06;
    scorch.position.y = baseY + 0.08;
    tower.position.y = baseY;
    buildings.position.y = baseY;
    const spaceMix = Math.min(1, sim.altitude / 120);
    const sky = new THREE.Color().lerpColors(new THREE.Color("#0b2033"), new THREE.Color("#01040b"), spaceMix);
    renderer.setClearColor(sky, 1);
    scene.fog.color.copy(sky);
    scene.fog.density = 0.0045 * Math.max(0.24, 1 - spaceMix * 0.75);
    stars.material.opacity = Math.max(0, (spaceMix - 0.18) / 0.82) * 0.88;
    cloudGroup.children.forEach((cloud, index) => {
      cloud.visible = spaceMix < 0.92;
      cloud.material.opacity = Math.max(0.04, 0.24 - spaceMix * 0.2 + state.windFactor * 0.08);
      cloud.position.x = cloud.userData.base.x + Math.sin(state.cuePulse * 0.006 + index) * 7 + state.windFactor * Math.sin(state.cuePulse * 0.014 + index) * 14;
      cloud.position.y = cloud.userData.base.y - Math.min(180, launchLift(sim, state) * 0.28);
    });
    weatherGroup.visible = spaceMix < 0.7 && (state.windFactor > 0.28 || state.cameraMode === "weather");
    weatherGroup.children.forEach((streak, index) => {
      const intensity = Math.max(0, Math.min(1, state.windFactor * 1.25 + (state.cameraMode === "weather" ? 0.32 : 0) - spaceMix * 0.4));
      streak.material.opacity = intensity * 0.32;
      streak.position.x += (0.08 + state.windFactor * 0.34) * (index % 2 ? 1 : -1);
      streak.position.y -= 0.72 + intensity * 1.7;
      streak.position.z += Math.sin(state.cuePulse * 0.01 + streak.userData.seed) * 0.04;
      if (streak.position.y < -8) {
        streak.position.y = 116 + Math.random() * 34;
        streak.position.x = (Math.random() - 0.5) * 190;
        streak.position.z = (Math.random() - 0.5) * 150;
      }
    });
    tower.visible = launchLift(sim, state) < 120;
    buildings.visible = launchLift(sim, state) < 140;
    ground.visible = launchLift(sim, state) < 160;
    pad.visible = launchLift(sim, state) < 120;
    padRing.visible = launchLift(sim, state) < 120;
    scorch.visible = launchLift(sim, state) < 120;
  }

  function updateCamera(sim, state) {
    const rocket = getRocket();
    const parts = normalizeParts(rocket);
    const totalHeight = Math.max(1, parts.at(-1).top - parts[0].bottom);
    const focusRatio = Math.max(0.06, Math.min(0.94, state.focusY ?? 0.5));
    const stackFocusY = parts[0].bottom + totalHeight * focusRatio;
    const lift = launchLift(sim, state);
    const rect = canvas.getBoundingClientRect();
    const mobile = rect.width < 720;
    const distance = (mobile ? 152 : 120) * Math.max(0.3, Math.min(1.9, 1 / state.zoom)) * Math.max(0.78, rocket.heightM / 100);
    const angle = state.angle;
    const pitch = state.pitch || 0;
    const followY = lift + stackFocusY;
    target.set(0, followY, 0);
    const horizontalDistance = distance * Math.cos(pitch);
    camera.position.set(
      Math.sin(angle) * horizontalDistance,
      followY + (mobile ? 22 : 18) + Math.sin(pitch) * distance,
      Math.cos(angle) * horizontalDistance,
    );
    camera.lookAt(target);
  }

  function render() {
    resize();
    const state = getState();
    const rocket = getRocket();
    if (rocket.id !== activeRocketId) rebuildRocket();
    const sim = simSnapshot();
    updatePartMaterials(state, sim);
    updateRocketAssembly(sim, state);
    updateFlames(sim, state, rocket);
    updateShockDiamonds(sim, state, rocket);
    updateSmoke(sim, state);
    updatePhysicsEffects(sim, state, rocket);
    updateFailureDebris(sim, state, rocket);
    updateEnvironment(sim, state);
    updateCamera(sim, state);
    if (state.cameraMode === "ir") {
      renderer.domElement.style.filter = "contrast(1.28) saturate(1.65) hue-rotate(168deg) brightness(1.05)";
    } else if (state.cameraMode === "weather") {
      renderer.domElement.style.filter = "contrast(0.92) saturate(0.82) brightness(0.82)";
    } else {
      renderer.domElement.style.filter = "";
    }
    renderer.render(scene, camera);
  }

  function pickPart(clientX, clientY) {
    render();
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, true);
    const partId = hits.find((hit) => hit.object.userData.partId)?.object.userData.partId || null;
    hoverId = partId;
    return partId;
  }

  function setHover(id) {
    hoverId = id;
  }

  function snapshotStats() {
    return renderer.info.render;
  }

  rebuildRocket();
  resize();
  return { resize, render, pickPart, setHover, snapshotStats };
}
