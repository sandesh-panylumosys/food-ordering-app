// Request schemas live in the shared @food/validation package so the admin panel
// and mobile app validate forms with exactly the same rules as the API.
export * from '@food/validation';

import { z } from 'zod';

export const uploadFolderSchema = z.object({
  folder: z.enum(['products', 'categories', 'banners', 'branding']).default('products'),
});
