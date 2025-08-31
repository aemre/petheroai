import { Alert, Platform } from 'react-native';
import { store } from '../store/store';

class PushNotificationServiceMock {
  
  async initialize() {
    try {
      console.log('Mock Push Notification Service initialized');
      
      // Mock token
      const token = 'mock-fcm-token-' + Date.now();
      console.log('Mock FCM Token:', token);

      return token;
    } catch (error) {
      console.error('Mock push notification initialization error:', error);
      return null;
    }
  }

  async requestPermission() {
    console.log('Mock permission request');
    return true; // Always return true for mock
  }

  async saveTokenToDatabase(token: string) {
    console.log('Mock save token to database:', token);
  }

  handleForegroundMessage = (message: any) => {
    console.log('Mock foreground message:', message);
  };

  handleBackgroundMessage = async (message: any) => {
    console.log('Mock background message:', message);
  };

  handleNotificationOpenApp = (message: any) => {
    console.log('Mock notification opened app:', message);
  };

  navigateToPhoto(photoId: string) {
    console.log('Mock navigate to photo:', photoId);
  }

  async checkNotificationPermission() {
    console.log('Mock check notification permission');
    return true;
  }

  async unsubscribe() {
    console.log('Mock unsubscribe from notifications');
  }
}

export default new PushNotificationServiceMock();
