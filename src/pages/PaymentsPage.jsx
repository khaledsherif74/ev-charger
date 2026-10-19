import { useState } from "react";
import { RefreshCw, XCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { adminApi } from "../api/http";
import { fetchAlerts } from "../features/alerts/alertsSlice";
import usePaged from "../hooks/usePaged";
import { useI18n } from "../i18n";
import { errorText } from "../utils/plain";
import { formatDate, formatMoneyPiastres } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import Badge from "../components/common/Badge";
import { useConfirm } from "../components/common/ConfirmDialog";
import { HelpLink } from "../components/common/HelpPanel";

const TONE = { PAID: "success", PENDING: "warning", FAILED: "danger" };
const STATUS = ["all", "PAID", "PENDING", "FAILED"];
const RESULT_TONE = { MARK_PAID: "ok", ALREADY_PAID: "ok", STILL_PENDING: "warn", ALREADY_FAILED: "warn", FAILED: "ok" };

export default function PaymentsPage() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { confirm, dialog } = useConfirm();
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(null);
  const [notes, setNotes] = useState({});
  const list = usePaged(async (before) => {
    const r = await adminApi.payments({ status: status === "all" ? undefined : status, before: before || undefined });
    return { items: r.payments, nextBefore: r.nextBefore };
  }, [status]);

  async function run(p, kind) {
    if (kind === "fail") {
      const ok = await confirm({
        title: t("pay.failTitle", { n: p.id }),
        body: t("pay.failBody"),
        moneyEffect: t("pay.failMoney"),
        confirmLabel: t("pay.fail"),
      });
      if (!ok) return;
    }
    setBusy(p.id);
    try {
      const r = kind === "fail" ? await adminApi.failPayment(p.id) : await adminApi.recheckPayment(p.id);
      setNotes((n) => ({ ...n, [p.id]: { tone: RESULT_TONE[r.result] || "warn", text: t(`pay.res.${r.result}`) } }));
    } catch (e) {
      setNotes((n) => ({ ...n, [p.id]: { tone: "bad", text: errorText(e, t) } }));
    } finally {
      setBusy(null);
      list.reload();
      dispatch(fetchAlerts());
    }
  }

  return (
    <>
      <PageHeader
        title={t("pay.title")}
        description={t("pay.sub")}
        actions={
          <>
            <HelpLink code="PAID_NO_BALANCE" className="button button-secondary" />
            <button type="button" className="button button-secondary" onClick={list.reload} disabled={list.loading}>
              <RefreshCw size={15} />
              {t("common.refresh")}
            </button>
          </>
        }
      />
      <SectionCard>
        <div className="chips pad">
          {STATUS.map((s) => (
            <button key={s} type="button" className={`chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
              {s === "all" ? t("common.all") : t(`pay.${s}`)}
            </button>
          ))}
        </div>
        {list.loading && !list.items.length ? (
          <div className="loading-block">
            <Spinner />
          </div>
        ) : null}
        {list.error && !list.items.length ? <ErrorState message={list.error.message} onRetry={list.reload} /> : null}
        {list.items.length ? (
          <>
            <div className="table-shell table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("common.customer")}</th>
                    <th>{t("pay.amount")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("pay.created")}</th>
                    <th>{t("pay.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((p) => (
                    <tr key={p.id} className={p.stuck ? "row-review" : ""}>
                      <td dir="ltr">#{p.id}</td>
                      <td dir="ltr">{p.userEmail}</td>
                      <td>{formatMoneyPiastres(p.amountPiastres)}</td>
                      <td>
                        <Badge tone={TONE[p.status]}>{t(`pay.${p.status}`)}</Badge>
                        {p.stuck ? <Badge tone="warning">{t("pay.stuck")}</Badge> : null}
                      </td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td className="pay-actions">
                        {p.status === "PENDING" ? (
                          <div className="pay-buttons">
                            <button type="button" className="button button-secondary" disabled={busy === p.id} onClick={() => run(p, "recheck")}>
                              <RefreshCw size={14} />
                              {t("pay.recheck")}
                            </button>
                            <button type="button" className="button button-secondary" disabled={busy === p.id} onClick={() => run(p, "fail")}>
                              <XCircle size={14} />
                              {t("pay.fail")}
                            </button>
                          </div>
                        ) : null}
                        {p.stuck ? <HelpLink code="PAYMENT_PENDING" /> : null}
                        {p.status === "FAILED" ? <HelpLink code="PAYMENT_PROVIDER_ERROR" /> : null}
                        {notes[p.id] ? <div className={`note note-${notes[p.id].tone}`}>{notes[p.id].text}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.next ? (
              <button type="button" className="button button-secondary load-more" onClick={list.loadMore} disabled={list.loadingMore}>
                {list.loadingMore ? <Spinner /> : t("common.loadMore")}
              </button>
            ) : null}
          </>
        ) : !list.loading && !list.error ? (
          <EmptyState title={t("pay.none")} />
        ) : null}
      </SectionCard>
      {dialog}
    </>
  );
}
