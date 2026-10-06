import { Link, useParams } from 'react-router';
import { buttonClass } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { IconArrowLeft, IconGrid } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Skeleton } from '../../components/Spinner';
import { ApiError, errorMessage } from '../../lib/api';
import { useCategories } from '../categories/api';
import { useProduct } from './api';
import { ProductForm } from './ProductForm';

const BackLink = () => (
  <Link to="/products" className={buttonClass('ghost', 'sm', '-ml-3 text-muted')}>
    <IconArrowLeft size={15} /> All products
  </Link>
);

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const product = useProduct(id);
  const categories = useCategories();

  const title = isNew ? 'New product' : product.data ? `Edit ${product.data.name}` : 'Edit product';
  const loading = categories.isPending || (!isNew && product.isPending);
  const failed = categories.isError ? categories : !isNew && product.isError ? product : null;

  let body;
  if (loading) {
    body = (
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Skeleton className="h-[480px] w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  } else if (failed) {
    const notFound = failed.error instanceof ApiError && (failed.error.status === 404 || failed.error.status === 422);
    body = (
      <Card>
        <ErrorState
          message={notFound ? "This product doesn't exist or was deleted." : errorMessage(failed.error)}
          onRetry={notFound ? undefined : () => void failed.refetch()}
          retrying={failed.isFetching}
        />
      </Card>
    );
  } else if (categories.data && categories.data.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={<IconGrid />}
          title="Create a category first"
          description="Every product belongs to a category."
          action={
            <Link to="/categories" className={buttonClass('primary')}>
              Go to categories
            </Link>
          }
        />
      </Card>
    );
  } else {
    body = <ProductForm key={product.data?.id ?? 'new'} product={product.data} categories={categories.data ?? []} />;
  }

  return (
    <>
      <PageHeader eyebrow={<BackLink />} title={title} />
      {body}
    </>
  );
}
