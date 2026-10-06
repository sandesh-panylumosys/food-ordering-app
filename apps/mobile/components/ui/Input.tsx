import { forwardRef, useState, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, hint, icon, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.espresso : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.field, { borderColor }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textSubtle} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.caramel}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={colors.textSubtle}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  label: { marginLeft: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.md,
  },
});
