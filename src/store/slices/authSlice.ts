import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit";
import {
  signInAnonymously,
  createUserProfile,
  getUserProfile,
} from "../../services/firebase";
import {UserDTO, convertFirebaseUserToDTO} from "../../types/dto";

interface AuthState {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

export const checkAuthStateThunk = createAsyncThunk(
  "auth/checkAuthState",
  async (_, {rejectWithValue}) => {
    try {
      const auth = await import("@react-native-firebase/auth");
      const currentUser = auth.default().currentUser;

      if (currentUser) {
        // User is already authenticated, return existing user
        console.log("Found existing authenticated user:", {
          uid: currentUser.uid,
          email: currentUser.email,
          isAnonymous: currentUser.isAnonymous,
        });

        // Check if user profile exists, if not create one
        const existingProfile = await getUserProfile(currentUser.uid);
        if (!existingProfile) {
          await createUserProfile(currentUser.uid);
        }

        return convertFirebaseUserToDTO(currentUser);
      } else {
        // No authenticated user, sign in anonymously
        console.log("No authenticated user found, signing in anonymously");
        const user = await signInAnonymously();

        // Check if user profile exists, if not create one
        const existingProfile = await getUserProfile(user.uid);
        if (!existingProfile) {
          await createUserProfile(user.uid);
        }

        return convertFirebaseUserToDTO(user);
      }
    } catch (error: any) {
      console.error("Auth state check error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const signInAnonymouslyThunk = createAsyncThunk(
  "auth/signInAnonymously",
  async (_, {rejectWithValue}) => {
    try {
      const user = await signInAnonymously();

      // Check if user profile exists, if not create one
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user.uid);
      }

      return convertFirebaseUserToDTO(user);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserDTO | null>) => {
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
      .addCase(checkAuthStateThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStateThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuthStateThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
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

export const {setUser, clearError, signOut} = authSlice.actions;
export default authSlice.reducer;
