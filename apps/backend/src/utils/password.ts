import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

let dummyHash: Promise<string> | undefined;
/** Compares against a throwaway hash so unknown emails take as long as wrong passwords. */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= bcrypt.hash('timing-equaliser', ROUNDS);
  await bcrypt.compare(plain, await dummyHash);
}
