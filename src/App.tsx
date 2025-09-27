import React, {useEffect, useState} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {Provider} from "react-redux";
import {StatusBar} from "expo-status-bar";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {View, Text, ActivityIndicator} from "react-native";
import * as Font from "expo-font";
import {store} from "./store/store";
import AppNavigator from "./navigation/AppNavigator";

import {initializeFirebase} from "./services/firebase";
import PushNotificationService from "./services/pushNotifications";
import IAPService from "./services/iap";
import {loadOnboardingState} from "./services/onboarding";
import {i18n} from "./services/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load Oswald fonts
        await Font.loadAsync({
          "Oswald-Light": require("../assets/fonts/Oswald-Light.ttf"),
          "Oswald-Regular": require("../assets/fonts/Oswald-Regular.ttf"),
          "Oswald-Medium": require("../assets/fonts/Oswald-Medium.ttf"),
          "Oswald-SemiBold": require("../assets/fonts/Oswald-SemiBold.ttf"),
        });
        setFontsLoaded(true);

        // Load saved language preference
        try {
          const savedLanguage = await AsyncStorage.getItem("language");
          if (savedLanguage && ["en", "tr", "ar"].includes(savedLanguage)) {
            i18n.setLanguage(savedLanguage as "en" | "tr" | "ar");
          }
        } catch (error) {
          console.log("No saved language preference found");
        }

        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
          console.warn(
            "⚠️ Firebase initialization failed, some features may not work"
          );
        }
        await PushNotificationService.initialize();
        await IAPService.initialize();
        await loadOnboardingState(store.dispatch);
      } catch (error) {
        console.error("App initialization error:", error);
        // Set fonts as loaded even if there's an error to prevent infinite loading
        setFontsLoaded(true);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#5D688A",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{color: "#FFFFFF", marginTop: 16, fontSize: 16}}>
          Loading Fonts...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}
