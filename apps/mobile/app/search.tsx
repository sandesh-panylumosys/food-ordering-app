import type { Product } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { ProductRow } from '@/components/product/ProductRow';
import { EmptyState, ErrorState, IconButton, PressableScale, Screen, Skeleton, Text } from '@/components/ui';
import { colors, fonts, gutter, radius, spacing } from '@/constants/theme';
import { useCategories, useProductList } from '@/features/catalog/hooks';
import { useDebounce } from '@/hooks/useDebounce';

const SUGGESTIONS = ['Truffle', 'Pizza', 'Latte', 'Tiramisu', 'Burger', 'Vegan'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const term = useDebounce(query.trim(), 300);
  const { data: categories = [] } = useCategories();
  const results = useProductList({ search: term });
  const items: Product[] = term.length >= 2 ? (results.data?.pages.flatMap((p) => p.data) ?? []) : [];

  return (
    <Screen>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Dishes, drinks, ingredients…"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.caramel}
            accessibilityLabel="Search the menu"
            style={styles.input}
          />
          {query.length > 0 && (
            <PressableScale onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
            </PressableScale>
          )}
        </View>
      </View>

      {term.length < 2 ? (
        <View style={styles.suggestions}>
          <Text variant="overline" color={colors.accentText}>
            Popular searches
          </Text>
          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <PressableScale key={s} onPress={() => setQuery(s)} style={styles.chip} accessibilityLabel={`Search ${s}`}>
                <Text variant="caption">{s}</Text>
              </PressableScale>
            ))}
          </View>
          <Text variant="overline" color={colors.accentText} style={styles.gap}>
            Browse categories
          </Text>
          <View style={styles.chips}>
            {categories.map((c) => (
              <PressableScale
                key={c.id}
                onPress={() => router.navigate({ pathname: '/menu', params: { category: c.slug } })}
                style={styles.chip}
                accessibilityLabel={`Browse ${c.name}`}
              >
                <Text variant="caption">{c.name}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ) : results.isPending ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={102} rounded={radius.lg} />
          ))}
        </View>
      ) : results.error ? (
        <ErrorState error={results.error} onRetry={() => void results.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProductRow product={item} />}
          contentContainerStyle={[styles.list, items.length === 0 && styles.grow]}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          onEndReached={() => results.hasNextPage && !results.isFetchingNextPage && void results.fetchNextPage()}
          ListHeaderComponent={
            items.length ? (
              <Text variant="caption" color={colors.textMuted}>
                {results.data?.pages[0]?.meta.total ?? items.length} results for “{term}”
              </Text>
            ) : null
          }
          ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator color={colors.caramel} /> : null}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No results" message={`We couldn’t find anything for “${term}”. Try another dish or ingredient.`} />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: gutter, paddingVertical: spacing.sm },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.espresso,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.text },
  suggestions: { paddingHorizontal: gutter, paddingTop: spacing.lg, gap: spacing.md },
  gap: { marginTop: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.huge, gap: spacing.md },
  grow: { flexGrow: 1 },
});
