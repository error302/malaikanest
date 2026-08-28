'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Smartphone, Lock, ArrowRight, Wallet } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';
import api, { handleApiError, getPaymentStatusByCheckoutId } from '@/lib/api';
import { getDeliveryZones } from '@/lib/delivery';
import type { DeliveryZone } from '@/lib/delivery';
import { getPublicSettings } from '@/lib/public-settings';
import type { PublicSettings } from '@/lib/public-settings';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';

const PAYMENT_METHODS = [
  { value: 'till', labelKey: 'checkout.till', Icon: Smartphone, descKey: 'checkout.tillDesc' },
  { value: 'paypal', labelKey: 'checkout.paypal', Icon: Wallet, descKey: 'checkout.paypalDesc' },
];

export default function CheckoutPage() {
  const { t } = useI18n();
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [settings, setSettings] = useState<PublicSettings>({ free_shipping_threshold: '3000', shipping_fee: '300' });
  const [region, setRegion] = useState('');
  const [payment, setPayment] = useState('till');
  const [submitting, setSubmitting] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentPollingError, setPaymentPollingError] = useState<string | null>(null);
  const [pendingReceiptNumber, setPendingReceiptNumber] = useState<string | null>(null);
  const [pendingCheckoutToken, setPendingCheckoutToken] = useState<string | null>(null);
  const [tillCode, setTillCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; discount_label: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '',
  });

  useEffect(() => {
    Promise.all([getDeliveryZones(), getPublicSettings()]).then(([zones, s]) => {
      if (zones.length > 0) setDeliveryZones(zones);
      setSettings(s);
    });
  }, []);

  useEffect(() => {
    if (!paymentPending || !checkoutRequestId) return;

    let pollCount = 0;
    const MAX_POLLS = 40;
    const POLL_INTERVAL = 3000;

    const poll = async () => {
      try {
        const status = await getPaymentStatusByCheckoutId(checkoutRequestId);
        if (status.status === 'completed' || status.status === 'paid') {
          setPaymentPending(false);
          showToast('Payment confirmed!', 'success');
          router.push(`/checkout/success?order=${pendingReceiptNumber}&status=paid&token=${pendingCheckoutToken}`);
          return;
        }
        if (status.status === 'failed') {
          setPaymentPending(false);
          setPaymentPollingError('Payment failed. Please try again.');
          showToast('M-Pesa payment failed. Please try again.', 'error');
          return;
        }
      } catch {
        // continue polling on error
      }

      pollCount++;
      if (pollCount >= MAX_POLLS) {
        setPaymentPending(false);
        setPaymentPollingError('Payment timed out. Please check your phone and try again.');
        showToast('Payment timed out. Please check your phone and try again.', 'error');
        return;
      }

      setTimeout(poll, POLL_INTERVAL);
    };

    const timeoutId = setTimeout(poll, POLL_INTERVAL);
    return () => clearTimeout(timeoutId);
  }, [paymentPending, checkoutRequestId, router, pendingReceiptNumber, pendingCheckoutToken]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.post('/api/v1/orders/coupon/apply/', { code: couponCode.trim().toUpperCase() });
      const data = res.data?.data ?? res.data;
      if (data?.valid) {
        setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount, discount_label: data.discount_label || `-${data.discount_label}` });
        showToast('Coupon applied!', 'success');
      } else {
        setCouponError(data?.message || 'Invalid or expired coupon');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Coupon not valid';
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const zones = deliveryZones.length > 0 ? deliveryZones : [
    { slug: 'mombasa_pickup', name: 'Mombasa (Pick up at Shop)', fee: '0', estimated_days: 'Same Day' },
    { slug: 'mombasa', name: 'Mombasa (Delivery)', fee: '150', estimated_days: 'Same Day' },
    { slug: 'nairobi', name: 'Nairobi (1-2 Days)', fee: '300', estimated_days: '1-2 Days' },
    { slug: 'upcountry', name: 'Upcountry (2-3 Days)', fee: '500', estimated_days: '2-3 Days' },
  ];
  const regionObj = zones.find((r) => r.slug === region);
  const freeThreshold = Number(settings.free_shipping_threshold) || 3000;
  const deliveryFee = !regionObj ? 0 : subtotal >= freeThreshold ? 0 : Number(regionObj.fee || 0);
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + deliveryFee - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region) {
      showToast(t('checkout.chooseDelivery') || 'Please choose a delivery option.', 'error');
      return;
    }
    if (payment === 'till' && !/^[A-Z0-9]{10}$/.test(tillCode.trim().toUpperCase())) {
      showToast('Enter a valid 10-character M-Pesa transaction code.', 'error');
      return;
    }
    setSubmitting(true);

    try {
      // Step 1: Create the order via Django backend
      const orderPayload: Record<string, any> = {
        delivery_region: region,
        is_guest: !isAuthenticated,
        shipping_name: `${form.firstName} ${form.lastName}`.trim(),
        shipping_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal_code: form.postalCode,
        guest_email: form.email,
        guest_phone: form.phone,
        payment_method: payment,
        coupon_code: appliedCoupon?.code || undefined,
        ...(payment === 'till' ? { mpesa_receipt_number: tillCode.trim().toUpperCase(), till_code: tillCode.trim().toUpperCase() } : {}),
      };

      const orderRes = await api.post('/api/v1/orders/cart/checkout/', orderPayload);
      const orderData = orderRes.data?.data ?? orderRes.data;
      const orderId = orderData?.id || orderData?.order_id;
      const receiptNumber = orderData?.receipt_number;
      const checkoutToken = orderData?.checkout_token;

      if (!orderId) {
        throw new Error('No order ID returned from server');
      }

      showToast('Order created! Processing payment…', 'success');

      // Step 2: Initiate payment based on method
      if (payment === 'mpesa') {
        // Initiate M-Pesa STK push
        const mpesaRes = await api.post('/api/v1/payments/mpesa/initiate/', {
          order_id: orderId,
          phone: form.phone,
        });
        const mpesaData = mpesaRes.data?.data ?? mpesaRes.data;

        // Check if STK push was initiated
        if (mpesaData?.checkout_request_id || mpesaRes.status === 200) {
          showToast('M-Pesa prompt sent to your phone. Enter your PIN to complete payment.', 'success');
          setPaymentPending(true);
          setCheckoutRequestId(mpesaData.checkout_request_id);
          setPendingReceiptNumber(receiptNumber);
          setPendingCheckoutToken(checkoutToken);
          setPaymentPollingError(null);
        } else {
          throw new Error(mpesaData?.message || 'M-Pesa initiation failed');
        }
      } else if (payment === 'pesapal') {
        // Initiate Pesapal order and open the hosted payment page
        const pesapalRes = await api.post('/api/v1/payments/pesapal/initiate/', {
          order_id: orderId,
          phone: form.phone,
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
        });
        const pesapalData = pesapalRes.data?.data ?? pesapalRes.data;

        if (pesapalData?.redirect_url) {
          showToast('Opening Pesapal… complete payment to confirm your order.', 'success');
          // Open the Pesapal hosted page; Pesapal redirects back to our callback
          // which lands the shopper on the success page. We also send the main
          // window there so the order is recorded as placed.
          window.open(pesapalData.redirect_url, '_blank');
          router.push(`/checkout/success?order=${receiptNumber}&token=${checkoutToken}`);
        } else {
          throw new Error(pesapalData?.detail || 'Pesapal initiation failed');
        }
      } else if (payment === 'paypal') {
        // Initiate PayPal order and redirect to PayPal checkout
        const paypalRes = await api.post('/api/v1/payments/paypal/initiate/', {
          order_id: orderId,
        });
        const paypalData = paypalRes.data?.data ?? paypalRes.data;
        if (paypalData?.approval_url || paypalData?.redirect_url || paypalData?.paypal_order_id) {
          const url = paypalData.approval_url || paypalData.redirect_url;
          if (url) {
            window.location.href = url;
          } else {
            showToast('PayPal order created. Follow the PayPal prompt to complete payment.', 'success');
            router.push(`/checkout/success?order=${receiptNumber}&token=${checkoutToken}`);
          }
        } else {
          throw new Error(paypalData?.detail || 'PayPal initiation failed');
        }
      } else if (payment === 'till') {
        showToast('Order placed! We will verify your M-Pesa code (Till 3370347) and confirm shortly.', 'success');
        router.push(`/checkout/success?order=${receiptNumber}&token=${checkoutToken}`);
      } else if (payment === 'card') {
        // Card payment — redirect to payment gateway if URL provided
        const cardData = orderData;
        if (cardData?.payment_url) {
          window.location.href = cardData.payment_url;
        } else {
          showToast('Order placed! We will send payment instructions by email.', 'success');
          router.push(`/checkout/success?order=${receiptNumber}&token=${checkoutToken}`);
        }
      } else {
        // Cash on delivery or bank transfer
        showToast('Order placed! We will contact you to arrange payment.', 'success');
        router.push(`/checkout/success?order=${receiptNumber}&token=${checkoutToken}`);
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
          {t('checkout.empty')}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-secondary)' }}>
          {t('cart.emptySub')}
        </p>
        <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          {t('nav.shop')} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        {t('checkout.title')}
      </h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              {t('checkout.contact')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder={t('checkout.firstName')} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required placeholder={t('checkout.lastName')} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="email" placeholder={t('checkout.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <input required type="tel" placeholder={t('checkout.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
          </section>

          {/* Shipping */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              {t('checkout.shippingAddress')}
            </h2>
            <div className="space-y-3">
              <input required placeholder={t('checkout.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder={t('checkout.city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
                <input placeholder={`${t('checkout.postal')} (${t('common.cancel') === 'Cancel' ? 'optional' : 'hiari'})`} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                className="input-warm w-full !pl-4"
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-label={t('checkout.shippingAddress')}
              >
                <option value="" disabled>{t('checkout.chooseDelivery') || 'Choose delivery option…'}</option>
                {zones.map((r) => (
                  <option key={r.slug} value={r.slug}>{r.name} — KES {Number(r.fee).toLocaleString('en-KE')}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Payment */}
          <section className="p-5 sm:p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              {t('checkout.payment')}
            </h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ value, labelKey, Icon, descKey }) => (
                <div key={value}>
                  <label
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
                      <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{t(labelKey)}</div>
                      <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{t(descKey)}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: payment === value ? 'var(--brand-gold)' : 'var(--brand-border)' }}>
                      {payment === value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />}
                    </div>
                  </label>

                  {payment === 'mpesa' && value === 'mpesa' && (
                    <div className="mt-2.5 p-3 rounded-xl border text-xs space-y-1" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
                      <div className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--brand-gold)' }}>Lipa Na M-Pesa (Buy Goods)</div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--brand-text-secondary)' }}>Till Number:</span>
                        <span className="font-mono font-bold text-sm" style={{ color: 'var(--brand-text)' }}>3370347</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: 'var(--brand-text-secondary)' }}>Store / Shortcode:</span>
                        <span className="font-mono font-medium" style={{ color: 'var(--brand-text-muted)' }}>3104615</span>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                        Enter your phone number above. You will receive an instant STK push prompt on your phone to complete payment.
                      </p>
                    </div>
                  )}
                  {payment === 'till' && value === 'till' && (
                    <div className="mt-2.5 p-3 rounded-xl border text-xs space-y-2" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
                      <div className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--brand-gold)' }}>Manual Till Payment — Ready Now</div>
                      <ol className="list-decimal list-inside space-y-0.5" style={{ color: 'var(--brand-text-secondary)' }}>
                        <li>Go to M-Pesa → Lipa na M-Pesa → Buy Goods and Services</li>
                        <li>Enter Till <span className="font-mono font-bold" style={{ color: 'var(--brand-text)' }}>3370347</span> (Malaika Nest)</li>
                        <li>Enter Amount: <span className="font-mono" style={{ color: 'var(--brand-text)' }}>KES {Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) + (region ? Number(deliveryZones.find(z => z.slug === region)?.fee || 0) : 0)).toLocaleString('en-KE')}</span></li>
                        <li>Enter PIN &amp; Send</li>
                        <li>Paste the 10-char M-Pesa code below (e.g. SHK...)</li>
                      </ol>
                      <input
                        placeholder="M-Pesa Transaction Code (10 chars)"
                        value={tillCode}
                        onChange={(e) => setTillCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                        maxLength={10}
                        className="input-warm w-full !pl-4 font-mono text-sm tracking-wider"
                        style={{ background: '#FFFFFF' }}
                        required={payment === 'till'}
                        pattern="^[A-Z0-9]{10}$"
                      />
                      <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
                        Order will be created as <em>Pending Verification</em>. You’ll verify the SMS code in Admin → Orders → Verify &amp; Mark Paid.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              {t('checkout.orderSummary')}
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
                  <span className="truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                  <span>KES {(item.price * item.qty).toLocaleString('en-KE')}</span>
                </div>
              ))}
            </div>

            {!appliedCoupon && (
              <div className="flex gap-2 py-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                  className="input-warm flex-1 !pl-3 text-xs"
                  style={{ background: 'var(--brand-bg-alt)' }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="px-3 py-2 rounded-full text-xs font-medium disabled:opacity-50"
                  style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-xs pb-2" style={{ color: 'var(--brand-terra)' }}>{couponError}</p>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm py-2" style={{ color: 'var(--brand-green-light)' }}>
                <span>{appliedCoupon.discount_label || `Coupon: ${appliedCoupon.code}`}</span>
                <button type="button" onClick={handleRemoveCoupon} className="text-xs underline" style={{ color: 'var(--brand-text-muted)' }}>Remove</button>
              </div>
            )}

            <div className="space-y-2 text-sm pt-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>{t('cart.subtotal')}</span><span>KES {subtotal.toLocaleString('en-KE')}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>{t('cart.shipping')}{region && deliveryFee === 0 ? ` (${t('cart.shippingFree').toLowerCase()} ${t('checkout.over')} KES ${freeThreshold.toLocaleString('en-KE')})` : ''}</span>
                <span>{!region ? (t('checkout.chooseDelivery') || 'Please choose') : deliveryFee === 0 ? t('cart.shippingFree') : `KES ${deliveryFee.toLocaleString('en-KE')}`}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--brand-green-light)' }}>
                  <span>Discount</span>
                  <span>-KES {discountAmount.toLocaleString('en-KE')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-3" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
                <span>{t('cart.total')}</span><span>KES {total.toLocaleString('en-KE')}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {submitting ? t('checkout.processing') : <>{t('checkout.placeOrder')} <Lock size={14} /></>}
            </button>
            {paymentPending && (
              <div className="mt-4 p-4 rounded-xl border text-center" style={{ background: 'rgba(139,105,20,0.06)', borderColor: 'var(--brand-gold)' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand-gold)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>Waiting for M-Pesa payment…</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--brand-text-secondary)' }}>Check your phone and enter your PIN</p>
                {paymentPollingError ? (
                  <p className="text-xs text-red-600 mb-3">{paymentPollingError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentPending(false);
                    setCheckoutRequestId(null);
                    setPaymentPollingError(null);
                    setPendingReceiptNumber(null);
                  }}
                  className="text-xs underline"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  Cancel and try again
                </button>
              </div>
            )}
            <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--brand-text-muted)' }}>
              {t('checkout.secured')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
