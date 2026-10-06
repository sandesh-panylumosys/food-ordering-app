import { BRAND } from '@food/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, PressableScale, Screen, Skeleton, Text } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';
import { logout } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useFavoritesStore } from '@/store/favorites.store';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Row({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityLabel={label} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.espresso} />
      </View>
      <Text variant="body" style={styles.flex}>
        {label}
      </Text>
      {detail ? (
        <Text variant="caption" color={colors.textSubtle}>
          {detail}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { status, user, signOut } = useAuthStore();
  const favoritesCount = useFavoritesStore((s) => Object.keys(s.items).length);
  const go = (href: Href) => () => router.push(href);

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'Your cart and favourites stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout().catch(() => {});
          await signOut();
        },
      },
    ]);

  const initials = user?.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="h1" accessibilityRole="header">
          Profile
        </Text>

        {status === 'loading' ? (
          <Skeleton height={96} rounded={radius.lg} />
        ) : status === 'authenticated' && user ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text variant="h2" color={colors.textOnDark}>
                {initials}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="h3" color={colors.textOnDark} numberOfLines={1}>
                {user.name}
              </Text>
              <Text variant="bodySm" color={colors.textOnDarkMuted} numberOfLines={1}>
                {user.email}
              </Text>
              {user.phone ? (
                <Text variant="caption" color={colors.textOnDarkMuted}>
                  {user.phone}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.userCard}>
            <View style={styles.flex}>
              <Text variant="h3" color={colors.textOnDark}>
                Welcome to {BRAND.name}
              </Text>
              <Text variant="bodySm" color={colors.textOnDarkMuted}>
                Sign in to order and track your food.
              </Text>
            </View>
            <Button label="Sign In" variant="accent" size="sm" onPress={go('/login')} />
          </View>
        )}

        <View style={styles.group}>
          {status === 'authenticated' && (
            <>
              <Row icon="receipt-outline" label="Order history" onPress={() => router.navigate('/orders')} />
              <Row icon="location-outline" label="Saved addresses" onPress={go('/addresses')} />
            </>
          )}
          <Row icon="heart-outline" label="Favourites" detail={favoritesCount ? String(favoritesCount) : undefined} onPress={go('/favorites')} />
          {status === 'authenticated' && <Row icon="settings-outline" label="Account settings" onPress={go('/account')} />}
          <Row icon="chatbubble-ellipses-outline" label="Help & support" onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`)} />
        </View>

        {status === 'authenticated' && <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={confirmLogout} />}

        <Text variant="caption" color={colors.textSubtle} align="center">
          {BRAND.name} · v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.huge, gap: spacing.xl },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.espresso,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.caramel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
