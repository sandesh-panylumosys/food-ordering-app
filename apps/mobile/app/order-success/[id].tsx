import { PREP_TIME } from '@food/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Button, Screen, Text } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { useOrder } from '@/features/orders/hooks';

const SPARKS = 8;

/** A single, restrained burst of caramel sparks — celebration without confetti overload. */
function Spark({ index }: { index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(260, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [progress]);
  const angle = (index / SPARKS) * Math.PI * 2;
  const style = useAnimatedStyle(() => ({
    opacity: progress.get() < 0.15 ? progress.get() * 6 : 1 - progress.get(),
    transform: [
      { translateX: Math.cos(angle) * 92 * progress.get() },
      { translateY: Math.sin(angle) * 92 * progress.get() },
      { scale: 1 - progress.get() * 0.5 },
    ],
  }));
  return <Animated.View style={[styles.spark, index % 2 ? styles.sparkAlt : null, style]} />;
}

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order } = useOrder(id);
  const scale = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => {
    scale.set(withSpring(1, { damping: 12, stiffness: 140 }));
    check.set(withDelay(220, withSpring(1, { damping: 10, stiffness: 180 })));
  }, [scale, check]);

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const tick = useAnimatedStyle(() => ({ transform: [{ scale: check.get() }], opacity: check.get() }));

  return (
    <Screen edges={['top', 'bottom']} background={colors.warmWhite}>
      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          {Array.from({ length: SPARKS }, (_, i) => (
            <Spark key={i} index={i} />
          ))}
          <Animated.View style={[styles.circle, circle]}>
            <Animated.View style={tick}>
              <Ionicons name="checkmark" size={56} color={colors.textOnDark} />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(420)} style={styles.copy}>
          <Text variant="overline" color={colors.accentText} align="center">
            Payment received
          </Text>
          <Text variant="display" align="center" accessibilityRole="header">
            Order Confirmed
          </Text>
          <Text variant="body" color={colors.textMuted} align="center">
            {order ? `Your order #${order.orderNumber}\nhas been received.` : 'Your order has been received.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(420).duration(420)} style={styles.eta}>
          <Ionicons name="time-outline" size={20} color={colors.espresso} />
          <View>
            <Text variant="caption" color={colors.textMuted}>
              Estimated preparation
            </Text>
            <Text variant="title">
              {order?.estimatedMinutes.min ?? PREP_TIME.min}–{order?.estimatedMinutes.max ?? PREP_TIME.max} minutes
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(520).duration(420)} style={styles.actions}>
        <Button label="View Order" size="lg" fullWidth iconRight="arrow-forward" onPress={() => router.replace(`/orders/${id}`)} />
        <Button label="Back to Home" variant="ghost" onPress={() => router.replace('/')} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter, gap: spacing.xxl },
  badgeWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.caramel },
  sparkAlt: { width: 6, height: 6, backgroundColor: colors.gold },
  copy: { gap: spacing.sm },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { paddingHorizontal: gutter, paddingBottom: spacing.lg, gap: spacing.sm },
});
