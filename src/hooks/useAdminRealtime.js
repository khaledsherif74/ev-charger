import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { applyChargerStatus } from "../features/admin/adminSlice";
import { alertsPushed, fetchAlerts } from "../features/alerts/alertsSlice";
import {
  socketConnected,
  socketDisconnected,
  statusEventReceived,
} from "../features/realtime/realtimeSlice";

export default function useAdminRealtime() {
  const dispatch = useDispatch();
  const authenticated = Boolean(useSelector((state) => state.adminAuth.admin));

  useEffect(() => {
    if (!authenticated) return undefined;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "https://ev-charger.runasp.net";
    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ["polling"],
    });

    socket.on("connect", () => {
      dispatch(socketConnected());
      dispatch(fetchAlerts());
    });
    socket.on("disconnect", () => dispatch(socketDisconnected()));
    socket.on("connect_error", () => dispatch(socketDisconnected()));
    socket.on("charger:status", (payload) => {
      if (payload?.chargerId && payload?.status) {
        dispatch(applyChargerStatus(payload));
        dispatch(statusEventReceived());
      }
    });
    socket.on("alerts:update", (payload) => dispatch(alertsPushed(payload)));

    return () => {
      socket.disconnect();
      dispatch(socketDisconnected());
    };
  }, [authenticated, dispatch]);
}
