import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api/http";

// Module-level cache: reading the live config on one page warms it for every
// other page. TTL exists so a stale value does not survive a long gap.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // chargerId -> { data, at, promise, error }
const listeners = new Set(); // fn(chargerId, data) — each useChargerLive instance

function notify(chargerId, data) {
  for (const fn of listeners) {
    try {
      fn(chargerId, data);
    } catch {
      /* ignore */
    }
  }
}

export async function loadChargerLive(chargerId, { force = false } = {}) {
  if (!chargerId) return null;
  const now = Date.now();
  const cached = cache.get(chargerId);

  if (!force && cached?.data && now - cached.at < TTL_MS) return cached.data;
  if (cached?.promise) return cached.promise;

  const promise = adminApi
    .chargerLive(chargerId)
    .then((data) => {
      cache.set(chargerId, {
        data,
        at: Date.now(),
        promise: null,
        error: null,
      });
      notify(chargerId, data);
      return data;
    })
    .catch((e) => {
      const prev = cache.get(chargerId);
      cache.set(chargerId, {
        data: prev?.data || null,
        at: prev?.at || 0,
        promise: null,
        error: e,
      });
      notify(chargerId, prev?.data || null);
      throw e;
    });

  cache.set(chargerId, {
    data: cached?.data || null,
    at: cached?.at || 0,
    promise,
    error: null,
  });
  return promise;
}

/** Mark the cache stale so the next reader refetches. Does not fetch. */
export function invalidateChargerLive(chargerId) {
  const c = cache.get(chargerId);
  if (c) cache.set(chargerId, { ...c, at: 0 });
}

/**
 * Subscribe to a charger's live snapshot.
 * Returns { data, loading, error, reload }.
 *   data = { chargerId, connectorId, config, limit, localListVersion, readAt, errors }
 */
export function useChargerLive(chargerId, { online = true } = {}) {
  const [state, setState] = useState(() => {
    const c = chargerId ? cache.get(chargerId) : null;
    return {
      data: c?.data || null,
      loading: Boolean(chargerId && online && !c?.data),
      error: c?.error || null,
    };
  });

  useEffect(() => {
    if (!chargerId) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    let alive = true;
    const onUpdate = (id, data) => {
      if (!alive || id !== chargerId) return;
      setState((s) => ({
        data: data || s.data,
        loading: false,
        error: data ? null : s.error,
      }));
    };
    listeners.add(onUpdate);

    const c = cache.get(chargerId);
    if (c?.data) setState({ data: c.data, loading: false, error: null });
    else if (online) setState((s) => ({ ...s, loading: true }));

    if (online) {
      loadChargerLive(chargerId).catch((e) => {
        if (alive) setState((s) => ({ ...s, loading: false, error: e }));
      });
    }

    return () => {
      alive = false;
      listeners.delete(onUpdate);
    };
  }, [chargerId, online]);

  const reload = useCallback(() => {
    if (!chargerId) return Promise.resolve(null);
    return loadChargerLive(chargerId, { force: true });
  }, [chargerId]);

  return { ...state, reload };
}
