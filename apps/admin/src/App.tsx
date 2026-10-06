import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { NotFound } from './components/NotFound';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAdmin } from './features/auth/RequireAdmin';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrderDetailPage } from './features/orders/OrderDetailPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { ProductFormPage } from './features/products/ProductFormPage';
import { ProductsPage } from './features/products/ProductsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
