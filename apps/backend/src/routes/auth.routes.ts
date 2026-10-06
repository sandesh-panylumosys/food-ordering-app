import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, auth.register);
authRouter.post('/login', authLimiter, auth.login);
authRouter.post('/logout', requireAuth, auth.logout);
authRouter.get('/me', requireAuth, auth.me);
authRouter.patch('/me', requireAuth, auth.updateMe);
