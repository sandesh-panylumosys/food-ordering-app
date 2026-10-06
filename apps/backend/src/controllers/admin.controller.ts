import type { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import * as categoryService from '../services/category.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import * as orderService from '../services/order.service.js';
import * as productService from '../services/product.service.js';
import * as uploadService from '../services/upload.service.js';
import {
  categorySchema,
  categoryUpdateSchema,
  idParamSchema,
  orderQuerySchema,
  productQuerySchema,
  productSchema,
  productUpdateSchema,
  uploadFolderSchema,
} from '../validations/index.js';
import { created, ok, paginated } from '../utils/response.js';
import { parse } from '../utils/parse.js';

export async function dashboard(_req: Request, res: Response) {
  ok(res, await dashboardService.getDashboardStats());
}

// ─── Products ───────────────────────────────────────────────────────────────
export async function listProducts(req: Request, res: Response) {
  const { items, meta } = await productService.listProducts({
    ...parse(productQuerySchema, req.query),
    admin: true,
  });
  paginated(res, items, meta);
}

export async function getProduct(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await productService.getProduct(id, { admin: true }));
}

export async function createProduct(req: Request, res: Response) {
  created(res, await productService.createProduct(parse(productSchema, req.body)), 'Product created');
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await productService.updateProduct(id, parse(productUpdateSchema, req.body)));
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  await productService.deleteProduct(id);
  ok(res, null, { message: 'Product deleted' });
}

// ─── Categories ─────────────────────────────────────────────────────────────
export async function listCategories(_req: Request, res: Response) {
  ok(res, await categoryService.listCategories({ includeInactive: true }));
}

export async function createCategory(req: Request, res: Response) {
  created(res, await categoryService.createCategory(parse(categorySchema, req.body)), 'Category created');
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await categoryService.updateCategory(id, parse(categoryUpdateSchema, req.body)));
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  await categoryService.deleteCategory(id);
  ok(res, null, { message: 'Category deleted' });
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export async function listOrders(req: Request, res: Response) {
  const { items, meta } = await orderService.listOrders(parse(orderQuerySchema, req.query), { admin: true });
  paginated(res, items, meta);
}

export async function getOrder(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await orderService.getOrder(id, { admin: true }));
}

// ─── Uploads ────────────────────────────────────────────────────────────────
export async function uploadImage(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest('Attach an image in the "image" field');
  const { folder } = parse(uploadFolderSchema, req.body ?? {});
  created(res, await uploadService.uploadImage(req.file.buffer, folder));
}
