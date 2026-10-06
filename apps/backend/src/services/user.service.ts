import type { User } from '@food/shared-types';
import type { UpdateProfileInput } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { UserRow } from '../types/db.js';
import { unwrap, unwrapMaybe } from '../utils/db.js';
import { toUser } from '../utils/mappers.js';

export const USER_PUBLIC_COLUMNS = 'id, name, email, phone, role, created_at';

export async function findUserById(id: string): Promise<User | null> {
  const row = unwrapMaybe(
    await supabase.from('users').select(USER_PUBLIC_COLUMNS).eq('id', id).maybeSingle<UserRow>(),
  );
  return row ? toUser(row) : null;
}

export async function updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
  const patch: Partial<UserRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = input.phone;

  const row = unwrap(
    await supabase
      .from('users')
      .update(patch)
      .eq('id', id)
      .select(USER_PUBLIC_COLUMNS)
      .single<UserRow>(),
    'User',
  );
  return toUser(row);
}
