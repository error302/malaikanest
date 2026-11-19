async function check() {
  const res = await fetch('https://malaikanest.com/');
  const html = await res.text();
  console.log('HTML length on home:', html.length);
  const prodHrefs = [...html.matchAll(/href="(\/products\/[^"?]+)"/g)].map(m => m[1]);
  console.log('Product hrefs on home:', [...new Set(prodHrefs)]);
}
check();
