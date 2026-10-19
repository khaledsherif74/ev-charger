import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, WalletCards } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createTopup, fetchUserDashboard } from "../features/user/userSlice";
import { useI18n } from "../i18n";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import { formatDate, formatMoneyPiastres } from "../utils/format";

export default function UserWalletPage() {
  const { t } = useI18n();
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
      window.location.assign(result.payload.checkoutUrl); // popups are blocked after an await: open it in this tab
    }
  }

  return (
    <>
      <PageHeader
        title={t("u.wallet.title")}
        description={t("u.wallet.sub")}
        actions={
          <button
            className="button button-secondary"
            onClick={() => dispatch(fetchUserDashboard())}
          >
            <RefreshCw size={15} />
            {t("common.refresh")}
          </button>
        }
      />
      <div className="wallet-layout">
        <SectionCard
          title={t("u.balance")}
          subtitle={t("u.wallet.balanceHelp")}
        >
          <div className="balance-hero">
            <WalletCards size={22} />
            <strong>{formatMoneyPiastres(balancePiastres)}</strong>
            <span>{t("u.wallet.available")}</span>
          </div>
        </SectionCard>
        <SectionCard title={t("u.addMoney")} subtitle={t("u.wallet.addHelp")}>
          <form className="form-grid" onSubmit={submitTopup}>
            <label className="field">
              <span>
                {t("u.wallet.amount")} <em>{t("u.wallet.min")}</em>
              </span>
              <input
                type="number"
                dir="ltr"
                min="20"
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
                  <Spinner label={t("u.wallet.preparing")} />
                ) : (
                  <>
                    {t("u.wallet.pay")} <ExternalLink size={15} />
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
              <span>{t("u.wallet.redirecting")}</span>
              <a href={checkoutUrl}>{t("u.wallet.openPay")}</a>
            </div>
          ) : null}
          <p className="hint pad">{t("u.wallet.afterPay")}</p>
        </SectionCard>
      </div>
      <div style={{ height: 16 }} />
      <SectionCard
        title={t("u.wallet.history")}
        subtitle={t("u.wallet.historyHelp")}
      >
        {ledger.length ? (
          <div className="table-shell table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>{t("u.wallet.date")}</th>
                  <th>{t("u.wallet.what")}</th>
                  <th>{t("pay.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>
                      <Badge tone={entry.amount >= 0 ? "success" : "neutral"}>
                        {t(`u.ledger.${entry.type}`)}
                      </Badge>
                    </td>
                    <td dir="ltr">
                      {entry.amount >= 0 ? "+" : ""}
                      {formatMoneyPiastres(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={t("u.wallet.none")}
            description={t("u.wallet.noneHelp")}
          />
        )}
      </SectionCard>
    </>
  );
}
