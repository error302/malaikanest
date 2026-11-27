(() => {
  const notice = document.getElementById("connection-notice");
  const updateNetwork = () => { if (notice) notice.hidden = navigator.onLine; };
  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);
  updateNetwork();
  const viewport = window.visualViewport;
  const updateKeyboard = () => {
    const editable = document.activeElement?.matches("textarea, input:not([type=radio]):not([type=checkbox])");
    document.documentElement.classList.toggle("keyboard-open", !!editable && !!viewport && window.innerHeight - viewport.height > 150);
  };
  viewport?.addEventListener("resize", updateKeyboard);
  document.addEventListener("focusin", updateKeyboard);
  document.addEventListener("focusout", () => requestAnimationFrame(updateKeyboard));
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* Normal online navigation remains available. */ }); });
  }
})();

// Sticky search on mobile - appears on scroll down
(() => {
  const stickySearch = document.querySelector('.sticky-search');
  if (!stickySearch) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateStickySearch = () => {
    const currentScrollY = window.scrollY;
    const headerHeight = document.querySelector('.shop-header')?.offsetHeight || 0;

    // Show sticky search when scrolling down past header and not at top
    if (currentScrollY > headerHeight && currentScrollY > lastScrollY) {
      stickySearch.classList.add('visible');
    } else if (currentScrollY <= headerHeight || currentScrollY < lastScrollY) {
      stickySearch.classList.remove('visible');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateStickySearch);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Saved items (wishlist): optimistic toggle without a page reload.
(() => {
  const forms = document.querySelectorAll(".nest-save-form");
  if (!forms.length) return;

  const headerLink = document.querySelector(".shop-header-saved");

  const paint = (button, saved) => {
    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", saved ? "true" : "false");
    const label = button.querySelector(".nest-save-label");
    if (label) label.textContent = saved ? "Saved" : "Save";
  };

  const bump = () => {
    if (!headerLink) return;
    headerLink.classList.add("is-bumping");
    window.setTimeout(() => headerLink.classList.remove("is-bumping"), 340);
  };

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      const button = form.querySelector("[data-save-toggle]");
      if (!button || !window.fetch) return; // let the plain form post work
      event.preventDefault();

      const wasSaved = button.classList.contains("is-saved");
      paint(button, !wasSaved); // optimistic: the tap feels instant

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "X-Requested-With": "fetch" },
          credentials: "same-origin",
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Could not save");

        paint(button, data.saved);
        if (headerLink) {
          headerLink.classList.toggle("is-saved", data.count > 0);
          let count = headerLink.querySelector("span");
          if (data.count > 0) {
            if (!count) {
              count = document.createElement("span");
              headerLink.appendChild(count);
            }
            count.textContent = data.count;
          } else if (count) {
            count.remove();
          }
        }
        if (data.saved) bump();
      } catch (error) {
        paint(button, wasSaved); // roll back so the heart never lies
      }
    });
  });
})();
