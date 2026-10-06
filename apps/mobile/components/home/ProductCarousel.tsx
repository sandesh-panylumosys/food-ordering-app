import type { Product } from '@food/shared-types';
import { FlatList, StyleSheet, View } from 'react-native';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductSkeletons';
import { gutter, spacing } from '@/constants/theme';

const CARD_WIDTH = 216;

export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={(p) => p.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      snapToInterval={CARD_WIDTH + spacing.lg}
      decelerationRate="fast"
      initialNumToRender={3}
      windowSize={5}
      renderItem={({ item }) => <ProductCard product={item} width={CARD_WIDTH} />}
    />
  );
}

export function ProductCarouselSkeleton() {
  return (
    <View style={[styles.list, styles.row]}>
      <ProductCardSkeleton width={CARD_WIDTH} />
      <ProductCardSkeleton width={CARD_WIDTH} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, gap: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  row: { flexDirection: 'row', overflow: 'hidden' },
});
