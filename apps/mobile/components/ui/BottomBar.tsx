import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gutter, shadows, spacing } from '@/constants/theme';

/** Sticky bottom container for the primary CTA of a screen. */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: gutter,
    paddingTop: spacing.lg,
    backgroundColor: colors.warmWhite,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.md,
    ...shadows.lg,
  },
});
