// Mock Firebase services for Expo Go compatibility
// This file provides mock implementations when native Firebase modules are not available

export const initializeFirebase = () => {
  console.log('Mock Firebase initialized');
  return Promise.resolve();
};

export const signInAnonymously = async () => {
  console.log('Mock anonymous sign-in');
  return Promise.resolve({
    uid: 'mock-user-' + Date.now(),
    isAnonymous: true
  });
};

export const createUserProfile = async (userId: string) => {
  console.log('Mock user profile created for:', userId);
  return Promise.resolve();
};

export const getUserProfile = async (userId: string) => {
  console.log('Mock get user profile for:', userId);
  return Promise.resolve({
    credits: 5,
    premium: false,
    createdAt: new Date()
  });
};

export const updateUserCredits = async (userId: string, credits: number) => {
  console.log('Mock update credits:', userId, credits);
  return Promise.resolve();
};

export const uploadImage = async (uri: string, userId: string) => {
  console.log('Mock image upload:', uri, userId);
  // Return mock URL
  return Promise.resolve('https://example.com/mock-image.jpg');
};

export const createPhotoRecord = async (userId: string, originalUrl: string) => {
  console.log('Mock photo record created:', userId, originalUrl);
  return Promise.resolve('mock-photo-id-' + Date.now());
};

export const getPhotoRecord = async (photoId: string) => {
  console.log('Mock get photo record:', photoId);
  return Promise.resolve({
    id: photoId,
    userId: 'mock-user',
    originalUrl: 'https://example.com/original.jpg',
    resultUrl: 'https://example.com/result.jpg',
    status: 'done' as const,
    createdAt: new Date()
  });
};

export const setupPushNotifications = async () => {
  console.log('Mock push notifications setup');
  return Promise.resolve('mock-fcm-token');
};