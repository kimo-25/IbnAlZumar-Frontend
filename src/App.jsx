// App.jsx

import { Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StorefrontSearchProvider } from './context/StorefrontSearchContext'
import { useAuth } from './context/AuthContext'

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
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'
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
  // تفعيل المزامنة التلقائية في الخلفية
  useAutoSync();

  // جلب دور المستخدم الحالي لتوجيهه حسب الصلاحية في الراوت العام
  const { role } = useAuth();
  
  // تطبيع دور المستخدم للتعامل الآمن مع حالات الأحرف
  const normalizedRole = role ? String(role).trim().toUpperCase() : "";

  return (
    <>
      <ReminderBanner />

      <Routes>
        {/* ---------------- 1. STOREFRONT ROUTES (Protected by CustomerRoute) ---------------- */}
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

        {/* ---------------- 3. POS ROUTE (Protected by CashierRoute) ---------------- */}
        <Route
          path="/pos"
          element={
            <CashierRoute>
              <PosCheckoutPage />
            </CashierRoute>
          }
        />

        {/* ---------------- 4. MODERATOR ROUTES (Protected by ModeratorRoute) ---------------- */}
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
          <Route path="catalog" element={<ModeratorCatalogPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* ---------------- 5. ADMIN ROUTES (Protected by AdminRoute) ---------------- */}
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

          {/* Sub-routes with granular role/permission checks */}
          <Route 
            path="operations" 
            element={
              <ProtectedRoute allowRoles={['ONLINE_MANAGER', 'Moderator', 'moderator', 'MODERATOR', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Manager']}>
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
              <ProtectedRoute allowRoles={['STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin', 'Moderator', 'moderator', 'MODERATOR']}>
                <AdminRemindersPage />
              </ProtectedRoute>
            } 
          />

          <Route path="inventory/adjust" element={<InventoryAdjustPage />} />
          <Route path="inventory/transfer" element={<InventoryTransferPage />} />

          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailsPage />} />

          <Route path="purchasing" element={<PurchaseOrdersPage />} />
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
          element={
            normalizedRole === "CASHIER"
              ? <Navigate to="/pos" replace />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </>
  )
}