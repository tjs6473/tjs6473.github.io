// Reuse the display fixture's camera/projection. Its painted relief and golfer sketches are not used as recommendations.
import { VIEW, projectPoint } from "../green-preview.js";
import { BALL, HOLE, AIM, onSurface, examplePath, slopeGrid } from "./scenario.js";
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
  function label(text, point, dx, dy, color = "#fff") {
    const p = project(point);
    const labelSize = Math.max(19, (11.5 * VIEW.width) / Math.max(320, canvas.clientWidth));
    c.font = `600 ${labelSize}px system-ui`;
    c.fillStyle = "#102b22";
    const w = c.measureText(text).width;
    c.fillRect(p.x + dx - 7, p.y + dy - labelSize - 3, w + 14, labelSize + 10);
    c.fillStyle = color;
    c.fillText(text, p.x + dx, p.y + dy);
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
    label("Example aim", onSurface(AIM.x, AIM.y), 12, 35, "#ffd96a");
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
  label("Hole", onSurface(HOLE.x, HOLE.y), -53, -15);
  label("Ball", onSurface(BALL.x, BALL.y), 17, 6);
  c.font = "15px system-ui";
  c.fillStyle = "#fff";
  if (canvas.clientWidth > 600)
    c.fillText("AUTHORED SCENE · DRAWING UNITS, NOT MEASUREMENTS", 22, 552);
}
