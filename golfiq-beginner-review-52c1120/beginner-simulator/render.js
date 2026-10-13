// Reuse the display fixture's camera/projection. Its painted relief and golfer sketches are not used as recommendations.
import { VIEW, projectPoint } from "../green-preview.js";
import { BALL, HOLE, AIM, onSurface, examplePath, slopeGrid } from "./scenario.js";

export const SCENE_LIFT = 0.018;
export const CUP_RX = 7;
export const CUP_RY = 3;
export const FLAG_POLE_HEIGHT = 52;
export const FLAG_WIDTH = 23;
export const FLAG_POLE_WIDTH = 2;
export const FLAG_TIP_DROP = 8;
export const FLAG_FLY_DROP = 17;

export function labelFontForWidth(visibleWidth) {
  const width = visibleWidth > 0 ? visibleWidth : VIEW.width;
  const canvasPx = Math.max(19, (12 * VIEW.width) / width);
  return { canvasPx, cssPx: canvasPx * (width / VIEW.width) };
}

export function projectScenePoint(point) {
  return projectPoint({ ...point, z: point.z + SCENE_LIFT });
}

export function cupEllipseBounds(hole) {
  return {
    x: hole.x - CUP_RX,
    y: hole.y - CUP_RY,
    w: CUP_RX * 2,
    h: CUP_RY * 2,
  };
}

export function flagDrawingBounds(hole) {
  const halfPole = FLAG_POLE_WIDTH / 2;
  return {
    x: hole.x - halfPole,
    y: hole.y - FLAG_POLE_HEIGHT,
    w: FLAG_WIDTH + halfPole,
    h: FLAG_POLE_HEIGHT,
  };
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
  const project = projectScenePoint;
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
  function freeOfPlaced(box) {
    return !placed.some((other) => hits(box, other));
  }
  function placeBox(box) {
    const preferredX = box.x,
      preferredY = box.y;
    function tryPos(x, y) {
      box.x = x;
      box.y = y;
      clampBox(box);
      return freeOfPlaced(box);
    }
    const stepY = Math.max(8, Math.round(box.h / 2));
    const stepX = Math.max(8, Math.round(Math.min(48, box.w / 2)));
    const shifts = [[0, 0]];
    for (let ring = 1; ring <= 18; ring++) {
      for (const sy of [ring, -ring, 0]) {
        for (const sx of [-ring, 0, ring]) {
          if (sx === 0 && sy === 0) continue;
          shifts.push([sx * stepX, sy * stepY]);
        }
      }
    }
    for (const [sx, sy] of shifts) {
      if (tryPos(preferredX + sx, preferredY + sy)) {
        placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
        return box;
      }
    }
    for (let y = labelMargin; y <= VIEW.height - box.h - labelMargin; y += 4) {
      for (let x = labelMargin; x <= VIEW.width - box.w - labelMargin; x += 4) {
        if (tryPos(x, y)) {
          placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
          return box;
        }
      }
    }
    box.x = preferredX;
    box.y = preferredY;
    clampBox(box);
    placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
    return box;
  }
  function paintLabel(text, box, color = "#fff") {
    c.fillStyle = "#102b22";
    c.fillRect(box.x, box.y, box.w, box.h);
    c.fillStyle = color;
    c.fillText(text, box.x + 7, box.y + labelSize + 3);
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
    paintLabel(text, box, color);
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
  }
  const hole = project(onSurface(HOLE.x, HOLE.y)),
    ball = project(onSurface(BALL.x, BALL.y));
  const cup = cupEllipseBounds(hole);
  const flag = flagDrawingBounds(hole);
  placed.push(cup, flag);
  c.fillStyle = "#081b14";
  c.beginPath();
  c.ellipse(hole.x, hole.y, CUP_RX, CUP_RY, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#fff";
  c.lineWidth = FLAG_POLE_WIDTH;
  c.beginPath();
  c.moveTo(hole.x, hole.y);
  c.lineTo(hole.x, hole.y - FLAG_POLE_HEIGHT);
  c.stroke();
  c.fillStyle = "#f7eac4";
  c.beginPath();
  c.moveTo(hole.x, hole.y - FLAG_POLE_HEIGHT);
  c.lineTo(hole.x + FLAG_WIDTH, hole.y - FLAG_POLE_HEIGHT + FLAG_TIP_DROP);
  c.lineTo(hole.x, hole.y - FLAG_POLE_HEIGHT + FLAG_FLY_DROP);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  c.fill();
  c.font = `600 ${labelSize}px system-ui`;
  const holeLabelW = c.measureText("Hole").width + 14;
  const holeLabelH = labelSize + 10;
  function placeHoleLabel() {
    const box = { x: 0, y: 0, w: holeLabelW, h: holeLabelH };
    const adjacent = [
      { x: cup.x - labelGap - holeLabelW, y: hole.y - holeLabelH / 2 },
      { x: cup.x - labelGap - holeLabelW, y: cup.y + cup.h + labelGap },
      { x: cup.x - labelGap - holeLabelW, y: cup.y - labelGap - holeLabelH },
      { x: cup.x - holeLabelW, y: cup.y + cup.h + labelGap },
      { x: flag.x + flag.w + labelGap, y: hole.y - holeLabelH / 2 },
      { x: cup.x - labelGap - holeLabelW, y: hole.y - holeLabelH / 2 + 10 },
      { x: cup.x - labelGap - holeLabelW, y: hole.y - holeLabelH / 2 - 10 },
    ];
    for (const pos of adjacent) {
      box.x = pos.x;
      box.y = pos.y;
      clampBox(box);
      if (freeOfPlaced(box)) {
        placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
        return box;
      }
    }
    box.x = cup.x - labelGap - holeLabelW;
    box.y = hole.y - holeLabelH / 2;
    clampBox(box);
    placed.push({ x: box.x, y: box.y, w: box.w, h: box.h });
    return box;
  }
  paintLabel("Hole", placeHoleLabel());
  if (cues.grid) {
    label("LOWER", onSurface(-2, 8), -90, -15, "#92eaf0");
    label("HIGHER", onSurface(2, 8), 15, -15);
  }
  if (cues.path) {
    label("Example aim", onSurface(AIM.x, AIM.y), 12, 52, "#ffd96a");
  }
  label("Ball", onSurface(BALL.x, BALL.y), 17, 6);
  // The authored-units disclaimer is an HTML caption below the drawing so it
  // remains readable and accessible at all screen widths and cue states.
}
