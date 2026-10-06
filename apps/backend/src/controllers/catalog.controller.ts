import type { Request, Response } from 'express';
import * as categoryService from '../services/category.service.js';
import * as pricingService from '../services/pricing.service.js';
import * as productService from '../services/product.service.js';
import { productQuerySchema, quoteSchema } from '../validations/index.js';
import { ok, paginated } from '../utils/response.js';
import { parse } from '../utils/parse.js';

const param = (req: Request, name: string) => String(req.params[name] ?? '');

export async function home(_req: Request, res: Response) {
  res.set('Cache-Control', 'public, max-age=30');
  ok(res, await productService.getHomeFeed());
}

export async function listCategories(_req: Request, res: Response) {
  res.set('Cache-Control', 'public, max-age=60');
  ok(res, await categoryService.listCategories());
}

export async function getCategory(req: Request, res: Response) {
  ok(res, await categoryService.getCategory(param(req, 'id')));
}

export async function listProducts(req: Request, res: Response) {
  const query = parse(productQuerySchema, req.query);
  const { items, meta } = await productService.listProducts({ ...query, includeUnavailable: false });
  paginated(res, items, meta);
}

export async function getProduct(req: Request, res: Response) {
  ok(res, await productService.getProduct(param(req, 'id')));
}

/** Server-side price preview so the cart shows authoritative totals before payment. */
export async function quote(req: Request, res: Response) {
  const { items } = parse(quoteSchema, req.body);
  ok(res, await pricingService.quoteCart(items));
}
