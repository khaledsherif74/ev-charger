import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminAuthReducer from "../features/adminAuth/adminAuthSlice";
import adminReducer from "../features/admin/adminSlice";
import alertsReducer from "../features/alerts/alertsSlice";
import realtimeReducer from "../features/realtime/realtimeSlice";
import userReducer from "../features/user/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    admin: adminReducer,
    alerts: alertsReducer,
    realtime: realtimeReducer,
    user: userReducer,
  },
  devTools: import.meta.env.DEV,
});
