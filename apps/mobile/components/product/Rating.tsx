import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/constants/theme';

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

export function Rating({ value, count, light }: { value: number; count?: number; light?: boolean }) {
  if (!value) return null;
  return (
    <View style={styles.row} accessibilityLabel={`Rated ${value} out of 5${count ? ` by ${count} people` : ''}`}>
      <Ionicons name="star" size={12} color={colors.gold} />
      <Text variant="caption" color={light ? colors.textOnDark : colors.text}>
        {value.toFixed(1)}
      </Text>
      {count ? (
        <Text variant="caption" color={light ? colors.textOnDarkMuted : colors.textSubtle}>
          ({compact(count)})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 3 } });
