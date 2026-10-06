import { formatPrice, PRICING } from '@food/config';
import type { OrderTotals } from '@food/shared-types';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'title' : 'body'} color={muted ? colors.textMuted : colors.text}>
        {label}
      </Text>
      <Text variant={strong ? 'price' : 'body'} color={muted ? colors.textMuted : colors.text}>
        {value}
      </Text>
    </View>
  );
}

export function PriceBreakdown({ totals, estimate }: { totals: OrderTotals; estimate?: boolean }) {
  return (
    <View style={styles.card} accessibilityLabel={`Total ${formatPrice(totals.total)}`}>
      <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
      <Row label="Delivery fee" value={totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)} muted />
      {totals.discount > 0 && <Row label="Discount" value={`− ${formatPrice(totals.discount)}`} muted />}
      <Row label={`Taxes (${Math.round(PRICING.taxRate * 100)}% GST)`} value={formatPrice(totals.tax)} muted />
      <Divider style={styles.divider} />
      <Row label={estimate ? 'Estimated total' : 'Total'} value={formatPrice(totals.total)} strong />
    </View>
  );
}

export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const remaining = PRICING.freeDeliveryThreshold - subtotal;
  const progress = Math.min(subtotal / PRICING.freeDeliveryThreshold, 1);
  return (
    <View style={styles.progressCard}>
      <Text variant="caption" color={remaining > 0 ? colors.text : colors.success}>
        {remaining > 0 ? `Add ${formatPrice(Math.ceil(remaining))} more for free delivery` : 'You’ve unlocked free delivery'}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: remaining > 0 ? colors.caramel : colors.success }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { marginVertical: spacing.xs },
  progressCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warmWhite, borderWidth: 1, borderColor: colors.border },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
