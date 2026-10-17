import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Gauge,
  LogOut,
  Menu,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import useUserRealtime from "../../hooks/useUserRealtime";
import { clearUserState } from "../../features/user/userSlice";

const NAV = [
  { to: "/app", label: "Dashboard", icon: Gauge, end: true },
  { to: "/app/sessions", label: "My Sessions", icon: ReceiptText },
  { to: "/app/wallet", label: "Wallet", icon: WalletCards },
];

export default function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const balance = useSelector((state) => state.user.balancePiastres);
  const dispatch = useDispatch();
  useUserRealtime();

  async function signOut() {
    await dispatch(logout()).unwrap();
    dispatch(clearUserState());
    window.location.replace("/login");
  }

  return (
    <div
      className={`user-app ${collapsed ? "user-sidebar-collapsed" : ""} ${mobileOpen ? "user-mobile-open" : ""}`}
    >
      <aside className="user-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <BatteryCharging size={19} />
          </div>
          {!collapsed ? (
            <div>
              <div className="brand-name">VoltCharge</div>
              <div className="brand-subtitle">EV Charging</div>
            </div>
          ) : null}
        </div>
        <div className="sidebar-section-label">MY ACCOUNT</div>
        <nav className="nav-list">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed ? <span>{label}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <button
          className="collapse-button desktop-only"
          onClick={() => setCollapsed((value) => !value)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
        <div className="sidebar-footer">
          <div className="account-chip">
            <div className="account-avatar">
              <CircleUserRound size={17} />
            </div>
            {!collapsed ? (
              <div className="account-meta">
                <strong>{user?.email}</strong>
                <span>Customer account</span>
              </div>
            ) : null}
          </div>
          <button className="logout-button" onClick={signOut} title="Sign out">
            <LogOut size={17} />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </aside>

      <main className="user-main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-context">
            <BatteryCharging size={16} />
            <span>Personal charging dashboard</span>
          </div>
          <div className="topbar-spacer" />
          <div className="user-balance">
            <span>Wallet</span>
            <strong>{((balance || 0) / 100).toFixed(2)} EGP</strong>
          </div>
          <div className="user-mini">
            {user?.name ? user.name : user?.email}
          </div>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
