/**
 * Prepared putting picture for the computer demo.
 * Low camera, grass, cup, and flag are a fixture — not a surveyed green.
 * The surface shape is painted, not measured. The golfer's line is a sketch, not a roll prediction.
 * Flat SVG scenes stay available with ?art=wireframe.
 */

export const PREVIEW_LABEL = "Prepared fixture · shape is not measured";

export const VIEW = { width: 900, height: 560 };
const CAMERA = { x: 0, y: -2, z: 1.15 };
const LOOK = { x: 0, y: 5, z: 0 };
const FOCAL = 820;
const VIEW_CENTER_Y = 290;
const LIGHT = norm({ x: -0.62, y: 0.22, z: 0.75 });

const HOLE = { x: 0, y: 11.3 };
const BALL_Y = 0.42;

const basis = cameraBasis(CAMERA, LOOK);

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function norm(v) {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function cameraBasis(camera, look) {
  const forward = norm(sub(look, camera));
  const right = norm(cross(forward, { x: 0, y: 0, z: 1 }));
  const up = cross(right, forward);
  return { forward, right, up };
}

/** Painted relief for the picture. Kept small so it reads as grass, not a contour map. */
export function surfaceHeight(x, y) {
  const along = y / 12;
  const shoulder = Math.sin(along * Math.PI) * 0.1 * Math.exp(-((x - 0.55) ** 2) / 10);
  const tilt = x * 0.01 * along;
  return shoulder + tilt;
}

export function projectPoint(point) {
  const relative = sub(point, CAMERA);
  const depth = dot(relative, basis.forward);
  if (depth < 0.18) return null;
  const right = dot(relative, basis.right);
  const up = dot(relative, basis.up);
  return {
    x: VIEW.width / 2 + (right / depth) * FOCAL,
    y: VIEW_CENTER_Y - (up / depth) * FOCAL,
    depth,
    scale: FOCAL / depth,
  };
}

export function ballPosition() {
  return { x: 0, y: BALL_Y, z: surfaceHeight(0, BALL_Y) };
}

export function holePosition() {
  return { x: HOLE.x, y: HOLE.y, z: surfaceHeight(HOLE.x, HOLE.y) };
}

export function sliderToFeet(slider) {
  return ((Number(slider) || 0) / 80) * 1.25;
}

export function practicePinPosition(slider) {
  const x = HOLE.x + sliderToFeet(slider);
  return { x, y: HOLE.y, z: surfaceHeight(x, HOLE.y) };
}

/** Movable target marker. It is not a second hole flag. */
export function practiceMarker(slider) {
  const pin = practicePinPosition(slider);
  const hole = holePosition();
  return {
    kind: "target",
    x: pin.x,
    y: pin.y,
    hasFlag: false,
    holeX: hole.x,
    holeY: hole.y,
  };
}

export function gridPolylines() {
  const lines = [];
  const along = (x) => {
    const points = [];
    for (let y = 2.1; y <= 10.8; y += 0.45) points.push(pointOnGrass(x, y));
    lines.push(points);
  };
  const across = (y) => {
    const points = [];
    for (let x = -1.55; x <= 1.55; x += 0.4) points.push(pointOnGrass(x, y));
    lines.push(points);
  };
  for (const x of [-1.05, 0, 1.05]) along(x);
  for (const y of [3.5, 6.2, 8.9]) across(y);
  return lines;
}

/** A curve the golfer placed toward the practice marker. It does not simulate roll. */
export function sketchPoints(slider) {
  const pin = practicePinPosition(slider);
  const start = { x: 0, y: 0.95 };
  const end = { x: pin.x, y: pin.y - 0.2 };
  const bend = { x: (start.x + end.x) / 2 + end.x * 0.22, y: (start.y + end.y) / 2 };
  const points = [];
  const steps = 26;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * start.x + 2 * u * t * bend.x + t * t * end.x;
    const y = u * u * start.y + 2 * u * t * bend.y + t * t * end.y;
    points.push(pointOnGrass(x, y));
  }
  return points;
}

