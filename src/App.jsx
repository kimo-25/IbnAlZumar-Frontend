// File: src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StorefrontSearchProvider } from './context/StorefrontSearchContext'

// 🌟 الـ Component الجمالي للأذكار والآيات (يعمل للجميع هنا)
import ReminderBanner from './components/ui/ReminderBanner'

// Public storefront
import StorefrontLayout from './components/layout/StorefrontLayout'
import ShopPage from './pages/Shop/ShopPage'
import ProductDetailsPage from './pages/Shop/ProductDetailsPage'
import CartPage from './pages/Shop/CartPage'
import CheckoutPage from './pages/Shop/CheckoutPage'

// Auth & Customer Pages
import LoginPage from './pages/Login/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import CustomerProfilePage from './pages/Customers/CustomerProfilePage'
import OrderDetailsPage from './pages/Customers/OrderDetailsPage'

// Admin & Auth
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import ForbiddenPage from './pages/Forbidden/ForbiddenPage'
import DashboardHome from './pages/Dashboard/DashboardHome'
import CategoriesPage from './pages/Catalog/CategoriesPage'
import ProductsPage from './pages/Catalog/ProductsPage'
import InventoryAdjustPage from './pages/Inventory/InventoryAdjustPage'
import InventoryTransferPage from './pages/Inventory/InventoryTransferPage'
import CustomersPage from './pages/Customers/CustomersPage'
import PurchaseOrdersPage from './pages/Purchasing/PurchaseOrdersPage'
import PosCheckoutPage from './pages/Pos/PosCheckoutPage'
import ReportsPage from './pages/Reports/ReportsPage'
import OperationsHubPage from './pages/Operations/OperationsHubPage'

// Owner & Moderator Pages
import OwnerHubPage from './pages/Owner/OwnerHubPage'
import ModeratorHubPage from './pages/Moderator/ModeratorHubPage'
import ModeratorCatalogPage from './pages/Moderator/ModeratorCatalogPage'

export default function App() {
  return (
    <>
      {/* 🟢 يظهر هنا للجميع (زائر، كاستمر، أدمن، موديريتور) بدون تكرار */}
      <ReminderBanner />

      <Routes>
        {/* ---------------- Public storefront (no login) ---------------- */}
        <Route
          element={
            <CartProvider>
              <StorefrontSearchProvider>
                <StorefrontLayout />
              </StorefrontSearchProvider>
            </CartProvider>
          }
        >
          <Route path="/" element={<ShopPage />} />
          <Route path="/shop" element={<Navigate to="/" replace />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          <Route path="/profile" element={<CustomerProfilePage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ---------------- Admin ---------------- */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/forbidden" element={<ForbiddenPage />} />
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            
            <Route path="operations" element={<ProtectedRoute allowRoles={['ONLINE_MANAGER', 'Moderator', 'moderator', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Manager']} />}>
              <Route index element={<OperationsHubPage />} />
            </Route>

            <Route path="owner" element={<ProtectedRoute role="STORE_OWNER" allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']} />}>
              <Route index element={<OwnerHubPage />} />
            </Route>

            <Route path="moderator" element={<ProtectedRoute allowRoles={['moderator', 'Moderator', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']} />}>
              <Route index element={<ModeratorHubPage />} />
              <Route path="catalog" element={<ModeratorCatalogPage />} />
            </Route>

            <Route path="catalog/categories" element={<CategoriesPage />} />
            <Route path="catalog/products" element={<ProductsPage />} />

            <Route path="inventory/adjust" element={<InventoryAdjustPage />} />
            <Route path="inventory/transfer" element={<InventoryTransferPage />} />

            <Route path="customers" element={<CustomersPage />} />
            <Route path="purchasing" element={<PurchaseOrdersPage />} />

            <Route path="pos" element={<PosCheckoutPage />} />
            <Route path="reports" element={<ProtectedRoute permission="Reports.View" allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'admin']} />}>
              <Route index element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}