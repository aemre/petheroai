import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { signInAnonymously, createUserProfile, getUserProfile } from '../../services/firebaseMock';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false, // Changed to false for immediate demo
  isAuthenticated: false,
  error: null,
};

export const signInAnonymouslyThunk = createAsyncThunk(
  'auth/signInAnonymously',
  async (_, { rejectWithValue }) => {
    try {
      const user = await signInAnonymously();
      
      // Check if user profile exists, if not create one
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user.uid);
      }
      
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    signOut: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInAnonymouslyThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInAnonymouslyThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signInAnonymouslyThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearError, signOut } = authSlice.actions;
export default authSlice.reducer;