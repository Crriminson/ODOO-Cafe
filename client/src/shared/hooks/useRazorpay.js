import { request } from '../api/client.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const initiatePayment = async ({
    amount,
    posOrderId,
    customerName,
    couponCode,
    loyaltyPointsToRedeem,
    tip,
    onSuccess,
    onFailure,
  }) => {
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        return onFailure?.('Could not load Razorpay payment SDK');
      }

      // 1. Create Razorpay order on server
      const orderRes = await request('/payments/razorpay/create-order', {
        method: 'POST',
        body: { amount: String(amount), orderId: posOrderId },
      });

      const { razorpayOrderId, keyId } = orderRes;

      // 2. Open Razorpay Checkout overlay
      const options = {
        key: envKeyId(keyId), // Fallback if keyId is not returned or returned differently
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        name: 'Odoo Cafe',
        description: `Order #${posOrderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: customerName || '',
        },
        theme: {
          color: '#1A1A1A',
        },
        handler: async (response) => {
          try {
            // 3. Verify signature on backend
            const verifyRes = await request('/payments/razorpay/verify', {
              method: 'POST',
              body: {
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                posOrderId,
                couponCode:        couponCode || null,
                loyaltyPointsToRedeem: loyaltyPointsToRedeem || 0,
                tip:               tip || '0.00',
              },
            });

            if (verifyRes.success) {
              onSuccess?.(verifyRes);
            } else {
              onFailure?.('Verification failed');
            }
          } catch (err) {
            onFailure?.(err.message || 'Signature verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            onFailure?.('Payment cancelled by user');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onFailure?.(err.message || 'Failed to initiate Razorpay checkout');
    }
  };

  return { initiatePayment };
}

// Helper to resolve client VITE_RAZORPAY_KEY_ID or fallback to backend keyId
function envKeyId(keyId) {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || keyId;
}
