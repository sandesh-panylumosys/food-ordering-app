import { defaultSelections, formatPrice, resolveSelections } from '@food/config';
import type { CartSelection, Product } from '@food/shared-types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomizationGroup } from '@/components/product/CustomizationGroup';
import { FavoriteButton } from '@/components/product/FavoriteButton';
import { FoodImage } from '@/components/product/FoodImage';
import { ImageViewer } from '@/components/product/ImageViewer';
import { Rating } from '@/components/product/Rating';
import {
  Badge,
  BottomBar,
  Button,
  ErrorState,
  IconButton,
  QuantityStepper,
  Screen,
  Skeleton,
  Text,
  toast,
  VegIndicator,
} from '@/components/ui';
import { colors, gutter, radius, shadows, spacing } from '@/constants/theme';
import { useProduct } from '@/features/catalog/hooks';
import { haptics } from '@/lib/haptics';
import { useCartStore } from '@/store/cart.store';

function Meta({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text variant="caption" color={colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

function DetailSkeleton({ imageHeight }: { imageHeight: number }) {
  return (
    <Screen edges={[]}>
      <Skeleton height={imageHeight} rounded={0} />
      <View style={[styles.sheet, styles.skeletonSheet]}>
        <Skeleton width="65%" height={30} />
        <Skeleton width="40%" height={14} />
        <Skeleton height={60} />
        <Skeleton height={120} />
      </View>
    </Screen>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const imageHeight = Math.min(height * 0.5, width * 1.05);

  const add = useCartStore((s) => s.add);
  const [selections, setSelections] = useState<CartSelection[]>(() => defaultSelections(product.customizations));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Main photo first, then any extra gallery photos (de-duplicated).
  const gallery = [product.imageUrl, ...product.images.map((i) => i.url).filter((u) => u !== product.imageUrl)];
  const resolved = resolveSelections(product.customizations, selections);
  const unitPrice = product.price + (resolved.ok ? resolved.extraPrice : 0);
  const total = Math.round(unitPrice * quantity * 100) / 100;

  // Parallax + stretchy header image, compact title bar fades in on scroll.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.get(), [-imageHeight, 0, imageHeight], [-imageHeight / 2, 0, imageHeight * 0.45]) },
      { scale: interpolate(scrollY.get(), [-imageHeight, 0], [2, 1], 'clamp') },
    ],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [imageHeight - 140, imageHeight - 60], [0, 1], 'clamp'),
  }));

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.get() }] }));

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  const setGroup = (groupId: string, optionIds: string[]) =>
    setSelections((prev) => [...prev.filter((s) => s.groupId !== groupId), { groupId, optionIds }]);

  const onAdd = () => {
    const result = add(product, selections, quantity);
    if (!result.ok) {
      haptics.error();
      toast.error(result.error);
      return;
    }
    haptics.success();
    ctaScale.set(withSequence(withTiming(0.95, { duration: 90 }), withSpring(1, { damping: 10 })));
    setAdded(true);
    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  const onOffer = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <View style={styles.root}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={[{ height: imageHeight }, imageStyle]}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {gallery.map((uri, i) => (
              <Pressable key={`${uri}-${i}`} onPress={() => setViewerOpen(true)} accessibilityLabel={`View photo of ${product.name}`} accessibilityHint="Opens a zoomable photo">
                <FoodImage uri={uri} width={width} style={{ width, height: imageHeight }} priority="high" />
              </Pressable>
            ))}
          </Animated.ScrollView>
          {gallery.length > 1 && (
            <View style={styles.dots}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380)} style={styles.sheet}>
          <View style={styles.badges}>
            {product.isBestseller && <Badge label="Bestseller" tone="dark" />}
            {onOffer && <Badge label="Limited-time offer" tone="accent" />}
            {product.category && <Badge label={product.category.name} />}
          </View>

          <View style={styles.titleRow}>
            <Text variant="h1" style={styles.flex} accessibilityRole="header">
              {product.name}
            </Text>
            <VegIndicator isVeg={product.isVeg} size={18} />
          </View>

          <View style={styles.metaRow}>
            <Rating value={product.rating} count={product.ratingCount} />
            <Meta icon="time-outline" label={`${product.prepTimeMinutes} min`} />
            {product.calories != null && <Meta icon="flame-outline" label={`${product.calories} kcal`} />}
          </View>

          <View style={styles.priceRow}>
            <Text variant="priceLg">{formatPrice(product.price)}</Text>
            {onOffer && (
              <Text variant="body" color={colors.textSubtle} style={styles.strike}>
                {formatPrice(product.compareAtPrice!)}
              </Text>
            )}
          </View>

          <Text variant="body" color={colors.textMuted} style={styles.description}>
            {product.description}
          </Text>

          {product.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text variant="overline" color={colors.accentText}>
                Ingredients
              </Text>
              <View style={styles.chips}>
                {product.ingredients.map((ing) => (
                  <View key={ing} style={styles.chip}>
                    <Text variant="caption">{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {product.customizations.length > 0 && (
            <View style={styles.section}>
              <Text variant="overline" color={colors.accentText}>
                Make it yours
              </Text>
              {product.customizations.map((group) => (
                <CustomizationGroup
                  key={group.id}
                  group={group}
                  selected={selections.find((s) => s.groupId === group.id)?.optionIds ?? []}
                  onChange={(ids) => setGroup(group.id, ids)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Compact title bar that fades in once the image scrolls away. */}
      <Animated.View style={[styles.bar, { paddingTop: insets.top, height: insets.top + 64 }, barStyle]} pointerEvents="none">
        <Text variant="h3" numberOfLines={1} style={styles.barTitle}>
          {product.name}
        </Text>
      </Animated.View>
      <View style={[styles.floating, { top: insets.top + spacing.sm }]}>
        <IconButton icon="chevron-back" variant="glass" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <FavoriteButton product={product} size={44} />
      </View>

      <BottomBar>
        {!resolved.ok && (
          <Text variant="caption" color={colors.danger} align="center">
            {resolved.error}
          </Text>
        )}
        <View style={styles.ctaRow}>
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <Animated.View style={[styles.flex, ctaStyle]}>
            <Button
              size="lg"
              fullWidth
              disabled={!product.isAvailable || !resolved.ok}
              label={!product.isAvailable ? 'Currently unavailable' : added ? 'Added to cart' : `Add · ${formatPrice(total)}`}
              icon={added ? 'checkmark' : undefined}
              onPress={onAdd}
            />
          </Animated.View>
        </View>
      </BottomBar>

      <ImageViewer uri={gallery[imageIndex] ?? null} visible={viewerOpen} onClose={() => setViewerOpen(false)} alt={product.name} />
    </View>
  );
}

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const { data: product, isPending, error, refetch } = useProduct(id);

  if (isPending) return <DetailSkeleton imageHeight={Math.min(height * 0.5, width * 1.05)} />;
  if (error || !product) {
    return (
      <Screen>
        <View style={styles.errorHeader}>
          <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={() => router.back()} />
        </View>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }
  return <ProductDetail product={product} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.huge },
  sheet: {
    marginTop: -radius.xl,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: gutter,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  skeletonSheet: { gap: spacing.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  strike: { textDecorationLine: 'line-through' },
  description: { marginTop: spacing.xs },
  section: { gap: spacing.lg, marginTop: spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: -spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dots: { position: 'absolute', bottom: radius.xl + spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,248,240,0.5)' },
  dotActive: { width: 18, backgroundColor: colors.warmWhite },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warmWhite,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  barTitle: { textAlign: 'center', paddingHorizontal: 80 },
  floating: {
    position: 'absolute',
    left: gutter,
    right: gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  errorHeader: { paddingHorizontal: gutter, paddingTop: spacing.sm },
});
