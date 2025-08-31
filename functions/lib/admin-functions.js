"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPhotos = exports.listAllUsers = exports.getUserInfo = exports.addCreditsToUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Admin function to add credits to a user (for testing)
exports.addCreditsToUser = functions.https.onCall(async (data, context) => {
    const { userId, credits } = data;
    // In production, you'd want authentication checks here
    // For testing, we'll allow it
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
        }
        else {
            // Add credits to existing user
            const currentData = userDoc.data();
            const currentCredits = (currentData === null || currentData === void 0 ? void 0 : currentData.credits) || 0;
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
    }
    catch (error) {
        console.error('❌ Error adding credits:', error);
        throw new functions.https.HttpsError('internal', 'Failed to add credits');
    }
});
// Admin function to get user info (for testing)
exports.getUserInfo = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
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
                credits: (userData === null || userData === void 0 ? void 0 : userData.credits) || 0,
                premium: (userData === null || userData === void 0 ? void 0 : userData.premium) || false,
                createdAt: ((_b = (_a = userData === null || userData === void 0 ? void 0 : userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || null,
                lastUpdated: ((_d = (_c = userData === null || userData === void 0 ? void 0 : userData.lastUpdated) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) || null,
            }
        };
    }
    catch (error) {
        console.error('❌ Error getting user info:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user info');
    }
});
// Admin function to list all users (for testing)
exports.listAllUsers = functions.https.onCall(async (data, context) => {
    try {
        const usersSnapshot = await admin.firestore().collection('users').limit(10).get();
        const users = [];
        usersSnapshot.forEach(doc => {
            var _a, _b;
            const userData = doc.data();
            users.push({
                userId: doc.id,
                credits: userData.credits || 0,
                premium: userData.premium || false,
                createdAt: ((_b = (_a = userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || null,
            });
        });
        console.log(`📋 Found ${users.length} users`);
        return { users, total: users.length };
    }
    catch (error) {
        console.error('❌ Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Failed to list users');
    }
});
// Function to get user's photo gallery
exports.getUserPhotos = functions.https.onCall(async (data, context) => {
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
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
        }
        catch (indexError) {
            console.warn('⚠️ Index not ready, falling back to simpler query:', indexError.message);
            // Fallback: query without orderBy if index isn't ready yet
            photosSnapshot = await admin.firestore()
                .collection('photos')
                .where('userId', '==', userId)
                .limit(50)
                .get();
        }
        const photos = [];
        photosSnapshot.forEach(doc => {
            var _a, _b, _c;
            const photoData = doc.data();
            photos.push({
                id: doc.id,
                originalUrl: photoData.originalUrl,
                resultUrl: photoData.resultUrl || photoData.originalUrl,
                theme: photoData.theme || 'Unknown Theme',
                status: photoData.status || 'processing',
                createdAt: ((_c = (_b = (_a = photoData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString(),
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
    }
    catch (error) {
        console.error('❌ Error getting user photos:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user photos');
    }
});
//# sourceMappingURL=admin-functions.js.map