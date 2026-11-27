import { useRef, useState } from "react";
import { api, Product, ProductImage } from "./api";
import { validatePhotos } from "./productDraft";

/**
 * Photo manager for the product drawer.
 *
 * Photos are applied immediately (each action is its own PATCH), unlike the
 * text fields which save with the drawer's Save button. The main photo and
 * gallery both render above the Save button so no change is lost.
 */
export function PhotosEditor({
  productId,
  mainImage,
  gallery,
  onChanged,
  disabled = false,
  onBusyChange,
}: {
  productId: string;
  mainImage?: string | null;
  gallery: ProductImage[];
  onChanged: (product: Product) => void;
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const running = useRef(false);

  async function run(action: () => Promise<Product>) {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setNotice("");
    try {
      const saved = await action();
      onChanged(saved);
      setNotice("Photos saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo update failed");
    } finally {
      running.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function onApplyUrlAsMain() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please enter a valid URL starting with https://");
      return;
    }
    void run(async () => {
      const res = await api.saveProduct(productId, { image_url: trimmed });
      setUrlInput("");
      return res;
    });
  }

  function onApplyUrlToGallery() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please enter a valid URL starting with https://");
      return;
    }
    void run(async () => {
      const res = await api.saveProduct(productId, { add_gallery_url: trimmed } as Record<string, unknown>);
      setUrlInput("");
      return res;
    });
  }

  function pick(action: (files: File[]) => Promise<Product>, list: File[]) {
    if (!list.length) return;
    const problem = validatePhotos(list);
    if (problem) { setError(problem); return; }
    void run(() => action(list));
  }

  function onMainPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) pick((files) => api.saveProductMultipart(productId, {}, files.map((file) => ({ key: "image", file }))), [f]);
  }

  function onGalleryPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    pick((list) => api.saveProductMultipart(productId, {}, list.map((file) => ({ key: "gallery_images", file }))), files);
  }

  return (
    <section className="photos-editor" aria-labelledby="product-photos-heading">
      <h4 id="product-photos-heading">Product photos</h4>
      <p className="variants-hint">The cover appears in the shop and product list. Photos save when you choose them.</p>
      {busy && <p role="status">Saving photos…</p>}
      {!busy && notice && <p role="status">{notice}</p>}
      {error && <div className="error" role="alert">{error}</div>}

      <div className="product-cover">
        {mainImage ? <img src={mainImage} alt="Product cover" /> : <div className="photo-empty">Add a front photo</div>}
        <div>
          <label className="field file-picker">
            <span>{mainImage ? "Replace cover from files" : "Choose cover from files"}</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={busy || disabled} onChange={onMainPicked} />
            <small>JPG, PNG or WebP, up to 5 MB per photo.</small>
          </label>
          {mainImage && <button type="button" className="btn ghost small danger" disabled={busy || disabled} onClick={() => {
            if (confirm("Remove the main photo? Gallery copies are kept.")) void run(() => api.saveProduct(productId, { image: null, image_url: null }));
          }}>Remove cover</button>}
        </div>
      </div>

      <div className="photo-url-box">
        <label className="field">
          <span>Cloudinary image URL</span>
          <input type="url" inputMode="url" placeholder="https://res.cloudinary.com/…" value={urlInput} onChange={e => setUrlInput(e.target.value)} disabled={busy || disabled} />
        </label>
        <div className="photo-actions">
          <button type="button" className="btn ghost small" disabled={busy || disabled || !urlInput.trim()} onClick={onApplyUrlAsMain}>Set as cover</button>
          <button type="button" className="btn ghost small" disabled={busy || disabled || !urlInput.trim()} onClick={onApplyUrlToGallery}>Add to gallery</button>
        </div>
      </div>

      <label className="field file-picker">
        <span>Add gallery photos from files</span>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={busy || disabled} onChange={onGalleryPicked} />
        <small>Choose one or more back views or close-ups.</small>
      </label>

      {gallery.length > 0 && (
        <div className="photo-grid">
          {gallery.map((img) => (
            <div key={img.id} className={`photo-cell ${img.is_primary ? "is-primary" : ""}`}>
              <img src={img.url} alt={img.alt_text || "Product image"} />
              <div className="photo-actions">
                {!img.is_primary && (
                  <button
                    type="button"
                    className="btn ghost tiny"
                    disabled={busy || disabled}
                    title="Use as main photo"
                    onClick={() => run(() => api.setPrimaryImage(productId, img.id))}
                  >
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  className="btn ghost tiny danger"
                  disabled={busy || disabled}
                  title="Delete photo"
                  onClick={() => {
                    if (confirm("Delete this photo?")) run(() => api.deleteProductImage(productId, img.id));
                  }}
                >
                  Delete
                </button>
              </div>
              {img.is_primary && <span className="photo-primary-tag">Main</span>}
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
