import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { loginSchema, registerSchema, updateProfileSchema } from '../validations/index.js';
import { created, ok } from '../utils/response.js';
import { parse } from '../utils/parse.js';

export async function register(req: Request, res: Response) {
  const result = await authService.register(parse(registerSchema, req.body));
  created(res, result, 'Welcome to Ember & Oak');
}

export async function login(req: Request, res: Response) {
  ok(res, await authService.login(parse(loginSchema, req.body)));
}

/** JWTs are stateless; the client discards its token. Kept for API symmetry/auditing. */
export async function logout(_req: Request, res: Response) {
  ok(res, null, { message: 'Signed out' });
}

export async function me(req: Request, res: Response) {
  ok(res, currentUser(req));
}

export async function updateMe(req: Request, res: Response) {
  const user = currentUser(req);
  ok(res, await userService.updateProfile(user.id, parse(updateProfileSchema, req.body)));
}
