import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { store } from './store/store';
import AppNavigator from './navigation/AppNavigator';

import { initializeFirebase } from './services/firebase';
import PushNotificationService from './services/pushNotifications';
import IAPService from './services/iap';
import { loadOnboardingState } from './services/onboarding';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeFirebase();
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
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}