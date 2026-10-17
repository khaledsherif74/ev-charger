import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { chargerApi, sessionApi, walletApi } from "../../api/http";

const FINAL_STATES = ["COMPLETED", "FAILED", "TIMEOUT"];

export const fetchUserDashboard = createAsyncThunk(
  "user/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const [
        chargersResult,
        activeResult,
        sessionsResult,
        walletResult,
        historyResult,
      ] = await Promise.all([
        chargerApi.list(),
        sessionApi.active(),
        sessionApi.list({ limit: 10 }),
        walletApi.balance(),
        walletApi.history({ limit: 10 }),
      ]);
      return {
        chargers: chargersResult.chargers || [],
        activeSession: activeResult.session || null,
        sessions: sessionsResult.sessions || [],
        balancePiastres: walletResult.balancePiastres ?? 0,
        ledger: historyResult.entries || [],
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Unable to load your charging dashboard.",
      );
    }
  },
);

export const refreshUserSession = createAsyncThunk(
  "user/refreshSession",
  async (_, { rejectWithValue }) => {
    try {
      const [activeResult, sessionsResult] = await Promise.all([
        sessionApi.active(),
        sessionApi.list({ limit: 10 }),
      ]);
      return {
        activeSession: activeResult.session || null,
        sessions: sessionsResult.sessions || [],
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Unable to refresh session data.",
      );
    }
  },
);

export const startCharging = createAsyncThunk(
  "user/startCharging",
  async (chargerId, { rejectWithValue }) => {
    try {
      return (await sessionApi.start(chargerId)).session;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to start charging.");
    }
  },
);

export const stopCharging = createAsyncThunk(
  "user/stopCharging",
  async (sessionId, { rejectWithValue }) => {
    try {
      return (await sessionApi.stop(sessionId)).session;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to stop charging.");
    }
  },
);

export const createTopup = createAsyncThunk(
  "user/createTopup",
  async (amountEgp, { rejectWithValue }) => {
    try {
      return await walletApi.topup(amountEgp);
    } catch (error) {
      return rejectWithValue(
        error?.message || "Unable to start the top-up payment.",
      );
    }
  },
);

const initialState = {
  chargers: [],
  activeSession: null,
  sessions: [],
  balancePiastres: 0,
  ledger: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
  topupStatus: "idle",
  topupError: null,
};

function mergeSession(state, session) {
  if (!session) {
    state.activeSession = null;
    return;
  }
  const known = state.sessions.find((item) => item.id === session.id);
  const alreadyFinal = known && FINAL_STATES.includes(known.state);
  state.sessions = [
    session,
    ...state.sessions.filter((item) => item.id !== session.id),
  ];
  if (FINAL_STATES.includes(session.state)) {
    if (state.activeSession?.id === session.id) {
      state.activeSession = null;
      state.balancePiastres = session.balancePiastres;
    }
  } else if (!alreadyFinal) {
    state.activeSession = session;
  }
}

const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    applyChargerStatus(state, action) {
      const { chargerId, status } = action.payload || {};
      const charger = state.chargers.find((item) => item.id === chargerId);
      if (charger) {
        charger.status = status;
        charger.online = true;
        charger.statusSince = new Date().toISOString();
      }
    },
    applySessionUpdate(state, action) {
      mergeSession(state, action.payload || null);
    },
    clearUserState() {
      return initialState;
    },
    clearUserErrors(state) {
      state.error = null;
      state.actionError = null;
      state.topupError = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUserDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        Object.assign(state, action.payload);
      })
      .addCase(fetchUserDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(refreshUserSession.fulfilled, (state, action) =>
        Object.assign(state, action.payload),
      )
      .addCase(refreshUserSession.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(startCharging.pending, (state) => {
        state.actionStatus = "starting";
        state.actionError = null;
      })
      .addCase(startCharging.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.actionError = null;
        mergeSession(state, action.payload);
      })
      .addCase(startCharging.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload || action.error.message;
      })
      .addCase(stopCharging.pending, (state) => {
        state.actionStatus = "stopping";
        state.actionError = null;
      })
      .addCase(stopCharging.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.actionError = null;
        mergeSession(state, action.payload);
      })
      .addCase(stopCharging.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload || action.error.message;
      })
      .addCase(createTopup.pending, (state) => {
        state.topupStatus = "loading";
        state.topupError = null;
      })
      .addCase(createTopup.fulfilled, (state) => {
        state.topupStatus = "succeeded";
        state.topupError = null;
      })
      .addCase(createTopup.rejected, (state, action) => {
        state.topupStatus = "failed";
        state.topupError = action.payload || action.error.message;
      });
  },
});

export const {
  applyChargerStatus,
  applySessionUpdate,
  clearUserState,
  clearUserErrors,
} = slice.actions;
export default slice.reducer;
