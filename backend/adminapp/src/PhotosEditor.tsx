import { useRef, useState } from "react";
import { api, COLOR_CHOICES, Product, ProductImage, Variant } from "./api";
import { validatePhotos } from "./productDraft";
import { useObjectUrl } from "./useObjectUrl";

export type DraftPhoto = { id: string; file?: File; url?: string };

function PhotoPreview({ file, url, alt }: { file?: File; url?: string; alt: string }) {
  const preview = useObjectUrl(file ?? null);
  const [failed, setFailed] = useState(false);
  const src = preview || url;
  return src && !failed
    ? <img src={src} alt={alt} onError={() => setFailed(true)} />
    : <div className="photo-empty">Preview unavailable</div>;
}

function PhotoDetails({ photo, variants, disabled, save }: {
  photo: ProductImage;
  variants: Variant[];
  disabled: boolean;
  save: (values: { id: string; variant_id: string | null; alt_text: string }) => void;
}) {
  const [variant, setVariant] = useState(photo.variant_id ?? "");
  const [caption, setCaption] = useState(photo.alt_text ?? "");
  return (
    <details className="photo-details editor-details">
      <summary>Photo details</summary>
      <label className="field">
        <span>Show for</span>
        <select value={variant} disabled={disabled} onChange={e => setVariant(e.target.value)}>
          <option value="">All variants</option>
          {variants.filter(row => row.id).map(row => <option key={row.id} value={row.id}>
            {[row.size_label || row.size, row.color_label || COLOR_CHOICES.find(choice => choice.value === row.color)?.label].filter(Boolean).join(" · ") || "Standard"}
          </option>)}
        </select>
      </label>
      <label className="field">
        <span>Photo label</span>
        <input type="text" maxLength={200} placeholder="e.g. Fabric close-up" value={caption} disabled={disabled} onChange={e => setCaption(e.target.value)} />
      </label>
      <button type="button" className="btn ghost small" disabled={disabled || (variant === (photo.variant_id ?? "") && caption.trim() === (photo.alt_text ?? ""))}
              onClick={() => save({ id: photo.id, variant_id: variant || null, alt_text: caption.trim() })}>Save photo details</button>
    </details>
  );
}

