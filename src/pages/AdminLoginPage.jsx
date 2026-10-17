import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Globe,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  bootstrapAdmin,
  clearAdminAuthError,
  loginAdmin,
} from "../features/adminAuth/adminAuthSlice";
import { useI18n } from "../i18n";
import { errorText } from "../utils/plain";
import Spinner from "../components/common/Spinner";

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t, toggle } = useI18n();
  const { admin, status, error, initialized } = useSelector(
    (state) => state.adminAuth,
  );
  const [form, setForm] = useState({ username: "", password: "" });

  useEffect(() => {
    if (!initialized) dispatch(bootstrapAdmin());
  }, [dispatch, initialized]);
  useEffect(() => () => dispatch(clearAdminAuthError()), [dispatch]);

  if (admin) return <Navigate to={location.state?.from || "/admin"} replace />;

  async function submit(event) {
    event.preventDefault();
    dispatch(clearAdminAuthError());
    await dispatch(loginAdmin(form));
  }

  const busy = status === "loading";
  const shown = !error
    ? ""
    : /not configured/i.test(error)
      ? errorText({ code: "ADMIN_NOT_CONFIGURED" }, t)
      : /invalid/i.test(error)
        ? t("login.invalid")
        : error;
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-visual-content">
          <div className="auth-logo">
            <RadioTower size={21} />
          </div>
          <div className="eyebrow">
            VOLT<span>OPS</span>
          </div>
          <h1>{t("login.headline")}</h1>
          <p>{t("login.text")}</p>
          <div className="auth-trust-row">
            <ShieldCheck size={16} />
            <span>{t("login.trust")}</span>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <button type="button" className="lang-btn" onClick={toggle}>
            <Globe size={15} />
            {t("common.language")}
          </button>
          <div className="auth-form-icon">
            <LockKeyhole size={18} />
          </div>
          <div className="eyebrow">{t("login.console")}</div>
          <h2>{t("login.title")}</h2>
          <p className="auth-intro">{t("login.intro")}</p>
          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>{t("login.username")}</span>
              <input
                type="text"
                dir="ltr"
                autoComplete="username"
                value={form.username}
                onChange={(e) =>
                  setForm((c) => ({ ...c, username: e.target.value }))
                }
                placeholder="admin"
                required
                autoFocus
              />
            </label>
            <label className="field">
              <span>{t("login.password")}</span>
              <input
                type="password"
                dir="ltr"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) =>
                  setForm((c) => ({ ...c, password: e.target.value }))
                }
                required
              />
            </label>
            {shown ? <div className="form-error">{shown}</div> : null}
            <button
              className="button button-primary button-wide"
              disabled={busy || !form.username || !form.password}
            >
              {busy ? (
                <Spinner label={t("login.signingIn")} />
              ) : (
                <>
                  {t("login.enter")} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <div className="auth-security-note">
            <strong>{t("login.separate")}</strong>
            <span>{t("login.separateHelp")}</span>
            <a className="auth-admin-link" href="/login">
              {t("login.customer")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
