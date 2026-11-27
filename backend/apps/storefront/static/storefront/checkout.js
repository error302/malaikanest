(() => {
  const form = document.getElementById("checkoutForm");
  const region = form.elements.delivery_region;
  const address = document.getElementById("checkout-address");
  const locality = document.getElementById("checkout-locality");
  const pickup = document.getElementById("checkout-pickup");
  const override = document.getElementById("checkout-mpesa-phone");
  const gift = document.getElementById("checkout-gift-message");
  const feeOutput = document.getElementById("checkout-fee");
  const totalOutput = document.getElementById("checkout-total");
  const pay = document.getElementById("checkout-pay");
  const fees = JSON.parse(document.getElementById(form.dataset.regionFeesId).textContent);
  const subtotal = Number(form.dataset.subtotal);
  const discount = Number(form.dataset.discount);
  const threshold = Number(form.dataset.threshold);
  const money = (amount) => "KES " + amount.toLocaleString("en-KE", { maximumFractionDigits: 2 });
  const cents = (amount) => Math.round(amount * 100);

  function update() {
    const isPickup = region.value === "mombasa_pickup";
    const isPayPal = form.elements.payment_method.value === "paypal";
    address.hidden = isPickup;
    locality.hidden = isPickup;
    pickup.hidden = !isPickup;
    for (const group of [address, locality]) {
      for (const field of group.querySelectorAll("input")) field.disabled = isPickup;
    }
    form.elements.shipping_address.required = !isPickup;
    override.hidden = isPayPal;
    form.elements.mpesa_phone.disabled = isPayPal;
    gift.hidden = !form.elements.is_gift.checked;
    form.elements.gift_message.disabled = gift.hidden;

    const fee = subtotal > 0 && subtotal >= threshold ? 0 : Number(fees[region.value]);
    feeOutput.textContent = fee ? money(fee) : "FREE";
    totalOutput.textContent = money(Math.round((Math.max(0, cents(subtotal) - cents(discount)) + cents(fee)) / 100));
    pay.textContent = isPayPal ? "Continue to PayPal" : "Pay with M-Pesa";
  }

  form.addEventListener("change", update);
  window.addEventListener("pageshow", update);
  update();
})();
