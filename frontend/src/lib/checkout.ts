import api from '@/lib/api';

export interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}

export interface AppliedCoupon {
  code: string;
  discount_amount: number;
  discount_label: string;
}

export interface OrderCreationResult {
  orderId: string | number;
  receiptNumber: string;
  checkoutToken: string;
  orderData: Record<string, any>;
}

export type PaymentExecutionResult =
  | {
      type: 'mpesa_prompt';
      checkoutRequestId: string;
      receiptNumber: string;
      checkoutToken: string;
    }
  | {
      type: 'redirect_window';
      redirectUrl: string;
      successUrl: string;
    }
  | {
      type: 'redirect_location';
      url: string;
    }
  | {
      type: 'success_navigation';
      message: string;
      successUrl: string;
    };

export function validateCheckoutForm(params: {
  region: string;
  agreedToTerms: boolean;
  payment: string;
  tillCode: string;
  chooseDeliveryMessage?: string;
}): string | null {
  if (!params.region) {
    return params.chooseDeliveryMessage || 'Please choose a delivery option.';
  }
  if (!params.agreedToTerms) {
    return 'Please agree to the Terms of Service & 72-Hour Return Policy to proceed.';
  }
  if (params.payment === 'till' && !/^[A-Z0-9]{10}$/.test(params.tillCode.trim().toUpperCase())) {
    return 'Enter a valid 10-character M-Pesa transaction code.';
  }
  return null;
}

export async function createCheckoutOrder(params: {
  form: CheckoutFormState;
  region: string;
  payment: string;
  tillCode: string;
  appliedCoupon: AppliedCoupon | null;
  isAuthenticated: boolean;
}): Promise<OrderCreationResult> {
  const cleanTill = params.tillCode.trim().toUpperCase();
  const orderPayload: Record<string, any> = {
    delivery_region: params.region,
    is_guest: !params.isAuthenticated,
    shipping_name: `${params.form.firstName} ${params.form.lastName}`.trim(),
    shipping_phone: params.form.phone,
    shipping_address: params.form.address,
    shipping_city: params.form.city,
    shipping_postal_code: params.form.postalCode,
    notes: params.form.notes,
    guest_email: params.form.email,
    guest_phone: params.form.phone,
    payment_method: params.payment,
    coupon_code: params.appliedCoupon?.code || undefined,
    ...(params.payment === 'till' ? { mpesa_receipt_number: cleanTill, till_code: cleanTill } : {}),
  };

  const orderRes = await api.post('/api/v1/orders/cart/checkout/', orderPayload);
  const orderData = orderRes.data?.data ?? orderRes.data;
  const orderId = orderData?.id || orderData?.order_id;
  const receiptNumber = orderData?.receipt_number;
  const checkoutToken = orderData?.checkout_token;

  if (!orderId) {
    throw new Error('No order ID returned from server');
  }

  return {
    orderId,
    receiptNumber,
    checkoutToken,
    orderData,
  };
}

export async function initiatePayment(params: {
  payment: string;
  order: OrderCreationResult;
  form: CheckoutFormState;
}): Promise<PaymentExecutionResult> {
  const { payment, order, form } = params;
  const { orderId, receiptNumber, checkoutToken, orderData } = order;
  const successUrl = `/checkout/success?order=${receiptNumber}&token=${checkoutToken}`;

  switch (payment) {
    case 'mpesa': {
      const res = await api.post('/api/v1/payments/mpesa/initiate/', {
        order_id: orderId,
        phone: form.phone,
      });
      const data = res.data?.data ?? res.data;
      if (data?.checkout_request_id || res.status === 200) {
        return {
          type: 'mpesa_prompt',
          checkoutRequestId: data.checkout_request_id,
          receiptNumber,
          checkoutToken,
        };
      }
      throw new Error(data?.message || 'M-Pesa initiation failed');
    }

    case 'pesapal': {
      const res = await api.post('/api/v1/payments/pesapal/initiate/', {
        order_id: orderId,
        phone: form.phone,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
      });
      const data = res.data?.data ?? res.data;
      if (data?.redirect_url) {
        return {
          type: 'redirect_window',
          redirectUrl: data.redirect_url,
          successUrl,
        };
      }
      throw new Error(data?.detail || 'Pesapal initiation failed');
    }

    case 'paypal': {
      const res = await api.post('/api/v1/payments/paypal/initiate/', {
        order_id: orderId,
      });
      const data = res.data?.data ?? res.data;
      const url = data?.approval_url || data?.redirect_url;
      if (url) {
        return { type: 'redirect_location', url };
      }
      if (data?.paypal_order_id) {
        return {
          type: 'success_navigation',
          message: 'PayPal order created. Follow the PayPal prompt to complete payment.',
          successUrl,
        };
      }
      throw new Error(data?.detail || 'PayPal initiation failed');
    }

    case 'till':
      return {
        type: 'success_navigation',
        message: 'Order placed! We will verify your M-Pesa code (Till 3370347) and confirm shortly.',
        successUrl,
      };

    case 'card':
      if (orderData?.payment_url) {
        return { type: 'redirect_location', url: orderData.payment_url };
      }
      return {
        type: 'success_navigation',
        message: 'Order placed! We will send payment instructions by email.',
        successUrl,
      };

    default:
      return {
        type: 'success_navigation',
        message: 'Order placed! We will contact you to arrange payment.',
        successUrl,
      };
  }
}
