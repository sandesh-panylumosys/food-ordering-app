import type { Product } from '@food/shared-types';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Badge, VegDot } from '../../components/Badge';
import { buttonClass, IconButton } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { Input, Select } from '../../components/Field';
import { IconCup, IconEdit, IconImage, IconPlus, IconSearch, IconStar, IconTrash } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { Table, TableSkeleton, Td, Th, THead, Tr } from '../../components/Table';
import { Toggle } from '../../components/Toggle';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { formatPrice } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { useCategories } from '../categories/api';
import { useDeleteProduct, usePatchProduct, useProducts } from './api';

export function ProductsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';

  const [search, setSearch] = useState(q);
  const debounced = useDebounced(search.trim());

  const update = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (debounced !== q) update({ q: debounced || undefined, page: undefined });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useCategories();
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useProducts({
    page,
    search: q || undefined,
    category: category || undefined,
  });
  const patch = usePatchProduct();
  const remove = useDeleteProduct();
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleAvailability = (p: Product, isAvailable: boolean) =>
    patch.mutate(
      { id: p.id, patch: { isAvailable } },
      {
        onSuccess: () => toast.success(`${p.name} is now ${isAvailable ? 'available' : 'unavailable'}.`),
        onError: (err) => toast.error(errorMessage(err, `Couldn't update ${p.name}.`)),
      },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    setDeleteError(null);
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Deleted “${deleting.name}”.`);
        setDeleting(null);
      },
      onError: (err) => setDeleteError(errorMessage(err, "Couldn't delete the product.")),
    });
  };

  const filtered = Boolean(q || category);

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything on the menu, including unavailable dishes."
        actions={
          <Link to="/products/new" className={buttonClass('primary')}>
            <IconPlus size={16} /> New product
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-3 sm:p-4">
          <Input
            label="Search products"
            srOnlyLabel
            type="search"
            placeholder="Search by name, description or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leading={<IconSearch size={16} />}
            wrapperClassName="w-full max-w-sm"
          />
          <Select
            label="Category"
            srOnlyLabel
            value={category}
            onChange={(e) => update({ category: e.target.value || undefined, page: undefined })}
            wrapperClassName="w-full sm:w-56"
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? '' : ' (inactive)'}
              </option>
            ))}
          </Select>
          {filtered && (
            <button
              type="button"
              className="h-10 text-[13px] font-semibold text-caramel-dark hover:underline"
              onClick={() => {
                setSearch('');
                update({ q: undefined, category: undefined, page: undefined });
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {isError && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} retrying={isFetching} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={<IconCup />}
            title={filtered ? 'No products match' : 'No products yet'}
            description={filtered ? 'Try a different search or category.' : 'Add your first dish to the menu.'}
            action={
              !filtered && (
                <Link to="/products/new" className={buttonClass('primary')}>
                  <IconPlus size={16} /> New product
                </Link>
              )
            }
          />
        ) : (
          <div className={cx('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <Table label="Products">
              <THead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  <Th>Rating</Th>
                  <Th>Available</Th>
                  <Th>Tags</Th>
                  <Th className="text-right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </THead>
              {isPending ? (
                <TableSkeleton cols={7} />
              ) : (
                <tbody>
                  {data?.items.map((p) => (
                    <Tr key={p.id} className={cx(!p.isAvailable && 'bg-cream/40')}>
                      <Td>
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="size-11 shrink-0 rounded-lg bg-cream object-cover" />
                          ) : (
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cream text-muted">
                              <IconImage size={16} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="flex items-center gap-2">
                              <VegDot isVeg={p.isVeg} />
                              <Link
                                to={`/products/${p.id}/edit`}
                                className="max-w-[200px] truncate font-semibold text-ink hover:text-caramel-dark hover:underline"
                              >
                                {p.name}
                              </Link>
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-muted">{p.shortDescription}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-muted">{p.category?.name ?? '—'}</Td>
                      <Td className="tabular text-right whitespace-nowrap">
                        <span className="font-semibold text-ink">{formatPrice(p.price)}</span>
                        {p.compareAtPrice !== null && p.compareAtPrice > p.price && (
                          <s className="ml-1.5 text-xs text-muted">
                            <span className="sr-only">was </span>
                            {formatPrice(p.compareAtPrice)}
                          </s>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {p.ratingCount > 0 ? (
                          <span className="tabular inline-flex items-center gap-1 text-[13px]">
                            <IconStar size={13} className="text-gold" />
                            <span className="font-semibold">{p.rating.toFixed(1)}</span>
                            <span className="text-muted">({p.ratingCount})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted">No ratings</span>
                        )}
                      </Td>
                      <Td>
                        <Toggle
                          size="sm"
                          hideLabel
                          label={`${p.name} available`}
                          checked={p.isAvailable}
                          disabled={patch.isPending && patch.variables?.id === p.id}
                          onChange={(v) => toggleAvailability(p, v)}
                        />
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && <Badge tone="caramel">Featured</Badge>}
                          {p.isBestseller && <Badge tone="gold">Bestseller</Badge>}
                          {!p.isFeatured && !p.isBestseller && <span className="text-xs text-muted">—</span>}
                        </div>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <IconButton label={`Edit ${p.name}`} onClick={() => navigate(`/products/${p.id}/edit`)}>
                          <IconEdit size={16} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${p.name}`}
                          tone="danger"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(p);
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
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={(p) => update({ page: p > 1 ? String(p) : undefined })} />}
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.name ?? ''}”?`}
        message="This removes the dish from the menu permanently. Past orders keep their item details. To hide it temporarily, turn off availability instead."
        confirmLabel="Delete product"
        loading={remove.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
