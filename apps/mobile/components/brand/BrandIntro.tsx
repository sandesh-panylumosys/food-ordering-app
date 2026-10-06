import { BRAND } from '@food/config';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

/**
 * A short (~1.3s) branded introduction shown once per launch on top of the
 * already-rendering app, so it never delays content.
 */
export function BrandIntro({ onDone }: { onDone: () => void }) {
  const reveal = useSharedValue(0);
  const line = useSharedValue(0);
  const exit = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    reveal.set(withTiming(1, { duration: 520, easing: ease }));
    line.set(withDelay(240, withTiming(1, { duration: 520, easing: ease })));
    exit.set(
      withDelay(
        1000,
        withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
  }, [reveal, line, exit, onDone]);

  const container = useAnimatedStyle(() => ({ opacity: exit.get() }));
  const title = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [{ translateY: (1 - reveal.get()) * 14 }],
  }));
  const rule = useAnimatedStyle(() => ({ transform: [{ scaleX: line.get() }], opacity: line.get() }));
  const tagline = useAnimatedStyle(() => ({ opacity: line.get() }));

  return (
    <Animated.View style={[styles.root, container]} pointerEvents="none" accessibilityElementsHidden>
      <Animated.View style={[styles.center, title]}>
        <Text variant="overline" color={colors.beige}>
          Café · Kitchen · Bakery
        </Text>
        <Text style={styles.wordmark} color={colors.textOnDark}>
          {BRAND.name}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.rule, rule]} />
      <Animated.View style={tagline}>
        <Text variant="serifItalic" color={colors.textOnDarkMuted} style={styles.tagline}>
          {BRAND.tagline}
        </Text>
      </Animated.View>
      <View />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    zIndex: 999,
  },
  center: { alignItems: 'center', gap: spacing.sm },
  wordmark: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 52, lineHeight: 58, letterSpacing: -0.5 },
  rule: { width: 72, height: 1.5, backgroundColor: colors.caramel },
  tagline: { fontSize: 19 },
});
