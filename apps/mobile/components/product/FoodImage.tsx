import { Image, type ImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { optimizeImage } from '@/lib/image';

interface FoodImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null | undefined;
  /** Rendered width in dp — used to request the right size from the CDN. */
  width: number;
}

export function FoodImage({ uri, width, style, ...rest }: FoodImageProps) {
  return (
    <Image
      source={optimizeImage(uri, width)}
      contentFit="cover"
      transition={260}
      cachePolicy="memory-disk"
      recyclingKey={uri ?? undefined}
      style={[styles.base, style]}
      accessibilityIgnoresInvertColors
      {...rest}
    />
  );
}

const styles = StyleSheet.create({ base: { backgroundColor: colors.skeleton } });
