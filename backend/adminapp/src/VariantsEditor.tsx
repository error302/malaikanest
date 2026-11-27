import { useState } from "react";
import { CatalogueOption, COLOR_CHOICES, Variant } from "./api";
import { availableVariantStock } from "./productDraft";

export function VariantsEditor({
  sizeOptions,
  variants,
  previous,
  onChange,
}: {
  sizeOptions: CatalogueOption[];
  variants: Variant[];
  previous: Variant[];
  onChange: (next: Variant[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [colour, setColour] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [stock, setStock] = useState("1");
  const existingSizes = new Set(variants.filter(row => (row.color ?? "") === colour).map(row => row.size));
  const selectedSizes = sizes.filter(size => !existingSizes.has(size));

  function update(index: number, patch: Partial<Variant>) {
    onChange(variants.map((row, i) => i === index ? { ...row, ...patch } : row));
  }

  function addVariants() {
    if (!selectedSizes.length || !stock || !Number.isInteger(Number(stock)) || Number(stock) < 0) return;
    onChange([
      ...variants,
      ...selectedSizes.map(size => ({ size, color: colour || null, stock: Number(stock), is_active: true, price_modifier: "0" })),
    ]);
    setSizes([]);
    setAdding(false);
  }

  return (
    <div className="variants-editor">
      <div className="variants-head">
        <h4>Sizes and colours</h4>
        <button type="button" className="btn ghost small" aria-expanded={adding} aria-controls="variant-builder" disabled={!sizeOptions.length} onClick={() => setAdding(value => !value)}>
          {adding ? "Close variant picker" : "Add variants"}
        </button>
      </div>
      {adding && (
        <div className="variant-builder" id="variant-builder">
          <div className="variant-builder-fields">
            <label className="field">
              <span>Colour (optional)</span>
              <select value={colour} onChange={event => { setColour(event.target.value); setSizes([]); }}>
                <option value="">No colour specified</option>
                {COLOR_CHOICES.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Stock per size</span>
              <input type="number" min={0} step={1} value={stock} onChange={event => setStock(event.target.value)} />
            </label>
          </div>
          <fieldset className="variant-size-picker">
            <legend>Sizes to add</legend>
            {sizeOptions.map(size => (
              <label key={size.value}>
                <input type="checkbox" checked={sizes.includes(size.value)} disabled={existingSizes.has(size.value)}
                       onChange={event => setSizes(previousSizes => event.target.checked ? [...previousSizes, size.value] : previousSizes.filter(value => value !== size.value))} />
                {size.label}
              </label>
            ))}
          </fieldset>
          <button className="btn small" type="button" onClick={addVariants}
                  disabled={!selectedSizes.length || !stock || !Number.isInteger(Number(stock)) || Number(stock) < 0}>
            {selectedSizes.length ? `Add ${selectedSizes.length} ${selectedSizes.length === 1 ? "variant" : "variants"}` : "Add selected sizes"}
          </button>
        </div>
      )}

      {variants.length > 0 && (
        <>
          <p className="variants-hint">Visible variants appear on the product page. Set stock to 0 to show a variant as sold out.</p>
          <ul className="variant-rows">
            {variants.map((row, index) => {
              const available = availableVariantStock(row, previous);
              const held = row.stock - available;
              return (
                <li key={row.id ?? `new-${index}`} className="variant-row">
                  <div className="variant-row-fields">
                    <label className="field">
                      <span>Size</span>
                      <select value={row.size ?? ""} disabled={!sizeOptions.length} onChange={event => update(index, { size: event.target.value || null })}>
                        <option value="">Standard</option>
                        {row.size && !sizeOptions.some(size => size.value === row.size) && <option value={row.size}>{row.size.toUpperCase()}</option>}
                        {sizeOptions.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>Colour</span>
                      <select value={row.color ?? ""} onChange={event => update(index, { color: event.target.value || null })}>
                        <option value="">No colour specified</option>
                        {COLOR_CHOICES.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>Stock</span>
                      <input type="number" min={held} step={1} required value={row.stock}
                             onChange={event => update(index, { stock: Number(event.target.value) })} />
                    </label>
                  </div>
                  <div className="variant-row-actions">
                    <label className="check">
                      <input type="checkbox" checked={row.is_active} onChange={event => update(index, { is_active: event.target.checked })} />
                      Show in shop
                    </label>
                    <small>{available} available{held > 0 && `, ${held} reserved`}</small>
                    {!row.id && <button className="btn ghost small danger" type="button" onClick={() => onChange(variants.filter((_, i) => i !== index))}>Remove</button>}
                  </div>
                  <details className="editor-details variant-extra">
                    <summary>SKU and price adjustment</summary>
                    <div className="variant-builder-fields">
                      <label className="field">
                        <span>SKU (optional)</span>
                        <input type="text" maxLength={100} value={row.sku ?? ""} onChange={event => update(index, { sku: event.target.value })} />
                      </label>
                      <label className="field">
                        <span>Price adjustment (KES)</span>
                        <input type="number" step="0.01" value={row.price_modifier ?? "0"} onChange={event => update(index, { price_modifier: event.target.value })} />
                      </label>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
