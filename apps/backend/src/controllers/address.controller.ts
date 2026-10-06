import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as addressService from '../services/address.service.js';
import { addressSchema, addressUpdateSchema, idParamSchema } from '../validations/index.js';
import { created, ok } from '../utils/response.js';
import { parse } from '../utils/parse.js';

export async function list(req: Request, res: Response) {
  ok(res, await addressService.listAddresses(currentUser(req).id));
}

export async function create(req: Request, res: Response) {
  const address = await addressService.createAddress(currentUser(req).id, parse(addressSchema, req.body));
  created(res, address);
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  ok(res, await addressService.updateAddress(currentUser(req).id, id, parse(addressUpdateSchema, req.body)));
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParamSchema, req.params);
  await addressService.deleteAddress(currentUser(req).id, id);
  ok(res, null, { message: 'Address removed' });
}
