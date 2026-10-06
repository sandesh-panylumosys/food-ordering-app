import type { Category } from '@food/shared-types';
import type { CategoryInput, CategoryUpdateInput } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { CategoryRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { unwrap, unwrapMaybe } from '../utils/db.js';
import { toCategory } from '../utils/mappers.js';
import { slugify, uniqueSlug } from '../utils/slugify.js';
import { deleteImage } from './upload.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

export async function listCategories(opts: { includeInactive?: boolean } = {}): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*, products(count)')
    .order('sort_order')
    .order('name');
  if (!opts.includeInactive) query = query.eq('is_active', true);
  const rows = unwrap<CategoryRow[]>(await query);
  return rows.map(toCategory);
}

/** Accepts a UUID or a slug. */
export async function getCategory(idOrSlug: string, opts: { includeInactive?: boolean } = {}) {
  let query = supabase.from('categories').select('*, products(count)');
  query = isUuid(idOrSlug) ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug);
  if (!opts.includeInactive) query = query.eq('is_active', true);
  const row = unwrapMaybe(await query.maybeSingle<CategoryRow>());
  if (!row) throw AppError.notFound('Category');
  return toCategory(row);
}

async function slugFor(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'category';
  let query = supabase.from('categories').select('id').eq('slug', base);
  if (excludeId) query = query.neq('id', excludeId);
  const clash = unwrapMaybe(await query.maybeSingle());
  return clash ? uniqueSlug(name) : base;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const row = unwrap(
    await supabase
      .from('categories')
      .insert({
        name: input.name,
        slug: await slugFor(input.name),
        description: input.description,
        image_url: input.imageUrl,
        image_public_id: input.imagePublicId,
        sort_order: input.sortOrder,
        is_active: input.isActive,
      })
      .select('*')
      .single<CategoryRow>(),
  );
  return toCategory(row);
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<Category> {
  const current = unwrap(
    await supabase.from('categories').select('*').eq('id', id).maybeSingle<CategoryRow>(),
    'Category',
  );

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined && input.name !== current.name) {
    patch.name = input.name;
    patch.slug = await slugFor(input.name, id);
  }
  if (input.description !== undefined) patch.description = input.description;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.imagePublicId !== undefined) patch.image_public_id = input.imagePublicId;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const row = unwrap(
    await supabase.from('categories').update(patch).eq('id', id).select('*').single<CategoryRow>(),
  );

  if (current.image_public_id && current.image_public_id !== row.image_public_id) {
    void deleteImage(current.image_public_id);
  }
  return toCategory(row);
}

export async function deleteCategory(id: string): Promise<void> {
  const current = unwrap(
    await supabase.from('categories').select('*').eq('id', id).maybeSingle<CategoryRow>(),
    'Category',
  );
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if (count) {
    throw AppError.conflict(
      `This category still has ${count} product${count === 1 ? '' : 's'}. Move or delete them first.`,
    );
  }
  unwrapMaybe(await supabase.from('categories').delete().eq('id', id));
  if (current.image_public_id) void deleteImage(current.image_public_id);
}
