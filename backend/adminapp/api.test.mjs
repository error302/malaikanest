import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
async function client() {
  const source = await readFile(new URL("./src/api.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText + `\n// ${Math.random()}`).toString("base64")}`);
}
const json = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { "Content-Type": "application/json" } });
test("concurrent expired requests share one refresh and recover the session", async () => {
  const { api } = await client();
  let refreshed = false, refreshes = 0;
  global.document = { cookie: "csrftoken=test" };
  global.fetch = async url => {
    if (url.includes("token/refresh")) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); refreshed = true; return json({ access: "renewed" }); }
    return refreshed ? json({ is_staff: true }) : json({}, 401);
  };
  await Promise.all([api.session(), api.analytics()]);
  assert.equal(refreshes, 1);
});
test("failed logout retains authentication and reports failure", async () => {
  const { api } = await client();
  global.document = { cookie: "access_token=keep; csrftoken=test" };
  global.fetch = async () => { throw new TypeError("network down"); };
  await assert.rejects(api.logout(), /Check the saved record/);
  assert.match(document.cookie, /access_token=keep/);
});
test("mutations include CSRF and are never replayed after network failure", async () => {
  const { api } = await client();
  global.document = { cookie: "csrftoken=example" };
  let calls = 0;
  global.fetch = async (_url, init) => { calls++; assert.equal(init.headers["X-CSRFToken"], "example"); throw new TypeError("disconnected"); };
  await assert.rejects(api.saveProduct(null, { name: "Draft" }), /may have reached/);
  assert.equal(calls, 1);
});
