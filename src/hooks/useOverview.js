import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOverview } from "../features/admin/adminSlice";
import { loadChargerLive } from "./useChargerLive";

export default function useOverview(interval = 10000) {
  const dispatch = useDispatch();
  const { overview, overviewStatus, overviewError } = useSelector(
    (s) => s.admin,
  );

  useEffect(() => {
    dispatch(fetchOverview());
    if (!interval) return undefined;
    const timer = window.setInterval(() => dispatch(fetchOverview()), interval);
    return () => window.clearInterval(timer);
  }, [dispatch, interval]);

  // Background prefetch: whenever the chargers list arrives or changes, load
  // every online charger's live config once. Every page (Actions, Session
  // Control, MainConfigCard) reads from this cache, so opening a card never
  // triggers a visible "reading…" call.
  useEffect(() => {
    for (const c of overview?.chargers || []) {
      if (c.online) loadChargerLive(c.id).catch(() => {});
    }
  }, [overview?.chargers]);

  return {
    overview,
    chargers: overview?.chargers || [],
    status: overviewStatus,
    error: overviewError,
    reload: () => dispatch(fetchOverview()),
  };
}
