import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin function to add credits to a user (for testing)
export const addCreditsToUser = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, credits } = data;
  
  // Users can only add credits to their own account
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Users can only add credits to their own account');
  }
  
  if (!userId || typeof credits !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'userId and credits are required');
  }

  try {
    // Get current user data
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user if doesn't exist
      await userRef.set({
        credits: credits,
        premium: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Created new user ${userId} with ${credits} credits`);
      return { 
        success: true, 
        message: `Created new user with ${credits} credits`,
        totalCredits: credits 
      };
    } else {
      // Add credits to existing user
      const currentData = userDoc.data();
      const currentCredits = currentData?.credits || 0;
      const newTotal = currentCredits + credits;
      
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(credits),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Added ${credits} credits to user ${userId}. New total: ${newTotal}`);
      return { 
        success: true, 
        message: `Added ${credits} credits. New total: ${newTotal}`,
        totalCredits: newTotal 
      };
    }
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add credits');
  }
});

// Admin function to get user info (for testing)
export const getUserInfo = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  // Users can only access their own info
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Users can only access their own info');
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { 
        exists: false, 
        message: 'User not found' 
      };
    }
    
    const userData = userDoc.data();
    console.log(`📊 User ${userId} info:`, userData);
    
    return {
      exists: true,
      userData: {
        credits: userData?.credits || 0,
        premium: userData?.premium || false,
        createdAt: userData?.createdAt?.toDate?.() || null,
        lastUpdated: userData?.lastUpdated?.toDate?.() || null,
      }
    };
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get user info');
  }
});

// Admin function to list all users (DISABLED for security)
export const listAllUsers = functions.https.onCall(async (data, context) => {
  // This function is disabled for security - users should not see other users
  throw new functions.https.HttpsError('permission-denied', 'This function is not available for security reasons');
  
  /*try {
    const usersSnapshot = await admin.firestore().collection('users').limit(10).get();
    const users: any[] = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        userId: doc.id,
        credits: userData.credits || 0,
        premium: userData.premium || false,
        createdAt: userData.createdAt?.toDate?.() || null,
      });
    });
    
    console.log(`📋 Found ${users.length} users`);
    return { users, total: users.length };
  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to list users');
  }*/
});

// Function to get user's photo gallery
export const getUserPhotos = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  // Users can only access their own photos
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Users can only access their own photos');
  }

  try {
    let photosSnapshot;
    
    try {
      // Try the optimized query with index first
      photosSnapshot = await admin.firestore()
        .collection('photos')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50) // Limit to last 50 photos
        .get();
    } catch (indexError: any) {
      console.warn('⚠️ Index not ready, falling back to simpler query:', indexError.message);
      
      // Fallback: query without orderBy if index isn't ready yet
      photosSnapshot = await admin.firestore()
        .collection('photos')
        .where('userId', '==', userId)
        .limit(50)
        .get();
    }
    
    const photos: any[] = [];
    
    photosSnapshot.forEach(doc => {
      const photoData = doc.data();
      photos.push({
        id: doc.id,
        originalUrl: photoData.originalUrl,
        resultUrl: photoData.resultUrl || photoData.originalUrl,
        theme: photoData.theme || 'Unknown Theme',
        status: photoData.status || 'processing',
        createdAt: photoData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        analysis: photoData.analysis,
        error: photoData.error,
      });
    });
    
    // Sort by createdAt in JavaScript if we couldn't use orderBy
    if (photos.length > 0) {
      photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    console.log(`📸 Found ${photos.length} photos for user ${userId}`);
    return { photos, total: photos.length };
  } catch (error) {
    console.error('❌ Error getting user photos:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get user photos');
  }
});
