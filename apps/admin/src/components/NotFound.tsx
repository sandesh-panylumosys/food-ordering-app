import { Link } from 'react-router';
import { buttonClass } from './Button';
import { EmptyState } from './EmptyState';

export function NotFound() {
  return (
    <EmptyState
      className="py-24"
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <Link to="/" className={buttonClass('primary')}>
          Back to dashboard
        </Link>
      }
    />
  );
}
