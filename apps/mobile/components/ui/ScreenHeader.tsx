import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, gutter, spacing } from '@/constants/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  closeIcon?: boolean;
}

export function ScreenHeader({ title, subtitle, back = true, onBack, right, closeIcon }: ScreenHeaderProps) {
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {back && (
          <IconButton
            icon={closeIcon ? 'close' : 'chevron-back'}
            accessibilityLabel={closeIcon ? 'Close' : 'Go back'}
            onPress={goBack}
          />
        )}
      </View>
      <View style={styles.center}>
        {title && (
          <Text variant="h3" align="center" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="caption" color={colors.textMuted} align="center" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingVertical: spacing.sm,
    minHeight: 60,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
});
