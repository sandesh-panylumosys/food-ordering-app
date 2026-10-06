import type { Product } from '@food/shared-types';
import { productSchema, type ProductFormInput, type ProductUpdateInput } from '@food/validation';
import type { ImageValue } from '../../components/ImageUpload';
import { toNumber, uid, zodFieldErrors, type FieldErrors } from '../../lib/forms';

export interface OptionDraft {
  key: string;
  id: string;
  name: string;
  price: string;
  /** Once the admin edits the id by hand we stop deriving it from the name. */
  idEdited: boolean;
}

export interface GroupDraft {
  key: string;
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  maxSelect: string;
  idEdited: boolean;
  options: OptionDraft[];
}

export interface ProductDraft {
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  ingredients: string[];
  price: string;
  compareAtPrice: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  prepTimeMinutes: string;
  calories: string;
  image: ImageValue | null;
  imageTouched: boolean;
  customizations: GroupDraft[];
}

const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

export const newOption = (): OptionDraft => ({ key: uid(), id: '', name: '', price: '0', idEdited: false });

export const newGroup = (): GroupDraft => ({
  key: uid(),
  id: '',
  name: '',
  type: 'single',
  required: false,
  maxSelect: '',
  idEdited: false,
  options: [newOption()],
});

export function draftFromProduct(p?: Product, defaultCategoryId = ''): ProductDraft {
  return {
    categoryId: p?.categoryId ?? defaultCategoryId,
    name: p?.name ?? '',
    shortDescription: p?.shortDescription ?? '',
    description: p?.description ?? '',
    ingredients: p?.ingredients ?? [],
    price: str(p?.price),
    compareAtPrice: str(p?.compareAtPrice),
    isVeg: p?.isVeg ?? true,
    isAvailable: p?.isAvailable ?? true,
    isFeatured: p?.isFeatured ?? false,
    isBestseller: p?.isBestseller ?? false,
    prepTimeMinutes: str(p?.prepTimeMinutes ?? 20),
    calories: str(p?.calories),
    image: p?.imageUrl ? { url: p.imageUrl, publicId: null } : null,
    imageTouched: false,
    customizations: (p?.customizations ?? []).map((g) => ({
      key: uid(),
      id: g.id,
      name: g.name,
      type: g.type,
      required: g.required,
      maxSelect: str(g.maxSelect),
      idEdited: true,
      options: g.options.map((o) => ({ key: uid(), id: o.id, name: o.name, price: str(o.price), idEdited: true })),
    })),
  };
}

function toInput(d: ProductDraft): ProductFormInput {
  return {
    categoryId: d.categoryId,
    name: d.name,
    shortDescription: d.shortDescription,
    description: d.description,
    ingredients: d.ingredients,
    price: toNumber(d.price) ?? 0,
    compareAtPrice: toNumber(d.compareAtPrice) ?? null,
    imageUrl: d.image?.url ?? null,
    imagePublicId: d.image?.publicId ?? null,
    isVeg: d.isVeg,
    isAvailable: d.isAvailable,
    isFeatured: d.isFeatured,
    isBestseller: d.isBestseller,
    prepTimeMinutes: toNumber(d.prepTimeMinutes),
    calories: toNumber(d.calories) ?? null,
    customizations: d.customizations.map((g) => ({
      id: g.id.trim(),
      name: g.name,
      type: g.type,
      required: g.required,
      maxSelect: g.type === 'multiple' ? toNumber(g.maxSelect) : undefined,
      options: g.options.map((o) => ({ id: o.id.trim(), name: o.name, price: toNumber(o.price) ?? 0 })),
    })),
  };
}

/** Rules the schema can't express but the ordering flow depends on. */
function extraChecks(d: ProductDraft): FieldErrors {
  const errors: FieldErrors = {};
  const groupIds = new Set<string>();
  d.customizations.forEach((g, gi) => {
    const gid = g.id.trim();
    if (gid && groupIds.has(gid)) errors[`customizations.${gi}.id`] = 'Group IDs must be unique';
    groupIds.add(gid);
    const optionIds = new Set<string>();
    g.options.forEach((o, oi) => {
      const oid = o.id.trim();
      if (oid && optionIds.has(oid)) errors[`customizations.${gi}.options.${oi}.id`] = 'Option IDs must be unique';
      optionIds.add(oid);
    });
  });
  return errors;
}

export type BuildResult = { ok: true; body: ProductUpdateInput } | { ok: false; errors: FieldErrors };

export function buildPayload(d: ProductDraft, isNew: boolean): BuildResult {
  const parsed = productSchema.safeParse(toInput(d));
  const extra = extraChecks(d);
  if (!parsed.success || Object.keys(extra).length > 0) {
    return { ok: false, errors: { ...extra, ...(parsed.success ? {} : zodFieldErrors(parsed.error)) } };
  }
  const { imageUrl, imagePublicId, ...rest } = parsed.data;
  // The API doesn't expose imagePublicId, so leave image fields out of edits unless the
  // image actually changed — sending null would orphan/delete the stored Cloudinary asset.
  const body: ProductUpdateInput = isNew || d.imageTouched ? { ...rest, imageUrl, imagePublicId } : rest;
  return { ok: true, body };
}
