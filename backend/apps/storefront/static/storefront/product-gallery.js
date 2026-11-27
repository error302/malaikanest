(() => {
  const form = document.getElementById("pdp-add-form");
  const quantity = form?.elements.quantity;
  const status = document.getElementById("pdp-availability");
  const buttonLabel = document.getElementById("pdp-bag-label");
  const price = document.getElementById("pdp-price");
  const image = document.getElementById("mainProductImage");
  const noPhoto = document.getElementById("pdp-no-photo");
  const thumbnails = document.getElementById("pdp-thumbnails");
  const imageOpen = document.getElementById("pdp-image-open");
  const imageDialog = document.getElementById("pdp-image-dialog");
  const largeImage = document.getElementById("pdp-large-image");
  const selection = document.getElementById("pdp-selected");
  const whatsapp = document.querySelector("[data-pdp-whatsapp]");
  const galleries = document.getElementById("pdp-variant-galleries");
  const productName = image?.parentElement.dataset.pdpName;
  const variantPhotos = new Map(JSON.parse(galleries?.textContent || "[]").map(({id, photos}) => [id, photos]));
  const whatsappBase = whatsapp ? new URL(whatsapp.href) : null;
  let currentVariant;
  let currentPhotos = Array.from(thumbnails?.querySelectorAll("[data-gallery-src]") || [])
    .map(button => ({url: button.dataset.gallerySrc, label: button.dataset.galleryLabel}));
  let currentPhoto = 0;
  let touchStart;
  let swiped = false;

  imageOpen?.addEventListener("click", () => {
    if (swiped) { swiped = false; return; }
    if (!image?.src || !imageDialog || !largeImage) return;
    largeImage.src = image.src;
    largeImage.alt = image.alt;
    imageDialog.showModal();
    imageDialog.querySelector(".pdp-image-close")?.focus();
  });
  imageDialog?.querySelector(".pdp-image-close")?.addEventListener("click", () => imageDialog.close());
  imageDialog?.addEventListener("close", () => imageOpen?.focus());
  imageOpen?.addEventListener("touchstart", event => {
    touchStart = {x: event.touches[0].clientX, y: event.touches[0].clientY};
  }, {passive: true});
  imageOpen?.addEventListener("touchend", event => {
    if (!touchStart || currentPhotos.length < 2) return;
    const delta = event.changedTouches[0].clientX - touchStart.x;
    const vertical = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(delta) < 50 || Math.abs(delta) <= Math.abs(vertical)) return;
    swiped = true;
    const next = Math.max(0, Math.min(currentPhotos.length - 1, currentPhoto + (delta < 0 ? 1 : -1)));
    thumbnails.querySelectorAll("button")[next]?.click();
  }, {passive: true});
  image?.addEventListener("error", () => {
    imageOpen.hidden = true;
    noPhoto.hidden = false;
    noPhoto.textContent = "This photo could not be loaded.";
  });

  form?.addEventListener("click", event => {
    const step = event.target.closest("[data-quantity-step]");
    if (!step || !quantity || quantity.disabled) return;
    const next = (Number(quantity.value) || 1) + Number(step.dataset.quantityStep);
    quantity.value = String(Math.max(1, Math.min(next, Number(quantity.max))));
  });

  const mainButton = document.querySelector(".pdp-purchase-actions .pdp-add-button");
  const mobileCart = document.querySelector(".pdp-mobile-cart");
  if (mobileCart && mainButton && !mainButton.disabled && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      mobileCart.hidden = entry.isIntersecting || entry.boundingClientRect.bottom > 0;
    });
    observer.observe(mainButton);
  }

  function setPhoto(url, label) {
    if (!image || !noPhoto) return;
    image.hidden = !url;
    if (imageOpen) imageOpen.hidden = !url;
    noPhoto.hidden = Boolean(url);
    if (url) {
      image.src = url;
      image.alt = productName + " — " + label;
    } else {
      image.removeAttribute("src");
      noPhoto.textContent = "Photo unavailable for this option";
    }
  }

  thumbnails?.addEventListener("click", event => {
    const button = event.target.closest("[data-gallery-src]");
    if (!button) return;
    for (const item of thumbnails.querySelectorAll("button")) {
      item.setAttribute("aria-pressed", String(item === button));
    }
    currentPhoto = Array.from(thumbnails.querySelectorAll("button")).indexOf(button);
    setPhoto(button.dataset.gallerySrc, button.dataset.galleryLabel);
  });

  function showGallery(photos) {
    if (!thumbnails) return;
    currentPhotos = photos;
    currentPhoto = 0;
    thumbnails.hidden = photos.length < 2;
    thumbnails.replaceChildren(...photos.map(({url, label}, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.gallerySrc = url;
      button.dataset.galleryLabel = label;
      button.setAttribute("aria-pressed", String(index === 0));
      const thumb = document.createElement("img");
      thumb.src = url;
      thumb.alt = "";
      thumb.width = 64;
      thumb.height = 64;
      thumb.loading = "lazy";
      const caption = document.createElement("span");
      caption.textContent = label;
      button.append(thumb, caption);
      return button;
    }));
    setPhoto(photos[0]?.url, photos[0]?.label);
  }

  if (!form?.querySelector("[name=variant_id]") || !quantity || !status || !buttonLabel) return;

  function showSelection() {
    const selected = form.querySelector("[name=variant_id]:checked:not(:disabled)");
    if (!selected) return;
    const stock = Number(selected.dataset.stock);
    if (!Number.isInteger(stock) || stock < 1) return;
    quantity.max = String(stock);
    if (Number(quantity.value) > stock) quantity.value = String(stock);
    status.textContent = stock + " available";
    if (selection) selection.textContent = "Selected: " + selected.dataset.label;
    buttonLabel.textContent = "Add to Cart · " + selected.dataset.price;
    if (price) price.textContent = selected.dataset.price;
    if (currentVariant !== selected.value) {
      showGallery(variantPhotos.get(selected.value) || []);
      currentVariant = selected.value;
    }
    if (whatsappBase) {
      const url = new URL(whatsappBase);
      url.searchParams.set("text", whatsappBase.searchParams.get("text") + " (" + selected.dataset.label + ")");
      whatsapp.href = url.href;
    }
  }
  form.addEventListener("change", event => {
    if (event.target.name === "variant_id") showSelection();
  });
  window.addEventListener("pageshow", showSelection);
  showSelection();
})();
