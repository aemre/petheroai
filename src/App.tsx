import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './store/store';
import AppNavigator from './navigation/AppNavigator';

import { initializeFirebase } from './services/firebase';
import PushNotificationService from './services/pushNotifications';
import IAPService from './services/iap';
import { loadOnboardingState } from './services/onboarding';
import { i18n } from './services/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load saved language preference
        try {
          const savedLanguage = await AsyncStorage.getItem('language');
          if (savedLanguage && ['en', 'tr', 'ar'].includes(savedLanguage)) {
            i18n.setLanguage(savedLanguage as 'en' | 'tr' | 'ar');
          }
        } catch (error) {
          console.log('No saved language preference found');
        }
        
        const firebaseReady = await initializeFirebase();
        if (!firebaseReady) {
          console.warn('⚠️ Firebase initialization failed, some features may not work');
        }
        await PushNotificationService.initialize();
        await IAPService.initialize();
        await loadOnboardingState(store.dispatch);
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}