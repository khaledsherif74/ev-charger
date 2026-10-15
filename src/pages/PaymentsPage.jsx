import { useState } from "react";
import { adminApi } from "../api/http";
import usePaged from "../hooks/usePaged";
import { useI18n } from "../i18n";
import { formatDate, formatMoneyPiastres } from "../utils/format";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import Badge from "../components/common/Badge";
import { HelpLink } from "../components/common/HelpPanel";

const TONE = { PAID: "success", PENDING: "warning", FAILED: "danger" };
const STATUS = ["all", "PAID", "PENDING", "FAILED"];

export default function PaymentsPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState("all");
  const list = usePaged(async (before) => {
    const r = await adminApi.payments({ status: status === "all" ? undefined : status, before: before || undefined });
    return { items: r.payments, nextBefore: r.nextBefore };
  }, [status]);

  return (
    <>
      <PageHeader title={t("pay.title")} description={t("pay.sub")} actions={<HelpLink code="PAID_NO_BALANCE" className="button button-secondary" />} />
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
                    <th />
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
                      <td>
                        {p.stuck ? <HelpLink code="PAYMENT_PENDING" /> : null}
                        {p.status === "FAILED" ? <HelpLink code="PAYMENT_PROVIDER_ERROR" /> : null}
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
    </>
  );
}
