# Pet Hero AI - Credentials Configuration Template 🔐

## 📋 Complete Credentials Checklist

Use this template to organize all your credentials and configurations. **NEVER commit this file with real credentials to version control.**

---

## 🔥 Firebase Configuration

### Project Information
```
Project Name: pet-hero-ai
Project ID: ______________________
Region: ______________________
```

### Firebase Config (from Firebase Console → Project Settings)
```typescript
const firebaseConfig = {
  apiKey: "________________________",
  authDomain: "________________________.firebaseapp.com",
  projectId: "________________________",
  storageBucket: "________________________.appspot.com",
  messagingSenderId: "________________________",
  appId: "________________________"
};
```

### Firebase Admin SDK (for Cloud Functions)
```
Service Account Key: Download JSON file from Firebase Console → Service Accounts
File Location: functions/serviceAccountKey.json (DO NOT COMMIT)
```

---

## 🍎 iOS App Store Configuration

### Apple Developer Account
```
Apple ID: ________________________
Team ID: ________________________
Bundle Identifier: com.pethero.ai
```

### App Store Connect
```
App Name: Pet Hero AI
App ID: ________________________
```

### In-App Purchase Products
```
Product 1:
- Product ID: com.pethero.credits5
- Name: 5 Hero Credits
- Price: $0.99 (or your choice)
- Status: Ready to Submit ✓

Product 2:
- Product ID: com.pethero.credits10
- Name: 10 Hero Credits  
- Price: $1.99 (or your choice)
- Status: Ready to Submit ✓

Product 3:
- Product ID: com.pethero.credits20
- Name: 20 Hero Credits
- Price: $3.99 (or your choice)  
- Status: Ready to Submit ✓
```

### iOS Push Notification Certificate
```
Certificate Type: Apple Push Notification service SSL (Sandbox & Production)
Certificate File: ________________________.p12
Password: ________________________
Uploaded to Firebase: ✓ / ✗
```

### iOS Testing
```
Sandbox Test Account Email: ________________________
Sandbox Test Account Password: ________________________
```

---

## 🤖 Android Google Play Configuration

### Google Play Console
```
Developer Account: ________________________
App Name: Pet Hero AI
Package Name: com.pethero.ai
```

### In-App Products (Google Play Console)
```
Product 1:
- Product ID: com.pethero.credits5
- Name: 5 Hero Credits
- Price: $0.99 (or your choice)
- Status: Active ✓

Product 2:
- Product ID: com.pethero.credits10
- Name: 10 Hero Credits
- Price: $1.99 (or your choice)
- Status: Active ✓

Product 3:
- Product ID: com.pethero.credits20
- Name: 20 Hero Credits
- Price: $3.99 (or your choice)
- Status: Active ✓
```

### Google Play Service Account (for server-side verification)
```
Service Account Name: ________________________
Service Account Email: ________________________
JSON Key File: ________________________.json (DO NOT COMMIT)
```

### Android Testing
```
License Test Account 1: ________________________
License Test Account 2: ________________________
```

---

## 🤖 AI Service Credentials

### Google Gemini API
```
API Key: ________________________
Quota Limit: ________________________
Billing Account: ________________________
```

### Image Generation Service (Choose One)

#### Option A: OpenAI DALL-E
```
API Key: ________________________
Organization ID: ________________________
Usage Limit: ________________________
```

#### Option B: Stability AI
```
API Key: ________________________
Credits: ________________________
```

#### Option C: Midjourney (if using)
```
Discord Bot Token: ________________________
Server ID: ________________________
Channel ID: ________________________
```

---

## 📧 Email & Communication

### SendGrid (for transactional emails - optional)
```
API Key: ________________________
Sender Email: ________________________
```

### Customer Support Email
```
Support Email: support@yourcompany.com
```

---

## 💳 Payment Processing

### Stripe (for web payments - optional)
```
Publishable Key: ________________________
Secret Key: ________________________
Webhook Secret: ________________________
```

---

## 📊 Analytics & Monitoring

### Google Analytics
```
Measurement ID: ________________________
```

### Crashlytics (Firebase)
```
Automatically configured with Firebase ✓
```

### Mixpanel (optional)
```
Project Token: ________________________
```

---

## 🌐 Domain & Web Services

### Domain Registration
```
Domain: yourcompany.com
Registrar: ________________________
DNS Provider: ________________________
```

