import { PRICING } from '@food/config';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { colors, hitSlop, radius, spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  dark?: boolean;
}

export function QuantityStepper({ value, onChange, min = 1, max = PRICING.maxItemQuantity, size = 'md', dark }: QuantityStepperProps) {
  const pop = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const btn = size === 'sm' ? 30 : 40;
  const fg = dark ? colors.textOnDark : colors.text;

  const change = (next: number) => {
    if (next < min || next > max) return;
    haptics.selection();
    pop.set(withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 12 })));
    onChange(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: dark ? 'rgba(255,248,240,0.12)' : colors.surfaceAlt }]}>
      <PressableScale
        onPress={() => change(value - 1)}
        hitSlop={hitSlop}
        scaleTo={0.85}
        accessibilityLabel={value - 1 < min ? 'Remove' : 'Decrease quantity'}
        style={[styles.btn, { width: btn, height: btn }]}
      >
        <Ionicons name={value <= 1 && min === 0 ? 'trash-outline' : 'remove'} size={size === 'sm' ? 15 : 18} color={fg} />
      </PressableScale>
      <Animated.View style={[styles.value, animated]}>
        <Text variant="title" color={fg} accessibilityLabel={`Quantity ${value}`} accessibilityLiveRegion="polite">
          {value}
        </Text>
      </Animated.View>
      <PressableScale
        onPress={() => change(value + 1)}
        hitSlop={hitSlop}
        scaleTo={0.85}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        style={[styles.btn, { width: btn, height: btn, opacity: value >= max ? 0.4 : 1 }]}
      >
        <Ionicons name="add" size={size === 'sm' ? 15 : 18} color={fg} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, padding: 3 },
  btn: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  value: { minWidth: 28, alignItems: 'center', paddingHorizontal: spacing.xs },
});
