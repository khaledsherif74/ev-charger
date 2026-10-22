import { useState } from "react";
import { adminApi } from "../../api/http";
import { useI18n } from "../../i18n";
import { useDispatch } from "react-redux";
import { fetchSessions } from "../../features/admin/adminSlice";
import { ShieldAlert, Square, Unlock, XCircle } from "lucide-react";
import { formatKwh } from "../../utils/format";

export default function SessionControlModal({ session, onClose }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const [amps, setAmps] = useState(16);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function sendCommand(action, command, params, successMsg) {
    setBusy(action);
    setMsg("");
    try {
      const res = await adminApi.command(session.chargerId, command, params);
      if (res.ok === false)
        throw new Error(res.error?.message || "Charger rejected the command");
      setMsg(successMsg);
      dispatch(fetchSessions({ group: "active" }));
      if (action === "stop") setTimeout(onClose, 2000);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header className="modal-head">
          <ShieldAlert size={22} />
          <h2>Live Control: Session #{session.id}</h2>
        </header>
        <div className="modal-body">
          <div className="effect">
            <strong>Customer</strong>
            <p>{session.userEmail}</p>
            <strong>Charger</strong>
            <p>
              {session.chargerId} · Energy: {formatKwh(session.energyWh)}
            </p>
          </div>

          <label className="field" style={{ marginTop: "16px" }}>
            <span>Adjust Live Current Limit (Amps)</span>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginTop: "8px",
              }}
            >
              <input
                type="range"
                min="6"
                max="32"
                value={amps}
                onChange={(e) => setAmps(Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--primary)" }}
              />
              <strong
                style={{
                  fontSize: "18px",
                  minWidth: "40px",
                  textAlign: "right",
                }}
              >
                {amps} A
              </strong>
            </div>
          </label>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              className="button button-primary"
              onClick={() =>
                sendCommand(
                  "limit",
                  "SetCurrentLimit",
                  {
                    limitAmps: amps,
                    purpose: "TxProfile",
                    transactionId: session.id,
                  },
                  "Limit applied.",
                )
              }
              disabled={!!busy}
            >
              {busy === "limit" ? "Applying..." : "Apply Limit"}
            </button>
            <button
              className="button button-secondary"
              onClick={() =>
                sendCommand(
                  "clear",
                  "ClearChargingProfile",
                  { connectorId: 1 },
                  "Limit cleared. Charger reverts to default.",
                )
              }
              disabled={!!busy}
            >
              <XCircle size={15} /> Clear Limit
            </button>
            <button
              className="button button-secondary"
              onClick={() =>
                sendCommand(
                  "unlock",
                  "UnlockConnector",
                  { connectorId: 1 },
                  "Cable unlocked.",
                )
              }
              disabled={!!busy}
            >
              <Unlock size={15} /> Unlock Cable
            </button>
          </div>

          {msg ? (
            <div
              className={`note ${msg.startsWith("Error") ? "note-bad" : "note-ok"}`}
              style={{ marginTop: "16px" }}
            >
              {msg}
            </div>
          ) : null}
        </div>

        <footer
          className="modal-foot"
          style={{
            justifyContent: "space-between",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            className="button button-danger"
            onClick={() =>
              sendCommand(
                "stop",
                "RemoteStopTransaction",
                { transactionId: session.id },
                "Stopping...",
              )
            }
            disabled={!!busy}
          >
            <Square size={15} />
            {busy === "stop" ? "Stopping..." : "Stop Session"}
          </button>
          <button
            className="button button-secondary"
            onClick={onClose}
            disabled={!!busy}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
