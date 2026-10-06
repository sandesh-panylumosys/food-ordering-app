import type { Product } from '@food/shared-types';
import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Badge, PressableScale, Text, VegIndicator } from '@/components/ui';
import { colors, gutter, radius, shadows, spacing } from '@/constants/theme';
import { AddButton } from './AddButton';
import { FavoriteButton } from './FavoriteButton';
import { FoodImage } from './FoodImage';
import { Price } from './Price';
import { Rating } from './Rating';

/** Full-width editorial card for the menu — large photography, magazine-style type. */
export function ProductFeatureCard({ product }: { product: Product }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - gutter * 2, 560);
  const onOffer = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <PressableScale
      onPress={() => router.push(`/product/${product.id}`)}
      accessibilityLabel={`${product.name}, ${product.shortDescription}`}
      scaleTo={0.985}
      style={[styles.card, { width: cardWidth }]}
    >
      <View>
        <FoodImage uri={product.imageUrl} width={cardWidth} style={[styles.image, { height: cardWidth * 0.62 }]} />
        <FavoriteButton product={product} style={styles.heart} />
        <View style={styles.badges}>
          {product.isBestseller && <Badge label="Bestseller" tone="dark" />}
          {onOffer && <Badge label="Limited offer" tone="accent" />}
        </View>
        {!product.isAvailable && (
          <View style={styles.soldOut}>
            <Text variant="overline" color={colors.textOnDark}>
              Sold out today
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="h3" numberOfLines={1} style={styles.flex}>
            {product.name}
          </Text>
          <VegIndicator isVeg={product.isVeg} />
        </View>
        <Text variant="bodySm" color={colors.textMuted} numberOfLines={2}>
          {product.shortDescription}
        </Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Price price={product.price} compareAt={product.compareAtPrice} />
            <Rating value={product.rating} count={product.ratingCount} />
          </View>
          <AddButton product={product} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: { width: '100%' },
  heart: { position: 'absolute', top: spacing.md, right: spacing.md },
  badges: { position: 'absolute', top: spacing.md + 6, left: spacing.md, flexDirection: 'row', gap: spacing.xs },
  soldOut: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31,26,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg, gap: spacing.xs + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xs },
  meta: { gap: 4 },
});
