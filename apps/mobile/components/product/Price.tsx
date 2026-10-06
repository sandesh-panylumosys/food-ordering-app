import { formatPrice } from '@food/config';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { colors, type TypographyVariant } from '@/constants/theme';

export function Price({ price, compareAt, variant = 'price' }: { price: number; compareAt?: number | null; variant?: TypographyVariant }) {
  const onOffer = compareAt != null && compareAt > price;
  return (
    <View style={styles.row}>
      <Text variant={variant}>{formatPrice(price)}</Text>
      {onOffer && (
        <Text variant="caption" color={colors.textSubtle} style={styles.strike} accessibilityLabel={`was ${formatPrice(compareAt)}`}>
          {formatPrice(compareAt)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  strike: { textDecorationLine: 'line-through' },
});
