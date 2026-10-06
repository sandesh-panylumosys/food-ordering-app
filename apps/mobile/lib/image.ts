import { PixelRatio } from 'react-native';

/**
 * Requests an appropriately-sized, modern-format image from the CDN. Works for
 * Cloudinary (f_auto,q_auto,w_*) and Unsplash URLs; other URLs pass through.
 */
export function optimizeImage(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  const px = Math.min(Math.round(PixelRatio.getPixelSizeForLayoutSize(width) / 100) * 100 || 400, 1600);

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${px}/`);
  }
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=${px}&q=75`;
  }
  return url;
}

/** Soft warm placeholder shown while images load. */
export const IMAGE_BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';
