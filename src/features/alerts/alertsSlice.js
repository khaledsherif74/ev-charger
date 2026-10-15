import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminApi } from "../../api/http";
import { adminSessionExpired, logoutAdmin } from "../adminAuth/adminAuthSlice";

export const fetchAlerts = createAsyncThunk("alerts/fetch", async (_, { rejectWithValue }) => {
  try {
    return (await adminApi.alerts()).alerts;
  } catch (error) {
    return rejectWithValue({ message: error.message, status: error.status, code: error.code });
  }
});

const initialState = { items: [], status: "idle", error: null, newIds: [] };

const slice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    // pushed over the admin-only socket room
    alertsPushed(state, action) {
      state.items = action.payload.alerts || [];
      state.newIds = action.payload.newIds || [];
      state.status = "succeeded";
    },
    clearNewAlerts(state) {
      state.newIds = [];
    },
  },
  extraReducers(builder) {
    builder
      .addCase(logoutAdmin.fulfilled, () => initialState)
      .addCase(adminSessionExpired, () => initialState)
      .addCase(fetchAlerts.pending, (state) => {
        if (state.status === "idle") state.status = "loading";
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const { alertsPushed, clearNewAlerts } = slice.actions;
// The red badge counts what needs action (critical + warning); info alerts are only listed.
export const selectAlertCount = (state) => state.alerts.items.filter((a) => a.severity !== "info").length;
export default slice.reducer;
