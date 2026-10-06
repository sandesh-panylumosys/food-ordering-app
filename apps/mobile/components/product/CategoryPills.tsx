import type { Category } from '@food/shared-types';
import { useEffect, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { colors, fonts, gutter, radius, spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';

interface Pill {
  key: string;
  label: string;
}

function CategoryPill({ pill, selected, onPress }: { pill: Pill; selected: boolean; onPress: () => void }) {
  const progress = useDerivedValue(() => withTiming(selected ? 1 : 0, { duration: 220 }));
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.surface, colors.espresso]),
    borderColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.espresso]),
  }));
  const label = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [colors.text, colors.textOnDark]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={pill.label}
      scaleTo={0.94}
    >
      <Animated.View style={[styles.pill, bg]}>
        <Animated.Text style={[styles.label, label]} maxFontSizeMultiplier={1.3}>
          {pill.label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

interface CategoryPillsProps {
  categories: Category[];
  selected: string | undefined;
  onChange: (slug: string | undefined) => void;
}

export function CategoryPills({ categories, selected, onChange }: CategoryPillsProps) {
  const listRef = useRef<FlatList<Pill>>(null);
  const pills: Pill[] = [{ key: 'all', label: 'All' }, ...categories.map((c) => ({ key: c.slug, label: c.name }))];
  const selectedIndex = Math.max(0, pills.findIndex((p) => p.key === (selected ?? 'all')));

  useEffect(() => {
    // Keep the active pill in view when the category changes from elsewhere (e.g. Home).
    if (pills.length > 1) listRef.current?.scrollToIndex({ index: selectedIndex, viewPosition: 0.5, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={pills}
      keyExtractor={(p) => p.key}
      showsHorizontalScrollIndicator={false}
      // FlatList (a ScrollView) defaults to flexGrow: 1, which would make this
      // strip claim half the screen next to the product list.
      style={styles.rail}
      contentContainerStyle={styles.list}
      accessibilityRole="tablist"
      onScrollToIndexFailed={() => {}}
      renderItem={({ item }) => (
        <CategoryPill
          pill={item}
          selected={item.key === (selected ?? 'all')}
          onPress={() => {
            haptics.selection();
            onChange(item.key === 'all' ? undefined : item.key);
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  rail: { flexGrow: 0, flexShrink: 0 },
  list: { paddingHorizontal: gutter, gap: spacing.sm, paddingVertical: spacing.xs },
  pill: {
    height: 40,
    paddingHorizontal: spacing.lg + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.sansBold, fontSize: 14 },
});
