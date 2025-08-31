You are an expert React Native + Firebase + AI image processing developer.
I want you to build a production-ready mobile application called Pet Hero AI.

📱 App Concept

Users upload a photo of their pet.

AI automatically transforms the pet into an epic hero image (superhero, fantasy, warrior, astronaut, etc.).

No free usage. All actions require in-app purchase.

No theme selection. The AI chooses a theme automatically.

🛠️ Tech Stack

Frontend (Mobile App): React Native (Expo bare workflow)

State Management: Redux Toolkit (or Zustand if simpler)

Auth: Firebase Anonymous Auth (users sign in automatically on app launch)

Database: Firestore

Storage: Firebase Storage

Functions: Firebase Cloud Functions (image processing + AI call)

AI Processing: Google Gemini 2.5 Flash Image (Nano Banana) → via Firebase Functions

Payments: react-native-iap (Google Play + App Store)

Push Notifications: Firebase Cloud Messaging (FCM)

🔑 Core Features

Authentication

On app launch, sign in the user anonymously with Firebase.

Save user profile in Firestore.

Monetization

No free mode. Users must purchase before uploading.

Use react-native-iap.

Two possible models (we will refine later, but build structure for both):

Credits model: User buys credits (e.g., 5 transformations = 49₺).

Subscription model: Unlimited monthly usage.

Firestore should store:

users[userId].credits

users[userId].premium (boolean for subscription).

Photo Upload

User selects photo from gallery or camera.

Upload to Firebase Storage.

Firestore record created under photos collection:

{
  "userId": "...",
  "originalUrl": "...",
  "status": "processing",
  "resultUrl": null,
  "createdAt": "..."
}


AI Processing

Firebase Cloud Function is triggered on photo upload.

Sends image to Gemini API.

AI automatically applies a hero transformation (random/automatic theme).

Saves result back to Storage.

Updates Firestore with status: done and resultUrl.

Result Screen

Show processed image.

Buttons: Download (save to device), Share (native share API).

Push Notifications

When processing is finished, send push notification via FCM.

📐 User Flow

Splash → Auto login (Anonymous Auth).

Home → "Buy Credits / Subscription" (mandatory before usage).

After purchase → "Upload Photo".

Upload → Processing Screen.

Result Screen → Show image + Download + Share.

📊 Firestore Data Model
users: {
  userId: {
    credits: 5,
    premium: false,
    createdAt: "..."
  }
}

photos: {
  photoId: {
    userId: "...",
    originalUrl: "...",
    status: "processing | done",
    resultUrl: "...",
    createdAt: "..."
  }
}

🚀 Development Roadmap

Week 1: Project setup + Firebase Anonymous Auth + Navigation
Week 2: In-App Purchase flow (credits or subscription)
Week 3: Photo upload (Storage + Firestore)
Week 4: Cloud Function + AI image generation integration
Week 5: Result screen + Download + Share
Week 6: Push Notifications + Polish UI + Release

🎨 UI/UX Guidelines

Fun, modern, pet-friendly design.

Bright/pastel colors.

Smooth animations (Reanimated or Lottie).

Simple user journey (minimal steps).

📌 Task for Cursor

Scaffold the project structure with React Native + Firebase integration.

Implement Anonymous Auth and save users in Firestore.

Add react-native-iap flow (test sandbox products).

Implement photo upload (Storage + Firestore record).

Create Firebase Cloud Function that:

Listens to Firestore photos collection.

Calls Gemini API.

Saves AI result to Storage.

Updates Firestore with status: done + resultUrl.

Build UI screens:

Splash/Login (auto anon sign-in)

Home (Buy credits/subscription, Upload photo button)

Upload/Processing screen

Result screen (View, Download, Share)

Integrate FCM push notifications for completed results.

👉 Please start by generating the project skeleton (React Native + Firebase config + basic navigation + anon auth setup + iap skeleton).