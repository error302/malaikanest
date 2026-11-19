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
  const [urlInput, setUrlInput] = useState("");
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const running = useRef(false);

  async function run(action: () => Promise<Product>) {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const saved = await action();
      onChanged(saved);
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
    <div className="photos-editor">
      <h4>Photos</h4>
      <p className="variants-hint">Photo changes save immediately. JPG, PNG, WEBP, or direct Cloudinary URLs.</p>
      {busy && <p role="status">Saving photos…</p>}
      {error && <div className="error" role="alert">{error}</div>}

      <div className="photo-url-box" style={{ margin: "0.75rem 0", padding: "0.75rem", background: "var(--blue-wash)", borderRadius: "8px", border: "1px solid var(--border)" }}>
        <p style={{ margin: "0 0 0.4rem 0", fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>
          Paste Cloudinary / Web Image URL
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="url"
            aria-label="Photo URL"
            placeholder="https://res.cloudinary.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={busy || disabled}
            style={{ flex: "1 1 200px", padding: "0.4rem 0.6rem", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
          <button
            type="button"
            className="btn ghost small"
            disabled={busy || disabled || !urlInput.trim()}
            onClick={onApplyUrlAsMain}
          >
            Set as Main
          </button>
          <button
            type="button"
            className="btn ghost small"
            disabled={busy || disabled || !urlInput.trim()}
            onClick={onApplyUrlToGallery}
          >
            Add to Gallery
          </button>
        </div>
      </div>

      <div className="photo-main">
        {mainImage ? (
          <img src={mainImage} alt="Product photo" />
        ) : (
          <div className="photo-empty">No photo yet</div>
        )}
        <input
          ref={mainInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={onMainPicked}
        />
        <button
          type="button"
          className="btn ghost small"
          disabled={busy || disabled}
          onClick={() => mainInput.current?.click()}
        >
          {mainImage ? "Upload new main photo" : "Upload main photo"}
        </button>
        {mainImage && <button type="button" className="btn ghost small danger" disabled={busy || disabled} onClick={() => {
          if (confirm("Remove the main photo? Gallery copies are kept.")) void run(() => api.saveProduct(productId, { image: null, image_url: null }));
        }}>Remove main photo</button>}
      </div>

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

      <input
        ref={galleryInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={onGalleryPicked}
      />
      <button
        type="button"
        className="btn ghost small"
        disabled={busy || disabled}
        onClick={() => galleryInput.current?.click()}
      >
        + Add gallery photos
      </button>
    </div>
  );
}
