import { formatPrice } from '@food/config';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { FoodImage } from '@/components/product/FoodImage';
import { IconButton, PressableScale, QuantityStepper, Text, VegIndicator } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { CartLine } from '@/store/cart.store';
import { useCartStore } from '@/store/cart.store';

export function CartLineItem({ line, issue }: { line: CartLine; issue?: string }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  return (
    <Animated.View layout={LinearTransition.duration(220)} exiting={FadeOut.duration(180)} style={[styles.row, issue && styles.rowIssue]}>
      <PressableScale onPress={() => router.push(`/product/${line.productId}`)} accessibilityLabel={`View ${line.name}`}>
        <FoodImage uri={line.imageUrl} width={84} style={styles.image} />
      </PressableScale>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <VegIndicator isVeg={line.isVeg} size={12} />
          <Text variant="title" numberOfLines={1} style={styles.flex}>
            {line.name}
          </Text>
          <IconButton icon="trash-outline" variant="plain" size={18} color={colors.textSubtle} accessibilityLabel={`Remove ${line.name}`} onPress={() => remove(line.key)} style={styles.remove} />
        </View>
        {line.optionsLabel ? (
          <Text variant="caption" color={colors.textMuted} numberOfLines={2}>
            {line.optionsLabel}
          </Text>
        ) : null}
        {issue ? (
          <Text variant="caption" color={colors.danger}>
            {issue}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text variant="price">{formatPrice(Math.round(line.unitPrice * line.quantity * 100) / 100)}</Text>
          <QuantityStepper size="sm" min={0} value={line.quantity} onChange={(q) => setQuantity(line.key, q)} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowIssue: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  image: { width: 84, height: 84, borderRadius: radius.md },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  remove: { width: 32, height: 32, marginRight: -6, marginTop: -6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
});
