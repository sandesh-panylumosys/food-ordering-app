/**
 * Seeds categories, products and an admin account. Safe to re-run (upserts by slug/email).
 *
 *   pnpm db:seed               # use Unsplash image URLs
 *   pnpm db:seed --cloudinary  # copy every image into your Cloudinary account first
 */
import { categories, products } from '../db/seed-data.js';
import { env } from '../src/config/env.js';
import { supabase } from '../src/config/supabase.js';
import { uploadRemoteImage, type UploadFolder } from '../src/services/upload.service.js';
import { hashPassword } from '../src/utils/password.js';

const useCloudinary = process.argv.includes('--cloudinary');
if (useCloudinary && !env.cloudinaryEnabled) {
  console.error('--cloudinary requires CLOUDINARY_* variables in apps/backend/.env');
  process.exit(1);
}

const imageCache = new Map<string, { url: string; publicId: string | null }>();
/**
 * Uploads (once per record) to Cloudinary. Every record gets its OWN asset: the
 * API deletes an image's asset when it is replaced, so a shared asset would
 * break the other record that points at it.
 */
async function image(url: string, folder: UploadFolder, owner: string) {
  if (!useCloudinary) return { url, publicId: null };
  const key = `${folder}:${owner}:${url}`;
  const cached = imageCache.get(key);
  if (cached) return cached;
  const uploaded = await uploadRemoteImage(url, folder);
  const result = { url: uploaded.url, publicId: uploaded.publicId };
  imageCache.set(key, result);
  return result;
}

function fail(step: string, error: { message: string } | null) {
  if (error) {
    console.error(`❌ ${step}: ${error.message}`);
    process.exit(1);
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ℹ️  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin account.');
    return;
  }
  if (password.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }
  const { error } = await supabase.from('users').upsert(
    {
      email,
      name: process.env.SEED_ADMIN_NAME ?? 'Café Admin',
      password_hash: await hashPassword(password),
      role: 'ADMIN',
    },
    { onConflict: 'email' },
  );
  fail('admin user', error);
  console.log(`✓ admin account ready: ${email}`);
}

async function seedCatalog() {
  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const img = await image(c.image, 'categories', c.slug);
    const { data, error } = await supabase
      .from('categories')
      .upsert(
        {
          slug: c.slug,
          name: c.name,
          description: c.description,
          image_url: img.url,
          image_public_id: img.publicId,
          sort_order: c.sortOrder,
          is_active: true,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    fail(`category ${c.slug}`, error);
    categoryIds.set(c.slug, data!.id as string);
  }
  console.log(`✓ ${categories.length} categories`);

  for (const p of products) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Unknown category ${p.category} for ${p.slug}`);
    const img = await image(p.image, 'products', p.slug);

    const { data, error } = await supabase
      .from('products')
      .upsert(
        {
          slug: p.slug,
          category_id: categoryId,
          name: p.name,
          short_description: p.shortDescription,
          description: p.description,
          ingredients: p.ingredients,
          price: p.price,
          compare_at_price: p.compareAtPrice ?? null,
          image_url: img.url,
          image_public_id: img.publicId,
          is_veg: p.isVeg,
          is_available: true,
          is_featured: p.isFeatured ?? false,
          is_bestseller: p.isBestseller ?? false,
          rating: p.rating,
          rating_count: p.ratingCount,
          prep_time_minutes: p.prepTimeMinutes,
          calories: p.calories ?? null,
          customizations: p.customizations ?? [],
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    fail(`product ${p.slug}`, error);

    // product_images holds EXTRA gallery photos; the main photo is products.image_url.
    const productId = data!.id as string;
    await supabase.from('product_images').delete().eq('product_id', productId);
    const rows = [];
    for (const [i, url] of (p.gallery ?? []).entries()) {
      const g = await image(url, 'products', `${p.slug}-gallery-${i}`);
      rows.push({ product_id: productId, url: g.url, public_id: g.publicId, alt: p.name, sort_order: i + 1 });
    }
    if (rows.length) {
      const { error: imgError } = await supabase.from('product_images').insert(rows);
      fail(`images for ${p.slug}`, imgError);
    }
  }
  console.log(`✓ ${products.length} products${useCloudinary ? ' (images on Cloudinary)' : ''}`);
}

await seedCatalog();
await seedAdmin();
console.log('\n✅ Seed complete.');
