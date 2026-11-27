import { useCallback, useEffect, useRef, useState } from "react";
import { api, CatalogueOption, CatalogueOptions, Category, Paged, Product, SIZE_CHOICES, Variant } from "./api";
import { productChanges, productForm, SaveIntent, validateVariants } from "./productDraft";
import { VariantsEditor } from "./VariantsEditor";
import { Modal, trapModalTab } from "./Modal";
import { PhotosEditor } from "./PhotosEditor";
import { useUnsavedChanges } from "./useUnsavedChanges";

const PAGE_SIZE = 25;
const EMPTY_OPTIONS: CatalogueOptions = { ages: [], sizes: [], age_ranges: [], conditions: [] };
const EMPTY_FILTERS = { search: "", category_path: "", age: "", size: "", condition: "", sort: "" };
const SORT_OPTIONS = [
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "name", label: "Name, A to Z" },
];

/** Category can come back as an object or a bare pk string depending on the write/read path. */
function categoryName(c: Product["category"]): string {
  return typeof c === "object" && c !== null ? c.name : "—";
}

function productImage(product: Product) {
  return product.image_full_url || product.image || product.images?.find(image => image.is_primary)?.url || product.images?.[0]?.url;
}

function PreviewImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    : <span className="product-photo-empty">No photo</span>;
}

