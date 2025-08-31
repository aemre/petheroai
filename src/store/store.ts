import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import photoSlice from './slices/photoSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    photo: photoSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Now with DTOs, we only need to ignore a few specific actions if needed
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;