### Privacy Policy & Terms
```
Privacy Policy URL: https://yourcompany.com/privacy
Terms of Service URL: https://yourcompany.com/terms
```

---

## 🔐 Security Configuration

### Environment Variables (.env file)
```bash
# Firebase
FIREBASE_API_KEY=________________________
FIREBASE_AUTH_DOMAIN=________________________
FIREBASE_PROJECT_ID=________________________
FIREBASE_STORAGE_BUCKET=________________________
FIREBASE_MESSAGING_SENDER_ID=________________________
FIREBASE_APP_ID=________________________

# AI Services
GEMINI_API_KEY=________________________
OPENAI_API_KEY=________________________
STABILITY_API_KEY=________________________

# Apple
IOS_SHARED_SECRET=________________________

# Google Play
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=path/to/service-account.json

# Other
NODE_ENV=production
```

### Firebase Functions Config
```bash
# Set these using Firebase CLI
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
firebase functions:config:set apple.shared_secret="YOUR_IOS_SHARED_SECRET"
```

---

## 📱 App Store Submission Information

### App Store Listing
```
App Name: Pet Hero AI
Subtitle: Transform pets into heroes with AI
Keywords: pet, hero, AI, photo, transformation, superhero, fantasy
Category: Photo & Video
Age Rating: 4+
```

### App Store Screenshots (Required Sizes)
```
iPhone 6.7": 1290 x 2796 pixels
iPhone 6.5": 1242 x 2688 pixels  
iPhone 5.5": 1242 x 2208 pixels
iPad Pro (6th gen): 2048 x 2732 pixels
iPad Pro (2nd gen): 2048 x 2732 pixels
```

### Google Play Listing
```
App Name: Pet Hero AI
Short Description: Transform your pet into an epic hero with AI
Full Description: [See app store description template]
Category: Photography
Content Rating: Everyone
```

### Google Play Screenshots (Required Sizes)
```
Phone: 1080 x 1920 pixels (minimum)
Tablet 7": 1024 x 1920 pixels
Tablet 10": 1024 x 1920 pixels  
```

---

## ✅ Pre-Launch Checklist

### Firebase Setup
- [ ] Project created and configured
- [ ] Authentication enabled (Anonymous)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Cloud Functions deployed
- [ ] Security rules deployed
- [ ] Push notifications configured

### iOS Setup
- [ ] Developer account active
- [ ] App created in App Store Connect
- [ ] In-app purchases configured and approved
- [ ] Push notification certificate uploaded
- [ ] App built and tested on device
- [ ] TestFlight testing completed

### Android Setup
- [ ] Google Play Console account active
- [ ] App created in Play Console
- [ ] In-app products configured and active
- [ ] App bundle generated and tested
- [ ] Internal testing completed

### AI Service Setup
- [ ] Gemini API key obtained and configured
- [ ] Image generation service configured
- [ ] API quotas and billing verified
- [ ] Test transformations working

### Legal & Compliance
- [ ] Privacy policy created and published
- [ ] Terms of service created and published
- [ ] App store guidelines compliance verified
- [ ] COPPA compliance verified (if applicable)
- [ ] GDPR compliance implemented (if applicable)

---

## 🆘 Emergency Contacts & Support

### Technical Support
```
Firebase Support: https://firebase.google.com/support
Apple Developer Support: https://developer.apple.com/support/
Google Play Support: https://support.google.com/googleplay/android-developer/
```

### Service Status Pages
```
Firebase Status: https://status.firebase.google.com/
Apple System Status: https://developer.apple.com/system-status/
Google Play Status: https://play.google.com/about/developer-distribution-agreement/
```

---

## 📝 Configuration Commands

### Firebase CLI Commands
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Set function config
firebase functions:config:set gemini.api_key="YOUR_API_KEY"

# Deploy functions
firebase deploy --only functions

# View function logs
firebase functions:log
```

### Expo/React Native Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for iOS
npx expo run:ios

# Build for Android  
npx expo run:android

# Create production build
eas build --platform all
```

---

**⚠️ SECURITY WARNING:**
- Replace all placeholder values with your actual credentials
- Never commit this file with real credentials to version control
- Store sensitive credentials securely (password manager, secure vault)
- Use environment variables for local development
- Regularly rotate API keys and certificates

**🎯 Next Steps:**
1. Fill in all credential information
2. Test each service individually  
3. Complete end-to-end testing
4. Submit apps for review
5. Launch and monitor! 🚀