import type { CheckoutSession } from '@food/shared-types';
import { create } from 'zustand';

/**
 * Holds the in-flight Razorpay session between the checkout and payment screens.
 * If the customer backs out of payment and returns with the same cart + address,
 * the existing (unpaid) order is reused instead of creating a duplicate.
 */
interface CheckoutState {
  session: CheckoutSession | null;
  /** Cart + address fingerprint the session was created for (null = retry from order history). */
  signature: string | null;
  start: (session: CheckoutSession, signature: string | null) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  session: null,
  signature: null,
  start: (session, signature) => set({ session, signature }),
  reset: () => set({ session: null, signature: null }),
}));