/** A firmer-pace sketch drawn nearer the hole than the marker. It does not simulate roll. */
export function paceSketchPoints(slider) {
  const pin = practicePinPosition(slider);
  const start = { x: 0, y: 0.95 };
  const end = { x: pin.x * 0.42, y: pin.y - 0.12 };
  const bend = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 + 0.2 };
  const points = [];
  const steps = 26;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * start.x + 2 * u * t * bend.x + t * t * end.x;
    const y = u * u * start.y + 2 * u * t * bend.y + t * t * end.y;
    points.push(pointOnGrass(x, y));
  }
  return points;
}

function pointOnGrass(x, y) {
  return { x, y, z: surfaceHeight(x, y) + 0.028 };
}

function normalAt(x, y) {
  const e = 0.2;
  return norm({
    x: surfaceHeight(x - e, y) - surfaceHeight(x + e, y),
    y: surfaceHeight(x, y - e) - surfaceHeight(x, y + e),
    z: e * 2,
  });
}

function hash(n) {
  const value = Math.sin(n * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

function fbm(x, y) {
  const broad = valueNoise(x, y);
  const mid = valueNoise(x * 2.15 + 8.2, y * 2.15 + 3.4);
  const fine = valueNoise(x * 4.4 + 1.7, y * 4.4 + 9.1);
  return broad * 0.55 + mid * 0.3 + fine * 0.15;
}

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const n = (px, py) => hash(px * 19.13 + py * 7.31);
  return mix(mix(n(ix, iy), n(ix + 1, iy), ux), mix(n(ix, iy + 1), n(ix + 1, iy + 1), ux), uy);
}

function ellipseMask(x, y, cx, cy, rx, ry) {
  const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
  return 1 - smoothstep(0.9, 1.06, d);
}

function grassRgb(x, y, scene) {
  const bunker = scene === "bunker" ? ellipseMask(x, y, 3.55, 10.4, 2.35, 2.15) : 0;
  let green = 0;
  if (y < 2) green = 1 - smoothstep(14.6, 16.2, Math.abs(x));
  else if (y < 9) green = 1 - smoothstep(7.6, 8.8, Math.abs(x));
  else green = ellipseMask(x, y, 0, 9, 5.6, 3.5);
  green *= 1 - bunker;

  let collar = 0;
  if (y < 13.2) {
    collar =
      y < 9.2 ? 1 - smoothstep(10.6, 12.4, Math.abs(x)) : ellipseMask(x, y, 0, 9.2, 6.8, 4.1);
  }
  collar *= 1 - Math.max(green, bunker);

  const shore = 12.08 + Math.sin(x * 0.37) * 0.05 + (valueNoise(x * 0.55, 1.2) - 0.5) * 0.1;
  const fringe =
    (1 - smoothstep(shore - 0.05, shore + 0.32, y)) * (1 - smoothstep(9.5, 20, Math.abs(x)));
  const apron = fringe * (1 - Math.max(green, collar, bunker));
  const water =
    scene === "bunker" ? 0 : smoothstep(shore - 0.28, shore + 0.22, y) * (1 - green * 0.9);
  const cover = Math.max(green, collar, bunker, apron, water);
  if (cover < 0.04) return null;

  const sun = dot(normalAt(x, y), LIGHT);
  const key = Math.max(0, Math.min(1, 0.38 + -x * 0.05 + (7 - y) * 0.025));
  const light = Math.max(
    0.42,
    Math.min(1.32, (0.48 + Math.max(0, sun) * 0.9) * (0.74 + key * 0.55)),
  );
  const near = Math.max(0, Math.min(1, 1 - (y - 0.4) / 11));
  const brokenStripe = Math.sin(y * 1.65 + x * 0.11) * (0.35 + fbm(x * 0.45, y * 0.2));
  const mow = brokenStripe * 3.4;
  const patch = (fbm(x * 0.32 + 2.2, y * 0.24) - 0.5) * 18;
  const clump = (fbm(x * 1.2, y * 1.15) - 0.5) * 36 * (0.45 + near * 0.55);
  const fine = (fbm(x * 6.8 + 4, y * 7.6) - 0.5) * 16 * (0.4 + near);
  const shape = surfaceHeight(x, y) * 90;
  const haze = Math.max(0, Math.min(1, (y - 7.2) / 12)) * 0.2;
  const grain = mow + patch + clump + fine + shape;

  let r;
  let g;
  let b;
  if (bunker > 0.5) {
    const lip = Math.exp(-((Math.hypot(x - 2.3, y - 9.7) - 1.5) ** 2) / 1.4);
    r = 176 + lip * 28 + fine;
    g = 148 + lip * 16;
    b = 96 + fine * 0.15;
  } else {
    const putting = 46 + grain * 0.55;
    const puttingG = 108 + grain * 1.45;
    const puttingB = 50 + grain * 0.14;
    const rough = 24 + clump * 0.28 + fine * 0.12;
    const roughG = 52 + clump * 0.42 + fine * 0.16;
    const roughB = 28 + fine * 0.08;
    r = mix(rough, putting, green);
    g = mix(roughG, puttingG, green);
    b = mix(roughB, puttingB, green);
  }

  r *= light;
  g *= light;
  b *= light;
  const tint = green > collar ? [214, 206, 176] : [168, 176, 160];
  r = mix(r, tint[0], haze * 0.28);
  g = mix(g, tint[1], haze * 0.22);
  b = mix(b, tint[2], haze * 0.34);

  if (water > 0.02) {
    const depth = Math.max(0, Math.min(1, (y - shore) / 14));
    const shimmer = Math.sin(y * 2.4 + x * 0.28) * (1 - depth) * 5;
    const wr = mix(78, 26, depth) + shimmer;
    const wg = mix(124, 58, depth) + shimmer * 0.4;
    const wb = mix(138, 72, depth);
    const wet = Math.min(1, water);
    r = mix(r, wr, wet);
    g = mix(g, wg, wet);
    b = mix(b, wb, wet);
  }

  return [r, g, b];
}

const sceneCache = new Map();

function sceneLayer(scene) {
  const cached = sceneCache.get(scene);
  if (cached) return cached;
  const layer = document.createElement("canvas");
  layer.width = VIEW.width * 2;
  layer.height = VIEW.height * 2;
  const ctx = layer.getContext("2d");
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  drawBackdrop(ctx, scene);
  paintGround(ctx, scene);
  drawFarShore(ctx, scene);
  drawCup(ctx);
  drawBall(ctx);
  drawFlagShadow(ctx);
  drawFlag(ctx, holePosition(), 2.55, "#f4f0e6", "#f7f5f1");
  drawLabel(ctx);
  sceneCache.set(scene, layer);
  return layer;
}

export function drawGreenPreview(canvas, options) {
  const scene = options.scene === "bunker" ? "bunker" : "lake";
  const dpr = 2;
  if (canvas.width !== VIEW.width * dpr || canvas.height !== VIEW.height * dpr) {
    canvas.width = VIEW.width * dpr;
    canvas.height = VIEW.height * dpr;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.drawImage(sceneLayer(scene), 0, 0, VIEW.width, VIEW.height);
  if (options.grid) drawPolylines(ctx, gridPolylines(), "rgba(255,252,244,0.84)", 1.5);
  if (options.pace)
    drawPolylines(ctx, [paceSketchPoints(options.pinOffset)], "rgba(157,229,237,0.96)", 2.2);
  if (options.line)
    drawPolylines(ctx, [sketchPoints(options.pinOffset)], "rgba(243,208,96,0.96)", 2.6);
  if (options.pin) drawPracticePin(ctx, options.pinOffset);
}

function drawBackdrop(ctx, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, scene === "bunker" ? "#6f7c68" : "#4e86b0");
  sky.addColorStop(0.42, scene === "bunker" ? "#c9b89a" : "#b7d0df");
  sky.addColorStop(0.78, scene === "bunker" ? "#e4d3b4" : "#e7f0ea");
  sky.addColorStop(1, "#f4efe4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawCanopy(ctx, x, y, radius, seed, color) {
  const steps = 8;
  const lobes = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2 - 0.5;
    const wobble = 0.48 + hash(seed + i * 2.7) * 0.7;
    lobes.push({
      x: x + Math.cos(angle) * radius * wobble,
      y: y + Math.sin(angle) * radius * 0.78 * (0.62 + hash(seed + i * 4.1) * 0.55),
    });
  }
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  ctx.beginPath();
  const start = mid(lobes[lobes.length - 1], lobes[0]);
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < lobes.length; i += 1) {
    const next = lobes[(i + 1) % lobes.length];
    const end = mid(lobes[i], next);
    ctx.quadraticCurveTo(lobes[i].x, lobes[i].y, end.x, end.y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPine(ctx, x, base, scale, seed, dry) {
  const height = (38 + hash(seed) * 22) * scale;
  const lean = (hash(seed + 2) - 0.5) * 6 * scale;
  ctx.strokeStyle = dry ? "#3a3428" : "#2a2118";
  ctx.lineWidth = Math.max(1, 1.6 * scale);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + lean * 0.2, base - height * 0.2);
  ctx.stroke();
  const tiers = [
    [0.42, 0.55, dry ? "#3a4630" : "#163828"],
    [0.68, 0.4, dry ? "#4d5a38" : "#1f4d34"],
    [0.92, 0.22, dry ? "#66724a" : "#2d6846"],
  ];
  for (const [rise, width, color] of tiers) {
    const tip = base - height * rise;
    const span = height * width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + lean * rise, tip - height * 0.16);
    ctx.quadraticCurveTo(x + lean - span * 0.15, tip + 2, x - span, tip + span * 0.42);
    ctx.quadraticCurveTo(x + lean, tip + span * 0.2, x + span, tip + span * 0.42);
    ctx.quadraticCurveTo(x + lean + span * 0.15, tip + 2, x + lean * rise, tip - height * 0.16);
    ctx.fill();
  }
}

function drawTree(ctx, x, base, scale, seed, dry) {
  if (hash(seed + 5) > 0.62) {
    drawPine(ctx, x, base, scale, seed, dry);
    return;
  }
  const trunk = (18 + hash(seed) * 16) * scale;
  const lean = (hash(seed + 2) - 0.5) * 10 * scale;
  ctx.strokeStyle = dry ? "#3a3428" : "#241c16";
  ctx.lineWidth = Math.max(1.2, 2.6 * scale);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, base + 1);
  ctx.quadraticCurveTo(x + lean * 0.35, base - trunk * 0.5, x + lean, base - trunk);
  ctx.stroke();
  const crown = base - trunk * 0.72;
  const spread = (16 + hash(seed + 4) * 18) * scale;
  const sun = dry ? "#6a7648" : "#3d7a52";
  const leaf = dry ? "#455338" : "#1c4a34";
  const shade = dry ? "#2c3426" : "#0e241a";
  drawCanopy(ctx, x + lean, crown + 6 * scale, spread * 1.08, seed + 1, shade);
  drawCanopy(ctx, x + lean - spread * 0.42, crown + scale, spread * 0.62, seed + 6, leaf);
  drawCanopy(ctx, x + lean + spread * 0.38, crown - scale, spread * 0.58, seed + 9, leaf);
  drawCanopy(ctx, x + lean + spread * 0.05, crown - 8 * scale, spread * 0.48, seed + 14, sun);
  if (hash(seed + 8) > 0.4) {
    ctx.strokeStyle = dry ? "#4a4336" : "#1a1612";
    ctx.lineWidth = Math.max(0.7, 1.05 * scale);
    ctx.beginPath();
    ctx.moveTo(x + lean * 0.7, crown + 4 * scale);
    ctx.quadraticCurveTo(
      x + lean - spread * 0.2,
      crown,
      x + lean - spread * 0.55,
      crown + spread * 0.08,
    );
    ctx.moveTo(x + lean * 0.8, crown);
    ctx.quadraticCurveTo(
      x + lean + spread * 0.2,
      crown - spread * 0.15,
      x + lean + spread * 0.48,
      crown - spread * 0.02,
    );
    ctx.stroke();
  }
}

