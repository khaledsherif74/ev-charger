import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity, Bell, Cable, CircleCheckBig, CreditCard, Globe, History, House, LifeBuoy, LogOut, Menu, Plug,
  PlusCircle, RadioTower, Settings, SlidersHorizontal, Stethoscope, UsersRound, Wrench, X, CircleUserRound,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../features/adminAuth/adminAuthSlice";
import { fetchAlerts, selectAlertCount } from "../../features/alerts/alertsSlice";
import useAdminRealtime from "../../hooks/useAdminRealtime";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useI18n } from "../../i18n";
import { HelpProvider } from "../common/HelpPanel";

// Every page is always in the menu. Nothing is hidden behind a "technical tools" toggle.
const GROUPS = [
  {
    key: "nav.group.daily",
    items: [
      { to: "/admin", key: "nav.home", icon: House, end: true },
      { to: "/admin/chargers", key: "nav.chargers", icon: Cable },
      { to: "/admin/sessions", key: "nav.sessions", icon: Activity },
      { to: "/admin/customers", key: "nav.customers", icon: UsersRound },
      { to: "/admin/payments", key: "nav.payments", icon: CreditCard },
    ],
  },
  {
    key: "nav.group.fix",
    items: [
      { to: "/admin/charger-settings", key: "nav.chargerSettings", icon: SlidersHorizontal },
      { to: "/admin/check", key: "nav.check", icon: Stethoscope },
      { to: "/admin/timeline", key: "nav.timeline", icon: History },
      { to: "/admin/actions", key: "nav.actions", icon: Wrench },
      { to: "/admin/alerts", key: "nav.alerts", icon: Bell, badge: true },
      { to: "/admin/help", key: "nav.help", icon: LifeBuoy },
    ],
  },
  {
    key: "nav.group.setup",
    items: [
      { to: "/admin/add-charger", key: "nav.addCharger", icon: PlusCircle },
      { to: "/admin/connection-guide", key: "nav.guide", icon: Plug },
      { to: "/admin/settings", key: "nav.settings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { t, toggle } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const admin = useSelector((state) => state.adminAuth.admin);
  const realtime = useSelector((state) => state.realtime.connected);
  const alertCount = useSelector(selectAlertCount);
  const dispatch = useDispatch();
  useAdminRealtime();
  const { pathname } = useLocation();
  const current = GROUPS.flatMap((g) => g.items).find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));
  useDocumentTitle(`${current ? `${t(current.key)} · ` : ""}${t("brand.admin")}`);

  // Alerts also load by themselves, so the badge is right even if the live connection is down.
  useEffect(() => {
    dispatch(fetchAlerts());
    const timer = window.setInterval(() => dispatch(fetchAlerts()), 30000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const link = ({ to, key, icon: Icon, end, badge }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}>
      <Icon size={19} strokeWidth={1.8} />
      <span>{t(key)}</span>
      {badge && alertCount > 0 ? <span className="nav-badge" aria-label={t("nav.alertsCount", { n: alertCount })}>{alertCount}</span> : null}
    </NavLink>
  );

  return (
    <HelpProvider>
      <div className={`admin-app ${mobileOpen ? "mobile-nav-open" : ""}`}>
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">
              <RadioTower size={19} />
            </div>
            <div>
              <div className="brand-name">VoltCharge</div>
              <div className="brand-subtitle">{t("common.station")}</div>
            </div>
            <button type="button" className="icon-button drawer-close" onClick={() => setMobileOpen(false)} aria-label={t("dlg.cancel")}>
              <X size={18} />
            </button>
          </div>

          {GROUPS.map((g) => (
            <div key={g.key} className="nav-group">
              <div className="sidebar-section-label">{t(g.key)}</div>
              <nav className="nav-list">{g.items.map(link)}</nav>
            </div>
          ))}

          <div className="sidebar-spacer" />
          <div className="sidebar-footer">
            <div className="account-chip">
              <div className="account-avatar">
                <CircleUserRound size={17} />
              </div>
              <div className="account-meta">
                <strong>{admin?.username}</strong>
                <span>{t("common.admin")}</span>
              </div>
            </div>
            <button type="button" className="logout-button" onClick={() => dispatch(logoutAdmin())}>
              <LogOut size={17} />
              <span>{t("common.signOut")}</span>
            </button>
          </div>
        </aside>
        {mobileOpen ? <button type="button" className="drawer-backdrop" aria-label={t("dlg.cancel")} onClick={() => setMobileOpen(false)} /> : null}

        <main className="main-shell">
          <header className="topbar">
            <button type="button" className="icon-button mobile-menu" onClick={() => setMobileOpen((v) => !v)} aria-label={t("nav.menu")}>
              <Menu size={20} />
            </button>
            <div className="topbar-spacer" />
            {alertCount > 0 ? (
              <NavLink to="/admin/alerts" className="topbar-alert">
                <Bell size={15} />
                {t("nav.alertsCount", { n: alertCount })}
              </NavLink>
            ) : (
              <span className="topbar-ok">
                <CircleCheckBig size={15} />
                {t("home.allGood")}
              </span>
            )}
            <div className="topbar-status">
              <span className={`status-dot ${realtime ? "live" : "warn"}`} />
              {realtime ? t("common.live") : t("common.reconnecting")}
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
    </HelpProvider>
  );
}
