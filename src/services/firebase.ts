import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import messaging from "@react-native-firebase/messaging";
import functions from "@react-native-firebase/functions";

// Export functions instance for cloud function calls
export {functions};

// React Native Firebase automatically initializes from GoogleService-Info.plist
// But we need to ensure all services are ready
export const initializeFirebase = async () => {
  try {
    console.log("🔥 Initializing Firebase services...");

    // Wait for Firebase to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test basic connectivity
    const storageApp = storage();
    const authApp = auth();
    const firestoreApp = firestore();

    console.log("✅ Firebase services initialized successfully");
    console.log("📱 App name:", storageApp.app.name);
    console.log("🗄️ Storage bucket:", storageApp.app.options.storageBucket);
    console.log("🔐 Auth domain:", authApp.app.options.authDomain);

    // Check if auth domain is properly configured
    if (!authApp.app.options.authDomain) {
      console.warn(
        "⚠️ AUTH_DOMAIN not found in Firebase config - emails may not work"
      );
      console.log("💡 Expected auth domain: pet-hero-ai.firebaseapp.com");
    } else {
      console.log("✅ Auth domain configured:", authApp.app.options.authDomain);
    }

    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    return false;
  }
};

export const signInAnonymously = async () => {
  try {
    const userCredential = await auth().signInAnonymously();
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
};

export const createUserProfile = async (userId: string) => {
  try {
    await firestore().collection("users").doc(userId).set({
      credits: 1, // Give new users 1 free credits to start
      premium: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const doc = await firestore().collection("users").doc(userId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        credits: firestore.FieldValue.increment(credits),
      });
  } catch (error) {
    console.error("Error updating user credits:", error);
    throw error;
  }
};

// Interface for onboarding data
export interface OnboardingData {
  petPreference: "dog" | "cat" | "bird";
  petSpecies: string;
  petName: string;
  petAge: number;
  petWeight: string;
}

export const updateUserProfileWithOnboarding = async (
  userId: string,
  onboardingData: OnboardingData
) => {
  try {
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        ...onboardingData,
        onboardingCompleted: true,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    console.log(
      "✅ User profile updated with onboarding data:",
      onboardingData
    );
  } catch (error) {
    console.error(
      "❌ Error updating user profile with onboarding data:",
      error
    );
    throw error;
  }
};

export const getUserOnboardingData = async (
  userId: string
): Promise<OnboardingData | null> => {
  try {
    const doc = await firestore().collection("users").doc(userId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data?.onboardingCompleted) {
      return null;
    }

    // Return onboarding data if all required fields exist
    if (
      data.petPreference &&
      data.petSpecies &&
      data.petName &&
      data.petAge !== undefined &&
      data.petWeight
    ) {
      return {
        petPreference: data.petPreference,
        petSpecies: data.petSpecies,
        petName: data.petName,
        petAge: data.petAge,
        petWeight: data.petWeight,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting user onboarding data:", error);
    return null;
  }
};

export const uploadImage = async (uri: string, userId: string) => {
  try {
    console.log("📤 Starting image upload...", {uri, userId});

    // Check authentication first
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated for storage upload");
    }
    console.log("👤 User authenticated:", currentUser.uid);

    // Wait for temp file to be ready
    console.log("⏳ Waiting for temp file to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Initialize storage with explicit bucket
    const storageInstance = storage();
    console.log(
      "🗄️ Storage bucket:",
      storageInstance.app.options.storageBucket
    );

    // Detect file extension from URI
    const fileExtension = uri.toLowerCase().includes(".png") ? "png" : "jpg";
    const filename = `${userId}_${Date.now()}.${fileExtension}`;
    const reference = storageInstance.ref(`images/${filename}`);

    console.log("📂 Storage reference created:", `images/${filename}`);
    console.log("⬆️ Starting upload...");

    // Simple upload without event listeners to avoid race conditions
    console.log("⬆️ Starting Firebase Storage upload...");

    let snapshot: any;
    try {
      // Try upload with minimal metadata first
      snapshot = await reference.putFile(uri);
      console.log("✅ Upload completed successfully");
    } catch (uploadError: any) {
      console.error(
        "❌ Initial upload failed, trying with different metadata:",
        uploadError
      );

      // Retry with different approach - sometimes metadata causes issues
      try {
        snapshot = await reference.putFile(uri, {
          contentType: fileExtension === "png" ? "image/png" : "image/jpeg",
        });
        console.log("✅ Upload completed successfully on retry");
      } catch (retryError: any) {
        console.error("❌ Retry upload also failed:", retryError);

        // Check for specific error codes
        if (retryError.code === "storage/unauthorized") {
          throw new Error(
            "Storage access denied. Check Firebase Storage rules."
          );
        } else if (retryError.code === "storage/canceled") {
          throw new Error("Upload was canceled");
        } else if (retryError.code === "storage/quota-exceeded") {
          throw new Error("Storage quota exceeded");
        } else {
          throw new Error(
            `Upload failed: ${
              retryError.message || retryError.code || "Unknown error"
            }`
          );
        }
      }
    }

    console.log("📊 Upload completed:", {
      bytesTransferred: snapshot.bytesTransferred,
      totalBytes: snapshot.totalBytes,
      state: snapshot.state,
    });

    // Get download URL
    console.log("🔗 Getting download URL...");
    let downloadUrl: string;
    try {
      downloadUrl = await reference.getDownloadURL();
      console.log("✅ Download URL obtained:", downloadUrl);
    } catch (urlError) {
      console.error("❌ Failed to get download URL:", urlError);
      throw new Error(`Failed to get download URL: ${urlError}`);
    }

    return downloadUrl;
  } catch (error: any) {
    console.error("❌ Upload error:", error);

    // Log detailed error information
    console.error("❌ Error details:", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
    });

    // Log storage configuration
    console.error("🏗️ Storage config:", {
      appName: storage().app.name,
      bucket: storage().app.options.storageBucket,
      projectId: storage().app.options.projectId,
    });

    // Log auth state
    const user = auth().currentUser;
    console.error("👤 Auth state:", {
      isAnonymous: user?.isAnonymous,
      isAuthenticated: !!user,
      uid: user?.uid,
    });

    throw error;
  }
};

export const createPhotoRecord = async (
  userId: string,
  originalUrl: string
) => {
  try {
    const docRef = await firestore().collection("photos").add({
      userId,
      originalUrl,
      status: "processing",
      resultUrl: null,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating photo record:", error);
    throw error;
  }
};

export const getPhotoRecord = async (photoId: string) => {
  try {
    const doc = await firestore().collection("photos").doc(photoId).get();
    return doc.exists ? {id: doc.id, ...doc.data()} : null;
  } catch (error) {
    console.error("Error getting photo record:", error);
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
    console.error("Error setting up push notifications:", error);
    throw error;
  }
};

export const getUserPhotos = async (userId: string) => {
  try {
    const getUserPhotosFunction = functions().httpsCallable("getUserPhotos");
    const result = await getUserPhotosFunction({userId});
    return (result.data as any).photos || [];
  } catch (error) {
    console.error("Error getting user photos:", error);
    throw error;
  }
};
