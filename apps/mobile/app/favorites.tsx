import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { ProductRow } from '@/components/product/ProductRow';
import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { gutter, spacing } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favorites.store';

export default function FavoritesScreen() {
  const items = Object.values(useFavoritesStore((s) => s.items));
  return (
    <Screen>
      <ScreenHeader title="Favourites" />
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProductRow product={item} />}
        contentContainerStyle={[styles.list, items.length === 0 && styles.grow]}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No favourites yet"
            message="Tap the heart on any dish to save it here for next time."
            actionLabel="Explore Menu"
            onAction={() => router.navigate('/menu')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, paddingBottom: spacing.huge, gap: spacing.md },
  grow: { flexGrow: 1 },
});
