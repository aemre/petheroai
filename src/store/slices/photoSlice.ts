import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { uploadImage, createPhotoRecord, getPhotoRecord } from '../../services/firebase';

interface PhotoState {
  currentPhoto: {
    id: string;
    originalUrl: string;
    resultUrl: string | null;
    status: 'processing' | 'done' | 'error';
    createdAt?: string;
    processedAt?: string;
    theme?: string;
    analysis?: string;
    error?: string;
    userId?: string;
  } | null;
  isUploading: boolean;
  isProcessing: boolean;
  error: string | null;
}

const initialState: PhotoState = {
  currentPhoto: null,
  isUploading: false,
  isProcessing: false,
  error: null,
};

export const uploadAndProcessPhoto = createAsyncThunk(
  'photo/uploadAndProcess',
  async ({ uri, userId }: { uri: string; userId: string }, { rejectWithValue }) => {
    try {
      // Upload image to Firebase Storage
      const downloadUrl = await uploadImage(uri, userId);
      
      // Create photo record in Firestore
      const photoId = await createPhotoRecord(userId, downloadUrl);
      
      return {
        id: photoId,
        originalUrl: downloadUrl,
        resultUrl: null,
        status: 'processing' as const,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkPhotoStatus = createAsyncThunk(
  'photo/checkStatus',
  async (photoId: string, { rejectWithValue }) => {
    try {
      const photoData = await getPhotoRecord(photoId);
      if (photoData) {
        // Convert Firebase Timestamps to serializable format
        const serializedData = {
          ...photoData,
          createdAt: photoData.createdAt?.toDate?.() ? photoData.createdAt.toDate().toISOString() : photoData.createdAt,
          processedAt: photoData.processedAt?.toDate?.() ? photoData.processedAt.toDate().toISOString() : photoData.processedAt,
        };
        return serializedData;
      }
      return photoData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const photoSlice = createSlice({
  name: 'photo',
  initialState,
  reducers: {
    clearCurrentPhoto: (state) => {
      state.currentPhoto = null;
      state.isProcessing = false;
      state.error = null;
    },
    setProcessingStatus: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAndProcessPhoto.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadAndProcessPhoto.fulfilled, (state, action) => {
        state.isUploading = false;
        state.isProcessing = true;
        state.currentPhoto = action.payload;
      })
      .addCase(uploadAndProcessPhoto.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })
      .addCase(checkPhotoStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentPhoto = action.payload;
          if (action.payload.status === 'done' || action.payload.status === 'error') {
            state.isProcessing = false;
          }
        }
      });
  },
});

export const { clearCurrentPhoto, setProcessingStatus, clearError } = photoSlice.actions;
export default photoSlice.reducer;