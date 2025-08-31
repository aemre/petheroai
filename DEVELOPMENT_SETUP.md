# Pet Hero AI - Development Setup 🛠️

## ⚠️ Important: Development Build Required

This app uses React Native Firebase and other native modules that require a **development build** instead of Expo Go.

## 🚀 Quick Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Development Build

#### For iOS:
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account (create free account if needed)
eas login

# Create development build for iOS
eas build --profile development --platform ios
```

#### For Android:
```bash
# Create development build for Android
eas build --profile development --platform android
```

### 3. Install Development Build
- Download the build from the EAS dashboard
- Install on your device/simulator
- The app will have "Pet Hero AI (dev)" name

### 4. Start Development Server
```bash
npm start
```

### 5. Open in Development Build
- Open the development build app on your device
- Scan QR code or enter URL manually
- App will load with hot reload capabilities

## 🎨 Missing Assets

The app currently needs these assets created:

### Required Images:
1. **App Icon** (1024x1024): Create a pet/hero themed icon
2. **Splash Screen** (1284x2778): Loading screen background
3. **Adaptive Icon** (1024x1024): Android adaptive icon

### Quick Asset Creation:
```bash
# Create placeholder assets (you'll need actual images)
touch assets/icon.png
touch assets/splash.png  
touch assets/adaptive-icon.png
touch assets/favicon.png
```

### Recommended Design:
- Use pet silhouettes with hero elements (cape, mask, etc.)
- Bright, friendly colors (#FF6B6B, #4ECDC4, #45B7D1)
- Simple, recognizable design
- High contrast for visibility

## 🔧 Development vs Production

### Development Build Features:
- ✅ All native modules work
- ✅ Firebase integration
- ✅ In-app purchases (sandbox)
- ✅ Push notifications
- ✅ Hot reload and debugging
- ✅ Chrome DevTools

### Expo Go Limitations:
- ❌ Firebase native modules
- ❌ React Native IAP
- ❌ Custom native code
- ❌ Push notifications

## 🧪 Testing Setup

### 1. Firebase Emulator (Optional)
```bash
# Install Firebase tools
npm install -g firebase-tools

# Start emulators for local testing
firebase emulators:start
```

### 2. Configure Test Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your test credentials
# Use Firebase emulator endpoints if running locally
```

### 3. Test Data
The app will create test data automatically:
- Anonymous user authentication
- Sample credit balances
- Mock photo processing (until AI service is connected)

## 📱 Platform-Specific Setup

### iOS Development
1. **Xcode** required for iOS builds
2. **Apple Developer Account** for device testing
3. **Provisioning Profile** setup
4. **iOS Simulator** for testing

### Android Development  
1. **Android Studio** for builds
2. **Google Play Console** for testing
3. **Android Emulator** or physical device
4. **USB Debugging** enabled

## 🔥 Firebase Setup for Development

### 1. Create Test Project
- Create separate Firebase project for development
- Use naming like "pet-hero-ai-dev"
- Enable same services as production

### 2. Download Config Files
- **iOS**: `GoogleService-Info.plist` → `ios/` folder
- **Android**: `google-services.json` → `android/app/` folder

### 3. Update Firebase Config
Edit `src/services/firebase.ts` with your dev project credentials.

## 🛠️ Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf .expo
npm install
```

### Metro Bundle Errors
```bash
# Reset Metro cache  
npx expo start --clear
```

### Native Module Errors
- Ensure you're using development build, not Expo Go
- Check that all plugins are properly configured in app.json
- Verify native dependencies are installed

### Firebase Connection Issues
- Check Firebase project configuration
- Verify config files are in correct locations
- Ensure Firebase services are enabled

## 📊 Development Workflow

### 1. Feature Development
- Create feature branch
- Use development build for testing
- Test on both iOS and Android
- Use Firebase emulators for backend testing

### 2. Testing
- Unit tests (Jest)
- Integration tests
- Manual testing on devices
- Performance testing

### 3. Code Review
- ESLint/Prettier formatting
- TypeScript type checking
- Security review
- Performance review

### 4. Deployment
- Build preview version
- Internal testing
- Production deployment

## 🎯 Next Steps

1. **Create Assets**: Design app icon and splash screen
2. **Setup Firebase**: Configure your development project  
3. **Test Build**: Create and install development build
4. **Connect Services**: Configure AI services and payment processing
5. **Test Flow**: Complete user journey testing

---

**Ready to start development! 🚀**

Run the commands above to get your development environment set up and start building Pet Hero AI.