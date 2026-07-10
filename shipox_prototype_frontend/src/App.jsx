import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import MerchantsPage from './pages/admin/MerchantsPage';
import DriversPage from './pages/admin/DriversPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantOrdersPage from './pages/merchant/MerchantOrdersPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverOrdersPage from './pages/driver/DriverOrdersPage';

function RoleRedirect() {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const dashboardMap = {
    admin: '/admin',
    merchant: '/merchant',
    driver: '/driver',
  };

  return <Navigate to={dashboardMap[role] || '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="merchants" element={<MerchantsPage />} />
              <Route path="drivers" element={<DriversPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
            </Route>

            {/* Merchant Routes */}
            <Route
              path="/merchant"
              element={
                <ProtectedRoute allowedRoles={['merchant']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MerchantDashboard />} />
              <Route path="orders" element={<MerchantOrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
            </Route>

            {/* Driver Routes */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DriverDashboard />} />
              <Route path="orders" element={<DriverOrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
