import { RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDashboard } from '../features/user/userSlice';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { formatDate, formatKwh, formatMoneyPiastres } from '../utils/format';

export default function UserSessionsPage() {
  const dispatch = useDispatch();
  const sessions = useSelector((state) => state.user.sessions);
  return (
    <>
      <PageHeader title="My sessions" description="Charging sessions belonging to the currently authenticated user." actions={<button className="button button-secondary" onClick={() => dispatch(fetchUserDashboard())}><RefreshCw size={15} />Refresh</button>} />
      <SectionCard title="Session history" subtitle="The backend currently returns the latest sessions, with the limit capped server-side.">
        {sessions.length ? <div className="table-shell table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Charger</th><th>State</th><th>Energy</th><th>Cost</th><th>Balance</th><th>Started</th><th>Ended</th><th>Stop reason</th></tr></thead><tbody>{sessions.map((session) => (
          <tr key={session.id}><td>#{session.id}</td><td className="mono">{session.chargerId}</td><td><Badge tone={session.state === 'COMPLETED' ? 'success' : ['FAILED', 'TIMEOUT'].includes(session.state) ? 'danger' : 'neutral'}>{session.state}</Badge></td><td>{formatKwh(session.energyWh)}</td><td>{formatMoneyPiastres(session.costPiastres)}</td><td>{formatMoneyPiastres(session.balancePiastres)}</td><td>{formatDate(session.startedAt)}</td><td>{formatDate(session.endedAt)}</td><td>{session.stopReason || '—'}</td></tr>
        ))}</tbody></table></div> : <EmptyState title="No sessions" description="Your completed and active sessions will appear here." />}
      </SectionCard>
    </>
  );
}
