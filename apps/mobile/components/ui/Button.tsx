import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing, TOUCH_TARGET } from '@/constants/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconRight?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.espresso, fg: colors.textOnDark },
  accent: { bg: colors.caramel, fg: colors.espresso },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.text },
  danger: { bg: colors.dangerBg, fg: colors.danger },
};

const heights: Record<Size, number> = { sm: 38, md: 48, lg: 56 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  trailing,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      style={[
        styles.base,
        {
          backgroundColor: p.bg,
          minHeight: Math.max(heights[size], size === 'sm' ? 0 : TOUCH_TARGET),
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          borderColor: p.border ?? 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={p.fg} />}
          <Text variant="button" color={p.fg} style={size === 'sm' && styles.small} numberOfLines={1}>
            {label}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={18} color={p.fg} />}
          {trailing}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  small: { fontSize: 13 },
});
