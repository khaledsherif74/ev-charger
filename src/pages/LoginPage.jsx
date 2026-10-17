import { useEffect, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAuthError,
  loginUser,
  registerUser,
} from "../features/auth/authSlice";
import Spinner from "../components/common/Spinner";

export default function LoginPage() {
  const dispatch = useDispatch();
  const { user, status, error } = useSelector((state) => state.auth);
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
          <h1>Charge your vehicle with a wallet built for the road.</h1>
          <p>
            Find connected chargers, start a billed charging session, monitor
            live session cost, and manage your wallet from one personal
            dashboard.
          </p>
          <div className="auth-trust-row">
            <ShieldCheck size={16} />
            <span>
              Charging actions are enforced by the backend session and wallet
              services.
            </span>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-icon">
            <LockKeyhole size={18} />
          </div>
          <div className="eyebrow">CUSTOMER DASHBOARD</div>
          <h2>{isSignUp ? "Create an account" : "Sign in"}</h2>
          <p className="auth-intro">
            {isSignUp
              ? "Create your EV charging account to access your wallet and start charging."
              : "Use your normal EV charging account to access your wallet, charging sessions, and available chargers."}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isSignUp && (
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="John Doe"
                  required={isSignUp}
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="you@example.com"
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder={
                  isSignUp
                    ? "Create a password (min 8 chars)"
                    : "Enter your password"
                }
                required
                minLength={isSignUp ? 8 : undefined}
              />
            </label>

            {error ? <div className="form-error">{error}</div> : null}

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
                  label={isSignUp ? "Creating account..." : "Signing in…"}
                />
              ) : (
                <>
                  {isSignUp ? "Create account" : "Open my dashboard"}{" "}
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
