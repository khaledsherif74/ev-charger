import { useState } from "react";
import { Search } from "lucide-react";
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

export default function CustomersPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const list = usePaged(async (before) => {
    const r = await adminApi.customers({ q: applied || undefined, before: before || undefined });
    return { items: r.customers, nextBefore: r.nextBefore };
  }, [applied]);

  return (
    <>
      <PageHeader title={t("cus.title")} description={t("cus.sub")} />
      <SectionCard
        actions={
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(q.trim());
            }}
          >
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cus.search")} aria-label={t("cus.search")} />
          </form>
        }
      >
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
                    <th>{t("cus.email")}</th>
                    <th>{t("cus.joined")}</th>
                    <th>{t("cus.balance")}</th>
                    <th>{t("cus.sessions")}</th>
                    <th>{t("cus.spent")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((c) => (
                    <tr key={c.id}>
                      <td dir="ltr">{c.email}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td className={c.balance < 0 ? "money-neg" : ""}>
                        {formatMoneyPiastres(c.balance)} {c.balance < 0 ? <Badge tone="danger">{t("cus.owes")}</Badge> : null}
                      </td>
                      <td>{c.sessions}</td>
                      <td>{formatMoneyPiastres(c.totalSpentPiastres)}</td>
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
          <EmptyState title={t("cus.none")} />
        ) : null}
      </SectionCard>
    </>
  );
}
