import { formatPrice } from '@food/config';
import type { Product } from '@food/shared-types';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FoodImage } from '@/components/product/FoodImage';
import { PressableScale, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

export const OFFER_CARD_WIDTH = 290;

/** Dark, limited-time offer tile. */
export function OfferCard({ product }: { product: Product }) {
  const saving = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  return (
    <PressableScale
      onPress={() => router.push(`/product/${product.id}`)}
      accessibilityLabel={`${product.name}, ${saving}% off, now ${formatPrice(product.price)}`}
      style={styles.card}
    >
      <View style={styles.copy}>
        <Text variant="overline" color={colors.beige}>
          {saving}% off · today
        </Text>
        <Text variant="h3" color={colors.textOnDark} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.prices}>
          <Text variant="price" color={colors.textOnDark}>
            {formatPrice(product.price)}
          </Text>
          {product.compareAtPrice != null && (
            <Text variant="caption" color={colors.textOnDarkMuted} style={styles.strike}>
              {formatPrice(product.compareAtPrice)}
            </Text>
          )}
        </View>
      </View>
      <FoodImage uri={product.imageUrl} width={120} style={styles.image} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    width: OFFER_CARD_WIDTH,
    height: 148,
    flexDirection: 'row',
    backgroundColor: colors.espresso,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  copy: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  prices: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  strike: { textDecorationLine: 'line-through' },
  image: { width: 120, height: '100%', borderTopLeftRadius: 80, borderBottomLeftRadius: 80 },
});
