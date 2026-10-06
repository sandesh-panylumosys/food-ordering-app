import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import * as orders from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/dashboard', admin.dashboard);

adminRouter.get('/products', admin.listProducts);
adminRouter.post('/products', admin.createProduct);
adminRouter.get('/products/:id', admin.getProduct);
adminRouter.patch('/products/:id', admin.updateProduct);
adminRouter.delete('/products/:id', admin.deleteProduct);

adminRouter.get('/categories', admin.listCategories);
adminRouter.post('/categories', admin.createCategory);
adminRouter.patch('/categories/:id', admin.updateCategory);
adminRouter.delete('/categories/:id', admin.deleteCategory);

adminRouter.get('/orders', admin.listOrders);
adminRouter.get('/orders/:id', admin.getOrder);
adminRouter.patch('/orders/:id/status', orders.updateStatus);

adminRouter.post('/uploads', imageUpload.single('image'), admin.uploadImage);
