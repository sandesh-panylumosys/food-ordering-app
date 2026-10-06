import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { colors, gutter, radius, spacing } from '@/constants/theme';

export function ProductCardSkeleton({ width = 220 }: { width?: number }) {
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton height={width * 0.86} rounded={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="40%" height={16} />
      </View>
    </View>
  );
}

export function FeatureCardSkeleton() {
  const { width } = useWindowDimensions();
  const w = Math.min(width - gutter * 2, 560);
  return (
    <View style={[styles.card, { width: w, alignSelf: 'center' }]}>
      <Skeleton height={w * 0.62} rounded={0} />
      <View style={styles.body}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="85%" height={12} />
        <Skeleton width="30%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  body: { padding: spacing.md, gap: spacing.sm },
});
