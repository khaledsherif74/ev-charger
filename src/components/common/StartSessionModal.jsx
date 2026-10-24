import { useEffect, useState } from "react";
import { adminApi } from "../../api/http";
import { useDispatch } from "react-redux";
import { fetchOverview, fetchSessions } from "../../features/admin/adminSlice";
import { Play, X } from "lucide-react";
import Spinner from "./Spinner";

export default function StartSessionModal({ charger, onClose }) {
  const dispatch = useDispatch();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    adminApi
      .customers({ limit: 100, q: search })
      .then((r) => {
        if (active) setCustomers(r.customers || []);
      })
      .catch((error) => {
        if (active) setMsg({ tone: "bad", text: `Failed to load customers: ${error.message}` });
      });
    return () => {
      active = false;
    };
  }, [search]);

  const ready = Boolean(
    charger?.online && charger?.status === "Preparing" && !charger?.activeSession,
  );

  async function handleStart() {
    if (!selectedUser || !charger?.id || !ready || busy || started) return;
    setBusy(true);
    setMsg(null);
    try {
      await adminApi.startSession(Number(selectedUser), charger.id);
      setStarted(true);
      setMsg({
        tone: "ok",
        text: "Start request accepted. Charging will begin when the charger confirms the transaction.",
      });
      dispatch(fetchOverview());
      dispatch(fetchSessions({ group: "active" }));
    } catch (error) {
      setMsg({ tone: "bad", text: `Unable to start charging: ${error.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="start-session-title">
        <header className="modal-head">
          <Play size={22} />
          <h2 id="start-session-title">Start charging session</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            style={{ marginLeft: "auto" }}
          >
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          <div className="effect">
            <strong>Charger</strong>
            <p dir="ltr">{charger?.id}</p>
            <strong>Current state</strong>
            <p>{charger?.online ? charger?.status : "Offline"}</p>
          </div>
          <p className="hint">
            A vehicle must be plugged in and the charger must be online. Choose the customer whose wallet will be billed, just as in a normal customer start.
          </p>

          <label className="field">
            <span>Search customer</span>
            <input
              type="text"
              placeholder="Type customer email to search..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={busy || started}
            />
          </label>

          <label className="field">
            <span>Customer to bill</span>
            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              disabled={busy || started}
            >
              <option value="">— Choose a customer —</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.email} (Balance: {(customer.balance / 100).toFixed(2)} EGP)
                </option>
              ))}
            </select>
          </label>

          {!ready ? (
            <div className="note note-warn">
              Start is available only when the charger is online, a vehicle is plugged in, and no session is active.
            </div>
          ) : null}

          {msg ? <div className={`note note-${msg.tone}`}>{msg.text}</div> : null}
        </div>

        <footer className="modal-foot">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            {started ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleStart}
            disabled={busy || started || !selectedUser || !ready}
          >
            {busy ? <Spinner label="Starting…" /> : "Start charging"}
          </button>
        </footer>
      </div>
    </div>
  );
}
