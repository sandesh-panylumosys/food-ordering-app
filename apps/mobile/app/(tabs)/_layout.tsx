import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { type ColorValue, Platform } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useCartCount } from '@/store/cart.store';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon =
  (active: IconName, inactive: IconName) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color as string} />
  );

export default function TabLayout() {
  const cartCount = useCartCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.espresso,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.2 },
        tabBarStyle: {
          backgroundColor: colors.warmWhite,
          borderTopColor: colors.border,
          paddingTop: Platform.OS === 'ios' ? 6 : 4,
        },
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.background },
      }}
      screenListeners={{ tabPress: () => void haptics.selection() }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: icon('restaurant', 'restaurant-outline') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: icon('bag-handle', 'bag-handle-outline'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.caramel, color: colors.espresso, fontFamily: fonts.sansExtraBold, fontSize: 10 },
          tabBarAccessibilityLabel: cartCount ? `Cart, ${cartCount} items` : 'Cart',
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
