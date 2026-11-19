import { useEffect, useState } from "react";
import { api, Category } from "./api";
import { Modal } from "./Modal";
import { useObjectUrl } from "./useObjectUrl";
import { validatePhotos } from "./productDraft";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.categories();
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.group && c.group.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="bar">
        <h2>Categories</h2>
        <input
          type="search"
          aria-label="Filter categories"
          placeholder="Filter categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          onClick={() =>
            setEditing({
              id: "",
              name: "",
              slug: "",
              description: "",
              group: "",
              image_url: "",
            })
          }
        >
          + Add Category
        </button>
      </div>

      {error && <div className="error" role="alert">{error} <button className="btn ghost" onClick={() => void load()}>Retry</button></div>}
      {loading && <p role="status">Loading categories…</p>}

      {!loading && (
        <div className="card table-wrap" role="region" aria-label="Categories table, scroll horizontally for more columns" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Image</th>
                <th>Name</th>
                <th>Slug / Path</th>
                <th>Group</th>
                <th>Products</th>
                <th style={{ width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6}>No categories match your search.</td></tr>}
              {filtered.map((cat) => {
                const img = cat.image_full_url || cat.image_url || cat.image;
                return (
                  <tr key={cat.id}>
                    <td>
                      {img ? (
                        <img
                          src={img}
                          alt={cat.name}
                          style={{
                            width: "44px",
                            height: "44px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "6px",
                            background: "var(--blue-wash)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "var(--muted)",
                          }}
                        >
                          MN
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "12px" }}>
                      {cat.full_slug || cat.slug}
                    </td>
                    <td>{cat.group || "—"}</td>
                    <td>{cat.product_count ?? 0}</td>
                    <td>
                      <button
                        className="btn ghost small"
                        onClick={() => setEditing(cat)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CategoryDrawer
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </>
  );
}

function CategoryDrawer({
  category,
  onClose,
  onSaved,
}: {
  category: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !category.id;
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [group, setGroup] = useState(category.group || "");
  const [imageUrl, setImageUrl] = useState(category.image_url || "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [removeImage, setRemoveImage] = useState(false);
  const preview = useObjectUrl(file);
  const currentPreview = file ? preview : removeImage ? null : imageUrl || category.image_full_url || category.image;
  const dirty = name !== category.name || description !== (category.description || "") || group !== (category.group || "") || imageUrl !== (category.image_url || "") || !!file || removeImage;
  function close() {
    if (!busy && (!dirty || window.confirm("Discard unsaved category changes?"))) onClose();
  }
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      if (file && category.id) {
        await api.saveCategoryMultipart(
          category.id,
          {
            name,
            description,
            group,
            image_url: imageUrl,
          },
          file
        );
      } else {
        await api.saveCategory(category.id || null, {
          name,
          description,
          group,
          image_url: imageUrl,
          ...(removeImage ? { image: null } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? "Add category" : `Edit ${category.name}`} onClose={close}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--navy)" }}>
            {isNew ? "Add Category" : `Edit ${category.name}`}
          </h3>
          <button
            type="button"
            className="btn ghost small"
            aria-label="Close category editor"
            onClick={close}
            disabled={busy}
          >
            Close
          </button>
        </div>

        {error && <div role="alert" className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form aria-busy={busy} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
          <fieldset disabled={busy} className="product-fields">
          <label className="field">
            <span>Category Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rompers & Sleepsuits"
            />
          </label>

          <label className="field">
            <span>Navigation Group (e.g. Baby, Toddler, Essentials)</span>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="e.g. Baby"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of items in this category"
            />
          </label>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "var(--navy)" }}>
              Category Image
            </h4>
            <p style={{ margin: "0 0 1rem 0", fontSize: "12px", color: "var(--muted)" }}>
              Appears on homepage category cards and category browsing pages.
            </p>

            {currentPreview ? (
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <img
                  src={currentPreview}
                  alt="Preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
                <div>
                  <button
                    type="button"
                    className="btn ghost tiny danger"
                    disabled={busy}
                    onClick={() => {
                      setImageUrl("");
                      setFile(null);
                      setRemoveImage(true);
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "8px",
                  background: "var(--blue-wash)",
                  border: "1px dashed #879caa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "var(--blue-dark)",
                  marginBottom: "1rem",
                }}
              >
                No Image
              </div>
            )}

            <label className="field" style={{ marginBottom: "0.75rem" }}>
              <span>Paste Cloudinary / Web Image URL</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setFile(null);
                  setRemoveImage(false);
                }}
                placeholder="https://res.cloudinary.com/..."
              />
            </label>

            {!isNew && (
              <label className="field">
                <span>Or Upload Image File (JPG, PNG, WEBP)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { const problem = validatePhotos([f]); if (problem) { setError(problem); e.target.value = ""; return; } setFile(f); setImageUrl(""); setRemoveImage(false); setError(""); }
                  }}
                />
              </label>
            )}
          </div>

          </fieldset>
          <div className="editor-actions" style={{ marginTop: "auto", display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <button type="submit" className="btn" disabled={busy} style={{ flex: 1 }}>
              {busy ? "Saving…" : isNew ? "Create Category" : "Save Changes"}
            </button>
            <button type="button" className="btn ghost" disabled={busy} onClick={close}>
              Cancel
            </button>
          </div>
        </form>
    </Modal>
  );
}

