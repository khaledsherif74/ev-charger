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

    // Keep this same-origin: Vercel proxies /socket.io to the backend and the
    // browser's admin cookie remains available to the Socket.IO handshake.
    const socket = io(window.location.origin, {
      path: "/socket.io",
      addTrailingSlash: false,
      withCredentials: true,
      transports: ["polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      dispatch(socketConnected());
      dispatch(fetchAlerts());
    });
    socket.on("disconnect", () => dispatch(socketDisconnected()));
    socket.on("connect_error", (error) => {
      dispatch(socketDisconnected());
      // Useful in the browser console without exposing credentials or cookies.
      console.warn("Admin realtime connection failed:", error?.message || error);
    });
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
