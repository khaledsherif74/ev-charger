import { useEffect, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Globe,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAuthError,
  loginUser,
  registerUser,
} from "../features/auth/authSlice";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useI18n } from "../i18n";
import Spinner from "../components/common/Spinner";

export default function LoginPage() {
  const dispatch = useDispatch();
  const { t, toggle } = useI18n();
  const { user, status, error } = useSelector((state) => state.auth);

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  useDocumentTitle(t("u.title.login"));

  useEffect(() => {
    if (user) window.location.replace("/app");
  }, [user]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch, isSignUp]);

  async function submit(event) {
    event.preventDefault();
    dispatch(clearAuthError());
    if (isSignUp) {
      await dispatch(registerUser(form));
    } else {
      await dispatch(loginUser(form));
    }
  }

  const busy = status === "loading";
  const shown = !error
    ? ""
    : /invalid|password/i.test(error)
      ? t("u.login.invalid")
      : error;

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-visual-content">
          <div className="auth-logo">
            <BatteryCharging size={21} />
          </div>
          <div className="eyebrow">
            VOLT<span>CHARGE</span>
          </div>
          <h1>{t("u.login.headline")}</h1>
          <p>{t("u.login.text")}</p>
          <div className="auth-trust-row">
            <ShieldCheck size={16} />
            <span>{t("u.login.trust")}</span>
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
          <h2>{isSignUp ? "Create an account" : t("u.login.title")}</h2>
          <p className="auth-intro">
            {isSignUp
              ? "Create your account to start charging and manage your wallet."
              : t("u.login.intro")}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isSignUp && (
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="John Doe"
                  required={isSignUp}
                />
              </label>
            )}

            <label className="field">
              <span>{t("u.login.email")}</span>
              <input
                type="email"
                dir="ltr"
                autoComplete="username"
                value={form.email}
                onChange={(e) =>
                  setForm((c) => ({ ...c, email: e.target.value }))
                }
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field">
              <span>{t("u.login.password")}</span>
              <input
                type="password"
                dir="ltr"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) =>
                  setForm((c) => ({ ...c, password: e.target.value }))
                }
                placeholder={
                  isSignUp ? "Create a password (min 8 chars)" : undefined
                }
                required
                minLength={isSignUp ? 8 : undefined}
              />
            </label>

            {shown ? <div className="form-error">{shown}</div> : null}

            <button
              className="button button-primary button-wide"
              disabled={
                busy ||
                !form.email ||
                !form.password ||
                (isSignUp && !form.name)
              }
            >
              {busy ? (
                <Spinner
                  label={
                    isSignUp ? "Creating account..." : t("login.signingIn")
                  }
                />
              ) : (
                <>
                  {isSignUp ? "Create account" : t("u.login.enter")}{" "}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              marginTop: "16px",
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
