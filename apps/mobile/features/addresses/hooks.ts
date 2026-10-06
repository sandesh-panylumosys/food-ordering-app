import type { Address } from '@food/shared-types';
import type { AddressInput, AddressUpdateInput } from '@food/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as addresses from '@/services/address.service';
import { useIsAuthenticated } from '@/store/auth.store';

export const useAddresses = () => {
  const authed = useIsAuthenticated();
  return useQuery({ queryKey: queryKeys.addresses, queryFn: addresses.fetchAddresses, enabled: authed });
};

export const defaultAddress = (list: Address[] | undefined) => list?.find((a) => a.isDefault) ?? list?.[0];

export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AddressInput | AddressUpdateInput }) =>
      id ? addresses.updateAddress(id, input) : addresses.createAddress(input as AddressInput),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addresses.deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}
