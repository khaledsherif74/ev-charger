import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapSession } from "./features/auth/authSlice";
import AdminLayout from "./components/layout/AdminLayout";
import UserLayout from "./components/layout/UserLayout";
import AdminRoute from "./router/AdminRoute";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import HomePage from "./pages/HomePage";
import ChargersPage from "./pages/ChargersPage";
import SessionsPage from "./pages/SessionsPage";
import CustomersPage from "./pages/CustomersPage";
import PaymentsPage from "./pages/PaymentsPage";
import AlertsPage from "./pages/AlertsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import ActionsPage from "./pages/ActionsPage";
import TimelinePage from "./pages/TimelinePage";
import ChargerSettingsPage from "./pages/ChargerSettingsPage";
import CheckPage from "./pages/CheckPage";
import AddChargerPage from "./pages/AddChargerPage";
import ConnectionGuidePage from "./pages/ConnectionGuidePage";
import SettingsPage from "./pages/SettingsPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import UserSessionsPage from "./pages/UserSessionsPage";
import UserWalletPage from "./pages/UserWalletPage";

function UserRoute() {
  const { user, initialized } = useSelector((state) => state.auth);
  if (!initialized)
    return <div className="full-page-center">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const dispatch = useDispatch();
  const initialized = useSelector((state) => state.auth.initialized);
  useEffect(() => {
    if (!initialized) dispatch(bootstrapSession());
  }, [dispatch, initialized]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          {/* Daily */}
          <Route path="/admin" element={<HomePage />} />
          <Route path="/admin/chargers" element={<ChargersPage />} />
          <Route path="/admin/sessions" element={<SessionsPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          {/* Fix & Control */}
          <Route path="/admin/alerts" element={<AlertsPage />} />
          <Route path="/admin/help" element={<HelpCenterPage />} />
          <Route path="/admin/actions" element={<ActionsPage />} />
          <Route path="/admin/timeline" element={<TimelinePage />} />
          <Route
            path="/admin/charger-settings"
            element={<ChargerSettingsPage />}
          />
          <Route path="/admin/check" element={<CheckPage />} />
          {/* Setup */}
          <Route path="/admin/add-charger" element={<AddChargerPage />} />
          <Route
            path="/admin/connection-guide"
            element={<ConnectionGuidePage />}
          />
          <Route path="/admin/settings" element={<SettingsPage />} />
          {/* old addresses keep working */}
          <Route
            path="/admin/advanced"
            element={<Navigate to="/admin/charger-settings" replace />}
          />
          <Route
            path="/admin/logs"
            element={<Navigate to="/admin/timeline" replace />}
          />
          <Route
            path="/admin/commands"
            element={<Navigate to="/admin/actions" replace />}
          />
        </Route>
      </Route>

      <Route element={<UserRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/app" element={<UserDashboardPage />} />
          <Route path="/app/sessions" element={<UserSessionsPage />} />
          <Route path="/app/wallet" element={<UserWalletPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
