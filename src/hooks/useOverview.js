import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOverview } from "../features/admin/adminSlice";

/** Loads the overview (chargers, counts, safe config) once and keeps it fresh. Returns the overview and a chargers array. */
export default function useOverview(interval = 10000) {
  const dispatch = useDispatch();
  const { overview, overviewStatus, overviewError } = useSelector((s) => s.admin);
  useEffect(() => {
    dispatch(fetchOverview());
    if (!interval) return undefined;
    const timer = window.setInterval(() => dispatch(fetchOverview()), interval);
    return () => window.clearInterval(timer);
  }, [dispatch, interval]);
  return { overview, chargers: overview?.chargers || [], status: overviewStatus, error: overviewError, reload: () => dispatch(fetchOverview()) };
}
