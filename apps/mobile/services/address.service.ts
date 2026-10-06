import type { Address } from '@food/shared-types';
import type { AddressInput, AddressUpdateInput } from '@food/validation';
import { api } from '@/lib/api';

export const fetchAddresses = () => api.get<Address[]>('/addresses');
export const createAddress = (input: AddressInput) => api.post<Address>('/addresses', input);
export const updateAddress = (id: string, input: AddressUpdateInput) => api.patch<Address>(`/addresses/${id}`, input);
export const deleteAddress = (id: string) => api.delete<null>(`/addresses/${id}`);
