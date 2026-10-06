import { formatPrice } from '@food/config';
import type { Order } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FoodImage } from '@/components/product/FoodImage';
import { PressableScale, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import { OrderStatusBadge } from './StatusBadge';

export function OrderCard({ order }: { order: Order }) {
  const summary = order.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ');
  const thumbs = order.items.slice(0, 3);

  return (
    <PressableScale
      onPress={() => router.push(`/orders/${order.id}`)}
      scaleTo={0.985}
      accessibilityLabel={`Order ${order.orderNumber}, ${formatPrice(order.total)}, ${summary}`}
      style={styles.card}
    >
      <View style={styles.top}>
        <View style={styles.thumbs}>
          {thumbs.map((item, i) => (
            <FoodImage key={item.id} uri={item.productImageUrl} width={44} style={[styles.thumb, { marginLeft: i === 0 ? 0 : -14, zIndex: 3 - i }]} />
          ))}
        </View>
        <View style={styles.flex}>
          <Text variant="title">Order #{order.orderNumber}</Text>
          <Text variant="caption" color={colors.textMuted}>
            {formatDateTime(order.createdAt)}
          </Text>
        </View>
        <OrderStatusBadge order={order} />
      </View>
      <Text variant="bodySm" color={colors.textMuted} numberOfLines={2}>
        {summary}
      </Text>
      <View style={styles.footer}>
        <Text variant="price">{formatPrice(order.total)}</Text>
        <View style={styles.more}>
          <Text variant="caption" color={colors.accentText}>
            {order.status === 'PENDING' ? 'Complete payment' : 'View details'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accentText} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.surface },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
