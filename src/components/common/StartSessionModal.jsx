import { useState, useEffect } from "react";
import { adminApi } from "../../api/http";
import { useDispatch } from "react-redux";
import { fetchSessions } from "../../features/admin/adminSlice";
import { Play, X } from "lucide-react";
import Spinner from "./Spinner";

export default function StartSessionModal({ chargers, onClose }) {
  const dispatch = useDispatch();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCharger, setSelectedCharger] = useState(chargers[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Fetch customers for the dropdown
  useEffect(() => {
    adminApi
      .customers({ limit: 100, q: search })
      .then((r) => setCustomers(r.customers))
      .catch((e) => setMsg(`Failed to load customers: ${e.message}`));
  }, [search]);

  async function handleStart() {
    if (!selectedUser || !selectedCharger) return;
    setBusy(true);
    setMsg("");
    try {
      await adminApi.startSession(Number(selectedUser), selectedCharger);
      setMsg("Success! Session started. The charger will begin shortly.");
      dispatch(fetchSessions({ group: "active" }));
      setTimeout(onClose, 2000);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header className="modal-head">
          <Play size={22} />
          <h2>Force Start Session</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            style={{ marginLeft: "auto" }}
          >
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">
          <p className="hint">
            This bypasses the customer app. The customer's wallet will be billed
            exactly as if they started it themselves.
          </p>

          <label className="field">
            <span>Search Customer</span>
            <input
              type="text"
              placeholder="Type email to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Select Customer</span>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">— Choose a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email} (Balance: {(c.balance / 100).toFixed(2)} EGP)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Select Charger</span>
            <select
              value={selectedCharger}
              onChange={(e) => setSelectedCharger(e.target.value)}
            >
              {chargers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.online ? c.status : "Offline"})
                </option>
              ))}
            </select>
          </label>

          {msg ? (
            <div
              className={`note ${msg.startsWith("Error") ? "note-bad" : "note-ok"}`}
            >
              {msg}
            </div>
          ) : null}
        </div>
        <footer className="modal-foot">
          <button
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleStart}
            disabled={busy || !selectedUser || !selectedCharger}
          >
            {busy ? <Spinner label="Starting..." /> : "Start Session"}
          </button>
        </footer>
      </div>
    </div>
  );
}
