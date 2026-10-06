import type { HomeFeed, Paginated, Product } from '@food/shared-types';
import type { ProductInput, ProductQuery, ProductUpdateInput } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { ProductRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeSearch, unwrap, unwrapMaybe } from '../utils/db.js';
import { toProduct } from '../utils/mappers.js';
import { paginationMeta, range } from '../utils/response.js';
import { slugify, uniqueSlug } from '../utils/slugify.js';
import { isUuid, listCategories } from './category.service.js';
import { deleteImage } from './upload.service.js';

const PRODUCT_SELECT: string =
  '*, category:categories!inner(id, name, slug, is_active), images:product_images(id, url, public_id, alt, sort_order)';

interface ListOptions extends ProductQuery {
  /** Admin listings include unavailable products and inactive categories. */
  admin?: boolean;
}

export async function listProducts(opts: ListOptions): Promise<Paginated<Product>> {
  const { page, limit } = opts;
  let query = supabase.from('products').select(PRODUCT_SELECT, { count: 'exact' });

  if (!opts.admin) {
    query = query.eq('category.is_active', true);
    if (!opts.includeUnavailable) query = query.eq('is_available', true);
  }

  if (opts.category) {
    query = isUuid(opts.category)
      ? query.eq('category_id', opts.category)
      : query.eq('category.slug', opts.category);
  }
  if (opts.featured !== undefined) query = query.eq('is_featured', opts.featured);
  if (opts.bestseller !== undefined) query = query.eq('is_bestseller', opts.bestseller);

  if (opts.search) {
    const term = sanitizeSearch(opts.search);
    if (term) {
      // Match product text, or anything inside a category whose name matches.
      const { data: cats } = await supabase.from('categories').select('id').ilike('name', `%${term}%`);
      const pattern = `*${term}*`;
      const clauses = [
        `name.ilike.${pattern}`,
        `short_description.ilike.${pattern}`,
        `description.ilike.${pattern}`,
      ];
      if (cats?.length) clauses.push(`category_id.in.(${cats.map((c) => c.id).join(',')})`);
      query = query.or(clauses.join(','));
    }
  }

  const [from, to] = range(page, limit);
  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .order('name')
    .range(from, to);

  const rows = unwrap<ProductRow[]>({ data, error });
  return { items: rows.map(toProduct), meta: paginationMeta(page, limit, count ?? rows.length) };
}

export async function getProduct(idOrSlug: string, opts: { admin?: boolean } = {}): Promise<Product> {
  let query = supabase.from('products').select(PRODUCT_SELECT);
  query = isUuid(idOrSlug) ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug);
  const row = unwrapMaybe<ProductRow>(await query.maybeSingle());
  if (!row || (!opts.admin && row.category?.is_active === false)) throw AppError.notFound('Product');
  return toProduct(row);
}

/** Loads products for pricing. Callers must check availability themselves. */
export async function getProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  return unwrap<ProductRow[]>(await supabase.from('products').select(PRODUCT_SELECT).in('id', ids));
}

export async function getHomeFeed(): Promise<HomeFeed> {
  const [categories, { data, error }] = await Promise.all([
    listCategories(),
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_available', true)
      .eq('category.is_active', true)
      .order('rating', { ascending: false })
      .limit(100),
  ]);

  const products = unwrap<ProductRow[]>({ data, error }).map(toProduct);
  const offers = products.filter((p) => p.compareAtPrice !== null && p.compareAtPrice > p.price);
  const hero = products.find((p) => p.isFeatured && p.imageUrl) ?? products[0] ?? null;

  const popular = [...products].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 8);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 8);
  const shown = new Set([...popular, ...bestsellers].map((p) => p.id));
  const recommended = products
    .filter((p) => !shown.has(p.id))
    .concat(products.filter((p) => shown.has(p.id) && p.isFeatured))
    .slice(0, 8);

  return { hero, categories, popular, bestsellers, recommended, offers: offers.slice(0, 6) };
}

async function slugFor(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'dish';
  let query = supabase.from('products').select('id').eq('slug', base);
  if (excludeId) query = query.neq('id', excludeId);
  const clash = unwrapMaybe(await query.maybeSingle());
  return clash ? uniqueSlug(name) : base;
}

function toRow(input: ProductUpdateInput): Record<string, unknown> {
  const map: Record<string, unknown> = {
    category_id: input.categoryId,
    name: input.name,
    short_description: input.shortDescription,
    description: input.description,
    ingredients: input.ingredients,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    image_url: input.imageUrl,
    image_public_id: input.imagePublicId,
    is_veg: input.isVeg,
    is_available: input.isAvailable,
    is_featured: input.isFeatured,
    is_bestseller: input.isBestseller,
    prep_time_minutes: input.prepTimeMinutes,
    calories: input.calories,
    customizations: input.customizations,
  };
  return Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined));
}

async function assertCategoryExists(categoryId: string) {
  const cat = unwrapMaybe(
    await supabase.from('categories').select('id').eq('id', categoryId).maybeSingle(),
  );
  if (!cat) throw AppError.validation('Choose a valid category', { fields: { categoryId: 'Invalid category' } });
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await assertCategoryExists(input.categoryId);
  const row = unwrap<{ id: string }>(
    await supabase
      .from('products')
      .insert({ ...toRow(input), slug: await slugFor(input.name) })
      .select('id')
      .single(),
  );
  return getProduct(row.id, { admin: true });
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
  const current = unwrap<ProductRow>(
    await supabase.from('products').select('*').eq('id', id).maybeSingle(),
    'Product',
  );
  if (input.categoryId) await assertCategoryExists(input.categoryId);

  const patch = toRow(input);
  if (input.name && input.name !== current.name) patch.slug = await slugFor(input.name, id);

  unwrapMaybe(await supabase.from('products').update(patch).eq('id', id));

  if (
    current.image_public_id &&
    input.imagePublicId !== undefined &&
    input.imagePublicId !== current.image_public_id
  ) {
    void deleteImage(current.image_public_id);
  }
  return getProduct(id, { admin: true });
}

export async function deleteProduct(id: string): Promise<void> {
  const current = unwrap<ProductRow>(
    await supabase.from('products').select('*, images:product_images(public_id)').eq('id', id).maybeSingle(),
    'Product',
  );
  // order_items keep their snapshot; product_id becomes NULL via ON DELETE SET NULL.
  unwrapMaybe(await supabase.from('products').delete().eq('id', id));

  const publicIds = [current.image_public_id, ...(current.images ?? []).map((i) => i.public_id)];
  for (const pid of publicIds) if (pid) void deleteImage(pid);
}
