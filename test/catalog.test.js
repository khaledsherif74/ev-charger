import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { CATALOG, SOURCES, entryFor, hasEntry, listEntries } from "../src/utils/errorCatalog.js";
import { ACTIONS } from "../src/utils/catalogActions.js";

const require = createRequire(import.meta.url);
const { ALERT_CODES } = require("../../backend/lib/alerts.js");

const REQUIRED = [
  ...["ConnectorLockFailure", "EVCommunicationError", "GroundFailure", "HighTemperature", "InternalError", "LocalListConflict", "OtherError", "OverCurrentFailure", "OverVoltage", "UnderVoltage", "PowerMeterFailure", "PowerSwitchFailure", "ReaderFailure", "ResetFailure", "WeakSignal"],
  ...["Faulted", "Unavailable", "SuspendedEV", "SuspendedEVSE", "Reserved", "FinishingStuck", "PreparingStuck"],
  ...["Offline", "NoHeartbeat", "Flapping", "WrongPassword", "Replaced", "WsRedirect307", "PortForced80", "WrongClock", "NoInternet"],
  ...["SESSION_TIMEOUT", "SESSION_FAILED", "SESSION_OFFLINE_CHARGING", "SESSION_UNRESOLVED", "IMPLAUSIBLE_METER"],
  ...["EmergencyStop", "EVDisconnected", "HardReset", "Local", "Other", "PowerLoss", "Reboot", "Remote", "SoftReset", "UnlockCommand", "DeAuthorized", "BalanceExhausted", "UserStop", "EVIdleTimeout", "NoStart", "RemoteStartRejected", "RemoteStartError", "CancelledByUser", "BadMeterData"].map((r) => `STOP_${r}`),
  ...["CHARGER_OFFLINE", "CHARGER_TIMEOUT", "SESSION_ACTIVE", "START_REJECTED", "STOP_REJECTED", "NOT_PLUGGED", "LOW_BALANCE", "ALREADY_ACTIVE", "UNKNOWN_COMMAND", "ADMIN_NOT_CONFIGURED", "VALIDATION"],
  ...["Rejected", "NotSupported", "NotImplemented", "UnlockFailed", "Occupied", "Faulted", "Unavailable", "UnknownMessageId", "UnknownVendorId", "VersionMismatch", "RebootRequired", "Scheduled"].map((a) => `ANSWER_${a}`),
  ...["NotImplemented", "NotSupported", "PropertyConstraintViolation", "FormationViolation", "GenericError", "InternalError", "SecurityError", "ProtocolError", "TypeConstraintViolation", "OccurenceConstraintViolation"].map((c) => `CALLERROR_${c}`),
  ...["FREEVEND_ENABLED", "METER_INTERVAL", "HEARTBEAT_LONG", "CURRENT_LIMIT_LOW", "LOCAL_LIST_USED", "AUTHORIZE_REMOTE_OFF"],
  ...["PAYMENT_PENDING", "PAYMENT_MISMATCH", "PAYMOB_NOT_CONFIGURED", "PAYMENT_PROVIDER_ERROR", "PAID_NO_BALANCE"],
  ...["DB_DOWN", "SERVER_RESTARTED", "PAYMOB_KEYS_MISSING"],
];

test("every required problem has an entry", () => {
  const missing = REQUIRED.filter((c) => !hasEntry(c));
  assert.deepEqual(missing, []);
});

test("codes are unique", () => {
  const codes = CATALOG.map((e) => e.code);
  assert.equal(new Set(codes).size, codes.length);
});

test("every entry is complete in English and Arabic", () => {
  for (const e of CATALOG) {
    assert.ok(SOURCES.includes(e.source), `${e.code}: source`);
    assert.ok(["info", "warning", "critical"].includes(e.severity), `${e.code}: severity`);
    for (const lang of ["en", "ar"]) {
      const t = e[lang];
      for (const f of ["title", "meaning", "callTechnicianWhen", "customerImpact"]) assert.ok(typeof t[f] === "string" && t[f].length > 0, `${e.code}.${lang}.${f}`);
      assert.ok(t.causes.length >= 1, `${e.code}.${lang}.causes`);
      assert.ok(t.steps.length >= 1, `${e.code}.${lang}.steps`);
    }
    assert.equal(e.en.steps.length, e.ar.steps.length, `${e.code}: same number of steps in both languages`);
    assert.ok(/[\u0600-\u06FF]/.test(e.ar.title), `${e.code}: Arabic title is Arabic`);
  }
});

test("every action id used by the catalog exists", () => {
  for (const e of CATALOG) for (const a of e.actions) assert.ok(ACTIONS[a], `${e.code}: unknown action ${a}`);
});

test("every alert code the backend can raise is in the catalog", () => {
  for (const c of ALERT_CODES) assert.ok(hasEntry(c), c);
});

test("unknown codes fall back to something readable", () => {
  assert.equal(entryFor("STOP_SomethingNew").code, "STOP_Other");
  assert.equal(entryFor("ANSWER_Weird").code, "ANSWER_Rejected");
  assert.equal(entryFor("TOTALLY_NEW").code, "UNKNOWN");
  assert.equal(entryFor("CALLERROR_OccurrenceConstraintViolation").code, "CALLERROR_OccurenceConstraintViolation");
  assert.ok(listEntries("ar").length === CATALOG.length);
});

test("the Offline entry has the owner steps in order", () => {
  const e = entryFor("Offline", "en");
  assert.equal(e.steps.length, 6);
  assert.match(e.steps[5], /10 minutes/);
});
