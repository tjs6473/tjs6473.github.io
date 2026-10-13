/** Authored teaching geometry, in drawing units. No ball dynamics solver or measured inputs. */
export const SCENARIO = Object.freeze({
  id: "right-high-example-v1",
  title: "Start on the high side",
  disclosure: "Authored simulation · not a measured green or calculated recommendation",
  why: "In this example, the right side is higher. A rolling ball can bend toward the lower left side. The example starts right of the hole to leave room for that bend.",
  limit:
    "The yellow curve and aim marker were chosen by the lesson author. They illustrate an idea, not a solved putt. Pace, friction and exact break have not been calculated; the spacing is not an aim distance.",
  pace: "Pace matters too: a different pace can change the bend. This example does not calculate speed or compare pace outcomes.",
});
export const BALL = Object.freeze({ x: 0, y: 0.42 });
export const HOLE = Object.freeze({ x: 0, y: 11.3 });
export const AIM = Object.freeze({ x: 1.8, y: HOLE.y });
export function height(x) {
  return x * 0.08;
}
export function onSurface(x, y) {
  return { x, y, z: height(x) };
}
export function examplePath(t) {
  // Quadratic Bezier: starts toward AIM, then bends left to HOLE. Deliberately authored, not integrated physics.
  return onSurface((2 * (1 - t) * t * AIM.x) / 2, BALL.y + t * (HOLE.y - BALL.y));
}
export function slopeGrid() {
  const rows = [2, 4, 6, 8, 10].map((y) => [-2, -1, 0, 1, 2].map((x) => onSurface(x, y)));
  return [...rows, ...[-2, -1, 0, 1, 2].map((x) => [2, 4, 6, 8, 10].map((y) => onSurface(x, y)))];
}
export function initialState() {
  return { phase: "observe", observation: "", grid: false, path: false };
}
export function transition(state, action, observation = "") {
  if (action === "reset") return initialState();
  if (state.phase === "observe") {
    if (action === "observe" && observation.trim())
      return { ...state, phase: "explore", observation: observation.trim() };
    if (action === "unknown")
      return { ...state, phase: "explore", observation: "I'm not sure yet." };
    return state;
  }
  if (state.phase === "ready") return action === "review" ? { ...state, phase: "explore" } : state;
  if (action === "grid") return { ...state, grid: !state.grid };
  if (action === "path") return { ...state, path: !state.path };
  if (action === "ready") return { ...state, phase: "ready" };
  return state;
}
export function visibleCues(state) {
  const active = state.phase === "explore";
  return { grid: active && state.grid, path: active && state.path };
}
