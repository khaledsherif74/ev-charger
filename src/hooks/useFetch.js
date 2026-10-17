import { useCallback, useEffect, useRef, useState } from "react";

export default function useFetch(
  fn,
  deps = [],
  { interval = 0, enabled = true } = {},
) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: enabled,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  const load = useCallback(async (silent) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (alive.current && error?.name !== "AbortError")
        setState((s) => ({ ...s, error, loading: false }));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    if (!enabled) return undefined;
    load(false);
    const timer = interval
      ? window.setInterval(() => load(true), interval)
      : null;
    return () => {
      alive.current = false;
      if (timer) window.clearInterval(timer);
    };
  }, [...deps, enabled, interval, load]);

  return { ...state, reload: () => load(false) };
}
