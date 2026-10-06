import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as orderService from '../services/order.service.js';
import { idParamSchema, orderQuerySchema, updateOrderStatusSchema } from '../validations/index.js';
import { ok, paginated } from '../utils/response.js';
import { parse } from '../utils/parse.js';

export async function listMine(req: Request, res: Response) {
  const { items, meta } = await orderService.listOrders(parse(orderQuerySchema, req.query), {
    userId: currentUser(req).id,
  });
  paginated(res, items, meta);
}

export async function getMine(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await orderService.getOrder(id, { userId: currentUser(req).id }));
}

export async function cancelMine(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await orderService.cancelUnpaidOrder(id, currentUser(req).id), { message: 'Order cancelled' });
}

/** Admin only (route is guarded by requireRole('ADMIN')). */
export async function updateStatus(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  const { status, note } = parse(updateOrderStatusSchema, req.body);
  ok(res, await orderService.updateOrderStatus(id, status, note, currentUser(req).id));
}
