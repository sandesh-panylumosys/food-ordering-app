import { ORDER_STATUS_LABELS, ORDER_TIMELINE } from '@food/config';
import type { Order, OrderStatus } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatTime } from '@/lib/format';

const DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'We’ve received your order',
  CONFIRMED: 'Payment received, sent to the kitchen',
  PREPARING: 'Our chefs are cooking your food',
  READY: 'Packed and ready to go',
  OUT_FOR_DELIVERY: 'On its way to you',
  DELIVERED: 'Enjoy your meal!',
};

function ActiveDot() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 1.2 }],
  }));
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.ring, ring]} />
      <View style={[styles.dot, styles.dotActive]} />
    </View>
  );
}

/** Visual status timeline; the current step pulses gently. */
export function OrderTimeline({ order }: { order: Order }) {
  const reachedAt = new Map(order.statusHistory.map((e) => [e.status, e.createdAt]));
  const currentIndex = ORDER_TIMELINE.indexOf(order.status);
  // Hide the delivery leg if the order went straight from READY to DELIVERED.
  const steps = ORDER_TIMELINE.filter(
    (s) => !(s === 'OUT_FOR_DELIVERY' && order.status === 'DELIVERED' && !reachedAt.has(s)),
  );

  return (
    <View accessibilityLabel={`Order status: ${ORDER_STATUS_LABELS[order.status]}`}>
      {steps.map((status, i) => {
        const index = ORDER_TIMELINE.indexOf(status);
        const done = index < currentIndex || order.status === 'DELIVERED';
        const active = index === currentIndex && order.status !== 'DELIVERED';
        const last = i === steps.length - 1;
        const time = reachedAt.get(status);

        return (
          <View key={status} style={styles.row}>
            <View style={styles.rail}>
              {active ? (
                <ActiveDot />
              ) : (
                <View style={styles.dotWrap}>
                  <View style={[styles.dot, done && styles.dotDone]}>
                    {done && <Ionicons name="checkmark" size={12} color={colors.textOnDark} />}
                  </View>
                </View>
              )}
              {!last && <View style={[styles.line, done && styles.lineDone]} />}
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text variant="title" color={done || active ? colors.text : colors.textSubtle}>
                  {ORDER_STATUS_LABELS[status]}
                </Text>
                {time && (
                  <Text variant="caption" color={colors.textSubtle}>
                    {formatTime(time)}
                  </Text>
                )}
              </View>
              {(done || active) && (
                <Text variant="bodySm" color={colors.textMuted}>
                  {DESCRIPTIONS[status]}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 22;
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: DOT },
  dotWrap: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  dotActive: { width: 14, height: 14, borderWidth: 0, backgroundColor: colors.caramel },
  ring: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.caramel },
  line: { flex: 1, width: 2, minHeight: 28, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.espresso },
  copy: { flex: 1, paddingBottom: spacing.xl, gap: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: DOT },
});
