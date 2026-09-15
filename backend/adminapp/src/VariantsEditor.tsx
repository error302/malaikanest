import { COLOR_CHOICES, SIZE_CHOICES, Variant } from "./api";

const sizeLabel = (v: string | null | undefined) =>
  SIZE_CHOICES.find((s) => s.value === v)?.label ?? v ?? "";

const colorLabel = (v: string | null | undefined) =>
  COLOR_CHOICES.find((c) => c.value === v)?.label ?? v ?? "";

/**
 * Editable variant/size inventory rows.
 *
 * The backend sync replaces the full variant set on save: rows sent here are
 * updated/created, and any existing variant NOT included is deactivated.
 * Deactivating a row (checkbox off) keeps it in the payload so the variant
 * survives but shows as sold out / hidden in the shop.
 */
export function VariantsEditor({
  variants,
  onChange,
}: {
  variants: Variant[];
  onChange: (next: Variant[]) => void;
}) {
  function update(index: number, patch: Partial<Variant>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addRow() {
    onChange([...variants, { color: "blue", size: "0-3m", stock: 0, is_active: true, price_modifier: "0" }]);
  }

  function removeRow(index: number) {
    // Rows that already exist on the server must stay in the payload
    // (deactivated) so they are not silently kept active; new rows can go.
    const row = variants[index];
    onChange(
      row.id
        ? variants.map((v, i) => (i === index ? { ...v, is_active: false } : v))
        : variants.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="variants-editor">
      <div className="variants-head">
        <strong style={{ fontSize: 13 }}>Sizes &amp; colours</strong>
        <span className="variants-hint">
          Unchecked sizes are hidden from the shop. Set stock to 0 to show a size as sold out.
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>On sale</th>
            <th>Size</th>
            <th>Colour</th>
            <th className="num">Stock</th>
            <th>Available</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => (
            <tr key={v.id ?? `new-${i}`} className={v.is_active ? "" : "variant-off"}>
              <td>
                <input
                  type="checkbox"
                  checked={v.is_active}
                  aria-label={`${sizeLabel(v.size)} ${colorLabel(v.color)} on sale`}
                  onChange={(e) => update(i, { is_active: e.target.checked })}
                />
              </td>
              <td>
                <select
                  value={v.size ?? ""}
                  aria-label="Size"
                  onChange={(e) => update(i, { size: e.target.value || null })}
                >
                  <option value="">—</option>
                  {SIZE_CHOICES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={v.color}
                  aria-label="Colour"
                  onChange={(e) => update(i, { color: e.target.value })}
                >
                  {COLOR_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="num">
                <input
                  type="number"
                  min={0}
                  value={v.stock}
                  aria-label={`${sizeLabel(v.size)} ${colorLabel(v.color)} stock`}
                  onChange={(e) => update(i, { stock: Math.max(0, Number(e.target.value) || 0) })}
                  style={{ width: 80, textAlign: "right" }}
                />
              </td>
              <td className="num" style={{ color: "var(--muted)" }}>
                {v.available_stock ?? v.stock}
              </td>
              <td>
                <button type="button" className="btn ghost small danger" onClick={() => removeRow(i)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn ghost small" onClick={addRow} style={{ marginTop: 10 }}>
        + Add size
      </button>
    </div>
  );
}
