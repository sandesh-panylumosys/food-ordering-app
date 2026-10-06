import type { Address } from '@food/shared-types';
import type { AddressInput, AddressUpdateInput } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { AddressRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { unwrap, unwrapMaybe } from '../utils/db.js';
import { toAddress } from '../utils/mappers.js';

const MAX_ADDRESSES = 10;

function toRow(input: AddressUpdateInput): Record<string, unknown> {
  const map: Record<string, unknown> = {
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2,
    landmark: input.landmark,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
  };
  return Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined));
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const rows = unwrap<AddressRow[]>(
    await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
  );
  return rows.map(toAddress);
}

export async function getOwnedAddress(userId: string, id: string): Promise<AddressRow> {
  const row = unwrapMaybe<AddressRow>(
    await supabase.from('addresses').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
  );
  if (!row) throw AppError.notFound('Address');
  return row;
}

async function makeDefault(userId: string, id: string) {
  unwrapMaybe(await supabase.rpc('set_default_address', { p_user_id: userId, p_address_id: id }));
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((count ?? 0) >= MAX_ADDRESSES) {
    throw AppError.badRequest(`You can save up to ${MAX_ADDRESSES} addresses`);
  }

  const row = unwrap<AddressRow>(
    await supabase
      .from('addresses')
      .insert({ ...toRow(input), user_id: userId, is_default: false })
      .select('*')
      .single(),
  );

  // First address is always the default.
  if (input.isDefault || !count) await makeDefault(userId, row.id);
  return toAddress(await getOwnedAddress(userId, row.id));
}

export async function updateAddress(userId: string, id: string, input: AddressUpdateInput): Promise<Address> {
  await getOwnedAddress(userId, id);
  const patch = toRow(input);
  if (Object.keys(patch).length) {
    unwrapMaybe(await supabase.from('addresses').update(patch).eq('id', id).eq('user_id', userId));
  }
  if (input.isDefault) await makeDefault(userId, id);
  return toAddress(await getOwnedAddress(userId, id));
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const row = await getOwnedAddress(userId, id);
  unwrapMaybe(await supabase.from('addresses').delete().eq('id', id).eq('user_id', userId));

  if (row.is_default) {
    const next = unwrapMaybe<{ id: string }>(
      await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    if (next) await makeDefault(userId, next.id);
  }
}
