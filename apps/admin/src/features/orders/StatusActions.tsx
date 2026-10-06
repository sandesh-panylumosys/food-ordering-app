import { ORDER_STATUS_TRANSITIONS } from '@food/config';
import type { Order, OrderStatus } from '@food/shared-types';
import { useState } from 'react';
import { statusLabel } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InlineAlert } from '../../components/EmptyState';
import { Textarea } from '../../components/Field';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../lib/api';
import { formatOrderNumber } from '../../lib/format';
import { useUpdateOrderStatus } from './api';

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Confirm order',
  PREPARING: 'Start preparing',
  READY: 'Mark ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel order',
};

export function StatusActions({ order }: { order: Order }) {
  const toast = useToast();
  const mutation = useUpdateOrderStatus(order.id);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = ORDER_STATUS_TRANSITIONS[order.status];
  const isPaid = order.paymentStatus === 'PAID';

  if (next.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted">
        This order is {statusLabel(order.status).toLowerCase()} — no further changes are possible.
      </p>
    );
  }

  const submit = (status: OrderStatus) => {
    setError(null);
    mutation.mutate(
      { status, note: note.trim() || null },
      {
        onSuccess: (updated) => {
          setNote('');
          setConfirmCancel(false);
          toast.success(`Order ${formatOrderNumber(updated.orderNumber)} is now ${statusLabel(updated.status).toLowerCase()}.`);
        },
        onError: (err) => {
          const msg = errorMessage(err, "Couldn't update the order. Please try again.");
          setError(msg);
          if (status !== 'CANCELLED') toast.error(msg);
        },
      },
    );
  };

  const advance = next.filter((s) => s !== 'CANCELLED');
  const canCancel = next.includes('CANCELLED');
  const pendingStatus = mutation.isPending ? mutation.variables?.status : undefined;

  return (
    <div className="space-y-4 px-5 py-4">
      {!isPaid && (
        <InlineAlert tone="warning">
          This order hasn't been paid yet, so it can only be cancelled. Other updates unlock once payment is received.
        </InlineAlert>
      )}

      <Textarea
        label="Note (optional)"
        hint="Saved on the status timeline, e.g. “Rider: Arjun”."
        rows={2}
        maxLength={200}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {advance.map((status, i) => (
          <Button
            key={status}
            variant={i === 0 ? 'primary' : 'secondary'}
            disabled={!isPaid || mutation.isPending}
            loading={pendingStatus === status}
            onClick={() => submit(status)}
            title={!isPaid ? 'Available once the order is paid' : undefined}
          >
            {ACTION_LABEL[status] ?? statusLabel(status)}
          </Button>
        ))}
        {canCancel && (
          <Button
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            disabled={mutation.isPending}
            onClick={() => {
              setError(null);
              setConfirmCancel(true);
            }}
          >
            Cancel order
          </Button>
        )}
      </div>

      {error && !confirmCancel && <InlineAlert>{error}</InlineAlert>}

      <ConfirmDialog
        open={confirmCancel}
        title={`Cancel order ${formatOrderNumber(order.orderNumber)}?`}
        message={
          isPaid
            ? 'The customer has already paid. Cancelling does not refund them automatically — issue the refund from the Razorpay dashboard.'
            : 'This unpaid order will be cancelled.'
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={mutation.isPending}
        error={confirmCancel ? error : null}
        onConfirm={() => submit('CANCELLED')}
        onClose={() => setConfirmCancel(false)}
      >
        {note.trim() && (
          <p className="text-xs text-muted">
            Note: <span className="text-ink">{note.trim()}</span>
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