export function PhotosEditor({ product, staged, onStage, onChanged, disabled, onBusyChange }: {
  product: Product;
  staged: DraftPhoto[];
  onStage: (photos: DraftPhoto[]) => void;
  onChanged: (product: Product) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [method, setMethod] = useState<"device" | "url">("device");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const nextPhoto = useRef(0);
  const isNew = !product.id;
  const gallery = product.images ?? [];
  const main = product.image_full_url || product.image;
  const standaloneCover = main && !gallery.some(photo => photo.url === main);
  const locked = busy || disabled;

  async function run(action: () => Promise<Product>, failure = "Photo changes could not be saved.") {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setNotice("");
    try {
      onChanged(await action());
      setNotice("Photos saved.");
    } catch (err) {
      const message = err instanceof Error && err.message !== "An unexpected server error occurred." ? err.message : failure;
      setError(message);
    } finally {
      running.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    setNotice("");
    const problem = validatePhotos(files);
    setError(problem);
    if (problem) return;
    if (isNew) {
      onStage([...staged, ...files.map(file => ({ id: String(nextPhoto.current++), file }))]);
      return;
    }
    const [first, ...rest] = files;
    void run(() => api.saveProductMultipart(product.id, {}, main
      ? files.map(file => ({ key: "gallery_images", file }))
      : [{ key: "image", file: first }, ...rest.map(file => ({ key: "gallery_images", file }))]),
      "The upload failed. Choose the photo again to retry.");
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(url)) {
      setError("Paste the full photo link beginning with https://.");
      return;
    }
    setError("");
    setNotice("");
    if (isNew) {
      onStage([...staged, { id: String(nextPhoto.current++), url }]);
      setUrlInput("");
      return;
    }
    void run(async () => {
      const result = await api.saveProduct(product.id, main ? { add_gallery_url: url } : { image_url: url });
      setUrlInput("");
      return result;
    });
  }

  function remove(action: () => void) {
    if (window.confirm("Remove this photo from the product?")) action();
  }

  return (
    <div className="product-photos">
      <p className="editor-hint">{isNew ? "Photos will save with your draft." : "Photo changes save here as you make them."} The cover appears in the shop listing.</p>
      <div className="photo-picker">
        <div className="photo-methods" role="group" aria-label="How to add photos">
          <button type="button" className="btn ghost small" aria-pressed={method === "device"} disabled={locked} onClick={() => setMethod("device")}>Upload from device</button>
          <button type="button" className="btn ghost small" aria-pressed={method === "url"} disabled={locked} onClick={() => setMethod("url")}>Add from Cloudinary URL</button>
        </div>
        {method === "device" ? (
          <label className="field file-picker">
            <span>Choose photos</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={locked} onChange={event => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              addFiles(files);
            }} />
            <small>JPG, PNG or WebP · up to 5 MB each</small>
          </label>
        ) : (
          <div className="photo-link-entry">
            <label className="field">
              <span>Cloudinary image URL</span>
              <input type="text" inputMode="url" placeholder="https://res.cloudinary.com/…" value={urlInput} disabled={locked}
                     onChange={event => setUrlInput(event.target.value)} onKeyDown={event => {
                       if (event.key === "Enter") { event.preventDefault(); if (urlInput.trim()) addUrl(); }
                     }} />
            </label>
            <button type="button" className="btn small" disabled={locked || !urlInput.trim()} onClick={addUrl}>Add photo</button>
          </div>
        )}
        {busy && <p role="status" className="editor-hint">Saving photos…</p>}
        {!busy && notice && <p role="status" className="editor-hint">{notice}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      <div className="photo-grid">
        {staged.map((photo, index) => (
          <div className="photo-cell" key={photo.id}>
            <PhotoPreview file={photo.file} url={photo.url} alt={index ? "Gallery preview" : "Cover preview"} />
            <span className="photo-role">{index ? "Gallery photo" : "Cover"}</span>
            <div className="photo-actions">
              {index > 0 && <button type="button" className="btn ghost small" onClick={() => onStage([photo, ...staged.filter(item => item.id !== photo.id)])}>Set as cover</button>}
              <button type="button" className="btn ghost small danger" onClick={() => remove(() => onStage(staged.filter(item => item.id !== photo.id)))}>Remove</button>
            </div>
          </div>
        ))}
        {standaloneCover && (
          <div className="photo-cell">
            <PhotoPreview key={main} url={main} alt="Product cover" />
            <span className="photo-role">Cover</span>
            <div className="photo-actions">
              <button type="button" className="btn ghost small danger" disabled={locked} onClick={() => remove(() => {
                void run(() => api.saveProduct(product.id, { image: null, image_url: null }));
              })}>Remove</button>
            </div>
          </div>
        )}
        {gallery.map(photo => {
          const cover = photo.is_primary || photo.url === main;
          return (
            <div key={photo.id} className="photo-cell">
              <PhotoPreview key={photo.url} url={photo.url} alt={photo.alt_text || (cover ? "Product cover" : "Gallery photo")} />
              <span className="photo-role">{cover ? "Cover" : "Gallery photo"}</span>
              <div className="photo-actions">
                {!cover && <button type="button" className="btn ghost small" disabled={locked} onClick={() => void run(() => api.setPrimaryImage(product.id, photo.id))}>Set as cover</button>}
                <button type="button" className="btn ghost small danger" disabled={locked} onClick={() => remove(() => {
                  void run(() => api.deleteProductImage(product.id, photo.id));
                })}>Remove</button>
              </div>
              <PhotoDetails key={JSON.stringify([photo.variant_id, photo.alt_text])} photo={photo} variants={product.variants ?? []} disabled={locked}
                            save={values => void run(() => api.saveProduct(product.id, { photo_details: values }))} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
