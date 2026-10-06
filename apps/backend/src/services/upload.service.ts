import type { UploadApiResponse } from 'cloudinary';
import type { UploadResult } from '@food/shared-types';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export type UploadFolder = 'products' | 'categories' | 'banners' | 'branding';

function assertEnabled() {
  if (!env.cloudinaryEnabled) {
    throw AppError.unavailable('Image uploads are not configured. Add Cloudinary credentials to the backend.');
  }
}

export async function uploadImage(buffer: Buffer, folder: UploadFolder): Promise<UploadResult> {
  assertEnabled();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
        resource_type: 'image',
        // Cap stored originals; delivery transformations (f_auto,q_auto,w_*) happen per request.
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
      },
      (error, res) => (error || !res ? reject(error ?? new Error('Empty upload response')) : resolve(res)),
    );
    stream.end(buffer);
  }).catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Cloudinary upload failed', err);
    throw new AppError(502, 'UPLOAD_FAILED', 'Image upload failed. Please try again.');
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

/** Uploads a remote image URL (used by the seed script). */
export async function uploadRemoteImage(url: string, folder: UploadFolder): Promise<UploadResult> {
  assertEnabled();
  const result = await cloudinary.uploader.upload(url, {
    folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
    resource_type: 'image',
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
  });
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
}

/** Best-effort cleanup; never fails the calling request. */
export async function deleteImage(publicId: string): Promise<void> {
  if (!env.cloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Could not delete Cloudinary image ${publicId}`, err);
  }
}
