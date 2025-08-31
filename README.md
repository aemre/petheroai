# Pet Hero AI 🦸‍♀️

Transform your pet into an epic hero with AI-powered image generation!

## 📱 App Overview

Pet Hero AI is a React Native mobile application that uses artificial intelligence to transform pet photos into epic hero images. Users can upload photos of their pets and the AI automatically applies hero transformations like superheroes, medieval knights, space astronauts, and more.

### Key Features

- **AI-Powered Transformations**: Automatic hero theme selection and image generation
- **Monetization**: Credit-based system with in-app purchases
- **Real-time Processing**: Live updates with push notifications
- **Social Sharing**: Download and share transformed images
- **Anonymous Authentication**: Seamless user experience

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo bare workflow)
- **State Management**: Redux Toolkit
- **Authentication**: Firebase Anonymous Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **AI Processing**: Google Gemini 2.5 Flash
- **Payments**: react-native-iap
- **Push Notifications**: Firebase Cloud Messaging

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- React Native development environment
- Firebase project
- Google Gemini API key
- iOS/Android development setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd pet-hero-ai
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable the following services:
   - Authentication (Anonymous)
   - Firestore Database
   - Storage
   - Cloud Functions
   - Cloud Messaging

3. Download your Firebase config and update `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

Set Firebase Functions config:

```bash
firebase functions:config:set gemini.api_key="your_gemini_api_key"
```

### 4. Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
cd ..
```

### 5. Set up In-App Purchases

#### iOS (App Store Connect)
1. Create your app in App Store Connect
2. Set up in-app purchase products:
   - `com.pethero.credits5` - 5 Credits
   - `com.pethero.credits10` - 10 Credits
   - `com.pethero.credits20` - 20 Credits

#### Android (Google Play Console)
1. Create your app in Google Play Console
2. Set up in-app products with the same IDs

### 6. Run the App

```bash
# iOS
npm run ios

# Android  
npm run android

# Web (for testing)
npm run web
```

## 📁 Project Structure

```
pet-hero-ai/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # App screens
│   ├── navigation/       # Navigation configuration
│   ├── services/         # Firebase and external services
│   ├── store/           # Redux store and slices
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions and constants
├── functions/           # Firebase Cloud Functions
├── assets/             # Static assets
├── firebase.json       # Firebase configuration
├── firestore.rules    # Firestore security rules
└── storage.rules      # Storage security rules
```

## 🔧 Configuration

### Firebase Rules

The app uses security rules to protect user data:

- **Firestore**: Users can only access their own data
- **Storage**: Public read for sharing, authenticated write

### Push Notifications

Configure push notifications in your Firebase project:

1. Upload APNs certificates for iOS
2. Configure FCM for Android
3. Test notifications using Firebase Console

## 💰 Monetization Setup

### Credit System

- Users purchase credits to transform photos
- Each transformation costs 1 credit
- Credits are stored in Firestore user profiles

### Purchase Verification

The app includes server-side purchase verification in Cloud Functions to prevent fraud.

## 🎨 AI Image Generation

### Current Implementation

The Cloud Functions include integration with Google Gemini 2.5 Flash for image analysis. For actual image generation, you'll need to integrate with:

- **OpenAI DALL-E**: Best quality, moderate cost
- **Stability AI**: Good quality, lower cost  
- **Midjourney**: Excellent quality, API access needed
- **Custom Models**: Stable Diffusion, etc.

### Hero Themes

The app automatically selects from 10 hero themes:
- Superhero with cape
- Medieval knight
- Space astronaut
- Fantasy wizard
- Pirate captain
- Ninja warrior
- Cowboy sheriff
- Ancient gladiator
- Steampunk inventor
- Cyber warrior

## 🧪 Testing

### Local Development

Use Firebase emulators for local testing:

```bash
firebase emulators:start
```

### Testing Flow

1. Install the app on a device/simulator
2. Take/select a pet photo
3. Purchase credits (use test products)
4. Upload and process photo
5. Verify push notification
6. Check result screen functionality

## 🚀 Deployment

### iOS App Store

1. Build the app in Xcode
2. Configure signing certificates
3. Submit for review

### Google Play Store

1. Generate signed APK/Bundle
2. Upload to Play Console
3. Submit for review

### Firebase Functions

```bash
firebase deploy --only functions
```

## 📊 Monitoring

- **Firebase Analytics**: User behavior tracking
- **Crashlytics**: Error reporting
- **Performance Monitoring**: App performance metrics
- **Functions Logs**: Cloud Functions debugging

## 🔒 Security

- Anonymous authentication for privacy
- Server-side purchase verification
- Secure Firebase rules
- API key protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary. All rights reserved.

## 📧 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for pet lovers everywhere!** 🐶🐱