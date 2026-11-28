(function () {
  var script = document.currentScript;
  if (!script || window.CareDesk) return;

  var origin = new URL(script.src).origin;
  var locale = script.getAttribute("data-locale") || "en";
  var side = script.getAttribute("data-position") === "left" ? "left" : "right";
  var open = false;

  var frame = document.createElement("iframe");
  frame.src = origin + "/" + encodeURIComponent(locale) + "/embed";
  frame.title = "Help";
  frame.setAttribute("allowtransparency", "true");
  var s = frame.style;
  s.position = "fixed";
  s.border = "0";
  s.zIndex = "2147483000";
  s.background = "transparent";
  s.overflow = "hidden";
  s.colorScheme = "light";

  function layout() {
    var phone = window.innerWidth < 480;
    if (!open) {
      s.width = "64px";
      s.height = "64px";
      s.bottom = "20px";
      s[side] = "20px";
      s.borderRadius = "9999px";
      s.boxShadow = "0 10px 25px -5px rgba(0,0,0,.25)";
    } else if (phone) {
      s.width = "100vw";
      s.height = "100dvh";
      s.bottom = "0";
      s[side] = "0";
      s.borderRadius = "0";
      s.boxShadow = "none";
    } else {
      s.width = "420px";
      s.height = "min(700px, calc(100dvh - 40px))";
      s.bottom = "20px";
      s[side] = "20px";
      s.borderRadius = "16px";
      s.boxShadow = "0 1px 3px rgba(0,0,0,.06), 0 24px 48px -16px rgba(0,0,0,.28)";
    }
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    var data = event.data;
    if (!data || data.source !== "care-desk" || typeof data.open !== "boolean") return;
    open = data.open;
    layout();
  });
  window.addEventListener("resize", layout);

  window.CareDesk = {
    open: function () {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage({ source: "care-desk-host", action: "open" }, origin);
      }
    },
  };

  layout();
  if (document.body) document.body.appendChild(frame);
  else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(frame); });
})();