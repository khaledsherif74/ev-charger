import { tStatic } from "../i18n";

export class ApiError extends Error {
  constructor(message, status = 0, code = null, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

const CUSTOMER_CODES = [
  "NOT_PLUGGED",
  "LOW_BALANCE",
  "CHARGER_OFFLINE",
  "CHARGER_TIMEOUT",
  "ALREADY_ACTIVE",
  "START_REJECTED",
  "STOP_REJECTED",
  "NOT_ACTIVE",
];
function friendly(path, status, code, fallback) {
  if (code && CUSTOMER_CODES.includes(code)) return tStatic(`cust.${code}`);
  if (path.startsWith("/api/wallet/topup")) {
    if (status === 503) return tStatic("cust.TOPUP_UNAVAILABLE");
    if (status === 502) return tStatic("cust.TOPUP_PROVIDER");
    if (status === 400) return tStatic("cust.TOPUP_AMOUNT");
  }
  return fallback;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

export async function request(path, options = {}) {
  const { method = "GET", body, signal, timeoutMs } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      signal: controller ? controller.signal : signal,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      if (controller && controller.signal.aborted)
        throw new ApiError(tStatic("err.TIMEOUT"), 0, "TIMEOUT");
      throw error;
    }
    throw new ApiError(tStatic("err.NETWORK"), 0, "NETWORK");
  } finally {
    if (timer) clearTimeout(timer);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    const isAdmin = path.startsWith("/api/admin/");
    if (
      response.status === 401 &&
      isAdmin &&
      !path.startsWith("/api/admin/auth/")
    ) {
      window.dispatchEvent(new Event("admin:unauthorized"));
    }
    const raw = payload.error || `Request failed with HTTP ${response.status}`;
    throw new ApiError(
      isAdmin ? raw : friendly(path, response.status, payload.code, raw),
      response.status,
      payload.code || null,
      payload.details || null,
    );
  }

  return payload;
}

export const authApi = {
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  signup: (name, email, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),
  logout: () => request("/api/auth/logout", { method: "POST", body: {} }),
  me: () => request("/api/auth/me"),
};

export const adminAuthApi = {
  login: (username, password, code) =>
    request("/api/admin/auth/login", {
      method: "POST",
      body: { username, password, ...(code ? { code } : {}) },
    }),
  logout: () => request("/api/admin/auth/logout", { method: "POST", body: {} }),
  me: () => request("/api/admin/auth/me"),
};

const qs = (obj) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(obj))
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
};
const cid = (id) => encodeURIComponent(id);

export const adminApi = {
  overview: ({ signal } = {}) => request("/api/admin/overview", { signal }),
  stats: ({ signal } = {}) => request("/api/admin/stats", { signal }),
  alerts: ({ signal } = {}) => request("/api/admin/alerts", { signal }),
  sessions: ({ state, group, from, to, before, limit = 50, signal } = {}) =>
    request(
      `/api/admin/sessions${qs({ state, group, from, to, before, limit })}`,
      { signal },
    ),
  logs: ({ chargerId, direction, before, limit = 100, signal } = {}) =>
    request(`/api/admin/logs${qs({ chargerId, direction, before, limit })}`, {
      signal,
    }),
  timeline: ({
    chargerId,
    important = true,
    routine = false,
    from,
    to,
    before,
    limit = 100,
    signal,
  } = {}) =>
    request(
      `/api/admin/timeline${qs({ chargerId, important: important ? 1 : 0, routine: routine ? 1 : 0, from, to, before, limit })}`,
      { signal },
    ),
  customers: ({ q, before, limit = 50, signal } = {}) =>
    request(`/api/admin/customers${qs({ q, before, limit })}`, { signal }),
  payments: ({ status, before, limit = 50, signal } = {}) =>
    request(`/api/admin/payments${qs({ status, before, limit })}`, { signal }),
  chargerConfig: (chargerId) =>
    request(`/api/admin/chargers/${cid(chargerId)}/config`, {
      timeoutMs: 90000,
    }),
  chargerEvents: (chargerId, { before, limit = 50, signal } = {}) =>
    request(
      `/api/admin/chargers/${cid(chargerId)}/events${qs({ before, limit })}`,
      { signal },
    ),
  chargerReport: (chargerId, { signal } = {}) =>
    request(`/api/admin/chargers/${cid(chargerId)}/report`, { signal }),
  command: (chargerId, command, params) =>
    request(`/api/admin/chargers/${cid(chargerId)}/command`, {
      method: "POST",
      body: { command, params },
    }),
  settle: (sessionId, meterStopWh) =>
    request(`/api/admin/sessions/${sessionId}/settle`, {
      method: "POST",
      body: { meterStopWh },
    }),
  recheckPayment: (id) =>
    request(`/api/admin/payments/${id}/recheck`, { method: "POST", body: {} }),
  failPayment: (id) =>
    request(`/api/admin/payments/${id}/fail`, { method: "POST", body: {} }),
  createCharger: (id) =>
    request("/api/admin/chargers", { method: "POST", body: { id } }),
  resetChargerSecret: (id) =>
    request(`/api/admin/chargers/${cid(id)}/reset-secret`, {
      method: "POST",
      body: {},
    }),
};

export const chargerApi = {
  list: ({ signal } = {}) => request("/api/chargers", { signal }),
};

export const sessionApi = {
  active: ({ signal } = {}) => request("/api/sessions/active", { signal }),
  list: ({ limit = 20, signal } = {}) =>
    request(`/api/sessions?limit=${encodeURIComponent(limit)}`, { signal }),
  start: (chargerId) =>
    request("/api/sessions", { method: "POST", body: { chargerId } }),
  stop: (sessionId) =>
    request(`/api/sessions/${encodeURIComponent(sessionId)}/stop`, {
      method: "POST",
      body: {},
    }),
};

export const walletApi = {
  balance: ({ signal } = {}) => request("/api/wallet", { signal }),
  history: ({ limit = 20, signal } = {}) =>
    request(`/api/wallet/history?limit=${encodeURIComponent(limit)}`, {
      signal,
    }),
  topup: (amountEgp) =>
    request("/api/wallet/topup", { method: "POST", body: { amountEgp } }),
};
