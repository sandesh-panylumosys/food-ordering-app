import type { AuthResponse } from '@food/shared-types';
import type { LoginInput, RegisterInput } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { UserRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { unwrap, unwrapMaybe } from '../utils/db.js';
import { signToken } from '../utils/jwt.js';
import { toUser } from '../utils/mappers.js';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../utils/password.js';
import { USER_PUBLIC_COLUMNS } from './user.service.js';

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = unwrapMaybe(
    await supabase.from('users').select('id').eq('email', input.email).maybeSingle(),
  );
  if (existing) throw AppError.conflict('An account with this email already exists');

  const row = unwrap(
    await supabase
      .from('users')
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        password_hash: await hashPassword(input.password),
        role: 'CUSTOMER',
      })
      .select(USER_PUBLIC_COLUMNS)
      .single<UserRow>(),
  );

  const user = toUser(row);
  return { token: signToken({ sub: user.id, role: user.role }), user };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const row = unwrapMaybe(
    await supabase
      .from('users')
      .select(`${USER_PUBLIC_COLUMNS}, password_hash`)
      .eq('email', input.email)
      .maybeSingle<UserRow>(),
  );

  if (!row?.password_hash) {
    await burnPasswordCheck(input.password);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');

  const user = toUser(row);
  return { token: signToken({ sub: user.id, role: user.role }), user };
}
