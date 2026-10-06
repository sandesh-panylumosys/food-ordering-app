import type { Product } from '@food/shared-types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FoodImage } from '@/components/product/FoodImage';
import { Button, PressableScale, Text } from '@/components/ui';
import { colors, gutter, radius, shadows, spacing } from '@/constants/theme';

const HEIGHT = 420;

/** Splits "Slow-cooked Truffle Pasta" into an editorial two-line title. */
function splitTitle(name: string): [string, string] {
  const words = name.split(' ');
  if (words.length < 2) return [name, ''];
  const cut = Math.ceil(words.length / 2) - (words.length > 2 ? 1 : 0);
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
}

export function HeroBanner({ product, scrollY }: { product: Product; scrollY: SharedValue<number> }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - gutter * 2;
  const drift = useSharedValue(0);

  useEffect(() => {
    // Slow "breathing" zoom — subtle life without stealing attention.
    drift.set(withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [drift]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.get(), [-100, 0, HEIGHT], [-30, 0, HEIGHT * 0.25], 'clamp') },
      { scale: 1.06 + drift.get() * 0.05 + interpolate(scrollY.get(), [-100, 0], [0.12, 0], 'clamp') },
    ],
  }));

  const [line1, line2] = splitTitle(product.name);
  const open = () => router.push(`/product/${product.id}`);

  return (
    <PressableScale onPress={open} scaleTo={0.99} accessibilityLabel={`Today's special: ${product.name}`} style={[styles.card, { width: cardWidth }]}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <FoodImage uri={product.imageUrl} width={cardWidth} style={StyleSheet.absoluteFill} priority="high" />
      </Animated.View>
      <LinearGradient
        colors={['rgba(31,26,23,0.05)', 'rgba(31,26,23,0.45)', 'rgba(31,26,23,0.94)']}
        locations={[0.1, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          <Text variant="overline" color={colors.beige}>
            Today’s special
          </Text>
        </View>
        <Text variant="display" color={colors.textOnDark}>
          {line1}
          {line2 ? `\n${line2}` : ''}
        </Text>
        <Text variant="body" color={colors.textOnDarkMuted} numberOfLines={2} style={styles.sub}>
          {product.shortDescription}. Made fresh today.
        </Text>
        <Button label="Order Now" variant="accent" iconRight="arrow-forward" onPress={open} style={styles.cta} />
      </View>
    </PressableScale>
  );
}

export const HERO_HEIGHT = HEIGHT;

const styles = StyleSheet.create({
  card: {
    height: HEIGHT,
    alignSelf: 'center',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.espresso,
    ...shadows.lg,
  },
  content: { flex: 1, justifyContent: 'flex-end', padding: spacing.xxl, gap: spacing.sm },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.caramel },
  sub: { maxWidth: 280 },
  cta: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
