import type { Order } from '@food/shared-types';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyState, ErrorState, Screen, SignInPrompt, Skeleton, Text } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { useOrders } from '@/features/orders/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useAuthStore } from '@/store/auth.store';

function Header() {
  return (
    <View style={styles.header}>
      <Text variant="overline" color={colors.accentText}>
        History
      </Text>
      <Text variant="h1" accessibilityRole="header">
        Your Orders
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const status = useAuthStore((s) => s.status);
  const orders = useOrders();
  const { refreshing, onRefresh } = useRefresh(orders.refetch);
  const items: Order[] = orders.data?.pages.flatMap((p) => p.data) ?? [];

  if (status === 'guest') {
    return (
      <Screen>
        <Header />
        <SignInPrompt message="Sign in to see your orders and track deliveries in real time." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header />
      {orders.isPending ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={150} rounded={radius.lg} />
          ))}
        </View>
      ) : orders.error && items.length === 0 ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={[styles.list, items.length === 0 && styles.flexGrow]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.caramel} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
          }}
          ListFooterComponent={orders.isFetchingNextPage ? <ActivityIndicator color={colors.caramel} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              message="When you place your first order, you’ll be able to track it here."
              actionLabel="Explore Menu"
              onAction={() => router.navigate('/menu')}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 2 },
  list: { paddingHorizontal: gutter, paddingBottom: spacing.huge, paddingTop: spacing.sm, gap: spacing.md },
  flexGrow: { flexGrow: 1 },
});
