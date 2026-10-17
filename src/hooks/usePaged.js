import { useCallback, useEffect, useRef, useState } from "react";

export default function usePaged(fetchPage, deps = []) {
  const [state, setState] = useState({
    items: [],
    next: null,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const fnRef = useRef(fetchPage);
  fnRef.current = fetchPage;
  const seq = useRef(0);

  const load = useCallback(async (cursor) => {
    const my = ++seq.current;
    setState((s) =>
      cursor
        ? { ...s, loadingMore: true }
        : { ...s, loading: true, error: null },
    );
    try {
      const page = await fnRef.current(cursor);
      if (my !== seq.current) return;
      setState((s) => ({
        items: cursor ? [...s.items, ...page.items] : page.items,
        next: page.nextBefore,
        loading: false,
        loadingMore: false,
        error: null,
      }));
    } catch (error) {
      if (my === seq.current)
        setState((s) => ({ ...s, loading: false, loadingMore: false, error }));
    }
  }, []);

  useEffect(() => {
    load(null);
  }, deps);

  return {
    ...state,
    reload: () => load(null),
    loadMore: () => state.next && load(state.next),
  };
}
