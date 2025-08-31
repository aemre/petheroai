// Data Transfer Objects for Redux state serialization

export interface UserDTO {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  phoneNumber: string | null;
  providerId: string;
  creationTime: number;
  lastSignInTime: number;
}

export interface UserProfileDTO {
  credits: number;
  premium: boolean;
  createdAt: number; // Unix timestamp in seconds
}

export interface PhotoRecordDTO {
  id: string;
  userId: string;
  originalUrl: string;
  resultUrl: string | null;
  status: 'processing' | 'completed' | 'failed';
  createdAt: number; // Unix timestamp in seconds
}

// Utility functions to convert Firebase objects to DTOs
export const convertFirebaseUserToDTO = (user: any): UserDTO => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    phoneNumber: user.phoneNumber,
    providerId: user.providerId,
    creationTime: user.metadata?.creationTime || Date.now(),
    lastSignInTime: user.metadata?.lastSignInTime || Date.now(),
  };
};

export const convertFirebaseTimestampToNumber = (timestamp: any): number => {
  if (timestamp && typeof timestamp === 'object') {
    // Firestore Timestamp object
    if (timestamp.seconds !== undefined) {
      return timestamp.seconds;
    }
    // Date object
    if (timestamp.getTime) {
      return Math.floor(timestamp.getTime() / 1000);
    }
  }
  // Already a number or string
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return Math.floor(new Date(timestamp).getTime() / 1000);
  }
  // Fallback to current time
  return Math.floor(Date.now() / 1000);
};

export const convertUserProfileToDTO = (profile: any): UserProfileDTO => {
  return {
    credits: profile.credits || 0,
    premium: profile.premium || false,
    createdAt: convertFirebaseTimestampToNumber(profile.createdAt),
  };
};

export const convertPhotoRecordToDTO = (record: any, id: string): PhotoRecordDTO => {
  return {
    id,
    userId: record.userId,
    originalUrl: record.originalUrl,
    resultUrl: record.resultUrl || null,
    status: record.status || 'processing',
    createdAt: convertFirebaseTimestampToNumber(record.createdAt),
  };
};
