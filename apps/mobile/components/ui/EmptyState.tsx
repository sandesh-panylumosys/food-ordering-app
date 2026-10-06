import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/constants/theme';
import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.root}>
      <View style={styles.iconRing}>
        <Ionicons name={icon} size={34} color={colors.caramel} />
      </View>
      <Text variant="h2" align="center">
        {title}
      </Text>
      <Text variant="body" color={colors.textMuted} align="center" style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} style={styles.action} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.md },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: { maxWidth: 280 },
  action: { marginTop: spacing.md },
});
