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
exports.handleSubscriptionUpdate = exports.verifyPurchase = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Cloud function to verify in-app purchases
exports.verifyPurchase = functions.https.onCall(async (data, context) => {
    var _a;
    const { receipt, productId, platform } = data;
    const userId = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    console.log(`💳 Verifying purchase for user ${userId}, product: ${productId}, platform: ${platform}`);
    try {
        // Verify the purchase receipt with Apple/Google
        let isValid = false;
        let credits = 0;
        if (platform === 'ios') {
            isValid = await verifyAppleReceipt(receipt, productId);
        }
        else if (platform === 'android') {
            isValid = await verifyGooglePlayReceipt(receipt, productId);
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid platform specified');
        }
        if (isValid) {
            // Determine credits based on product ID
            credits = getCreditsForProduct(productId);
            if (credits === 0) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid product ID');
            }
            // Update user's credits
            await admin.firestore()
                .collection('users')
                .doc(userId)
                .update({
                credits: admin.firestore.FieldValue.increment(credits),
                lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Log the purchase for analytics and fraud prevention
            await admin.firestore()
                .collection('purchases')
                .add({
                userId,
                productId,
                credits,
                receipt: receipt.substring(0, 50) + '...', // Store partial receipt for debugging
                platform,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'verified',
            });
            console.log(`✅ Purchase verified: ${credits} credits added to user ${userId}`);
        }
        else {
            // Log failed verification attempt
            await admin.firestore()
                .collection('purchases')
                .add({
                userId,
                productId,
                receipt: 'verification_failed',
                platform,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'failed',
                error: 'Receipt verification failed',
            });
            console.log(`❌ Purchase verification failed for user ${userId}`);
        }
        return {
            success: isValid,
            credits: isValid ? credits : 0,
            message: isValid ? 'Purchase verified successfully' : 'Purchase verification failed'
        };
    }
    catch (error) {
        console.error('💳 Error verifying purchase:', error);
        // Log the error
        await admin.firestore()
            .collection('purchases')
            .add({
            userId,
            productId,
            receipt: 'error_occurred',
            platform,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw new functions.https.HttpsError('internal', 'Purchase verification failed');
    }
});
function getCreditsForProduct(productId) {
    const productCredits = {
        // Basic credit packages
        'com.pethero.credits5': 5,
        'com.pethero.credits10': 10,
        'com.pethero.credits20': 20,
        'com.pethero.credits50': 50,
        // Premium packages
        'com.pethero.premium_monthly': 100,
        'com.pethero.premium_yearly': 1200,
        // Special offers
        'com.pethero.starter_pack': 15,
        'com.pethero.hero_bundle': 35,
    };
    return productCredits[productId] || 0;
}
async function verifyAppleReceipt(receipt, productId) {
    var _a, _b;
    try {
        // Apple Receipt Validation
        // Documentation: https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
        const receiptData = {
            'receipt-data': receipt,
            'password': ((_a = functions.config().apple) === null || _a === void 0 ? void 0 : _a.shared_secret) || process.env.APPLE_SHARED_SECRET || '',
            'exclude-old-transactions': true
        };
        // Try production first, then sandbox
        let response = await verifyWithApple(receiptData, false);
        // If production fails with status 21007, try sandbox
        if (response.status === 21007) {
            console.log('🧪 Trying Apple sandbox environment');
            response = await verifyWithApple(receiptData, true);
        }
        if (response.status === 0 && ((_b = response.receipt) === null || _b === void 0 ? void 0 : _b.in_app)) {
            // Check if the specific product was purchased
            const purchases = response.receipt.in_app;
            const matchingPurchase = purchases.find((purchase) => purchase.product_id === productId);
            if (matchingPurchase) {
                console.log(`✅ Apple receipt verified for product ${productId}`);
                return true;
            }
        }
        console.log(`❌ Apple receipt verification failed. Status: ${response.status}`);
        return false;
    }
    catch (error) {
        console.error('Apple receipt verification error:', error);
        return false;
    }
}
async function verifyWithApple(receiptData, sandbox) {
    const url = sandbox
        ? 'https://sandbox.itunes.apple.com/verifyReceipt'
        : 'https://buy.itunes.apple.com/verifyReceipt';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
    });
    return await response.json();
}
async function verifyGooglePlayReceipt(receipt, productId) {
    try {
        // Google Play Receipt Validation
        // Would require Google Play Developer API setup
        // Documentation: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases/products/get
        // For now, implement basic validation
        // In production, you would:
        // 1. Use Google Play Developer API
        // 2. Verify the purchase token
        // 3. Check purchase state and consumption state
        // 4. Validate the package name and product ID
        console.log(`🤖 Google Play verification not fully implemented yet for ${productId}`);
        // Placeholder implementation - in production, replace with actual Google Play API calls
        if (receipt && receipt.length > 10 && productId) {
            console.log(`✅ Google Play receipt basic validation passed for ${productId}`);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Google Play receipt verification error:', error);
        return false;
    }
}
// Function to handle subscription status updates from Apple/Google
exports.handleSubscriptionUpdate = functions.https.onRequest(async (req, res) => {
    try {
        const { platform, data } = req.body;
        if (platform === 'apple') {
            // Handle Apple App Store Server Notifications
            // Documentation: https://developer.apple.com/documentation/appstoreservernotifications
            await handleAppleSubscriptionNotification(data);
        }
        else if (platform === 'google') {
            // Handle Google Play Real-time Developer Notifications
            // Documentation: https://developer.android.com/google/play/billing/rtdn-reference
            await handleGoogleSubscriptionNotification(data);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Subscription update error:', error);
        res.status(500).send('Error processing subscription update');
    }
});
async function handleAppleSubscriptionNotification(data) {
    // Handle Apple subscription lifecycle events
    console.log('🍎 Apple subscription notification:', data);
}
async function handleGoogleSubscriptionNotification(data) {
    // Handle Google Play subscription lifecycle events  
    console.log('🤖 Google Play subscription notification:', data);
}
//# sourceMappingURL=purchases.js.map