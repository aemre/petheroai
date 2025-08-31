import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Simple test function to verify deployment works
export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: "Pet Hero AI Cloud Functions are working!",
    timestamp: new Date().toISOString()
  });
});

// Function to update FCM tokens (v1 API)
export const updateFCMToken = functions.https.onCall(async (data, context) => {
  const { token } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        fcmToken: token,
        tokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update FCM token');
  }
});
