# Pet Hero AI - Complete Setup Guide 🚀

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `pet-hero-ai`
4. Enable Google Analytics (recommended)
5. Choose your analytics account
6. Click "Create project"

### Step 2: Enable Firebase Services

#### Authentication
1. Go to Authentication → Sign-in method
2. Enable "Anonymous" authentication
3. Click "Save"

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in production mode
4. Choose your location (closest to users)
5. Click "Done"

#### Storage
1. Go to Storage
2. Click "Get started"
3. Start in production mode
4. Choose same location as Firestore
5. Click "Done"

#### Functions
1. Go to Functions
2. Click "Get started"
3. Choose your location
4. Click "Continue"

#### Cloud Messaging
1. Go to Cloud Messaging
2. No setup needed initially
3. You'll configure this when adding apps

### Step 3: Add Mobile Apps

#### Add iOS App
1. Click "Add app" → iOS
2. iOS bundle ID: `com.pethero.ai`
3. App nickname: `Pet Hero AI iOS`
4. Download `GoogleService-Info.plist`
5. Add to your Xcode project root

#### Add Android App
1. Click "Add app" → Android
2. Android package name: `com.pethero.ai`
3. App nickname: `Pet Hero AI Android`
4. Download `google-services.json`
5. Place in `android/app/` folder

### Step 4: Configure Firebase in Your App

Update `src/services/firebase.ts` with your config:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "pet-hero-ai-12345.firebaseapp.com",
  projectId: "pet-hero-ai-12345",
  storageBucket: "pet-hero-ai-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### Step 5: Deploy Firebase Rules and Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (select existing project)
firebase init

# Deploy everything
./deploy.sh
```

---

## 🍎 iOS In-App Purchase Setup

### Step 1: Apple Developer Account
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Enroll in Apple Developer Program ($99/year)
3. Complete enrollment process

### Step 2: App Store Connect Setup

#### Create App
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "My Apps" → "+"
3. App Name: `Pet Hero AI`
4. Bundle ID: `com.pethero.ai` (must match Firebase)
5. SKU: `pet-hero-ai`
6. Fill required information

#### Configure In-App Purchases
1. Go to your app → Features → In-App Purchases
2. Click "+" to add products

##### Credit Package 1
- **Type**: Consumable
- **Product ID**: `com.pethero.credits5`
- **Reference Name**: `5 Credits`
- **Price**: Choose your price tier (e.g., $0.99)
- **Display Name**: `5 Hero Credits`
- **Description**: `Transform 5 pet photos into epic heroes`

##### Credit Package 2
- **Type**: Consumable
- **Product ID**: `com.pethero.credits10`
- **Reference Name**: `10 Credits`
- **Price**: Choose your price tier (e.g., $1.99)
- **Display Name**: `10 Hero Credits`
- **Description**: `Transform 10 pet photos into epic heroes`

##### Credit Package 3
- **Type**: Consumable
- **Product ID**: `com.pethero.credits20`
- **Reference Name**: `20 Credits`
- **Price**: Choose your price tier (e.g., $3.99)
- **Display Name**: `20 Hero Credits`
- **Description**: `Transform 20 pet photos into epic heroes`

### Step 3: iOS App Configuration

#### Xcode Setup
1. Open your project in Xcode
2. Select your target → Signing & Capabilities
3. Add "In-App Purchase" capability
4. Ensure your team is selected for signing

#### Testing
1. Create sandbox test user in App Store Connect
2. Use TestFlight for testing IAP
3. Test purchases with sandbox account

---

## 🤖 Android In-App Purchase Setup

### Step 1: Google Play Console Setup

#### Create App
1. Go to [Google Play Console](https://play.google.com/console/)
2. Create new app
3. App name: `Pet Hero AI`
4. Package name: `com.pethero.ai`
5. Complete app details

#### Configure In-App Products
1. Go to Monetization → Products → In-app products
2. Click "Create product"

##### Credit Package 1
- **Product ID**: `com.pethero.credits5`
- **Name**: `5 Hero Credits`
- **Description**: `Transform 5 pet photos into epic heroes`
- **Price**: Set your price (e.g., $0.99)
- **Status**: Active

##### Credit Package 2
- **Product ID**: `com.pethero.credits10`
- **Name**: `10 Hero Credits`
- **Description**: `Transform 10 pet photos into epic heroes`
- **Price**: Set your price (e.g., $1.99)
- **Status**: Active

##### Credit Package 3
- **Product ID**: `com.pethero.credits20`
- **Name**: `20 Hero Credits`
- **Description**: `Transform 20 pet photos into epic heroes`
- **Price**: Set your price (e.g., $3.99)
- **Status**: Active

### Step 2: Google Play Billing Setup

#### License Testing
1. Go to Setup → License Testing
2. Add test accounts for testing purchases
3. Test with these accounts before release

#### Service Account (for server verification)
1. Go to Setup → API access
2. Create service account or use existing
3. Download JSON key file
4. Store securely for server-side verification

---

## 🤖 AI Service Setup

### Step 1: Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create an account
3. Go to "Get API Key"
4. Create new API key
5. Copy your API key

### Step 2: Configure Gemini in Firebase Functions

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

### Step 3: Image Generation Service (Choose One)

#### Option A: OpenAI DALL-E
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account and get API key
3. Add to Firebase Functions config:
```bash
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