function drawFarShore(ctx, scene) {
  const horizon = projectPoint({ x: 0, y: 34, z: 0.04 });
  const base = horizon ? horizon.y : 168;
  const dry = scene === "bunker";
  const trees = [];
  let cursor = -24;
  let index = 0;
  while (cursor < VIEW.width + 36) {
    const scale = 0.72 + hash(index + 4) * 0.85;
    const gap = 28 + hash(index * 1.7) * 34;
    trees.push({ x: cursor, scale, seed: index * 13.1, depth: hash(index + 9) });
    cursor += gap * (0.62 + scale * 0.25);
    index += 1;
  }
  trees.sort((a, b) => a.depth - b.depth);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, base - 2, VIEW.width, 42);
  ctx.clip();
  ctx.translate(0, base);
  ctx.scale(1, -0.42);
  ctx.translate(0, -base);
  ctx.globalAlpha = 0.2;
  for (const tree of trees) drawTree(ctx, tree.x, base + 2, tree.scale, tree.seed, dry);
  ctx.restore();
  for (const tree of trees) drawTree(ctx, tree.x, base + 2, tree.scale, tree.seed, dry);
}

function flatGround(sx, sy) {
  const ndcX = (sx - VIEW.width / 2) / FOCAL;
  const ndcY = (VIEW_CENTER_Y - sy) / FOCAL;
  const dir = norm({
    x: basis.forward.x + ndcX * basis.right.x + ndcY * basis.up.x,
    y: basis.forward.y + ndcX * basis.right.y + ndcY * basis.up.y,
    z: basis.forward.z + ndcX * basis.right.z + ndcY * basis.up.z,
  });
  if (dir.z >= -0.0001) return null;
  const t = -CAMERA.z / dir.z;
  if (t < 0.2) return null;
  return { x: CAMERA.x + dir.x * t, y: CAMERA.y + dir.y * t };
}

