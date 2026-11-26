// Password visibility toggles — auto-wires every password field on the page.
// Loaded by the storefront auth pages, the admin login, and the staff reset pages.
(function () {
  function enhance(input) {
    if (input.dataset.pwToggle) return;
    input.dataset.pwToggle = "1";
    var wrap = document.createElement("span");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-toggle";
    btn.setAttribute("aria-label", "Show password");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML =
      '<svg class="i-eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '<svg class="i-eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" style="display:none"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4l16 16M9.9 5.9A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-2.4 3.2M6.1 7.6A16.9 16.9 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 3.4-.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    wrap.appendChild(btn);
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.querySelector(".i-eye").style.display = show ? "none" : "";
      btn.querySelector(".i-eye-off").style.display = show ? "" : "none";
    });
  }

  function wire() {
    document.querySelectorAll('input[type="password"]').forEach(enhance);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
