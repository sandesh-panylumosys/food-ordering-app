import { BRAND } from '@food/config';
import type { Category } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { CategoryRail, CategoryRailSkeleton } from '@/components/home/CategoryRail';
import { HERO_HEIGHT, HeroBanner } from '@/components/home/HeroBanner';
import { OFFER_CARD_WIDTH, OfferCard } from '@/components/home/OfferCard';
import { ProductCarousel, ProductCarouselSkeleton } from '@/components/home/ProductCarousel';
import { ProductFeatureCard } from '@/components/product/ProductFeatureCard';
import { ErrorState, IconButton, PressableScale, Screen, SectionHeader, Skeleton, Text } from '@/components/ui';
import { colors, gutter, radius, shadows, spacing } from '@/constants/theme';
import { defaultAddress, useAddresses } from '@/features/addresses/hooks';
import { useHomeFeed } from '@/features/catalog/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { firstName, greeting } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';

function LocationPill() {
  const status = useAuthStore((s) => s.status);
  const { data: addresses } = useAddresses();
  const address = defaultAddress(addresses);
  const label = address ? `${address.label} · ${address.line1}` : 'Set delivery address';

  return (
    <PressableScale
      onPress={() => router.push(status === 'authenticated' ? '/addresses' : '/login')}
      accessibilityLabel={`Delivery address: ${label}. Change`}
      style={styles.location}
    >
      <Ionicons name="location" size={14} color={colors.caramel} />
      <Text variant="caption" numberOfLines={1} style={styles.locationText}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
    </PressableScale>
  );
}

function SearchBar() {
  return (
    <PressableScale
      onPress={() => router.push('/search')}
      scaleTo={0.99}
      accessibilityRole="search"
      accessibilityLabel="Search dishes, drinks and desserts"
      style={styles.search}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <Text variant="body" color={colors.textSubtle}>
        Search pasta, coffee, desserts…
      </Text>
    </PressableScale>
  );
}

function HomeSkeleton() {
  return (
    <View style={styles.sections}>
      <View style={styles.heroSkeleton}>
        <Skeleton height={HERO_HEIGHT} rounded={radius.xl} />
      </View>
      <CategoryRailSkeleton />
      <View style={styles.skeletonHeader}>
        <Skeleton width={160} height={24} />
      </View>
      <ProductCarouselSkeleton />
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isPending, error, refetch } = useHomeFeed();
  const { refreshing, onRefresh } = useRefresh(refetch);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const openCategory = (c: Category) => router.navigate({ pathname: '/menu', params: { category: c.slug } });

  return (
    <Screen>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.caramel} />}
      >
        {/* Brand + greeting */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.wordmark} accessibilityRole="header">
              {BRAND.name}
            </Text>
            <Text variant="bodySm" color={colors.textMuted}>
              {greeting()}
              {user ? `, ${firstName(user.name)}` : ''} — what are you craving?
            </Text>
          </View>
          <IconButton icon="heart-outline" accessibilityLabel="Favourites" onPress={() => router.push('/favorites')} />
        </View>

        <View style={styles.utility}>
          <LocationPill />
          <SearchBar />
        </View>

        {isPending ? (
          <HomeSkeleton />
        ) : error || !data ? (
          <View style={styles.error}>
            <ErrorState error={error} onRetry={() => void refetch()} />
          </View>
        ) : (
          <View style={styles.sections}>
            {data.hero && (
              <Animated.View entering={FadeInDown.duration(420)}>
                <HeroBanner product={data.hero} scrollY={scrollY} />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(80).duration(420)}>
              <SectionHeader eyebrow="Explore" title="The Menu" actionLabel="See all" onAction={() => router.navigate('/menu')} />
              <CategoryRail categories={data.categories} onSelect={openCategory} />
            </Animated.View>

            {data.popular.length > 0 && (
              <Animated.View entering={FadeInDown.delay(140).duration(420)}>
                <SectionHeader eyebrow="Most loved" title="Popular Dishes" />
                <ProductCarousel products={data.popular} />
              </Animated.View>
            )}

            {data.offers.length > 0 && (
              <View>
                <SectionHeader eyebrow="Limited time" title="Today’s Offers" />
                <FlatList
                  horizontal
                  data={data.offers}
                  keyExtractor={(p) => p.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offerList}
                  snapToInterval={OFFER_CARD_WIDTH + spacing.md}
                  decelerationRate="fast"
                  renderItem={({ item }) => <OfferCard product={item} />}
                />
              </View>
            )}

            {data.bestsellers.length > 0 && (
              <View>
                <SectionHeader eyebrow="Guest favourites" title="Best Sellers" />
                <ProductCarousel products={data.bestsellers} />
              </View>
            )}

            {data.recommended.length > 0 && (
              <View>
                <SectionHeader eyebrow="Chef recommends" title="Made for You" />
                <View style={styles.recommended}>
                  {data.recommended.slice(0, 4).map((p) => (
                    <ProductFeatureCard key={p.id} product={p} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.signoff}>
              <Text variant="serifItalic" color={colors.textMuted} align="center">
                Made slowly, served warmly.
              </Text>
              <Text variant="overline" color={colors.textSubtle} align="center">
                {BRAND.name}
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  wordmark: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, lineHeight: 34, color: colors.espresso },
  utility: { paddingHorizontal: gutter, paddingTop: spacing.lg, gap: spacing.md },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', paddingVertical: 4 },
  locationText: { flexShrink: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sections: { gap: spacing.xxxl, paddingTop: spacing.xxl },
  heroSkeleton: { paddingHorizontal: gutter },
  skeletonHeader: { paddingHorizontal: gutter },
  error: { minHeight: 420 },
  offerList: { paddingHorizontal: gutter, gap: spacing.md },
  recommended: { gap: spacing.xl },
  signoff: { gap: spacing.xs, paddingTop: spacing.lg },
});
