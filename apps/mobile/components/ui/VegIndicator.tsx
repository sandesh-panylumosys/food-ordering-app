import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

/** The standard Indian veg / non-veg mark. */
export function VegIndicator({ isVeg, size = 14 }: { isVeg: boolean; size?: number }) {
  const color = isVeg ? colors.veg : colors.nonVeg;
  return (
    <View
      accessibilityLabel={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      style={[styles.box, { width: size, height: size, borderColor: color }]}
    >
      <View
        style={[
          isVeg ? styles.dot : styles.triangle,
          isVeg
            ? { width: size * 0.45, height: size * 0.45, backgroundColor: color }
            : { borderBottomColor: color, borderLeftWidth: size * 0.26, borderRightWidth: size * 0.26, borderBottomWidth: size * 0.44 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1.4, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  dot: { borderRadius: 99 },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
  },
});
