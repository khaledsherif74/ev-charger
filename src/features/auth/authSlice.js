import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../api/http";

export const bootstrapSession = createAsyncThunk(
  "auth/bootstrapSession",
  async (_, { rejectWithValue }) => {
    try {
      const { user } = await authApi.me();
      return user;
    } catch (error) {
      if (error?.status === 401) return null;
      return rejectWithValue(
        error?.message || "Unable to restore the session.",
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      await authApi.signup(name.trim(), email.trim(), password);
      return (await authApi.me()).user;
    } catch (error) {
      return rejectWithValue(error?.message || "Registration failed.");
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await authApi.login(email.trim(), password);
      return (await authApi.me()).user;
    } catch (error) {
      return rejectWithValue(error?.message || "Sign-in failed.");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await authApi.logout().catch(() => {});
});

const initialState = {
  user: null,
  status: "idle",
  initialized: false,
  error: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.initialized = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(bootstrapSession.rejected, (state, action) => {
        state.status = "failed";
        state.initialized = true;
        state.user = null;
        state.error = action.payload || action.error.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.initialized = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.initialized = true;
        state.user = null;
        state.error = action.payload || action.error.message;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.initialized = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.initialized = true;
        state.user = null;
        state.error = action.payload || action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "idle";
        state.initialized = true;
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearAuthError } = slice.actions;
export default slice.reducer;
