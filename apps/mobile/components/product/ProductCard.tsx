import type { Product } from '@food/shared-types';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Badge, PressableScale, Text, VegIndicator } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { AddButton } from './AddButton';
import { FavoriteButton } from './FavoriteButton';
import { FoodImage } from './FoodImage';
import { Price } from './Price';
import { Rating } from './Rating';

/** Image-first card used in horizontal carousels. */
export function ProductCard({ product, width = 220 }: { product: Product; width?: number }) {
  const onOffer = product.compareAtPrice != null && product.compareAtPrice > product.price;
  return (
    <PressableScale
      onPress={() => router.push(`/product/${product.id}`)}
      accessibilityLabel={`${product.name}, ${product.shortDescription}`}
      scaleTo={0.98}
      style={[styles.card, { width }]}
    >
      <View>
        <FoodImage uri={product.imageUrl} width={width} style={[styles.image, { height: width * 0.86 }]} />
        <FavoriteButton product={product} size={36} style={styles.heart} />
        {onOffer && (
          <View style={styles.badge}>
            <Badge label="Offer" tone="dark" />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <VegIndicator isVeg={product.isVeg} size={12} />
          <Text variant="title" numberOfLines={1} style={styles.name}>
            {product.name}
          </Text>
        </View>
        <Text variant="bodySm" color={colors.textMuted} numberOfLines={1}>
          {product.shortDescription}
        </Text>
        <Rating value={product.rating} count={product.ratingCount} />
        <View style={styles.footer}>
          <Price price={product.price} compareAt={product.compareAtPrice} />
          <AddButton product={product} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: { width: '100%', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  heart: { position: 'absolute', top: spacing.md, right: spacing.md },
  badge: { position: 'absolute', top: spacing.md + 6, left: spacing.md },
  body: { padding: spacing.md + 2, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
});
