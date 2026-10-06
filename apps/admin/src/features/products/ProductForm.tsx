import type { Category, Product } from '@food/shared-types';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, buttonClass } from '../../components/Button';
import { Card, CardHeader } from '../../components/Card';
import { InlineAlert } from '../../components/EmptyState';
import { Input, Select, Textarea } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { Toggle } from '../../components/Toggle';
import { useToast } from '../../components/Toast';
import { errorFields, errorMessage } from '../../lib/api';
import type { FieldErrors } from '../../lib/forms';
import { useSaveProduct } from './api';
import { CustomizationsEditor } from './CustomizationsEditor';
import { buildPayload, draftFromProduct, type ProductDraft } from './formState';
import { IngredientsInput } from './IngredientsInput';

const firstError = (errors: FieldErrors, key: string) =>
  errors[key] ?? Object.entries(errors).find(([k]) => k.startsWith(`${key}.`))?.[1];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="space-y-4 p-5">{children}</div>
    </Card>
  );
}

/** After errors render, bring the first invalid field into view. */
const focusFirstInvalid = () =>
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const toast = useToast();
  const navigate = useNavigate();
  const save = useSaveProduct();
  const isNew = !product;

  const [draft, setDraft] = useState<ProductDraft>(() => draftFromProduct(product, categories[0]?.id ?? ''));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = buildPayload(draft, isNew);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError('Please fix the highlighted fields.');
      focusFirstInvalid();
      return;
    }
    setErrors({});
    save.mutate(
      { id: product?.id, body: result.body },
      {
        onSuccess: (saved) => {
          toast.success(isNew ? `Created “${saved.name}”.` : `Saved “${saved.name}”.`);
          navigate('/products');
        },
        onError: (err) => {
          setErrors(errorFields(err));
          setFormError(errorMessage(err, "Couldn't save the product. Please try again."));
          focusFirstInvalid();
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && (
        <InlineAlert className="mb-5">{formError}</InlineAlert>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Section title="Details">
            <Select
              label="Category"
              required
              value={draft.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              error={errors.categoryId}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </Select>
            <Input
              label="Name"
              required
              maxLength={100}
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Short description"
              required
              maxLength={140}
              value={draft.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              error={errors.shortDescription}
              hint={`Shown on menu cards · ${draft.shortDescription.length}/140`}
            />
            <Textarea
              label="Description"
              required
              rows={4}
              maxLength={2000}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              error={errors.description}
            />
            <IngredientsInput
              value={draft.ingredients}
              onChange={(v) => set('ingredients', v)}
              error={firstError(errors, 'ingredients')}
            />
          </Section>

          <Section title="Pricing & kitchen">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Price (₹)"
                required
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => set('price', e.target.value)}
                error={errors.price}
              />
              <Input
                label="Compare-at price (₹)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draft.compareAtPrice}
                onChange={(e) => set('compareAtPrice', e.target.value)}
                error={errors.compareAtPrice}
                hint="Original price, shown struck through when on offer"
              />
              <Input
                label="Prep time (minutes)"
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                value={draft.prepTimeMinutes}
                onChange={(e) => set('prepTimeMinutes', e.target.value)}
                error={errors.prepTimeMinutes}
              />
              <Input
                label="Calories"
                type="number"
                inputMode="numeric"
                min={0}
                max={5000}
                value={draft.calories}
                onChange={(e) => set('calories', e.target.value)}
                error={errors.calories}
                hint="Optional"
              />
            </div>
          </Section>

          <Section title="Customizations" description="Choices customers make when adding this dish to the cart.">
            <CustomizationsEditor
              groups={draft.customizations}
              onChange={(groups) => set('customizations', groups)}
              errors={errors}
            />
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <Section title="Image">
            <ImageUpload
              label="Product photo"
              folder="products"
              value={draft.image}
              onChange={(image) => setDraft((d) => ({ ...d, image, imageTouched: true }))}
              error={errors.imageUrl ?? errors.imagePublicId}
            />
          </Section>

          <Section title="Visibility">
            <Toggle
              label="Available"
              description="Customers can order it right now"
              checked={draft.isAvailable}
              onChange={(v) => set('isAvailable', v)}
            />
            <Toggle
              label="Vegetarian"
              description="Shows the green veg mark"
              checked={draft.isVeg}
              onChange={(v) => set('isVeg', v)}
            />
            <Toggle
              label="Featured"
              description="Eligible for the home hero and offers"
              checked={draft.isFeatured}
              onChange={(v) => set('isFeatured', v)}
            />
            <Toggle
              label="Bestseller"
              description="Adds a bestseller badge"
              checked={draft.isBestseller}
              onChange={(v) => set('isBestseller', v)}
            />
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-2 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link to="/products" className={buttonClass('secondary')}>
          Cancel
        </Link>
        <Button type="submit" loading={save.isPending}>
          {isNew ? 'Create product' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
