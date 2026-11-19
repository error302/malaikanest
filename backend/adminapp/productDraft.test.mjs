import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadTypeScript(name) {
  const source = await readFile(new URL(`./src/${name}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { productForm, productChanges, validateVariants, validatePhotos, availableVariantStock } = await loadTypeScript("productDraft");
const { api } = await loadTypeScript("api");
const owner = {
  id: "owner", name: "Owner draft", slug: "owner-draft", price: "500.00", stock: 3,
  category: "category", is_active: false, status: "draft", fabric: "Owner fabric",
  whats_included: "One dress", size_guide: "Garment chest 54 cm", description: "Owner description",
  size_label: "2y",
};

test("an unchanged draft sends no fields and does not publish", () => {
  assert.deepEqual(productChanges(owner, productForm(owner)), {});
});

test("text edits preserve unrelated owner fields and inventory", () => {
  assert.deepEqual(productChanges(owner, { ...productForm(owner), name: "Updated name" }), { name: "Updated name" });
});

test("verified product details can be explicitly cleared", () => {
  assert.deepEqual(productChanges(owner, { ...productForm(owner), fabric: "", whats_included: "", size_guide: "" }), {
    fabric: "", whats_included: "", size_guide: "",
  });
});

test("explicit publish and unpublish write both visibility fields", () => {
  assert.deepEqual(productChanges(owner, productForm(owner), "publish"), { status: "published", is_active: true });
  assert.deepEqual(productChanges(owner, productForm(owner), "draft"), { status: "draft", is_active: false });
});

test("new products are created hidden even when publish is requested", () => {
  const result = productChanges({}, { ...productForm({}), name: "New dress", category: "category", price: "500" }, "publish");
  assert.equal(result.is_active, false);
  assert.equal(result.status, "draft");
  assert.equal(result.slug, "new-dress");
});

test("duplicate size and colour rows are rejected including inactive rows", () => {
  assert.match(validateVariants([
    { color: "blue", size: "2y", stock: 3, is_active: true },
    { color: "blue", size: "2y", stock: 0, is_active: false },
  ]), /duplicate/i);
});

test("fractional stock and stock below reservations are rejected", () => {
  assert.match(validateVariants([{ color: "blue", size: "2y", stock: 1.5, is_active: true }]), /whole/i);
  assert.match(validateVariants([{ color: "blue", size: "2y", stock: 1, is_active: true, id: "row" }], [
    { color: "blue", size: "2y", stock: 5, available_stock: 3, is_active: true, id: "row" },
  ]), /reserved/i);
});

test("available stock previews edits without losing reservations", () => {
  const saved = { id: "row", color: "blue", stock: 5, available_stock: 3, is_active: true };
  assert.equal(availableVariantStock({ ...saved, stock: 7 }, [saved]), 5);
  assert.equal(availableVariantStock({ ...saved, stock: 1 }, [saved]), 0);
});

test("API validation details are readable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ status: "error", error: { message: "Validation failed.", details: { stock: ["Must be a whole number."] } } }), { status: 400 }));
  await assert.rejects(api.saveProduct("row", { stock: 1.5 }), /stock: Must be a whole number/);
});

test("API reports non-JSON server failures without a JSON syntax error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("Bad gateway", { status: 502 }));
  await assert.rejects(api.product("row"), /502/);
});

test("gallery upload uses multipart PATCH with repeated gallery_images", async (t) => {
  let captured;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    captured = { url, ...init };
    return new Response(JSON.stringify({ status: "success", data: owner }));
  });
  const photo = new File(["image"], "photo.png", { type: "image/png" });
  await api.saveProductMultipart("owner", {}, [{ key: "gallery_images", file: photo }, { key: "gallery_images", file: photo }]);
  assert.equal(captured.url, "/api/products/admin/products/owner/");
  assert.equal(captured.method, "PATCH");
  assert.equal(captured.headers, undefined);
  assert.equal(captured.body.getAll("gallery_images").length, 2);
});

test("expired product request refreshes the enveloped access token and retries", async (t) => {
  const original = globalThis.document;
  globalThis.document = { cookie: "" };
  t.after(() => { if (original === undefined) delete globalThis.document; else globalThis.document = original; });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    if (calls === 1) return new Response("", { status: 401 });
    if (url.endsWith("/token/refresh/")) return new Response(JSON.stringify({ status: "success", data: { access: "test-access" } }));
    return new Response(JSON.stringify({ status: "success", data: owner }));
  });
  assert.deepEqual(await api.product("owner"), owner);
  assert.equal(calls, 3);
});

test("zero-stock sizes remain valid", () => {
  assert.equal(validateVariants([{ color: "blue", size: "2y", stock: 0, is_active: true }]), "");
});

test("uploads reject unsupported files and files over five MiB before a request", () => {
  assert.match(validatePhotos([{ name: "photo.gif", type: "image/gif", size: 5 }]), /JPG/i);
  assert.match(validatePhotos([{ name: "photo.png", type: "image/png", size: 5 * 1024 * 1024 + 1 }]), /5 MB/i);
  assert.equal(validatePhotos([{ name: "photo.png", type: "image/png", size: 100 }]), "");
});
