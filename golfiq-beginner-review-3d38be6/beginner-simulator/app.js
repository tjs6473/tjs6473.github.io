import { SCENARIO, initialState, transition, visibleCues } from "./scenario.js";
import { drawBeginnerScene } from "./render.js";
function revealLoadError() {
  const wait = document.getElementById("load-wait");
  if (wait) wait.hidden = true;
  const node = document.getElementById("load-error");
  if (node) node.hidden = false;
}
function startBeginnerSimulator() {
  const el = (id) => document.getElementById(id);
  let state = initialState();
  el("why").textContent = SCENARIO.why;
  el("pace").textContent = SCENARIO.pace;
  el("limit").textContent = SCENARIO.limit;
  function render() {
    const cues = visibleCues(state);
    drawBeginnerScene(el("scene"), cues);
    el("observe").hidden = state.phase !== "observe";
    el("explore").hidden = state.phase !== "explore";
    el("finish").hidden = state.phase !== "ready";
    el("your-words").textContent = state.observation;
    el("grid").setAttribute("aria-pressed", String(cues.grid));
    el("path").setAttribute("aria-pressed", String(cues.path));
    el("grid").textContent = cues.grid ? "Hide slope" : "Show slope";
    el("path").textContent = cues.path ? "Hide example aim & path" : "Show example aim & path";
    el("slope-note").hidden = !cues.grid;
    el("rationale").hidden = !cues.path;
    const description = [
      "Authored scene: ball and hole.",
      cues.grid ? "White grid, right side higher; blue arrows point downhill left." : "",
      cues.path
        ? "Dashed initial direction to an example aim marker right of the hole; yellow authored path bends left to the hole. Not a calculated prediction."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    el("scene").setAttribute("aria-label", description);
    el("legend").textContent = cues.path
      ? "Dashed line: example starting direction · Yellow: authored path · Ring: example aim"
      : cues.grid
        ? "White: simulated surface grid · Blue: downhill direction"
        : state.phase === "ready"
          ? "All teaching cues are cleared."
          : "Look at the ground between the ball and the hole.";
  }
  function act(action) {
    const previous = state.phase;
    state = transition(state, action, el("notice").value);
    el("error").hidden = !(action === "observe" && state.phase === "observe");
    if (action === "reset") el("notice").value = "";
    render();
    if (previous !== state.phase || action === "reset") {
      el(
        state.phase === "observe" ? "notice" : state.phase === "ready" ? "review" : "grid",
      ).focus();
    }
  }
  const controls = {
    save: "observe",
    unknown: "unknown",
    grid: "grid",
    path: "path",
    ready: "ready",
    review: "review",
    reset: "reset",
  };
  for (const [id, action] of Object.entries(controls)) {
    el(id).addEventListener("click", () => act(action));
  }
  window.addEventListener("resize", render);
  render();
  if (!window.__loadGuard) {
    revealLoadError();
    return;
  }
  for (const id of Object.keys(controls)) {
    const node = el(id);
    node.disabled = false;
    node.removeAttribute("aria-disabled");
  }
  if (typeof window.golfiqBeginnerReady === "function") window.golfiqBeginnerReady();
}
try {
  startBeginnerSimulator();
} catch (err) {
  if (typeof window.golfiqBeginnerLoadError === "function") window.golfiqBeginnerLoadError();
  else revealLoadError();
  throw err;
}
