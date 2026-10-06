import type { Category } from '@food/shared-types';
import { FlatList, StyleSheet, View } from 'react-native';
import { FoodImage } from '@/components/product/FoodImage';
import { PressableScale, Skeleton, Text } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';

interface CategoryRailProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

const SIZE = 72;

export function CategoryRail({ categories, onSelect }: CategoryRailProps) {
  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <PressableScale onPress={() => onSelect(item)} accessibilityLabel={`Browse ${item.name}`} style={styles.item}>
          <View style={styles.ring}>
            <FoodImage uri={item.imageUrl} width={SIZE} style={styles.image} />
          </View>
          <Text variant="caption" align="center" numberOfLines={1}>
            {item.name}
          </Text>
        </PressableScale>
      )}
    />
  );
}

export function CategoryRailSkeleton() {
  return (
    <View style={[styles.list, { flexDirection: 'row' }]}>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={styles.item}>
          <Skeleton width={SIZE} height={SIZE} rounded={radius.pill} />
          <Skeleton width={48} height={10} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, gap: spacing.lg },
  item: { alignItems: 'center', gap: spacing.sm, width: SIZE + 4 },
  ring: {
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.beige,
  },
  image: { width: SIZE - 4, height: SIZE - 4, borderRadius: radius.pill },
});
