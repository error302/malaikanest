import { useCallback, useEffect, useState } from "react";
import { api, Category, Paged, Product, Variant } from "./api";
import { VariantsEditor } from "./VariantsEditor";

const PAGE_SIZE = 25;

/** Category can come back as an object or a bare pk string depending on the write/read path. */
function categoryName(c: Product["category"]): string {
  return typeof c === "object" && c !== null ? c.name : "—";
}
function categoryId(c: Product["category"]): string {
  return typeof c === "object" && c !== null ? c.id : (c as string) || "";
}

export function Products() {
  const [data, setData] = useState<Paged<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    setError("");
    api
      .products("?" + params.toString())
      .then(setData)
      .catch((e) => setError(e.message));
  }, [search, category, page]);

  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <>
      <h2>Products</h2>
      <p className="sub">{data ? `${data.count} products` : "Loading…"}</p>

      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ flex: 1, maxWidth: 320 }}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {(c.parent ? c.parent.name + " › " : "") + c.name}
            </option>
          ))}
        </select>
        <button className="btn small" onClick={() => setEditing({} as Product)}>
          + New product
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="num">Price</th>
              <th className="num">Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.results.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>{categoryName(p.category)}</td>
                <td className="num">
                  KES {Number(p.price).toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                </td>
                <td className={`num ${p.stock <= 3 ? "stock-low" : ""}`}>{p.stock}</td>
                <td>
                  <span className={`badge ${p.is_active ? "on" : "off"}`}>
                    {p.is_active ? "active" : "draft"}
                  </span>
                </td>
                <td>
                  <button className="btn ghost small" onClick={() => setEditing(p)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
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
  const isNew = !product.id;
  const [form, setForm] = useState({
    name: product.name ?? "",
    price: product.price ?? "",
    stock: product.stock ?? 0,
    is_active: product.is_active ?? false,
    size_guide: product.size_guide ?? "",
    category: categoryId(product.category),
  });
  const [variants, setVariants] = useState<Variant[]>(product.variants ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // List responses omit the variants detail; fetch it for existing products.
  useEffect(() => {
    if (!product.id) return;
    let alive = true;
    api
      .productVariants(product.id)
      .then((full) => {
        if (alive) setVariants(full.variants ?? []);
      })
      .catch(() => {
        /* drawer stays usable without variants */
      });
    return () => {
      alive = false;
    };
  }, [product.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body: Partial<Product> & { slug?: string } = {
      name: form.name,
      price: form.price,
      stock: Number(form.stock),
      is_active: form.is_active,
      size_guide: form.size_guide,
    };
    if (form.category) body.category = form.category;
    if (isNew) body.slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!isNew && variants.length > 0) {
      // Backend replaces the full variant set: send every row, including
      // deactivated ones, so nothing is lost.
      body.variants = variants.map((v) => ({
        id: v.id,
        color: v.color,
        size: v.size || null,
        stock: v.stock,
        is_active: v.is_active,
        price_modifier: v.price_modifier ?? "0",
      }));
    }
    try {
      await api.saveProduct(isNew ? null : product.id, body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18,50,74,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <form
        className="panel"
        style={{ width: "100%", maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <h3>{isNew ? "New product" : `Edit — ${product.name}`}</h3>
        {error && <div className="error">{error}</div>}
        <label className="field">
          <span>Name</span>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label className="field">
          <span>Price (KES)</span>
          <input
            type="number"
            min="0"
            step="1"
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
            value={form.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.parent ? c.parent.name + " › " : "") + c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Measurements &amp; fit (shown on the product page)</span>
          <textarea
            value={form.size_guide}
            onChange={(e) => set("size_guide", e.target.value)}
            placeholder="e.g. 2y: chest 54 cm, length 38 cm"
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
          />
          Active (visible in the shop)
        </label>
        {!isNew && <VariantsEditor variants={variants} onChange={setVariants} />}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save"}
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
