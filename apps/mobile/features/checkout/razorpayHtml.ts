import type { CheckoutSession } from '@food/shared-types';
import { colors } from '@/constants/theme';

/**
 * Razorpay Standard Checkout rendered inside a WebView. Works in Expo Go and
 * production builds without a native module. Only the PUBLIC key id is used
 * here; the result is verified by the backend before the order is confirmed.
 */
export function razorpayCheckoutHtml(session: CheckoutSession): string {
  const options = {
    key: session.keyId,
    amount: session.amountPaise,
    currency: session.currency,
    name: session.businessName,
    description: session.description,
    order_id: session.razorpayOrderId,
    prefill: session.prefill,
    notes: { orderId: session.orderId },
    theme: { color: colors.espresso, backdrop_color: colors.cream },
    retry: { enabled: true, max_count: 3 },
  };

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; height: 100%; background: ${colors.cream}; font-family: -apple-system, Roboto, sans-serif; }
  .wrap { height: 100%; display: flex; align-items: center; justify-content: center; color: ${colors.textMuted}; font-size: 14px; }
</style>
</head>
<body>
<div class="wrap" id="status">Opening secure payment…</div>
<script>
  function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  window.onerror = function (m) { post({ type: 'error', message: String(m) }); };
</script>
<script src="https://checkout.razorpay.com/v1/checkout.js"
        onerror="post({ type: 'error', message: 'Could not load Razorpay. Check your connection.' })"></script>
<script>
  (function () {
    if (!window.Razorpay) return;
    var options = ${JSON.stringify(options)};
    options.handler = function (res) {
      document.getElementById('status').textContent = 'Confirming payment…';
      post({ type: 'success', paymentId: res.razorpay_payment_id, orderId: res.razorpay_order_id, signature: res.razorpay_signature });
    };
    options.modal = {
      ondismiss: function () { post({ type: 'dismiss' }); },
      confirm_close: true,
      escape: false,
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (res) {
      var e = res && res.error ? res.error : {};
      post({ type: 'failed', code: e.code, description: e.description, paymentId: e.metadata && e.metadata.payment_id });
    });
    rzp.open();
  })();
</script>
</body>
</html>`;
}

export type RazorpayMessage =
  | { type: 'success'; paymentId: string; orderId: string; signature: string }
  | { type: 'failed'; code?: string; description?: string; paymentId?: string }
  | { type: 'dismiss' }
  | { type: 'error'; message: string };
