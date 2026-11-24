import { useCallback, useEffect, useRef, useState } from "react";
import { api, Category, Paged, Product, SIZE_CHOICES, Variant } from "./api";
import { productChanges, productForm, SaveIntent, validateVariants } from "./productDraft";
import { VariantsEditor } from "./VariantsEditor";
import { trapModalTab } from "./Modal";
import { PhotosEditor } from "./PhotosEditor";
import { useUnsavedChanges } from "./useUnsavedChanges";

const PAGE_SIZE = 25;

/** Category can come back as an object or a bare pk string depending on the write/read path. */
function categoryName(c: Product["category"]): string {
  return typeof c === "object" && c !== null ? c.name : "—";
}

export function Products({ startNew = false }: { startNew?: boolean }) {
  const [data, setData] = useState<Paged<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(startNew ? {} as Product : null);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const version = ++requestVersion.current;
    setLoading(true);
    setData(null);
    setError("");
    api
      .products("?" + params.toString())
      .then((result) => { if (version === requestVersion.current) setData(result); })
      .catch((e) => { if (version === requestVersion.current) setError(e.message); })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
  }, [search, category, page]);

  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setError("Categories could not be loaded. Reload before editing products."));
  }, []);

  useEffect(() => {
    const requests = requestVersion;
    load();
    return () => { requests.current++; };
  }, [load]);

  const pages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <>
      <h2>Products</h2>
      <p className="sub">{data ? `${data.count} products` : "Loading…"}</p>

      {error && <div className="error" role="alert">{error} <button className="btn ghost" onClick={load}>Retry</button></div>}

      {loading && <p role="status">Loading products…</p>}
      <div className="toolbar">
        <input
          type="text"
          aria-label="Search products"
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ flex: 1, maxWidth: 320 }}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.full_slug || (typeof c.parent === "object" && c.parent ? c.parent.name + " › " : "") + c.name}
            </option>
          ))}
        </select>
        <button className="btn small" onClick={() => setEditing({} as Product)}>
          + New product
        </button>
      </div>

      {data?.results.length === 0 && <p className="panel">{search || category ? "No products match your filters." : "No products yet. Add your first product to start filling the shop."}</p>}
      {!!data?.results.length && (
        <ul className="panel product-list" aria-label="Products">
          {data.results.map(product => {
            const published = product.is_active && product.status === "published";
            return (
              <li key={product.id}>
                <div className="product-list-name">
                  <strong>{product.name}</strong>
                  <small>{product.category_name || categories.find(item => item.id === product.category)?.name || categoryName(product.category)}</small>
                </div>
                <div className="product-list-facts">
                  <strong>KES {Number(product.price).toLocaleString("en-KE", { maximumFractionDigits: 2 })}</strong>
                  <small className={product.stock <= 3 ? "stock-low" : ""}>{product.stock} in stock</small>
                </div>
                <span className={`badge ${published ? "on" : "off"}`}>{published ? "In shop" : "Hidden"}</span>
                <button className="btn ghost small" onClick={() => setEditing(product)}>Edit</button>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            className="btn ghost small"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {editing && (
        <EditDrawer
          product={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            if (startNew) location.hash = "products";
          }}
          onSaved={load}
        />
      )}
    </>
  );
}

function EditDrawer({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState(product);
  const isNew = !current.id;
  const [form, setForm] = useState(() => productForm(product));
  const [variants, setVariants] = useState<Variant[]>(product.variants ?? []);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [loaded, setLoaded] = useState(!product.id);
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(productForm(current)) || JSON.stringify(variants) !== JSON.stringify(current.variants ?? []);
  const locked = busy || photoBusy || !loaded;

  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);

  useUnsavedChanges(dirty, busy || photoBusy);

  useEffect(() => {
    if (!product.id) return;
    let alive = true;
    setLoaded(false);
    setError("");
    api.product(product.id).then((full) => {
      if (!alive) return;
      setCurrent(full);
      setForm(productForm(full));
      setVariants(full.variants ?? []);
      setLoaded(true);
    }).catch((err) => {
      if (alive) setError(err instanceof Error ? err.message : "Could not load product. Editing is disabled to protect saved data.");
    });
    return () => { alive = false; };
  }, [product.id, attempt]);

  function close() {
    if (busy || photoBusy) return;
    if (dirty && !window.confirm("Discard unsaved product details and size changes? Photo changes are already saved.")) return;
    onClose();
  }

  function refreshPhotos(full: Product) {
    setCurrent((previous) => ({ ...previous, images: full.images, image: full.image, image_full_url: full.image_full_url }));
    onSaved();
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setNotice("");
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = (submitter?.value || "save") as SaveIntent;
    const variantError = validateVariants(variants, current.variants ?? []);
    if (variantError) { setError(variantError); return; }
    if (intent === "publish" && !window.confirm("Publish this product and make it visible in the shop?")) return;
    const body = productChanges(current, form, intent);
    if (variants.length) delete body.stock;
    if (JSON.stringify(variants) !== JSON.stringify(current.variants ?? [])) {
      body.variants = variants.map((v) => ({
        id: v.id, color: v.color, size: v.size || null, sku: v.sku,
        stock: v.stock, is_active: v.is_active, price_modifier: v.price_modifier ?? "0",
      }));
    }
    if (!Object.keys(body).length) { setNotice("No unsaved changes."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await api.saveProduct(isNew ? null : current.id, body);
      setCurrent(saved);
      setForm(productForm(saved));
      setVariants(saved.variants ?? []);
      setNotice(isNew ? "Draft saved. Add photos below, then publish when ready." : intent === "publish" ? "Published." : intent === "draft" ? "Saved as a hidden draft." : "Changes saved. Visibility unchanged.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog onKeyDown={trapModalTab} ref={dialog} className="product-dialog panel" aria-labelledby="product-editor-title" onCancel={(event) => { event.preventDefault(); close(); }}>
      <form onSubmit={save}>
        <div className="dialog-heading"><h3 id="product-editor-title">{isNew ? "New product" : `Edit — ${current.name}`}</h3><button className="btn ghost" type="button" onClick={close} disabled={busy || photoBusy}>Close</button></div>
        <p className="variants-hint">{isNew ? "Start with the name, price and category. Save a draft to add photos from your phone." : current.is_active ? "Visible in the shop." : "Hidden draft. Add photos and check sizes before publishing."}</p>
        {error && <div className="error" role="alert">{error}</div>}
        {notice && <div className="notice" role="status">{notice}</div>}
        {!loaded && (error ? <button className="btn ghost" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry loading</button> : <p role="status">Loading product details…</p>)}
        <fieldset disabled={locked} className="product-fields">
        <label className="field">
          <span>Name</span>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label className="field">
          <span>Price (KES)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Stock</span>
          <input
            type="number"
            min="0"
            step="1"
            disabled={variants.length > 0}
            value={variants.length ? variants.filter((v) => v.is_active).reduce((total, v) => total + v.stock, 0) : form.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select required value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_slug || (typeof c.parent === "object" && c.parent ? c.parent.name + " › " : "") + c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Description</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="field">
          <span>Single size (when no size rows are active)</span>
          <select value={form.size_label} onChange={(e) => set("size_label", e.target.value)} disabled={variants.some((v) => v.is_active)}>
            <option value="">Not specified</option>
            {SIZE_CHOICES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>
        </label>
        <details className="editor-details">
          <summary>Optional product details</summary>
        <label className="field">
          <span>Fabric &amp; care</span>
          <textarea value={form.fabric} onChange={(e) => set("fabric", e.target.value)} />
        </label>
        <label className="field">
          <span>What's included</span>
          <textarea value={form.whats_included} onChange={(e) => set("whats_included", e.target.value)} />
        </label>
        <p className="variants-hint">Enter verified measurements in cm, stating body or garment measurements. Leave unknown details blank.</p>
        <label className="field">
          <span>Measurements &amp; fit (shown on the product page)</span>
          <textarea
            value={form.size_guide}
            onChange={(e) => set("size_guide", e.target.value)}
            placeholder="e.g. 2y: chest 54 cm, length 38 cm"
          />
        </label>
        <label className="field">
          <span>Main Image URL (Cloudinary or Web)</span>
          <input
            type="url"
            placeholder="https://res.cloudinary.com/..."
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
          />
        </label>
        {isNew && <label className="field">
          <span>URL slug (optional; generated from name)</span>
          <input type="text" pattern="[a-zA-Z0-9_-]+" maxLength={300} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </label>}
        </details>
        <VariantsEditor variants={variants} previous={current.variants ?? []} onChange={(rows) => { setVariants(rows); setNotice(""); }} />
        </fieldset>
        {!isNew && loaded && (
          <PhotosEditor productId={current.id} mainImage={current.image_full_url ?? current.image} gallery={current.images ?? []} onChanged={refreshPhotos} disabled={busy} onBusyChange={setPhotoBusy} />
        )}
        <div className="editor-actions">
          <button className="btn" disabled={locked} type="submit" value="save">
            {busy ? "Saving…" : isNew ? "Create draft" : "Save changes"}
          </button>
          {!isNew && <button className="btn ghost" disabled={locked} type="submit" value={current.is_active ? "draft" : "publish"}>
            {current.is_active ? "Unpublish to draft" : "Publish product"}
          </button>}
          <button className="btn ghost" disabled={busy || photoBusy} type="button" onClick={close}>Close</button>
        </div>
      </form>
    </dialog>
  );
}
