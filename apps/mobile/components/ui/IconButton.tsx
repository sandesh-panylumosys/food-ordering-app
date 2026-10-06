import type { ComponentProps } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, hitSlop, radius, shadows, TOUCH_TARGET } from '@/constants/theme';
import { PressableScale } from './PressableScale';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'surface' | 'glass' | 'plain' | 'dark';
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, onPress, accessibilityLabel, variant = 'surface', size = 20, color, style }: IconButtonProps) {
  const bg =
    variant === 'surface' ? colors.surface : variant === 'glass' ? 'rgba(255,248,240,0.92)' : variant === 'dark' ? colors.espresso : 'transparent';
  const fg = color ?? (variant === 'dark' ? colors.textOnDark : colors.text);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      scaleTo={0.9}
      style={[styles.base, { backgroundColor: bg }, variant !== 'plain' && shadows.sm, style]}
    >
      <Ionicons name={icon} size={size} color={fg} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
