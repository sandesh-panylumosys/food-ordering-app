import type { Address } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Badge, PressableScale, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

export const formatAddress = (a: Pick<Address, 'line1' | 'line2' | 'landmark' | 'city' | 'postalCode'>) =>
  [a.line1, a.line2, a.landmark, `${a.city} ${a.postalCode}`].filter(Boolean).join(', ');

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onPress?: () => void;
  actionLabel?: string;
}

export function AddressCard({ address, selected, onPress, actionLabel }: AddressCardProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.985}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      accessibilityLabel={`${address.label}: ${formatAddress(address)}`}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.icon}>
        <Ionicons name={address.label.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'} size={18} color={colors.espresso} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text variant="title">{address.label}</Text>
          {address.isDefault && <Badge label="Default" tone="accent" />}
        </View>
        <Text variant="bodySm" color={colors.textMuted} numberOfLines={2}>
          {formatAddress(address)}
        </Text>
        <Text variant="caption" color={colors.textSubtle}>
          {address.recipientName} · {address.phone}
        </Text>
      </View>
      {actionLabel ? (
        <Text variant="caption" color={colors.accentText}>
          {actionLabel}
        </Text>
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.espresso} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selected: { borderColor: colors.espresso },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
