'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Smartphone, Banknote, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';
import api, { handleApiError } from '@/lib/api';

const DELIVERY_REGIONS = [
  { value: 'mombasa', label: 'Mombasa (Same Day)', fee: 0 },
  { value: 'nairobi', label: 'Nairobi (1-2 Days)', fee: 300 },
  { value: 'upcountry', label: 'Upcountry (2-3 Days)', fee: 500 },
];

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa', Icon: Smartphone, desc: 'Pay via STK push to your phone' },
  { value: 'card', label: 'Credit / Debit Card', Icon: CreditCard, desc: 'Visa, Mastercard accepted' },
  { value: 'cash', label: 'Cash on Delivery', Icon: Banknote, desc: 'Pay when your order arrives' },
];

export default function CheckoutPage() {
  const { items } = useCart();
  const router = useRouter();
  const [region, setRegion] = useState('nairobi');
  const [payment, setPayment] = useState('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '',
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const regionObj = DELIVERY_REGIONS.find((r) => r.value === region)!;
  const deliveryFee = subtotal >= 3000 ? 0 : regionObj.fee;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Step 1: Create the order via Django backend
      const orderPayload = {
        delivery_region: region,
        shipping_first_name: form.firstName,
        shipping_last_name: form.lastName,
        shipping_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal_code: form.postalCode,
        guest_email: form.email,
        guest_phone: form.phone,
        payment_method: payment,
      };

      const orderRes = await api.post('/api/v1/orders/create/', orderPayload);
      const orderData = orderRes.data?.data ?? orderRes.data;
      const orderId = orderData?.id || orderData?.order_id;
      const receiptNumber = orderData?.receipt_number;

      if (!orderId) {
        throw new Error('No order ID returned from server');
      }

      showToast('Order created! Processing payment…', 'success');

      // Step 2: Initiate payment based on method
      if (payment === 'mpesa') {
        // Initiate M-Pesa STK push
        const mpesaRes = await api.post('/api/v1/payments/mpesa/initiate/', {
          order_id: orderId,
          phone_number: form.phone,
        });
        const mpesaData = mpesaRes.data?.data ?? mpesaRes.data;

        // Check if STK push was initiated
        if (mpesaData?.checkout_request_id || mpesaRes.status === 200) {
          showToast('M-Pesa prompt sent to your phone. Enter your PIN to complete payment.', 'success');
          // Redirect to success page — the backend will confirm payment via callback
          router.push(`/checkout/success?order=${receiptNumber}`);
        } else {
          throw new Error(mpesaData?.message || 'M-Pesa initiation failed');
        }
      } else if (payment === 'card') {
        // Card payment — redirect to payment gateway if URL provided
        const cardData = orderData;
        if (cardData?.payment_url) {
          window.location.href = cardData.payment_url;
        } else {
          showToast('Order placed! We will send payment instructions by email.', 'success');
          router.push(`/checkout/success?order=${receiptNumber}`);
        }
      } else {
        // Cash on delivery or bank transfer
        showToast('Order placed! We will contact you to arrange payment.', 'success');
        router.push(`/checkout/success?order=${receiptNumber}`);
      }
    } catch (err: any) {
      const msg = handleApiError(err, 'Failed to place order. Please try again.');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-shell py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Nothing to check out
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-secondary)' }}>
          Your cart is empty. Add some products first.
        </p>
        <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          Browse Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Contact Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="tel" placeholder="Phone (+2547XXXXXXXX)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
          </section>

          {/* Shipping */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Shipping Address
            </h2>
            <div className="space-y-3">
              <input required placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
                <input placeholder="Postal code (optional)" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-warm w-full !pl-4"
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-label="Delivery region"
              >
                {DELIVERY_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — KES {r.fee}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Payment */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Payment Method
            </h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ value, label, Icon, desc }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${payment === value ? 'ring-2' : ''}`}
                  style={{
                    borderColor: payment === value ? 'var(--brand-gold)' : 'var(--brand-border)',
                    background: payment === value ? 'rgba(139,105,20,0.04)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={payment === value}
                    onChange={(e) => setPayment(e.target.value)}
                    className="sr-only"
                  />
                  <Icon size={20} style={{ color: 'var(--brand-gold)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: payment === value ? 'var(--brand-gold)' : 'var(--brand-border)' }}>
                    {payment === value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />}
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Your Order
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
                  <span className="truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                  <span>KES {(item.price * item.qty).toLocaleString('en-KE')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm pt-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>Subtotal</span><span>KES {subtotal.toLocaleString('en-KE')}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `KES ${deliveryFee.toLocaleString('en-KE')}`}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-3" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
                <span>Total</span><span>KES {total.toLocaleString('en-KE')}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {submitting ? 'Processing…' : <>Place Order <Lock size={14} /></>}
            </button>
            <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--brand-text-muted)' }}>
              Secured by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
