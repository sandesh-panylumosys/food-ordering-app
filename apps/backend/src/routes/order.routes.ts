import { Router } from 'express';
import * as orders from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.get('/', orders.listMine);
orderRouter.get('/:id', orders.getMine);
orderRouter.post('/:id/cancel', orders.cancelMine);
orderRouter.patch('/:id/status', requireRole('ADMIN'), orders.updateStatus);
