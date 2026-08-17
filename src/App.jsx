import { Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StorefrontSearchProvider } from './context/StorefrontSearchContext'

// الـ Component الجمالي للأذكار والآيات
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
import CustomerDetailsPage from './pages/Customers/CustomerDetailsPage'
// Admin & Auth
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import ForbiddenPage from './pages/Forbidden/ForbiddenPage'
import DashboardHome from './pages/Dashboard/DashboardHome'
import CategoriesPage from './pages/Catalog/CategoriesPage'
import ProductsPage from './pages/Catalog/ProductsPage'
import AdminRemindersPage from './pages/Catalog/AdminRemindersPage'
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

// Profile Page
import AdminProfilePage from './pages/Profile/AdminProfilePage'

export default function App() {
  return (
    <>
      <ReminderBanner />

      <Routes>
        {/* Storefront */}
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
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/forbidden" element={<ForbiddenPage />} />

        {/* ---------------- MODERATOR ROUTES ---------------- */}
        <Route
          path="/moderator"
          element={
            <ProtectedRoute
              allowRoles={['moderator', 'Moderator', 'MODERATOR', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']}
            />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route index element={<ModeratorHubPage />} />
            <Route path="dashboard" element={<ModeratorHubPage />} />
            <Route path="catalog" element={<ModeratorCatalogPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        {/* ---------------- ADMIN ROUTES ---------------- */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="profile" element={<AdminProfilePage />} />

            <Route path="operations" element={<ProtectedRoute allowRoles={['ONLINE_MANAGER', 'Moderator', 'moderator', 'MODERATOR', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Manager']} />}>
              <Route index element={<OperationsHubPage />} />
            </Route>

            <Route path="owner" element={<ProtectedRoute role="STORE_OWNER" allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']} />}>
              <Route index element={<OwnerHubPage />} />
            </Route>

            <Route path="catalog/categories" element={<CategoriesPage />} />
            <Route path="catalog/products" element={<ProductsPage />} />

            <Route path="reminders" element={<ProtectedRoute allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Moderator', 'moderator', 'MODERATOR']} />}>
              <Route index element={<AdminRemindersPage />} />
            </Route>

            <Route path="inventory/adjust" element={<InventoryAdjustPage />} />
            <Route path="inventory/transfer" element={<InventoryTransferPage />} />
            
            {/* صفحات العملاء وتفاصيل العميل تحت حماية الإدارة وداخل الـ Layout */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailsPage />} />

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