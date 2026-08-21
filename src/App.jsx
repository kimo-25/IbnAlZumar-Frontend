import { Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StorefrontSearchProvider } from './context/StorefrontSearchContext'
import { useAuth } from './context/AuthContext'

// استيراد الدوال المساعدة لإدارة الأدوار والمسارات
import { normalizeRole, getRoleHomePath } from './utils/roles'

// استيراد الـ Hook الخاص بالمزامنة التلقائية للأوفلاين
import { useAutoSync } from './hooks/useAutoSync'

// حراس المسارات المخصصة (Route Guards)
import CashierRoute from './routes/CashierRoute'
import AdminRoute from './routes/AdminRoute'
import ModeratorRoute from './routes/ModeratorRoute'
import CustomerRoute from './routes/CustomerRoute'

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
import VerifyEmailPage from './components/auth/VerifyEmailPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import CustomerProfilePage from './pages/Customers/CustomerProfilePage'
import OrderDetailsPage from './pages/Customers/OrderDetailsPage'
import CustomerDetailsPage from './pages/Customers/CustomerDetailsPage'

// Admin & Auth Components
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
import PurchasingPage from './pages/Purchasing/PurchasingPage'
import PosCheckoutPage from './pages/Pos/PosCheckoutPage'
import ReportsPage from './pages/Reports/ReportsPage'
import OperationsHubPage from './pages/Operations/OperationsHubPage'

// Owner Pages
import OwnerHubPage from './pages/Owner/OwnerHubPage'

// Moderator Pages (المستقلة)
import ModeratorHubPage from './pages/Moderator/ModeratorHubPage'
import ModeratorCatalogPage from './pages/Moderator/ModeratorCatalogPage'
import ModeratorProductsPage from './pages/Moderator/ModeratorProductsPage'
import ModeratorCategoriesPage from './pages/Moderator/ModeratorCategoriesPage'
import ModeratorRemindersPage from './pages/Moderator/ModeratorRemindersPage'

// Profile Page
import AdminProfilePage from './pages/Profile/AdminProfilePage'

export default function App() {
  useAutoSync();
  const { role } = useAuth();
  const normalizedRole = normalizeRole(role);

  return (
    <>
      <ReminderBanner />

      <Routes>
        {/* ---------------- 1. STOREFRONT ROUTES ---------------- */}
        <Route
          element={
            <CustomerRoute>
              <CartProvider>
                <StorefrontSearchProvider>
                  <StorefrontLayout />
                </StorefrontSearchProvider>
              </CartProvider>
            </CustomerRoute>
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

        {/* ---------------- 2. AUTH & PUBLIC ROUTES ---------------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/forbidden" element={<ForbiddenPage />} />

        {/* ---------------- 3. POS ROUTE ---------------- */}
        <Route
          path="/pos"
          element={
            <CashierRoute>
              <PosCheckoutPage />
            </CashierRoute>
          }
        />

        {/* ---------------- 4. MODERATOR ROUTES ---------------- */}
        <Route
          path="/moderator"
          element={
            <ModeratorRoute>
              <DashboardLayout />
            </ModeratorRoute>
          }
        >
          <Route index element={<ModeratorHubPage />} />
          <Route path="dashboard" element={<ModeratorHubPage />} />
          <Route path="operations" element={<OperationsHubPage />} />
          <Route path="products" element={<ModeratorProductsPage />} />
          <Route path="categories" element={<ModeratorCategoriesPage />} />
          <Route path="reminders" element={<ModeratorRemindersPage />} />
          <Route path="catalog" element={<ModeratorCatalogPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* ---------------- 5. ADMIN ROUTES ---------------- */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="profile" element={<AdminProfilePage />} />

          <Route 
            path="operations" 
            element={
              <ProtectedRoute allowRoles={['ONLINE_MANAGER', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Manager']}>
                <OperationsHubPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="owner" 
            element={
              <ProtectedRoute role="STORE_OWNER" allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']}>
                <OwnerHubPage />
              </ProtectedRoute>
            } 
          />

          <Route path="catalog/categories" element={<CategoriesPage />} />
          <Route path="catalog/products" element={<ProductsPage />} />

          <Route 
            path="reminders" 
            element={
              <ProtectedRoute allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin']}>
                <AdminRemindersPage />
              </ProtectedRoute>
            } 
          />

          <Route path="inventory/adjust" element={<InventoryAdjustPage />} />
          <Route path="inventory/transfer" element={<InventoryTransferPage />} />

          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailsPage />} />

          <Route path="purchasing" element={<PurchasingPage />} />
          <Route path="pos" element={<PosCheckoutPage />} />

          <Route 
            path="reports" 
            element={
              <ProtectedRoute permission="Reports.View" allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* ---------------- 6. WILDCARD FALLBACK ---------------- */}
        <Route
          path="*"
          element={<Navigate to={getRoleHomePath(normalizedRole)} replace />}
        />
      </Routes>
    </>
  )
}