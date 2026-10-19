import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Gauge,
  Globe,
  LogOut,
  Menu,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import useUserRealtime from "../../hooks/useUserRealtime";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { clearUserState } from "../../features/user/userSlice";
import { useI18n } from "../../i18n";

const NAV = [
  { to: "/app", key: "u.nav.charge", icon: Gauge, end: true },
  { to: "/app/sessions", key: "u.nav.sessions", icon: ReceiptText },
  { to: "/app/wallet", key: "u.nav.wallet", icon: WalletCards },
];

export default function UserLayout() {
  const { t, toggle } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const balance = useSelector((state) => state.user.balancePiastres);
  const dispatch = useDispatch();
  useUserRealtime();
  useDocumentTitle(t("u.title.app"));

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
              <div className="brand-subtitle">{t("u.brand.sub")}</div>
            </div>
          ) : null}
        </div>
        <div className="sidebar-section-label">{t("u.nav.account")}</div>
        <nav className="nav-list">
          {NAV.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? t(key) : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed ? <span>{t(key)}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <button
          className="collapse-button desktop-only"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={t("nav.menu")}
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
                <strong dir="ltr">{user?.name}</strong>
                <span>{t("u.nav.customer")}</span>
              </div>
            ) : null}
          </div>
          <button
            className="logout-button"
            onClick={signOut}
            title={t("common.signOut")}
          >
            <LogOut size={17} />
            {!collapsed ? <span>{t("common.signOut")}</span> : null}
          </button>
        </div>
      </aside>

      <main className="user-main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={t("nav.menu")}
          >
            <Menu size={20} />
          </button>
          <div className="topbar-context">
            <BatteryCharging size={16} />
            <span>{t("u.topbar")}</span>
          </div>
          <div className="topbar-spacer" />
          <div className="user-balance">
            <span>{t("u.wallet")}</span>
            <strong>
              {((balance || 0) / 100).toFixed(2)} {t("common.egp")}
            </strong>
          </div>
          <button type="button" className="lang-btn" onClick={toggle}>
            <Globe size={15} />
            {t("common.language")}
          </button>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
