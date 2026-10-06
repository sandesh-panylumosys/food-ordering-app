import { calculateOrderTotals, formatPrice } from '@food/config';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { FreeDeliveryProgress, PriceBreakdown } from '@/components/cart/PriceBreakdown';
import { BottomBar, Button, EmptyState, PressableScale, Screen, Text } from '@/components/ui';
import { colors, gutter, spacing } from '@/constants/theme';
import { useCartQuote } from '@/features/cart/useCartQuote';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useCartCount, useCartStore, useCartSubtotal } from '@/store/cart.store';

export default function CartScreen() {
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const count = useCartCount();
  const localSubtotal = useCartSubtotal();
  const quote = useCartQuote();
  const requireAuth = useRequireAuth();

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="bag-handle-outline"
          title="Cart Empty"
          message="Looks like you haven’t added anything delicious yet."
          actionLabel="Explore Menu"
          onAction={() => router.navigate('/menu')}
        />
      </Screen>
    );
  }

  // Server pricing is authoritative; fall back to a local estimate while it loads.
  const totals = quote.data?.totals ?? calculateOrderTotals(localSubtotal);
  const issues = new Map(quote.data?.issues.map((i) => [i.productId, i.message]));
  const hasIssues = issues.size > 0;

  const confirmClear = () =>
    Alert.alert('Clear cart?', 'This removes every item from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text variant="overline" color={colors.accentText}>
            {count} {count === 1 ? 'item' : 'items'}
          </Text>
          <Text variant="h1" accessibilityRole="header">
            Your Cart
          </Text>
        </View>
        <PressableScale onPress={confirmClear} accessibilityLabel="Clear cart" style={styles.clear}>
          <Text variant="caption" color={colors.textMuted}>
            Clear
          </Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FreeDeliveryProgress subtotal={totals.subtotal} />
        <View style={styles.lines}>
          {lines.map((line) => (
            <CartLineItem key={line.key} line={line} issue={issues.get(line.productId)} />
          ))}
        </View>
        <PriceBreakdown totals={totals} estimate={!quote.data} />
        {hasIssues && (
          <Text variant="bodySm" color={colors.danger} align="center">
            Some items are unavailable. Remove them to continue.
          </Text>
        )}
      </ScrollView>

      <BottomBar>
        <Button
          size="lg"
          fullWidth
          label={`Proceed to Checkout · ${formatPrice(totals.total)}`}
          disabled={hasIssues}
          loading={quote.isFetching && !quote.data}
          onPress={() => requireAuth(() => router.push('/checkout'), '/checkout')}
        />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  clear: { padding: spacing.sm },
  content: { paddingHorizontal: gutter, paddingBottom: spacing.xxl, gap: spacing.lg },
  lines: { gap: spacing.md },
});
