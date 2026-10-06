import { Router } from 'express';
import * as catalog from '../controllers/catalog.controller.js';

export const catalogRouter = Router();

catalogRouter.get('/home', catalog.home);
catalogRouter.get('/categories', catalog.listCategories);
catalogRouter.get('/categories/:id', catalog.getCategory);
catalogRouter.get('/products', catalog.listProducts);
catalogRouter.get('/products/:id', catalog.getProduct);
catalogRouter.post('/cart/quote', catalog.quote);
