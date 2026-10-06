import { Router } from 'express';
import * as addresses from '../controllers/address.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const addressRouter = Router();

addressRouter.use(requireAuth);
addressRouter.get('/', addresses.list);
addressRouter.post('/', addresses.create);
addressRouter.patch('/:id', addresses.update);
addressRouter.delete('/:id', addresses.remove);
