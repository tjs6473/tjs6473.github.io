// "Still loading…" is due 4s after navigation start (waitMs - elapsed), so a
// late parse still matches wall-clock. The 10s load-error timer starts when
// this file runs, not from navigation: a slow-3G parse at ~6.3s must not
// collapse the remaining deadline to 3.7s or fire immediately after 10s elapsed.
(function (global) {
  var shown = false;
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
  function golfiqBeginnerLoadError() {
    if (shown) return;
    shown = true;
    hideNode("load-wait");
    var node = document.getElementById("load-error");
    if (node) node.hidden = false;
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
      var wait = document.getElementById("load-wait");
      if (wait) wait.hidden = false;
    }
  }, waitDelay);
  global.golfiqBeginnerReadyTimer = setTimeout(function () {
    if (!global.golfiqBeginnerIsReady) golfiqBeginnerLoadError();
  }, readyDelay);
})(window);
