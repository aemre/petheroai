import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

// React Native Firebase automatically initializes from GoogleService-Info.plist
// No manual initialization needed
export const initializeFirebase = () => {
  console.log('Firebase initialized from GoogleService-Info.plist');
  return true;
};

export const signInAnonymously = async () => {
  try {
    const userCredential = await auth().signInAnonymously();
    return userCredential.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export const createUserProfile = async (userId: string) => {
  try {
    await firestore().collection('users').doc(userId).set({
      credits: 0,
      premium: false,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const doc = await firestore().collection('users').doc(userId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    await firestore().collection('users').doc(userId).update({
      credits: firestore.FieldValue.increment(credits)
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
};

export const uploadImage = async (uri: string, userId: string) => {
  try {
    const filename = `${userId}_${Date.now()}.jpg`;
    const reference = storage().ref(`images/${filename}`);
    await reference.putFile(uri);
    const downloadUrl = await reference.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const createPhotoRecord = async (userId: string, originalUrl: string) => {
  try {
    const docRef = await firestore().collection('photos').add({
      userId,
      originalUrl,
      status: 'processing',
      resultUrl: null,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating photo record:', error);
    throw error;
  }
};

export const getPhotoRecord = async (photoId: string) => {
  try {
    const doc = await firestore().collection('photos').doc(photoId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error getting photo record:', error);
    throw error;
  }
};

export const setupPushNotifications = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      return token;
    }
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    throw error;
  }
};

export const getUserPhotos = async (userId: string) => {
  try {
    const getUserPhotosFunction = functions().httpsCallable('getUserPhotos');
    const result = await getUserPhotosFunction({ userId });
    return (result.data as any).photos || [];
  } catch (error) {
    console.error('Error getting user photos:', error);
    throw error;
  }
};