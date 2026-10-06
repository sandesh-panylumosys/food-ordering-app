import type { UploadResult } from '@food/shared-types';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from './api';

export type UploadFolder = 'products' | 'categories' | 'banners' | 'branding';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns a human message if the file can't be uploaded, else null. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP or AVIF images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be smaller than 5 MB.';
  return null;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder: UploadFolder }) => {
      const form = new FormData();
      form.append('folder', folder);
      form.append('image', file);
      return api.post<UploadResult>('/admin/uploads', form);
    },
  });
}

export const isUploadsUnavailable = (err: unknown) =>
  err instanceof ApiError && (err.status === 503 || err.code === 'SERVICE_UNAVAILABLE');
