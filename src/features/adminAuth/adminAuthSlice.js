import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminAuthApi } from "../../api/http";

export const bootstrapAdmin = createAsyncThunk(
  "adminAuth/bootstrap",
  async (_, { rejectWithValue }) => {
    try {
      const { admin } = await adminAuthApi.me();
      return admin;
    } catch (error) {
      if (error?.status === 401) return null;
      return rejectWithValue(
        error?.message || "Unable to check the admin session.",
      );
    }
  },
);

export const loginAdmin = createAsyncThunk(
  "adminAuth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { admin } = await adminAuthApi.login(username.trim(), password);
      return admin;
    } catch (error) {
      return rejectWithValue(error?.message || "Admin sign-in failed.");
    }
  },
);

export const logoutAdmin = createAsyncThunk("adminAuth/logout", async () => {
  await adminAuthApi.logout().catch(() => {});
});

const slice = createSlice({
  name: "adminAuth",
  initialState: {
    admin: null,
    status: "idle",
    initialized: false,
    error: null,
  },
  reducers: {
    clearAdminAuthError(state) {
      state.error = null;
    },
    // dispatched when any admin API call answers 401 (cookie expired)
    adminSessionExpired(state) {
      state.admin = null;
      state.initialized = true;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(bootstrapAdmin.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.initialized = true;
      })
      .addCase(bootstrapAdmin.rejected, (state, action) => {
        state.admin = null;
        state.initialized = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload;
        state.initialized = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.admin = null;
        state.initialized = true;
        state.error = action.payload || action.error.message;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.status = "idle";
        state.initialized = true;
        state.error = null;
      });
  },
});

export const { clearAdminAuthError, adminSessionExpired } = slice.actions;
export default slice.reducer;
