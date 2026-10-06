import type { Product } from '@food/shared-types';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CategoryPills } from '@/components/product/CategoryPills';
import { ProductFeatureCard } from '@/components/product/ProductFeatureCard';
import { FeatureCardSkeleton } from '@/components/product/ProductSkeletons';
import { EmptyState, ErrorState, IconButton, Screen, Text } from '@/components/ui';
import { colors, gutter, spacing } from '@/constants/theme';
import { useCategories, useProductList } from '@/features/catalog/hooks';
import { useRefresh } from '@/hooks/useRefresh';

export default function MenuScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = params.category || undefined;
  const { data: categories = [] } = useCategories();
  const list = useProductList({ category });
  const { refreshing, onRefresh } = useRefresh(list.refetch);
  const [listKey, setListKey] = useState(0);

  const products: Product[] = list.data?.pages.flatMap((p) => p.data) ?? [];
  const active = categories.find((c) => c.slug === category);

  const changeCategory = (slug: string | undefined) => {
    router.setParams({ category: slug ?? '' });
    setListKey((k) => k + 1);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text variant="overline" color={colors.accentText}>
            {active ? `${active.productCount ?? products.length} dishes` : 'Our kitchen'}
          </Text>
          <Text variant="h1" accessibilityRole="header">
            {active?.name ?? 'The Menu'}
          </Text>
          {active?.description ? (
            <Text variant="bodySm" color={colors.textMuted}>
              {active.description}
            </Text>
          ) : null}
        </View>
        <IconButton icon="search" accessibilityLabel="Search the menu" onPress={() => router.push('/search')} />
      </View>

      <CategoryPills categories={categories} selected={category} onChange={changeCategory} />

      {list.isPending ? (
        <View style={styles.skeletons}>
          <FeatureCardSkeleton />
          <FeatureCardSkeleton />
        </View>
      ) : list.error && products.length === 0 ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <Animated.View key={listKey} entering={FadeIn.duration(260)} style={styles.flex}>
          <FlatList
            data={products}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => <ProductFeatureCard product={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
            }}
            initialNumToRender={4}
            windowSize={7}
            removeClippedSubviews
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.caramel} />}
            ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.caramel} style={styles.footer} /> : null}
            ListEmptyComponent={
              <EmptyState
                icon="restaurant-outline"
                title="Nothing here yet"
                message="This part of the menu is being prepared. Try another category."
                actionLabel="View all dishes"
                onAction={() => changeCategory(undefined)}
              />
            }
          />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  titles: { flex: 1, gap: 2 },
  skeletons: { gap: spacing.xl, paddingTop: spacing.xl },
  list: { gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.huge },
  footer: { paddingVertical: spacing.xl },
});
