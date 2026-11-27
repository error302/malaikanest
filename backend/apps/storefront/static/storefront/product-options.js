(() => {
  const form = document.getElementById("pdp-add-form");
  const quantity = form?.elements.quantity;
  const status = document.getElementById("pdp-availability");
  const buttonLabel = document.getElementById("pdp-bag-label");
  if (!form?.querySelector("[name=variant_id]") || !quantity || !status || !buttonLabel) return;

  function showSelection() {
    const selected = form.querySelector("[name=variant_id]:checked:not(:disabled)");
    if (!selected) return;
    const stock = Number(selected.dataset.stock);
    if (!Number.isInteger(stock) || stock < 1) return;
    quantity.max = String(stock);
    if (Number(quantity.value) > stock) quantity.value = String(stock);
    status.textContent = stock + " available";
    buttonLabel.textContent = "Add to Bag · " + selected.dataset.price;
  }
  form.addEventListener("change", event => {
    if (event.target.name === "variant_id") showSelection();
  });
  window.addEventListener("pageshow", showSelection);
  showSelection();
})();
