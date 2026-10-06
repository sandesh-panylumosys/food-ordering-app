import type { Category } from '@food/shared-types';
import { categorySchema } from '@food/validation';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { InlineAlert } from '../../components/EmptyState';
import { Input, Textarea } from '../../components/Field';
import { ImageUpload, type ImageValue } from '../../components/ImageUpload';
import { Modal } from '../../components/Modal';
import { Toggle } from '../../components/Toggle';
import { useToast } from '../../components/Toast';
import { errorFields, errorMessage } from '../../lib/api';
import { toNumber, zodFieldErrors, type FieldErrors } from '../../lib/forms';
import { useSaveCategory, type CategoryPayload } from './api';

interface Props {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}

export function CategoryFormModal({ open, category, onClose }: Props) {
  const save = useSaveCategory();
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!save.isPending}
      title={category ? 'Edit category' : 'New category'}
      description={category ? `/${category.slug}` : 'Group dishes on the menu.'}
    >
      {/* Keyed so each open starts from fresh state. */}
      <CategoryForm key={category?.id ?? 'new'} category={category} onDone={onClose} save={save} />
    </Modal>
  );
}

function CategoryForm({
  category,
  onDone,
  save,
}: {
  category: Category | null;
  onDone: () => void;
  save: ReturnType<typeof useSaveCategory>;
}) {
  const toast = useToast();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [image, setImage] = useState<ImageValue | null>(
    category?.imageUrl ? { url: category.imageUrl, publicId: null } : null,
  );
  const [imageTouched, setImageTouched] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const body: CategoryPayload = {
      name,
      description: description.trim() || null,
      sortOrder: toNumber(sortOrder),
      isActive,
    };
    // The API never returns imagePublicId, so only send image fields when changed —
    // otherwise we'd wipe the stored Cloudinary id (and trigger its deletion).
    if (imageTouched || !category) {
      body.imageUrl = image?.url ?? null;
      body.imagePublicId = image?.publicId ?? null;
    }

    const result = category ? categorySchema.partial().safeParse(body) : categorySchema.safeParse(body);
    if (!result.success) {
      setFields(zodFieldErrors(result.error));
      return;
    }
    setFields({});

    save.mutate(
      { id: category?.id, body },
      {
        onSuccess: (saved) => {
          toast.success(category ? `Saved “${saved.name}”.` : `Created “${saved.name}”.`);
          onDone();
        },
        onError: (err) => {
          setFields(errorFields(err));
          setFormError(errorMessage(err, "Couldn't save the category. Please try again."));
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <InlineAlert>{formError}</InlineAlert>}
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fields.name} required maxLength={60} autoFocus />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fields.description}
        maxLength={300}
        rows={2}
      />
      <ImageUpload
        label="Image"
        folder="categories"
        value={image}
        onChange={(v) => {
          setImage(v);
          setImageTouched(true);
        }}
        error={fields.imageUrl ?? fields.imagePublicId}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <Input
          label="Sort order"
          type="number"
          inputMode="numeric"
          min={0}
          max={1000}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          error={fields.sortOrder}
          hint="Lower numbers appear first."
        />
        <div className="pb-6">
          <Toggle checked={isActive} onChange={setIsActive} label="Active" description="Visible in the app" />
        </div>
      </div>
      <div className="-mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-cream/50 px-5 py-3">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {category ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  );
}
