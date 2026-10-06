import type { Category } from '@food/shared-types';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, IconButton } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { IconEdit, IconGrid, IconImage, IconPlus, IconTrash } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Table, TableSkeleton, Td, Th, THead, Tr } from '../../components/Table';
import { Toggle } from '../../components/Toggle';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../lib/api';
import { useCategories, useDeleteCategory, useToggleCategory } from './api';
import { CategoryFormModal } from './CategoryFormModal';

export function CategoriesPage() {
  const toast = useToast();
  const { data, isPending, isError, error, refetch, isFetching } = useCategories();
  const toggle = useToggleCategory();
  const remove = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openForm = (category: Category | null) => {
    setEditing(category);
    setFormOpen(true);
  };

  const onToggle = (c: Category, isActive: boolean) => {
    toggle.mutate(
      { id: c.id, isActive },
      {
        onSuccess: () => toast.success(`${c.name} is now ${isActive ? 'visible' : 'hidden'} in the app.`),
        onError: (err) => toast.error(errorMessage(err, "Couldn't update the category.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setDeleteError(null);
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Deleted “${deleting.name}”.`);
        setDeleting(null);
      },
      onError: (err) => setDeleteError(errorMessage(err, "Couldn't delete the category.")),
    });
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the menu. Inactive categories are hidden from customers."
        actions={
          <Button icon={<IconPlus size={16} />} onClick={() => openForm(null)}>
            New category
          </Button>
        }
      />

      <Card>
        {isError && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} retrying={isFetching} />
        ) : data && data.length === 0 ? (
          <EmptyState
            icon={<IconGrid />}
            title="No categories yet"
            description="Create a category before adding dishes to the menu."
            action={
              <Button icon={<IconPlus size={16} />} onClick={() => openForm(null)}>
                New category
              </Button>
            }
          />
        ) : (
          <Table label="Categories">
            <THead>
              <tr>
                <Th className="w-16">Image</Th>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th className="text-right">Products</Th>
                <Th className="text-right">Sort</Th>
                <Th>Active</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            {isPending ? (
              <TableSkeleton cols={7} rows={5} />
            ) : (
              <tbody>
                {data?.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="size-10 rounded-lg bg-cream object-cover" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-lg bg-cream text-muted">
                          <IconImage size={16} />
                        </span>
                      )}
                    </Td>
                    <Td>
                      <p className="font-semibold text-ink">{c.name}</p>
                      {c.description && <p className="max-w-xs truncate text-xs text-muted">{c.description}</p>}
                    </Td>
                    <Td>
                      <code className="font-mono text-[12px] text-muted">{c.slug}</code>
                    </Td>
                    <Td className="tabular text-right">
                      {c.productCount ? (
                        <Link
                          to={`/products?category=${c.id}`}
                          className="font-semibold text-caramel-dark hover:underline"
                          aria-label={`${c.productCount} products in ${c.name}`}
                        >
                          {c.productCount}
                        </Link>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </Td>
                    <Td className="tabular text-right">{c.sortOrder}</Td>
                    <Td>
                      <Toggle
                        size="sm"
                        hideLabel
                        label={`${c.name} active`}
                        checked={c.isActive}
                        disabled={toggle.isPending && toggle.variables?.id === c.id}
                        onChange={(v) => onToggle(c, v)}
                      />
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <IconButton label={`Edit ${c.name}`} onClick={() => openForm(c)}>
                        <IconEdit size={16} />
                      </IconButton>
                      <IconButton
                        label={`Delete ${c.name}`}
                        tone="danger"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(c);
                        }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
      </Card>

      <CategoryFormModal open={formOpen} category={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.name ?? ''}”?`}
        message={
          deleting?.productCount
            ? `This category has ${deleting.productCount} product${deleting.productCount === 1 ? '' : 's'}. Move or delete them first — or deactivate the category instead.`
            : 'This permanently removes the category. This can’t be undone.'
        }
        confirmLabel="Delete category"
        loading={remove.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
