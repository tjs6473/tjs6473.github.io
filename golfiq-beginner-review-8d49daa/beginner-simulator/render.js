// Reuse the display fixture's camera/projection. Its painted relief and golfer sketches are not used as recommendations.
import { VIEW, projectPoint } from "../green-preview.js";
import { BALL, HOLE, AIM, onSurface, examplePath, slopeGrid } from "./scenario.js";
export function labelFontForWidth(visibleWidth) {
  const width = visibleWidth > 0 ? visibleWidth : VIEW.width;
  const canvasPx = Math.max(19, (12 * VIEW.width) / width);
  return { canvasPx, cssPx: canvasPx * (width / VIEW.width) };
}
export function drawBeginnerScene(canvas, cues) {
  canvas.width = VIEW.width * 2;
  canvas.height = VIEW.height * 2;
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  const sky = c.createLinearGradient(0, 0, 0, 560);
  sky.addColorStop(0, "#c6e3dc");
  sky.addColorStop(1, "#244c3c");
  c.fillStyle = sky;
  c.fillRect(0, 0, 900, 560);
  const project = (p) => projectPoint({ ...p, z: p.z + 0.018 });
  function stroke(points, color, width = 2, dash = []) {
    const screen = points.map(project);
    c.beginPath();
    c.setLineDash(dash);
    screen.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
    c.setLineDash([]);
  }
  const ground = [onSurface(-5, -0.4), onSurface(5, -0.4), onSurface(5, 15), onSurface(-5, 15)].map(
    project,
  );
  c.beginPath();
  ground.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
  c.fillStyle = "#2e7753";
  c.fill();
  const visibleWidth = canvas.getBoundingClientRect().width || canvas.clientWidth || VIEW.width;
  const { canvasPx: labelSize } = labelFontForWidth(visibleWidth);
  const placed = [];
  const labelGap = 6;
  const labelMargin = 6;
  function hits(a, b) {
    return (
      a.x < b.x + b.w + labelGap &&
      a.x + a.w + labelGap > b.x &&
      a.y < b.y + b.h + labelGap &&
      a.y + a.h + labelGap > b.y
    );
  }
  function clampBox(box) {
    box.x = Math.min(Math.max(box.x, labelMargin), VIEW.width - box.w - labelMargin);
    box.y = Math.min(Math.max(box.y, labelMargin), VIEW.height - box.h - labelMargin);
  }
  function placeBox(box) {
    const preferredX = box.x,
      preferredY = box.y;
    const stepY = box.h + labelGap;
    const stepX = Math.min(80, box.w) + labelGap;
    const shifts = [];
    for (const sy of [0, stepY, -stepY, 2 * stepY, -2 * stepY, 3 * stepY])
      for (const sx of [0, -stepX, stepX, -2 * stepX, 2 * stepX]) shifts.push([sx, sy]);
    for (const [sx, sy] of shifts) {
      box.x = preferredX + sx;
      box.y = preferredY + sy;
      clampBox(box);
      if (!placed.some((other) => hits(box, other))) {
        placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
        return box;
      }
    }
    box.x = preferredX;
    box.y = preferredY;
    clampBox(box);
    for (let n = 0; n < 80; n++) {
      if (!placed.some((other) => hits(box, other))) break;
      box.y += labelGap;
      if (box.y + box.h > VIEW.height - labelMargin) {
        box.y = labelMargin;
        box.x = Math.max(labelMargin, box.x - stepX);
      }
      clampBox(box);
    }
    placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
    return box;
  }
  function label(text, point, dx, dy, color = "#fff") {
    const p = project(point);
    // Canvas is 900 logical pixels wide, but CSS may render it at ~290px.
    // Compute glyph size from actual rendered width, including mobile page padding.
    c.font = `600 ${labelSize}px system-ui`;
    const w = c.measureText(text).width;
    const box = placeBox({
      x: p.x + dx - 7,
      y: p.y + dy - labelSize - 3,
      w: w + 14,
      h: labelSize + 10,
    });
    c.fillStyle = "#102b22";
    c.fillRect(box.x, box.y, box.w, box.h);
    c.fillStyle = color;
    c.fillText(text, box.x + 7, box.y + labelSize + 3);
  }
  if (cues.grid) {
    slopeGrid().forEach((row) => stroke(row, "#e8fff0", 1.7));
    for (const y of [4, 7, 10]) {
      const start = onSurface(1.3, y),
        end = onSurface(-1.3, y);
      stroke([start, end], "#92eaf0", 3);
      const tip = project(end),
        from = project(start),
        angle = Math.atan2(tip.y - from.y, tip.x - from.x);
      c.beginPath();
      c.moveTo(tip.x, tip.y);
      c.lineTo(tip.x - 12 * Math.cos(angle - 0.5), tip.y - 12 * Math.sin(angle - 0.5));
      c.moveTo(tip.x, tip.y);
      c.lineTo(tip.x - 12 * Math.cos(angle + 0.5), tip.y - 12 * Math.sin(angle + 0.5));
      c.strokeStyle = "#92eaf0";
      c.stroke();
    }
    label("LOWER", onSurface(-2, 8), -90, -15, "#92eaf0");
    label("HIGHER", onSurface(2, 8), 15, -15);
  }
  if (cues.path) {
    stroke([onSurface(BALL.x, BALL.y), onSurface(AIM.x, AIM.y)], "#f8e8a5", 2, [7, 7]);
    stroke(
      Array.from({ length: 61 }, (_, i) => examplePath(i / 60)),
      "#ffd96a",
      5,
    );
    const a = project(onSurface(AIM.x, AIM.y));
    c.strokeStyle = "#ffd96a";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(a.x, a.y, 9, 0, Math.PI * 2);
    c.stroke();
    label("Example aim", onSurface(AIM.x, AIM.y), 12, 52, "#ffd96a");
  }
  const hole = project(onSurface(HOLE.x, HOLE.y)),
    ball = project(onSurface(BALL.x, BALL.y));
  c.fillStyle = "#081b14";
  c.beginPath();
  c.ellipse(hole.x, hole.y, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#fff";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(hole.x, hole.y);
  c.lineTo(hole.x, hole.y - 52);
  c.stroke();
  c.fillStyle = "#f7eac4";
  c.beginPath();
  c.moveTo(hole.x, hole.y - 52);
  c.lineTo(hole.x + 23, hole.y - 44);
  c.lineTo(hole.x, hole.y - 35);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  c.fill();
  label(
    "Hole",
    onSurface(HOLE.x, HOLE.y),
    visibleWidth < 540 ? -72 : -53,
    visibleWidth < 540 ? 24 : -15,
  );
  label("Ball", onSurface(BALL.x, BALL.y), 17, 6);
  // The authored-units disclaimer is an HTML caption below the drawing so it
  // remains readable and accessible at all screen widths and cue states.
}
