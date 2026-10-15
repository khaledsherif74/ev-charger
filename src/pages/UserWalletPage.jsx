import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, WalletCards } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createTopup, fetchUserDashboard } from "../features/user/userSlice";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import { formatDate, formatMoneyPiastres } from "../utils/format";

export default function UserWalletPage() {
  const dispatch = useDispatch();
  const { balancePiastres, ledger, topupStatus, topupError } = useSelector(
    (state) => state.user,
  );
  const [amount, setAmount] = useState("100");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  useEffect(() => {
    dispatch(fetchUserDashboard());
  }, [dispatch]);

  async function submitTopup(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const result = await dispatch(createTopup(value));
    if (createTopup.fulfilled.match(result) && result.payload?.checkoutUrl) {
      setCheckoutUrl(result.payload.checkoutUrl);
      // FIX: window.open after an await is blocked as a popup by most browsers. Go to the checkout in this tab.
      window.location.assign(result.payload.checkoutUrl);
    }
  }

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Manage your charging wallet. Payment creation and crediting remain fully controlled by the existing backend Paymob flow."
        actions={
          <button
            className="button button-secondary"
            onClick={() => dispatch(fetchUserDashboard())}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <div className="wallet-layout">
        <SectionCard
          title="Current balance"
          subtitle="Balance comes directly from the authenticated wallet endpoint."
        >
          <div className="balance-hero">
            <WalletCards size={22} />
            <strong>{formatMoneyPiastres(balancePiastres)}</strong>
            <span>Available wallet balance</span>
          </div>
        </SectionCard>
        <SectionCard
          title="Add funds"
          subtitle="The backend validates the amount and creates a Paymob checkout session."
        >
          <form className="form-grid" onSubmit={submitTopup}>
            <label className="field">
              <span>
                Amount <em>EGP (min 10)</em>
              </span>
              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                className="button button-primary button-wide"
                disabled={topupStatus === "loading"}
              >
                {topupStatus === "loading" ? (
                  <Spinner label="Creating checkout…" />
                ) : (
                  <>
                    Continue to payment <ExternalLink size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
          {topupError ? (
            <div className="form-error" style={{ marginTop: 12 }}>
              {topupError}
            </div>
          ) : null}
          {checkoutUrl ? (
            <div className="response-banner success">
              <span>Redirecting to payment…</span>
              <a href={checkoutUrl}>Open payment page</a>
            </div>
          ) : null}
        </SectionCard>
      </div>
      <div style={{ height: 16 }} />
      <SectionCard
        title="Wallet history"
        subtitle="Ledger entries returned by the backend wallet service."
      >
        {ledger.length ? (
          <div className="table-shell table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>#{entry.id}</td>
                    <td>
                      <Badge tone={entry.amount >= 0 ? "success" : "danger"}>
                        {entry.type}
                      </Badge>
                    </td>
                    <td>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatMoneyPiastres(entry.amount)}
                    </td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No wallet activity"
            description="Top-ups and charging debits will appear here after they are recorded by the backend."
          />
        )}
      </SectionCard>
    </>
  );
}
