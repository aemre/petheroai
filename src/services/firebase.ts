import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

// Export functions instance for cloud function calls
export { functions };

// React Native Firebase automatically initializes from GoogleService-Info.plist
// But we need to ensure all services are ready
export const initializeFirebase = async () => {
  try {
    console.log('🔥 Initializing Firebase services...');
    
    // Wait for Firebase to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test basic connectivity
    const storageApp = storage();
    const authApp = auth();
    const firestoreApp = firestore();
    
    console.log('✅ Firebase services initialized successfully');
    console.log('📱 App name:', storageApp.app.name);
    console.log('🗄️ Storage bucket:', storageApp.app.options.storageBucket);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
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
      credits: 3, // Give new users 3 free credits to start
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
    console.log('📤 Starting FILE-READY upload...', { uri, userId });
    
    // Check authentication first
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated for storage upload');
    }
    console.log('👤 User authenticated:', currentUser.uid);
    
    // CRITICAL: Wait for temp file to be fully written by iOS
    // This is the likely root cause - temp files need time to be accessible
    console.log('⏳ Waiting for temp file to be ready...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    // Verify file is accessible
    console.log('🔍 Verifying file accessibility...');
    try {
      const response = await fetch(uri);
      console.log('✅ File is accessible, content-length:', response.headers.get('content-length'));
    } catch (fileError) {
      console.error('❌ File not accessible:', fileError);
      throw new Error('Temporary file not ready for upload');
    }
    
    // Simple upload without retry - should work now
    const filename = `image_${Date.now()}.jpg`;
    const reference = storage().ref(`images/${filename}`);
    
    console.log('📂 Storage reference created:', `images/${filename}`);
    console.log('⬆️ Starting direct upload...');
    
    const uploadTask = reference.putFile(uri);
    const snapshot = await uploadTask;
    
    console.log('📊 Final snapshot:', {
      bytesTransferred: snapshot.bytesTransferred,
      totalBytes: snapshot.totalBytes,
      state: snapshot.state,
    });
    
    // Get download URL directly
    console.log('🔗 Getting download URL...');
    const downloadUrl = await reference.getDownloadURL();
    
    console.log('✅ Download URL obtained successfully:', downloadUrl);
    return downloadUrl;
    
  } catch (error: any) {
    console.error('❌ DETAILED ERROR ANALYSIS:');
    console.error('❌ Error object:', error);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error toString:', error?.toString());
    
    // Log storage configuration
    console.error('🏗️ Storage config:', {
      bucket: storage().app.options.storageBucket,
      projectId: storage().app.options.projectId,
      appName: storage().app.name,
    });
    
    // Log auth state
    const user = auth().currentUser;
    console.error('👤 Auth state:', {
      isAuthenticated: !!user,
      uid: user?.uid,
      isAnonymous: user?.isAnonymous,
    });
    
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