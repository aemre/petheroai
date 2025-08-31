import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

// Note: Firebase imports are commented out for Expo Go compatibility
// Uncomment these when using development build:
// import { initializeFirebase } from './src/services/firebase';
// import PushNotificationService from './src/services/pushNotifications';

function App() {
  useEffect(() => {
    // Uncomment for development build:
    // const initializeApp = async () => {
    //   initializeFirebase();
    //   await PushNotificationService.initialize();
    // };
    // initializeApp();
    
    console.log('Pet Hero AI - Development Build Version');
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

registerRootComponent(App);
export default App;