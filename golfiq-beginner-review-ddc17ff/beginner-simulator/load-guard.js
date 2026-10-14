// "Still loading…" is due 4s after navigation start (waitMs - elapsed), so a
// late parse still matches wall-clock. The 10s load-error timer starts when
// this file runs, not from navigation: a slow-3G parse at ~6.3s must not
// collapse the remaining deadline to 3.7s or fire immediately after 10s elapsed.
(function (global) {
  var shown = false;
  var waitDue = false;
  var elapsed =
    global.performance && typeof global.performance.now === "function"
      ? Math.max(0, global.performance.now())
      : 0;
  global.__loadGuard = true;
  global.golfiqBeginnerNavElapsedMs = elapsed;
  function hideNode(id) {
    var node = document.getElementById(id);
    if (node) node.hidden = true;
  }
  function renderNotices() {
    // Timers can fire while the blocking head script's body is still absent.
    // Replay current state after parsing, not a stale request to show a notice.
    var wait = document.getElementById("load-wait");
    var error = document.getElementById("load-error");
    var ready = global.golfiqBeginnerIsReady;
    if (wait) wait.hidden = !!ready || shown || !waitDue;
    if (error) error.hidden = !!ready || !shown;
  }
  // interactive arrives before deferred modules finish; DOMContentLoaded may
  // otherwise wait for the very module download this notice is describing.
  document.addEventListener("readystatechange", renderNotices);
  document.addEventListener("DOMContentLoaded", renderNotices, { once: true });
  function golfiqBeginnerLoadError() {
    if (shown) return;
    shown = true;
    renderNotices();
  }
  function isCountedScriptError(node) {
    if (!node || node.nodeName !== "SCRIPT") return false;
    var type = ((node.getAttribute && node.getAttribute("type")) || "").toLowerCase();
    if (type === "module") return true;
    var src = (node.getAttribute && node.getAttribute("src")) || "";
    return !src;
  }
  global.golfiqBeginnerLoadError = golfiqBeginnerLoadError;
  global.golfiqBeginnerReady = function () {
    global.golfiqBeginnerIsReady = true;
    if (global.golfiqBeginnerWaitTimer) {
      clearTimeout(global.golfiqBeginnerWaitTimer);
      global.golfiqBeginnerWaitTimer = null;
    }
    if (global.golfiqBeginnerReadyTimer) {
      clearTimeout(global.golfiqBeginnerReadyTimer);
      global.golfiqBeginnerReadyTimer = null;
    }
    hideNode("load-wait");
    hideNode("load-error");
  };
  global.addEventListener(
    "error",
    function (event) {
      if (global.golfiqBeginnerIsReady) return;
      var t = event && event.target;
      if (t && t.nodeType === 1) {
        if (!isCountedScriptError(t)) return;
      }
      golfiqBeginnerLoadError();
    },
    true,
  );
  global.addEventListener("unhandledrejection", function () {
    if (!global.golfiqBeginnerIsReady) golfiqBeginnerLoadError();
  });
  var waitMs = Number(global.GOLFIQ_BEGINNER_WAIT_MS);
  if (!(waitMs > 0)) waitMs = 4000;
  var readyMs = Number(global.GOLFIQ_BEGINNER_READY_MS);
  if (!(readyMs > 0)) readyMs = 10000;
  var waitDelay = Math.max(0, waitMs - elapsed);
  var readyDelay = readyMs;
  global.golfiqBeginnerWaitDelayMs = waitDelay;
  global.golfiqBeginnerReadyDelayMs = readyDelay;
  global.golfiqBeginnerWaitTimer = setTimeout(function () {
    if (!global.golfiqBeginnerIsReady && !shown) {
      waitDue = true;
      renderNotices();
    }
  }, waitDelay);
  global.golfiqBeginnerReadyTimer = setTimeout(function () {
    if (!global.golfiqBeginnerIsReady) golfiqBeginnerLoadError();
  }, readyDelay);
})(window);
