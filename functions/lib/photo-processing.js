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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPhotoUpload = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const heroThemes = [
    'superhero with cape flying through the sky',
    'medieval knight in shining armor',
    'space astronaut exploring distant planets',
    'fantasy wizard casting magical spells',
    'pirate captain sailing the seven seas',
    'ninja warrior in stealth mode',
    'cowboy sheriff in the wild west',
    'ancient gladiator in the colosseum',
    'steampunk inventor with mechanical gadgets',
    'cyber warrior in a futuristic world',
    'royal king or queen with crown and robe',
    'detective with magnifying glass and coat',
    'firefighter hero saving the day',
    'arctic explorer in winter gear',
    'jungle adventurer with safari equipment'
];
const getRandomTheme = () => {
    return heroThemes[Math.floor(Math.random() * heroThemes.length)];
};
// Initialize Gemini AI
const genAI = new genai_1.GoogleGenAI({
    apiKey: ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.GEMINI_API_KEY || ''
});
// Rate limiting and retry logic for Gemini AI
async function analyzeWithGeminiAI(base64Image, heroTheme) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const analysisPrompt = `Describe this image for ${heroTheme} transformation. Keep all faces same, add only costumes.`;
    // Try with the image model first, then fallback to text-only
    const models = [
        'gemini-2.5-flash-image-preview',
        'gemini-1.5-flash', // Fallback to text-only model
    ];
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const isImageModel = model.includes('image');
        try {
            console.log(`🤖 Trying model: ${model}`);
            const prompt = isImageModel ? [
                { text: analysisPrompt },
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image,
                    },
                },
            ] : [
                { text: `${analysisPrompt}\n\nNote: Unable to analyze the actual image, but create a creative description for a ${heroTheme} transformation. IMPORTANT: Emphasize preserving original faces and features while adding heroic elements around them.` }
            ];
            const response = await genAI.models.generateContent({
                model,
                contents: prompt,
            });
            if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
                throw new Error('Invalid response from Gemini AI');
            }
            const analysisText = response.candidates[0].content.parts[0].text;
            if (!analysisText) {
                throw new Error('No text response from Gemini AI');
            }
            console.log(`✅ Successfully used model: ${model}`);
            return analysisText;
        }
        catch (error) {
            console.warn(`⚠️ Model ${model} failed:`, error.message);
            // Check if it's a rate limit error
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('429')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('quota')) || ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('RESOURCE_EXHAUSTED'))) {
                console.log(`⏰ Rate limited on ${model}, trying next model or fallback...`);
                // If this is the last model, wait and retry once more
                if (i === models.length - 1) {
                    console.log(`⏳ Waiting 20 seconds before final retry...`);
                    await new Promise(resolve => setTimeout(resolve, 20000));
                    try {
                        // Final retry with simple text model
                        const simplePrompt = [
                            { text: `Create a heroic ${heroTheme} description for a pet transformation. Be creative and vivid!` }
                        ];
                        const retryResponse = await genAI.models.generateContent({
                            model: 'gemini-1.5-flash',
                            contents: simplePrompt,
                        });
                        if ((_h = (_g = (_f = (_e = (_d = retryResponse.candidates) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.parts) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.text) {
                            console.log(`✅ Final retry successful`);
                            return retryResponse.candidates[0].content.parts[0].text;
                        }
                    }
                    catch (retryError) {
                        console.error('Final retry also failed:', retryError);
                    }
                }
            }
            else {
                // For non-rate-limit errors, continue to next model
                console.log(`❌ Non-rate-limit error on ${model}, trying next...`);
            }
            // Continue to next model
            continue;
        }
    }
    // If all models fail, return a creative placeholder
    console.warn('🎭 All Gemini models failed, using creative placeholder');
    return generateCreativePlaceholder(heroTheme);
}
function generateCreativePlaceholder(heroTheme) {
    const creativeDescriptions = {
        'superhero with cape flying through the sky': 'This magnificent pet transforms into a caped crusader soaring through cotton candy clouds. Their flowing cape ripples in the wind as they patrol the skies with determined eyes and a heroic stance, ready to save the day with their incredible powers. Any human companions stand proudly below, cheering on their heroic pet friend.',
        'medieval knight in shining armor': 'Behold this noble pet warrior, adorned in gleaming silver armor that reflects the golden sunlight. Their brave stance and loyal expression speak of countless battles fought for honor and justice, with a mighty sword at their side. Their human companions serve as loyal squires, supporting their valiant pet knight.',
        'space astronaut exploring distant planets': 'This cosmic pet explorer ventures boldly into the star-filled void, their sleek space suit gleaming against the backdrop of alien worlds. Curiosity and wonder shine in their eyes as they discover new frontiers.',
        'fantasy wizard casting magical spells': 'A mystical pet mage channels ancient powers, their robes shimmering with arcane energy. Sparkling magic swirls around them as they weave spells of wonder, their wise eyes holding secrets of the magical realm.',
        'pirate captain sailing the seven seas': 'This swashbuckling pet captain commands their vessel with fearless determination, tricorn hat askew and coat billowing in the ocean breeze. Adventure calls from every horizon as they navigate treacherous waters.',
        'ninja warrior in stealth mode': 'Silent as shadow, this pet ninja moves with deadly grace through moonlit rooftops. Their dark attire blends with the night as they master the ancient arts of stealth and precision.',
        'cowboy sheriff in the wild west': 'This frontier pet lawkeeper stands tall in dusty boots and weathered hat, badge gleaming in the desert sun. With steely resolve, they maintain peace in the untamed wilderness.',
        'ancient gladiator in the colosseum': 'A warrior pet stands proud in the arena, battle-tested armor bearing the marks of victory. Their courageous spirit echoes through the ancient stones as crowds cheer their legendary prowess.',
        'steampunk inventor with mechanical gadgets': 'This ingenious pet tinkerer surrounds themselves with brass gears and steam-powered contraptions. Their workshop buzzes with Victorian-era innovation and creative mechanical marvels.',
        'cyber warrior in a futuristic world': 'Enhanced with digital augmentations, this pet guardian protects the digital realm. Neon lights pulse across their high-tech armor as they navigate the cyber landscape with enhanced abilities.',
    };
    return creativeDescriptions[heroTheme] ||
        `This amazing pet embodies the spirit of ${heroTheme}, keeping their original adorable face and features while gaining heroic armor and accessories that transform them into a powerful hero. Their expressive eyes and recognizable features remain unchanged, now enhanced by epic ${heroTheme} elements. Any humans in the scene keep their original faces and appearances while gaining complementary heroic costumes as loyal companions supporting their beloved pet hero.`;
}
exports.processPhotoUpload = functions.firestore
    .document('photos/{photoId}')
    .onCreate(async (snap, context) => {
    var _a;
    const photoId = context.params.photoId;
    const photoData = snap.data();
    console.log(`🎯 Starting photo processing for ${photoId}`);
    try {
        // Download the original image
        console.log(`📥 Downloading image from: ${photoData.originalUrl}`);
        const imageResponse = await axios_1.default.get(photoData.originalUrl, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 second timeout
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        console.log(`✅ Image downloaded, size: ${imageBuffer.length} bytes`);
        // Process image with Sharp (resize/optimize)
        const processedImageBuffer = await (0, sharp_1.default)(imageBuffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
        console.log(`🖼️ Image processed, new size: ${processedImageBuffer.length} bytes`);
        // Convert to base64 for Gemini API
        const base64Image = processedImageBuffer.toString('base64');
        // Get random hero theme
        const heroTheme = getRandomTheme();
        console.log(`🎭 Selected theme: ${heroTheme}`);
        // Check if Gemini AI is available
        if (!genAI || !((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.api_key)) {
            console.warn('⚠️ Gemini AI not configured, using placeholder analysis');
            const placeholderAnalysis = `This adorable pet would make an amazing ${heroTheme}! With their expressive eyes and natural charisma, they're perfect for this heroic transformation.`;
            await updatePhotoResult(photoId, photoData.originalUrl, heroTheme, placeholderAnalysis);
            await sendNotification(photoData.userId, photoId);
            return;
        }
        // Analyze pet with Gemini AI (with rate limiting and fallbacks)
        console.log(`🤖 Analyzing pet with Gemini AI...`);
        const analysisText = await analyzeWithGeminiAI(base64Image, heroTheme);
        console.log(`✅ Analysis completed: ${analysisText.substring(0, 200)}...`);
        // For now, we'll use the original image as the result since we don't have 
        // an actual image generation API integrated yet
        // In production, you would integrate with:
        // - OpenAI DALL-E 3 API
        // - Stability AI SDXL
        // - Midjourney API (when available)
        // - Google Imagen API
        // - Replicate.com models
        const resultImageUrl = await generateHeroImage(photoData.originalUrl, heroTheme, analysisText);
        // Update Firestore with the result
        await updatePhotoResult(photoId, resultImageUrl, heroTheme, analysisText);
        // Send push notification
        await sendNotification(photoData.userId, photoId);
        console.log(`🎉 Successfully processed photo ${photoId}`);
    }
    catch (error) {
        console.error(`❌ Error processing photo ${photoId}:`, error);
        // Update Firestore with error status
        await admin.firestore()
            .collection('photos')
            .doc(photoId)
            .update({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Still send notification about completion (with error)
        try {
            await sendNotification(photoData.userId, photoId, true);
        }
        catch (notificationError) {
            console.error('Failed to send error notification:', notificationError);
        }
    }
});
async function updatePhotoResult(photoId, resultUrl, theme, analysis) {
    try {
        // Get the photo document to find the userId
        const photoDoc = await admin.firestore()
            .collection('photos')
            .doc(photoId)
            .get();
        if (!photoDoc.exists) {
            throw new Error(`Photo document ${photoId} not found`);
        }
        const photoData = photoDoc.data();
        const userId = photoData === null || photoData === void 0 ? void 0 : photoData.userId;
        if (!userId) {
            throw new Error(`No userId found for photo ${photoId}`);
        }
        // Use a transaction to ensure both operations succeed or fail together
        await admin.firestore().runTransaction(async (transaction) => {
            // 1. Update photo status to done
            const photoRef = admin.firestore().collection('photos').doc(photoId);
            transaction.update(photoRef, {
                status: 'done',
                resultUrl: resultUrl,
                theme: theme,
                analysis: analysis,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 2. Deduct 1 credit from user (only if processing succeeded)
            const userRef = admin.firestore().collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                console.warn(`⚠️ User ${userId} not found, skipping credit deduction`);
                return;
            }
            const userData = userDoc.data();
            const currentCredits = (userData === null || userData === void 0 ? void 0 : userData.credits) || 0;
            if (currentCredits > 0) {
                transaction.update(userRef, {
                    credits: admin.firestore.FieldValue.increment(-1),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                });
                // 3. Log the credit usage
                const usageLogRef = admin.firestore().collection('creditUsage').doc();
                transaction.set(usageLogRef, {
                    userId,
                    imageId: photoId,
                    creditsDeducted: 1,
                    purpose: 'image_generation_completed',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    remainingCredits: currentCredits - 1,
                    theme: theme,
                });
                console.log(`💎 Deducted 1 credit from user ${userId} for completed photo ${photoId}. Remaining: ${currentCredits - 1}`);
            }
            else {
                console.warn(`⚠️ User ${userId} has no credits to deduct for photo ${photoId}`);
                // Log the attempt even with no credits
                const usageLogRef = admin.firestore().collection('creditUsage').doc();
                transaction.set(usageLogRef, {
                    userId,
                    imageId: photoId,
                    creditsDeducted: 0,
                    purpose: 'image_generation_completed_no_credits',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    remainingCredits: 0,
                    theme: theme,
                    note: 'User had no credits to deduct',
                });
            }
        });
        console.log(`✅ Photo ${photoId} completed and credits deducted successfully`);
    }
    catch (error) {
        console.error(`❌ Error updating photo result and deducting credits for ${photoId}:`, error);
        // Even if credit deduction fails, still try to update the photo status
        try {
            await admin.firestore()
                .collection('photos')
                .doc(photoId)
                .update({
                status: 'done',
                resultUrl: resultUrl,
                theme: theme,
                analysis: analysis,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                creditError: 'Failed to deduct credits - see logs',
            });
            console.log(`⚠️ Photo ${photoId} marked as done despite credit error`);
        }
        catch (updateError) {
            console.error(`❌ Failed to update photo ${photoId} even without credit deduction:`, updateError);
            throw updateError;
        }
    }
}
async function generateHeroImage(originalUrl, theme, analysis) {
    var _a, _b, _c;
    try {
        console.log(`🎨 Generating hero image with Gemini (Nano Banana)...`);
        // Download the original image to include in the generation prompt
        const imageResponse = await axios_1.default.get(originalUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        const base64Image = imageBuffer.toString('base64');
        // Create a refined prompt for image generation
        const imagePrompt = `Make pet a ${theme} hero. Keep all faces exactly the same. Add only costumes around bodies.`;
        console.log(`🤖 Calling Gemini for image generation...`);
        // Use Gemini's native image generation (Image + Text to Image)
        const prompt = [
            { text: imagePrompt },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                },
            },
        ];
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: prompt,
        });
        // Check if we got an image in the response
        if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts) {
            throw new Error('Invalid response from Gemini image generation');
        }
        // Look for inline image data in the response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                console.log(`✅ Generated image received from Gemini!`);
                // Upload the generated image to Firebase Storage
                const generatedImageUrl = await uploadGeneratedImage(part.inlineData.data, originalUrl);
                return generatedImageUrl;
            }
        }
        // If no image was generated, log and fallback to original
        console.warn('⚠️ No image generated by Gemini, using original');
        return originalUrl;
    }
    catch (error) {
        console.error('❌ Error generating hero image:', error.message);
        // Check if it's a rate limit error and handle gracefully
        if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('429')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('quota')) || ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('RESOURCE_EXHAUSTED'))) {
            console.log('⏰ Rate limited on image generation, using original image');
        }
        // Fallback to original image on any error
        return originalUrl;
    }
}
async function uploadGeneratedImage(base64Data, originalUrl) {
    var _a;
    try {
        console.log(`📤 Uploading generated image to Firebase Storage...`);
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        // Extract user ID and create a unique filename for the generated image
        const originalFileName = ((_a = originalUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]) || 'generated';
        const decodedFileName = decodeURIComponent(originalFileName);
        const timestamp = Date.now();
        const generatedFileName = decodedFileName.replace('.jpg', `_hero_${timestamp}.jpg`);
        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(generatedFileName);
        await file.save(imageBuffer, {
            metadata: {
                contentType: 'image/jpeg',
            },
        });
        // Make the file publicly accessible
        await file.makePublic();
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${generatedFileName}`;
        console.log(`✅ Generated image uploaded: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.error('❌ Error uploading generated image:', error);
        throw error;
    }
}
async function sendNotification(userId, photoId, isError = false) {
    try {
        // Get user's FCM token
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        const userData = userDoc.data();
        if (!userData || !userData.fcmToken) {
            console.log(`📱 No FCM token for user ${userId}`);
            return;
        }
        const message = {
            token: userData.fcmToken,
            notification: isError ? {
                title: '😅 Oops! Something went wrong',
                body: 'We had trouble processing your pet photo. Please try again!',
            } : {
                title: '🦸‍♀️ Hero Transformation Complete!',
                body: 'Your pet has been transformed into an epic hero! Tap to see the amazing result.',
            },
            data: {
                type: 'photo_complete',
                photoId: photoId,
                error: isError.toString(),
            },
            android: {
                notification: {
                    icon: 'stock_ticker_update',
                    color: isError ? '#FF4444' : '#FF6B6B',
                },
            },
            apns: {
                payload: {
                    aps: {
                        badge: 1,
                        sound: 'default',
                    },
                },
            },
        };
        await admin.messaging().send(message);
        console.log(`📲 Notification sent to user ${userId}`);
    }
    catch (error) {
        console.error('📱 Error sending notification:', error);
    }
}
//# sourceMappingURL=photo-processing.js.map