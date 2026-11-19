'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';
import api, { handleApiError, getPaymentStatusByCheckoutId } from '@/lib/api';
import { validateCheckoutForm, createCheckoutOrder, initiatePayment } from '@/lib/checkout';
import { getDeliveryZones } from '@/lib/delivery';
import type { DeliveryZone } from '@/lib/delivery';
import { getPublicSettings } from '@/lib/public-settings';
import type { PublicSettings } from '@/lib/public-settings';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { CheckoutContactForm } from '@/components/malaika/checkout/CheckoutContactForm';
import { CheckoutShippingForm } from '@/components/malaika/checkout/CheckoutShippingForm';
import { CheckoutPaymentMethods } from '@/components/malaika/checkout/CheckoutPaymentMethods';
import { CheckoutOrderSummary } from '@/components/malaika/checkout/CheckoutOrderSummary';

export default function CheckoutPage() {
  const { t } = useI18n();
  const { items } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [settings, setSettings] = useState<PublicSettings>({ free_shipping_threshold: '10000', shipping_fee: '300' });
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
    address: '', city: '', postalCode: '', notes: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
  const freeThreshold = Number(settings.free_shipping_threshold) || 10000;
  const deliveryFee = !regionObj ? 0 : subtotal >= freeThreshold ? 0 : Number(regionObj.fee || 0);
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + deliveryFee - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCheckoutForm({
      region,
      agreedToTerms,
      payment,
      tillCode,
      chooseDeliveryMessage: t('checkout.chooseDelivery'),
    });
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createCheckoutOrder({
        form,
        region,
        payment,
        tillCode,
        appliedCoupon,
        isAuthenticated,
      });

      showToast('Order created! Processing payment…', 'success');

      const paymentResult = await initiatePayment({ payment, order, form });
      switch (paymentResult.type) {
        case 'mpesa_prompt':
          showToast('M-Pesa prompt sent to your phone. Enter your PIN to complete payment.', 'success');
          setPaymentPending(true);
          setCheckoutRequestId(paymentResult.checkoutRequestId);
          setPendingReceiptNumber(paymentResult.receiptNumber);
          setPendingCheckoutToken(paymentResult.checkoutToken);
          setPaymentPollingError(null);
          break;
        case 'redirect_window':
          showToast('Opening Pesapal… complete payment to confirm your order.', 'success');
          window.open(paymentResult.redirectUrl, '_blank');
          router.push(paymentResult.successUrl);
          break;
        case 'redirect_location':
          window.location.href = paymentResult.url;
          break;
        case 'success_navigation':
          showToast(paymentResult.message, 'success');
          router.push(paymentResult.successUrl);
          break;
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
        <div className="lg:col-span-2 space-y-6">
          <CheckoutContactForm
            form={form}
            onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
            t={t}
          />
          <CheckoutShippingForm
            form={form}
            onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
            region={region}
            onRegionChange={setRegion}
            zones={zones}
            t={t}
          />
          <CheckoutPaymentMethods
            payment={payment}
            onPaymentChange={setPayment}
            tillCode={tillCode}
            onTillCodeChange={setTillCode}
            itemsTotal={subtotal}
            deliveryFee={deliveryFee}
            t={t}
          />
        </div>

        <CheckoutOrderSummary
          items={items}
          subtotal={subtotal}
          freeThreshold={freeThreshold}
          region={region}
          deliveryFee={deliveryFee}
          discountAmount={discountAmount}
          total={total}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          appliedCoupon={appliedCoupon}
          couponLoading={couponLoading}
          couponError={couponError}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          agreedToTerms={agreedToTerms}
          setAgreedToTerms={setAgreedToTerms}
          submitting={submitting}
          paymentPending={paymentPending}
          paymentPollingError={paymentPollingError}
          onCancelPaymentPending={() => {
            setPaymentPending(false);
            setCheckoutRequestId(null);
            setPaymentPollingError(null);
            setPendingReceiptNumber(null);
          }}
          t={t}
        />
      </form>
    </div>
  );
}
