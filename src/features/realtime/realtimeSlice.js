import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'realtime',
  initialState: { connected: false, lastStatusEventAt: null },
  reducers: {
    socketConnected(state) {
      state.connected = true;
    },
    socketDisconnected(state) {
      state.connected = false;
    },
    statusEventReceived(state) {
      state.lastStatusEventAt = new Date().toISOString();
    },
  },
});

export const { socketConnected, socketDisconnected, statusEventReceived } = slice.actions;
export default slice.reducer;