function paintGround(ctx, scene) {
  const width = VIEW.width;
  const height = VIEW.height;
  const ground = document.createElement("canvas");
  ground.width = width;
  ground.height = height;
  const groundCtx = ground.getContext("2d");
  const image = groundCtx.createImageData(width, height);
  const data = image.data;
  for (let sy = 0; sy < height; sy += 1) {
    const left = flatGround(0, sy);
    const right = flatGround(width - 1, sy);
    if (!left || !right) continue;
    for (let sx = 0; sx < width; sx += 1) {
      const t = sx / (width - 1);
      const x = left.x + (right.x - left.x) * t;
      const y = left.y + (right.y - left.y) * t;
      const rgb = grassRgb(x, y, scene);
      if (!rgb) continue;
      const index = (sy * width + sx) * 4;
      data[index] = Math.max(0, Math.min(255, rgb[0]));
      data[index + 1] = Math.max(0, Math.min(255, rgb[1]));
      data[index + 2] = Math.max(0, Math.min(255, rgb[2]));
      data[index + 3] = 255;
    }
  }
  groundCtx.putImageData(image, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(ground, 0, 0, VIEW.width, VIEW.height);
  ctx.restore();
}

function drawCup(ctx) {
  const hole = holePosition();
  const ring = [];
  for (let i = 0; i <= 20; i += 1) {
    const angle = (i / 20) * Math.PI * 2;
    ring.push(
      projectPoint({
        x: hole.x + Math.cos(angle) * 0.24,
        y: hole.y + Math.sin(angle) * 0.24,
        z: surfaceHeight(hole.x, hole.y) + 0.01,
      }),
    );
  }
  if (ring.some((point) => !point)) return;
  ctx.fillStyle = "#141816";
  ctx.beginPath();
  ring.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawPolylines(ctx, lines, color, width) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([12, 11]);
  for (const points of lines) {
    const projected = points.map((point) => projectPoint(point)).filter(Boolean);
    if (projected.length < 2) continue;
    ctx.beginPath();
    projected.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "rgba(12, 24, 16, 0.35)";
    ctx.lineWidth = width + 1.6;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall(ctx) {
  const ball = ballPosition();
  const center = projectPoint({ ...ball, z: ball.z + 0.07 });
  const shadow = projectPoint(ball);
  if (!center || !shadow) return;
  const radius = Math.max(7, center.scale * 0.07);
  ctx.fillStyle = "rgba(16, 28, 18, 0.35)";
  ctx.beginPath();
  ctx.ellipse(shadow.x, shadow.y, radius * 0.95, radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  const gloss = ctx.createRadialGradient(
    center.x - radius * 0.35,
    center.y - radius * 0.4,
    radius * 0.1,
    center.x,
    center.y,
    radius,
  );
  gloss.addColorStop(0, "#ffffff");
  gloss.addColorStop(0.45, "#f4f1ea");
  gloss.addColorStop(1, "#c9c3b6");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlagShadow(ctx) {
  const foot = projectPoint(holePosition());
  if (!foot) return;
  ctx.fillStyle = "rgba(16, 28, 18, 0.32)";
  ctx.beginPath();
  ctx.ellipse(foot.x + 14, foot.y + 1, 18, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag(ctx, base, height, cloth, pole) {
  const foot = projectPoint(base);
  const top = projectPoint({ x: base.x, y: base.y, z: base.z + height });
  const fly = projectPoint({ x: base.x + 0.72, y: base.y + 0.05, z: base.z + height - 0.15 });
  const tail = projectPoint({ x: base.x + 0.58, y: base.y + 0.08, z: base.z + height - 0.72 });
  if (!foot || !top || !fly || !tail) return;
  ctx.strokeStyle = pole;
  ctx.lineWidth = Math.max(1.5, foot.scale * 0.025);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(fly.x, fly.y);
  ctx.lineTo(tail.x, tail.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 32, 18, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPracticePin(ctx, slider) {
  const pin = practicePinPosition(slider);
  const ring = [];
  for (let i = 0; i <= 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    ring.push(
      projectPoint({
        x: pin.x + Math.cos(angle) * 0.28,
        y: pin.y + Math.sin(angle) * 0.28,
        z: surfaceHeight(pin.x, pin.y) + 0.02,
      }),
    );
  }
  if (!ring.some((point) => !point)) {
    ctx.strokeStyle = "#e7c15a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ring.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }
  const foot = projectPoint({ x: pin.x, y: pin.y, z: pin.z + 0.03 });
  const top = projectPoint({ x: pin.x, y: pin.y, z: pin.z + 0.55 });
  if (!foot || !top) return;
  ctx.strokeStyle = "#f7f4ee";
  ctx.lineWidth = Math.max(2, foot.scale * 0.028);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  const head = Math.max(5, top.scale * 0.05);
  ctx.fillStyle = "#e7c15a";
  ctx.beginPath();
  ctx.arc(top.x, top.y, head, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6a4e16";
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawLabel(ctx) {
  ctx.save();
  ctx.font = "600 13px Avenir Next, Segoe UI, sans-serif";
  const text = PREVIEW_LABEL;
  const padX = 10;
  const width = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = "rgba(12, 22, 16, 0.62)";
  roundRect(ctx, 16, 16, width, 28, 8);
  ctx.fill();
  ctx.fillStyle = "#f6f1e6";
  ctx.fillText(text, 16 + padX, 35);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
