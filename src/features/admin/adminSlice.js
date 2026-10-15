import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminApi } from "../../api/http";
import { adminSessionExpired, logoutAdmin } from "../adminAuth/adminAuthSlice";

const fail = (error) => ({
  message: error.message,
  status: error.status,
  code: error.code,
  details: error.details,
});

export const fetchOverview = createAsyncThunk(
  "admin/fetchOverview",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.overview();
    } catch (error) {
      return rejectWithValue(fail(error));
    }
  },
);

export const fetchSessions = createAsyncThunk(
  "admin/fetchSessions",
  async ({ state = "", before = null } = {}, { rejectWithValue }) => {
    try {
      return await adminApi.sessions({ state: state || undefined, before });
    } catch (error) {
      return rejectWithValue(fail(error));
    }
  },
);

export const fetchLogs = createAsyncThunk(
  "admin/fetchLogs",
  async (
    { chargerId = "", direction = "", before = null } = {},
    { rejectWithValue },
  ) => {
    try {
      return await adminApi.logs({
        chargerId: chargerId || undefined,
        direction: direction || undefined,
        before,
      });
    } catch (error) {
      return rejectWithValue(fail(error));
    }
  },
);

export const fetchChargerConfig = createAsyncThunk(
  "admin/fetchChargerConfig",
  async (chargerId, { rejectWithValue }) => {
    try {
      return await adminApi.chargerConfig(chargerId);
    } catch (error) {
      return rejectWithValue(fail(error));
    }
  },
);

export const sendAdminCommand = createAsyncThunk(
  "admin/sendCommand",
  async ({ chargerId, command, params }, { rejectWithValue }) => {
    try {
      return await adminApi.command(chargerId, command, params);
    } catch (error) {
      return rejectWithValue(fail(error)); // keeps code + Zod details so the UI can show them
    }
  },
);

const initialState = {
  overview: null,
  overviewStatus: "idle",
  overviewError: null,
  sessions: [],
  sessionsNextBefore: null,
  sessionsStatus: "idle",
  sessionsError: null,
  logs: [],
  logsNextBefore: null,
  logsStatus: "idle",
  logsError: null,
  configByCharger: {},
  configStatusByCharger: {},
  configErrorByCharger: {},
  command: {
    status: "idle",
    lastRequest: null, // { chargerId, command, params, at }
    lastResult: null,
    error: null, // { message, status, code, details }
    finishedAt: null,
  },
};

const slice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearCommandResult(state) {
      state.command = initialState.command;
    },
    clearConfig(state, action) {
      const id = action.payload;
      delete state.configByCharger[id];
      delete state.configStatusByCharger[id];
      delete state.configErrorByCharger[id];
    },
    applyChargerStatus(state, action) {
      if (!state.overview?.chargers) return;
      const { chargerId, status } = action.payload;
      const charger = state.overview.chargers.find(
        (item) => item.id === chargerId,
      );
      if (charger) {
        charger.status = status;
        charger.statusSince = new Date().toISOString();
      }
    },
  },
  extraReducers(builder) {
    builder
      // Never keep admin data in memory after sign-out / expiry.
      .addCase(logoutAdmin.fulfilled, () => initialState)
      .addCase(adminSessionExpired, () => initialState)
      .addCase(fetchOverview.pending, (state) => {
        state.overviewStatus = "loading";
        state.overviewError = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.overviewStatus = "succeeded";
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.overviewStatus = "failed";
        state.overviewError = action.payload?.message || action.error.message;
      })
      .addCase(fetchSessions.pending, (state, action) => {
        state.sessionsStatus = action.meta.arg?.before
          ? "loadingMore"
          : "loading";
        state.sessionsError = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        const before = action.meta.arg?.before;
        state.sessionsStatus = "succeeded";
        state.sessions = before
          ? [...state.sessions, ...action.payload.sessions]
          : action.payload.sessions;
        state.sessionsNextBefore = action.payload.nextBefore;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.sessionsStatus = "failed";
        state.sessionsError = action.payload?.message || action.error.message;
      })
      .addCase(fetchLogs.pending, (state, action) => {
        state.logsStatus = action.meta.arg?.before ? "loadingMore" : "loading";
        state.logsError = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        const before = action.meta.arg?.before;
        state.logsStatus = "succeeded";
        state.logs = before
          ? [...state.logs, ...action.payload.logs]
          : action.payload.logs;
        state.logsNextBefore = action.payload.nextBefore;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.logsStatus = "failed";
        state.logsError = action.payload?.message || action.error.message;
      })
      .addCase(fetchChargerConfig.pending, (state, action) => {
        const id = action.meta.arg;
        state.configStatusByCharger[id] = "loading";
        state.configErrorByCharger[id] = null;
      })
      .addCase(fetchChargerConfig.fulfilled, (state, action) => {
        const id = action.payload.chargerId;
        state.configStatusByCharger[id] = "succeeded";
        state.configByCharger[id] = action.payload;
        state.configErrorByCharger[id] = null;
      })
      .addCase(fetchChargerConfig.rejected, (state, action) => {
        const id = action.meta.arg;
        state.configStatusByCharger[id] = "failed";
        state.configErrorByCharger[id] =
          action.payload?.message || action.error.message;
      })
      .addCase(sendAdminCommand.pending, (state, action) => {
        const { chargerId, command, params } = action.meta.arg;
        state.command = {
          status: "loading",
          lastRequest: {
            chargerId,
            command,
            params,
            at: new Date().toISOString(),
          },
          lastResult: null,
          error: null,
          finishedAt: null,
        };
      })
      .addCase(sendAdminCommand.fulfilled, (state, action) => {
        state.command.status = "succeeded";
        state.command.lastResult = action.payload;
        state.command.finishedAt = new Date().toISOString();
      })
      .addCase(sendAdminCommand.rejected, (state, action) => {
        state.command.status = "failed";
        state.command.error = action.payload || {
          message: action.error.message,
        };
        state.command.finishedAt = new Date().toISOString();
      });
  },
});

export const { clearCommandResult, clearConfig, applyChargerStatus } =
  slice.actions;
export default slice.reducer;
