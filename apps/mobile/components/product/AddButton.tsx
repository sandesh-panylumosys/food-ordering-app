import { defaultSelections } from '@food/config';
import type { Product } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { PressableScale, Text, toast } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useCartStore } from '@/store/cart.store';

/** Quick-add with default options. Full customisation lives on the detail screen. */
export function AddButton({ product, compact }: { product: Product; compact?: boolean }) {
  const add = useCartStore((s) => s.add);
  const pop = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  if (!product.isAvailable) {
    return (
      <Text variant="caption" color={colors.textSubtle}>
        Sold out
      </Text>
    );
  }

  const onPress = () => {
    const result = add(product, defaultSelections(product.customizations));
    if (!result.ok) {
      haptics.error();
      toast.error(result.error);
      return;
    }
    haptics.light();
    pop.set(withSequence(withTiming(1.12, { duration: 100 }), withSpring(1, { damping: 11 })));
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Animated.View style={animated}>
      <PressableScale
        onPress={onPress}
        hitSlop={hitSlop}
        scaleTo={0.9}
        accessibilityLabel={`Add ${product.name} to cart`}
        style={[styles.btn, compact && styles.compact]}
      >
        <Ionicons name="add" size={16} color={colors.textOnDark} />
        {!compact && (
          <Text variant="caption" color={colors.textOnDark}>
            Add
          </Text>
        )}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 34,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
  },
  compact: { width: 34, paddingLeft: 0, paddingRight: 0, justifyContent: 'center' },
});
