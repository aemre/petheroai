import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserProfile } from '../../services/firebase';
import { UserProfileDTO, convertUserProfileToDTO } from '../../types/dto';

interface UserState {
  profile: UserProfileDTO | null;
  isLoading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  petPreference: 'dog' | 'cat' | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  onboardingCompleted: false,
  petPreference: null,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const profile = await getUserProfile(userId);
      return profile ? convertUserProfileToDTO(profile) : null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Note: All credit management is now handled by cloud functions:
// - Credits are deducted automatically when photo processing completes
// - Credits are added automatically when purchases are verified
// - No manual credit operations needed in the app

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfileDTO | null>) => {
      state.profile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    decrementCredits: (state) => {
      if (state.profile && state.profile.credits > 0) {
        state.profile.credits -= 1;
      }
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    setPetPreference: (state, action: PayloadAction<'dog' | 'cat'>) => {
      state.petPreference = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfile, clearError, decrementCredits, setOnboardingCompleted, setPetPreference } = userSlice.actions;
export default userSlice.reducer;