import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { MockPaymentSheet } from '@/components/checkout/MockPaymentSheet';
import { Button, EmptyState, Screen, ScreenHeader, Text, toast } from '@/components/ui';
import { colors, gutter, spacing } from '@/constants/theme';
import { razorpayCheckoutHtml, type RazorpayMessage } from '@/features/checkout/razorpayHtml';
import { friendlyMessage } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { queryKeys } from '@/lib/queryClient';
import { reportPaymentFailure, verifyPayment } from '@/services/payment.service';
import { useCartStore } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';

type Phase = 'paying' | 'verifying' | 'verify-failed' | 'load-failed';

export default function PaymentScreen() {
  const session = useCheckoutStore((s) => s.session);
  const fromCart = useCheckoutStore((s) => s.signature !== null);
  const resetCheckout = useCheckoutStore((s) => s.reset);
  const clearCart = useCartStore((s) => s.clear);
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>('paying');
  const [lastResult, setLastResult] = useState<Extract<RazorpayMessage, { type: 'success' }> | null>(null);
  const html = useRef(session ? razorpayCheckoutHtml(session) : '').current;

  const verify = useMutation({
    mutationFn: verifyPayment,
    onSuccess: ({ order }) => {
      haptics.success();
      qc.setQueryData(queryKeys.order(order.id), order);
      void qc.invalidateQueries({ queryKey: queryKeys.orders });
      if (fromCart) clearCart();
      resetCheckout();
      router.dismissAll();
      router.push(`/order-success/${order.id}`);
    },
    onError: () => {
      haptics.error();
      setPhase('verify-failed');
    },
  });

  if (!session) return <Redirect href="/cart" />;

  const runVerify = (result: Extract<RazorpayMessage, { type: 'success' }>) => {
    setPhase('verifying');
    verify.mutate({
      orderId: session.orderId,
      razorpayOrderId: result.orderId,
      razorpayPaymentId: result.paymentId,
      razorpaySignature: result.signature,
    });
  };

  const leave = (message?: string) => {
    if (message) toast.info(message);
    if (router.canGoBack()) router.back();
    else router.replace('/cart');
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      handleResult(JSON.parse(event.nativeEvent.data) as RazorpayMessage);
    } catch {
      // Ignore non-JSON messages from the page.
    }
  };

  /** Shared by the Razorpay WebView and the local-dev mock sheet. */
  const handleResult = (msg: RazorpayMessage) => {
    switch (msg.type) {
      case 'success':
        setLastResult(msg);
        runVerify(msg);
        break;
      case 'failed':
        // Razorpay keeps its sheet open so the customer can retry another method.
        haptics.error();
        void reportPaymentFailure({
          orderId: session.orderId,
          razorpayOrderId: session.razorpayOrderId,
          razorpayPaymentId: msg.paymentId,
          code: msg.code,
          description: msg.description,
        }).catch(() => {});
        break;
      case 'dismiss':
        void reportPaymentFailure({
          orderId: session.orderId,
          razorpayOrderId: session.razorpayOrderId,
          code: 'PAYMENT_CANCELLED',
          description: 'Customer closed the payment window',
        }).catch(() => {});
        leave('Payment cancelled. Your cart is saved.');
        break;
      case 'error':
        setPhase('load-failed');
        break;
    }
  };

  if (phase === 'verifying') {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.caramel} />
          <Text variant="h2" align="center">
            Confirming your payment
          </Text>
          <Text variant="body" color={colors.textMuted} align="center">
            This only takes a moment. Please don’t close the app.
          </Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'verify-failed') {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Payment not confirmed"
          message={`${friendlyMessage(verify.error)} If money was deducted, it will be confirmed automatically or refunded.`}
          actionLabel="Try again"
          onAction={() => lastResult && runVerify(lastResult)}
        />
        <View style={styles.secondary}>
          <Button
            label="View my order"
            variant="ghost"
            onPress={() => {
              resetCheckout();
              router.dismissAll();
              router.push(`/orders/${session.orderId}`);
            }}
          />
        </View>
      </Screen>
    );
  }

  if (phase === 'load-failed') {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader closeIcon onBack={() => leave()} />
        <EmptyState
          icon="cloud-offline-outline"
          title="Payment didn’t load"
          message="We couldn’t reach Razorpay. Check your connection and try again — you haven’t been charged."
          actionLabel="Back to checkout"
          onAction={() => leave()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']} background={colors.cream}>
      <ScreenHeader title="Secure Payment" subtitle={`Order #${session.orderNumber}`} closeIcon onBack={() => leave('Payment cancelled. Your cart is saved.')} />
      {session.provider === 'mock' ? (
        <MockPaymentSheet session={session} onResult={handleResult} />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://checkout.razorpay.com/' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.caramel} />
            </View>
          )}
          onShouldStartLoadWithRequest={(req) => {
            // UPI apps (gpay://, phonepe://, upi://…) must open outside the WebView.
            if (!/^(https?|about|data|blob):/i.test(req.url)) {
              Linking.openURL(req.url).catch(() => toast.error('That payment app isn’t installed.'));
              return false;
            }
            return true;
          }}
          onError={() => setPhase('load-failed')}
          style={styles.webview}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: gutter * 2 },
  secondary: { paddingBottom: spacing.xxl, alignItems: 'center' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  webview: { flex: 1, backgroundColor: colors.cream },
});
