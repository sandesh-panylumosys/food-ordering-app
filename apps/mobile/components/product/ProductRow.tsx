import type { Product } from '@food/shared-types';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PressableScale, Text, VegIndicator } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { AddButton } from './AddButton';
import { FoodImage } from './FoodImage';
import { Price } from './Price';

/** Compact row for search results and favourites. */
export function ProductRow({ product }: { product: Product }) {
  return (
    <PressableScale onPress={() => router.push(`/product/${product.id}`)} scaleTo={0.985} accessibilityLabel={product.name} style={styles.row}>
      <FoodImage uri={product.imageUrl} width={76} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.title}>
          <VegIndicator isVeg={product.isVeg} size={12} />
          <Text variant="title" numberOfLines={1} style={styles.flex}>
            {product.name}
          </Text>
        </View>
        <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
          {product.category?.name ? `${product.category.name} · ` : ''}
          {product.shortDescription}
        </Text>
        <View style={styles.footer}>
          <Price price={product.price} compareAt={product.compareAtPrice} />
          <AddButton product={product} compact />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  image: { width: 76, height: 76, borderRadius: radius.md },
  body: { flex: 1, gap: 3 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
});
