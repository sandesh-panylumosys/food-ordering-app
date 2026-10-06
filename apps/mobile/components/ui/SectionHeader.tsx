import { StyleSheet, View } from 'react-native';
import { colors, gutter, spacing } from '@/constants/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ eyebrow, title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        {eyebrow && (
          <Text variant="overline" color={colors.accentText}>
            {eyebrow}
          </Text>
        )}
        <Text variant="h2" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {actionLabel && onAction && (
        <PressableScale onPress={onAction} accessibilityLabel={`${actionLabel} ${title}`} style={styles.action}>
          <Text variant="caption" color={colors.accentText}>
            {actionLabel}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    marginBottom: spacing.md,
  },
  titles: { gap: 2, flex: 1 },
  action: { paddingVertical: spacing.sm, paddingLeft: spacing.md },
});
