import { functions } from './firebase';

// Note: Credit deduction and refunding are now handled automatically by cloud functions
// These functions are no longer needed in the app since credits are managed server-side

// Cloud function to verify purchases securely
export const verifyPurchase = async (receipt: string, productId: string, platform: 'ios' | 'android') => {
  try {
    const verifyPurchaseFunc = functions().httpsCallable('verifyPurchase');
    const result = await verifyPurchaseFunc({ receipt, productId, platform });
    return result.data as {
      success: boolean;
      credits: number;
      message: string;
    };
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    throw new Error(error.message || 'Failed to verify purchase');
  }
};

// Note: addCreditsToUser is now only available as a cloud function for admin use

// Cloud function to securely delete a user's photo
export const deleteUserPhoto = async (photoId: string) => {
  try {
    const deletePhotoFunc = functions().httpsCallable('deleteUserPhoto');
    const result = await deletePhotoFunc({ photoId });
    return result.data as {
      success: boolean;
      message: string;
    };
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    throw new Error(error.message || 'Failed to delete photo');
  }
};
// App should not directly add credits - only through verified purchases

// Cloud function to get user info
export const getUserInfo = async (userId: string) => {
  try {
    const getUserInfoFunc = functions().httpsCallable('getUserInfo');
    const result = await getUserInfoFunc({ userId });
    return result.data as {
      exists: boolean;
      userData?: {
        credits: number;
        premium: boolean;
        createdAt: Date | null;
        lastUpdated: Date | null;
      };
      message?: string;
    };
  } catch (error: any) {
    console.error('Error getting user info:', error);
    throw new Error(error.message || 'Failed to get user info');
  }
};

// Cloud function to get user photos
export const getUserPhotos = async (userId: string) => {
  try {
    const getUserPhotosFunc = functions().httpsCallable('getUserPhotos');
    const result = await getUserPhotosFunc({ userId });
    return result.data as {
      photos: Array<{
        id: string;
        originalUrl: string;
        resultUrl: string;
        theme: string;
        status: string;
        createdAt: string;
        analysis?: any;
        error?: string;
      }>;
      total: number;
    };
  } catch (error: any) {
    console.error('Error getting user photos:', error);
    throw new Error(error.message || 'Failed to get user photos');
  }
};