#### Option B: Stability AI
1. Go to [Stability AI](https://platform.stability.ai/)
2. Create account and get API key
3. Add to Firebase Functions config:
```bash
firebase functions:config:set stability.api_key="YOUR_STABILITY_API_KEY"
```

#### Option C: Midjourney (Discord Bot)
1. Set up Midjourney Discord bot
2. Configure webhook integration
3. More complex setup - contact Midjourney for API access

---

## 📱 Push Notification Setup

### iOS Push Notifications

#### Step 1: Apple Push Certificates
1. Go to Apple Developer Portal → Certificates
2. Create "Apple Push Notification service SSL"
3. Choose your App ID (`com.pethero.ai`)
4. Download certificate

#### Step 2: Upload to Firebase
1. Go to Firebase Project Settings
2. Cloud Messaging tab
3. iOS app configuration
4. Upload your APNs certificate

### Android Push Notifications

#### FCM Configuration
1. Firebase automatically configures FCM for Android
2. Ensure `google-services.json` is in your project
3. Test notifications from Firebase Console

---

## 🧪 Testing Checklist

### Pre-Launch Testing

#### Firebase Testing
- [ ] Anonymous authentication works
- [ ] Firestore rules allow proper access
- [ ] Storage upload/download works
- [ ] Cloud Functions deploy and execute
- [ ] Push notifications deliver

#### IAP Testing
- [ ] iOS sandbox purchases work
- [ ] Android test purchases work
- [ ] Purchase verification functions
- [ ] Credits are added correctly
- [ ] Receipt validation works

#### App Flow Testing
- [ ] User can sign in anonymously
- [ ] Purchase flow completes successfully
- [ ] Photo upload works (camera/gallery)
- [ ] Processing screen shows progress
- [ ] AI transformation completes
- [ ] Result screen displays correctly
- [ ] Download/share functions work
- [ ] Push notifications arrive

---

## 🚀 Deployment

### Firebase Deployment
```bash
# Deploy all Firebase services
./deploy.sh

# Or deploy individually
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage
```

### iOS App Store
1. Archive your app in Xcode
2. Upload to App Store Connect
3. Submit for review
4. Wait for approval (1-7 days)

### Google Play Store
1. Generate signed APK/AAB
2. Upload to Play Console
3. Submit for review
4. Wait for approval (1-3 days)

---

## 🔐 Security Considerations

### API Keys
- Store API keys securely in Firebase Functions config
- Never commit API keys to version control
- Use environment variables for local development

### Purchase Verification
- Always verify purchases server-side
- Implement receipt validation
- Log all purchase attempts
- Handle edge cases (network failures, etc.)

### User Data
- Follow GDPR/CCPA guidelines
- Implement data deletion if required
- Use anonymous authentication for privacy
- Encrypt sensitive data

---

## 💰 Pricing Recommendations

### Credit Packages (USD)
- **5 Credits**: $0.99 (Good starter pack)
- **10 Credits**: $1.99 (Popular choice)
- **20 Credits**: $3.99 (Best value)

### Regional Pricing
- Enable regional pricing in app stores
- Consider local purchasing power
- Monitor conversion rates by region

### Future Monetization
- Premium subscription: $9.99/month unlimited
- Seasonal themes: $0.99 each
- Priority processing: $4.99/month
- Advanced AI models: Premium tier

---

## 📊 Analytics & Monitoring

### Firebase Analytics
- Track user engagement
- Monitor conversion rates
- A/B testing for pricing
- User journey analysis

### Performance Monitoring
- Monitor Cloud Functions performance
- Track image processing times
- Watch for errors and crashes
- Set up alerts for issues

### Revenue Tracking
- Monitor IAP revenue
- Track refund rates
- Analyze pricing effectiveness
- Optimize based on data

---

## 🆘 Troubleshooting

### Common Issues

#### Firebase Connection Issues
- Check Firebase config accuracy
- Verify app bundle ID matches
- Ensure Firebase services are enabled

#### IAP Not Working
- Verify product IDs match exactly
- Check app store product status
- Test with valid test accounts
- Verify certificates/signatures

#### AI Processing Fails
- Check API key validity
- Monitor quota limits
- Verify function permissions
- Check image size limits

### Support Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native IAP Guide](https://github.com/dooboolab/react-native-iap)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

**🎉 You're ready to launch Pet Hero AI!**

Follow this guide step-by-step and you'll have a fully functional pet transformation app ready for the app stores.