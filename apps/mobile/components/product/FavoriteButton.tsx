import type { Product } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { colors, hitSlop, radius, shadows } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useFavoritesStore, useIsFavorite } from '@/store/favorites.store';

export function FavoriteButton({ product, size = 38, style }: { product: Product; size?: number; style?: StyleProp<ViewStyle> }) {
  const isFavorite = useIsFavorite(product.id);
  const toggle = useFavoritesStore((s) => s.toggle);
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const onPress = () => {
    const added = toggle(product);
    haptics.light();
    if (added) scale.set(withSequence(withTiming(1.3, { duration: 110 }), withSpring(1, { damping: 10 })));
  };

  return (
    <PressableScale
      onPress={onPress}
      hitSlop={hitSlop}
      scaleTo={0.88}
      accessibilityLabel={isFavorite ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
      accessibilityState={{ selected: isFavorite }}
      style={[styles.btn, { width: size, height: size }, style]}
    >
      <Animated.View style={animated}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={size * 0.5} color={isFavorite ? colors.nonVeg : colors.text} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,248,240,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});