function FilterSelect({ label, placeholder, options, value, onChange }: {
  label: string;
  placeholder: string;
  options: CatalogueOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return <label className="field">
    <span>{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

export function Products({ startNew = false }: { startNew?: boolean }) {
  const [data, setData] = useState<Paged<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [optionsError, setOptionsError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(startNew ? {} as Product : null);
  const [preview, setPreview] = useState<Product | null>(null);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) params.set(key, value.trim());
    }
    const version = ++requestVersion.current;
    setLoading(true);
    setData(null);
    setError("");
    api
      .products("?" + params.toString())
      .then((result) => { if (version === requestVersion.current) setData(result); })
      .catch((e) => { if (version === requestVersion.current) setError(e.message); })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
  }, [filters, page]);

  const loadOptions = useCallback(async () => {
    setOptionsError("");
    const [categoryResult, optionsResult] = await Promise.allSettled([api.categories(), api.catalogueOptions()]);
    if (categoryResult.status === "fulfilled") setCategories(categoryResult.value);
    if (optionsResult.status === "fulfilled") setOptions(optionsResult.value);
    if (categoryResult.status === "rejected" || optionsResult.status === "rejected") {
      setOptionsError("Some catalogue filters could not be loaded.");
    }
  }, []);

  useEffect(() => { void loadOptions(); }, [loadOptions]);

  useEffect(() => {
    const requests = requestVersion;
    load();
    return () => { requests.current++; };
  }, [load]);

  const pages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;
  const filtered = Object.entries(filters).some(([key, value]) => key !== "sort" && value.trim());
  const categoryOptions = categories.map(c => ({ value: c.full_slug || c.slug, label: c.path_label || c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  function changeFilter(key: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters(previous => ({ ...previous, [key]: value }));
    setPage(0);
  }

  async function removeProduct(product: Product) {
    if (!window.confirm("Delete this product and all its photos permanently?")) return;
    setDeleting(product.id);
    setError("");
    try {
      await api.deleteProduct(product.id);
      if (page > 0 && data?.results.length === 1) setPage(page - 1);
      else load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="products-heading">
        <div>
          <h2>Products</h2>
          <p className="sub" aria-live="polite">{data ? `${data.count} ${data.count === 1 ? "product" : "products"}` : loading ? "Loading products…" : "Products unavailable"}</p>
        </div>
        <button className="btn small" onClick={() => setEditing({} as Product)}>+ New product</button>
      </div>

      {error && <div className="error" role="alert">{error} <button className="btn ghost" onClick={load}>Retry</button></div>}
      {optionsError && <div className="error" role="alert">{optionsError} <button className="btn ghost" onClick={loadOptions}>Retry filters</button></div>}

      <div className="product-filters panel">
        <label className="field">
          <span>Search products</span>
          <input type="search" placeholder="Name or description" value={filters.search} onChange={e => changeFilter("search", e.target.value)} />
        </label>
        <FilterSelect label="Category" placeholder="All categories" options={categoryOptions} value={filters.category_path} onChange={value => changeFilter("category_path", value)} />
        <FilterSelect label="Age" placeholder="All ages" options={options.ages} value={filters.age} onChange={value => changeFilter("age", value)} />
        <FilterSelect label="Size" placeholder="All sizes" options={options.sizes} value={filters.size} onChange={value => changeFilter("size", value)} />
        <FilterSelect label="Condition" placeholder="All conditions" options={options.conditions} value={filters.condition} onChange={value => changeFilter("condition", value)} />
        <FilterSelect label="Sort by" placeholder="Newest first" options={SORT_OPTIONS} value={filters.sort} onChange={value => changeFilter("sort", value)} />
        {filtered && <button className="btn ghost small" onClick={() => { setFilters({ ...EMPTY_FILTERS, sort: filters.sort }); setPage(0); }}>Clear filters</button>}
      </div>

      {data?.results.length === 0 && <p className="panel">{filtered ? "No products match your filters." : "No products yet. Add your first product to start filling the shop."}</p>}
      {!!data?.results.length && (
        <ul className="panel product-list" aria-label="Products">
          {data.results.map(product => {
            const published = product.is_active && product.status === "published";
            const image = productImage(product);
            const available = product.available_stock ?? product.stock;
            const category = categories.find(item => item.id === product.category);
            const sizes = product.variants?.length
              ? [...new Set(product.variants.filter(variant => variant.is_active).map(variant => variant.size).filter(Boolean))]
              : [product.size_label].filter(Boolean);
            const details = [product.age_range, ...sizes.map(size => options.sizes.find(option => option.value === size)?.label ?? size),
              options.conditions.find(option => option.value === product.condition)?.label].filter(Boolean).join(" · ");
            return (
              <li key={product.id}>
                <div className="product-list-name">
                  <button className="product-thumbnail" type="button" aria-label={`Preview ${product.name}`} onClick={() => setPreview(product)}>
                    <PreviewImage key={image} src={image} alt="" />
                  </button>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{category?.path_label || product.category_name || category?.name || categoryName(product.category)}</small>
                    {details && <small>{details}</small>}
                  </div>
                </div>
                <div className="product-list-facts">
                  <strong>KES {Number(product.price).toLocaleString("en-KE", { maximumFractionDigits: 2 })}</strong>
                  <small className={available <= 3 ? "stock-low" : ""}>{available} available</small>
                </div>
                <span className={`badge ${published ? "on" : "off"}`}>{published ? "In shop" : "Hidden"}</span>
                <div className="product-list-actions">
                  <button className="btn ghost small" onClick={() => setEditing(product)}>Edit</button>
                  <button className="btn ghost small danger" disabled={deleting === product.id} onClick={() => removeProduct(product)}>
                    {deleting === product.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
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

      {preview && (
        <Modal title={`Preview ${preview.name}`} onClose={() => setPreview(null)}>
          <div className="dialog-heading">
            <h3>{preview.name}</h3>
            <button type="button" className="btn ghost" onClick={() => setPreview(null)}>Close</button>
          </div>
          <div className="product-preview"><PreviewImage src={productImage(preview)} alt={preview.name} /></div>
          {preview.is_active && preview.status === "published" && (
            <a href={`/products/${encodeURIComponent(preview.slug)}/`} target="_blank" rel="noreferrer">View in shop ↗</a>
          )}
        </Modal>
      )}

      {editing && (
        <EditDrawer
          product={editing}
          categories={categories}
          options={options}
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
  options,
  onClose,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  options: CatalogueOptions;
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
    setCurrent(previous => ({
      ...previous, images: full.images, image: full.image,
      image_url: full.image_url, image_full_url: full.image_full_url,
    }));
    setForm(previous => previous.image_url === (current.image_url ?? "")
      ? { ...previous, image_url: full.image_url ?? "" }
      : previous);
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
      {!isNew && (current.image_full_url ?? current.image) ? (
        <div style={{ marginBottom: 16 }}>
          <span className="variants-hint" style={{ display: "block", marginBottom: 6 }}>Current main image</span>
          <img
            src={current.image_full_url ?? current.image ?? ""}
            alt="Current main image"
            style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)", display: "block" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ) : null}
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
                {c.path_label || c.full_slug || c.name}
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
            {(options.sizes.length ? options.sizes : SIZE_CHOICES).map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Age group (broad)</span>
          <select value={form.age_group} onChange={(e) => set("age_group", e.target.value)}>
            <option value="">Not specified</option>
            <option value="baby">Baby (0-2 years)</option>
            <option value="toddler">Toddler (2-5 years)</option>
            <option value="kids">Kids (6-12 years)</option>
          </select>
        </label>
        <label className="field">
          <span>Age range (shown on the product page)</span>
          <select value={form.age_range} onChange={e => set("age_range", e.target.value)} disabled={!options.age_ranges.length}>
            <option value="">Not specified</option>
            {form.age_range && !options.age_ranges.some(option => option.value === form.age_range) && <option value={form.age_range}>{form.age_range}</option>}
            {options.age_ranges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Condition</span>
          <select value={form.condition} onChange={e => set("condition", e.target.value)} disabled={!options.conditions.length}>
            {!options.conditions.length && <option value={form.condition}>{form.condition}</option>}
            {options.conditions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Gender</span>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="unisex">Unisex</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </label>
        <label className="field">
          <span>Compare price (KES, for "save X%" badge)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.compare_price}
            onChange={(e) => set("compare_price", e.target.value)}
          />
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
         {form.image_url.trim() ? (
           <div style={{ margin: "0 0 12px" }}>
             <img
               src={form.image_url}
               alt="Preview"
               style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)", display: "block" }}
               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
             />
           </div>
         ) : null}
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
