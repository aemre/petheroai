import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { store } from '../store/store';

class PushNotificationService {
  
  async initialize() {
    try {
      // Check if Firebase messaging is available
      const messagingInstance = messaging();
      if (!messagingInstance) {
        console.warn('Firebase messaging not available');
        return null;
      }

      // Request permission for iOS
      if (Platform.OS === 'ios') {
        await this.requestPermission();
        // Register device for remote messages (required for iOS)
        await messagingInstance.registerDeviceForRemoteMessages();
      }

      // Get FCM token
      const token = await messagingInstance.getToken();
      console.log('FCM Token:', token);

      // Save token to user profile
      await this.saveTokenToDatabase(token);

      // Listen for token refresh
      messagingInstance.onTokenRefresh(this.saveTokenToDatabase);

      // Handle foreground messages
      messagingInstance.onMessage(this.handleForegroundMessage);

      // Handle background messages
      messagingInstance.setBackgroundMessageHandler(this.handleBackgroundMessage);

      // Handle notification open app
      messagingInstance.onNotificationOpenedApp(this.handleNotificationOpenApp);

      // Check if app was opened by a notification
      const initialNotification = await messagingInstance.getInitialNotification();
      if (initialNotification) {
        this.handleNotificationOpenApp(initialNotification);
      }

      return token;
    } catch (error) {
      console.error('Push notification initialization error:', error);
      console.warn('Push notifications will not be available');
      return null;
    }
  }

  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications to get updates when your pet transformations are complete!'
      );
    }

    return enabled;
  }

  async saveTokenToDatabase(token: string) {
    try {
      const user = store.getState().auth.user;
      if (!user) return;

      // Call Firebase Function to update token
      const updateToken = await import('@react-native-firebase/functions').then(
        functions => functions().httpsCallable('updateFCMToken')
      );
      
      await updateToken({ token });
      console.log('FCM token updated in database');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  handleForegroundMessage = (message: any) => {
    console.log('Foreground message:', message);
    
    // Show alert for foreground messages
    if (message.notification) {
      Alert.alert(
        message.notification.title || 'Pet Hero AI',
        message.notification.body || 'You have a new notification',
        [
          {
            text: 'OK',
            onPress: () => {
              if (message.data?.photoId) {
                // Navigate to result screen
                this.navigateToPhoto(message.data.photoId);
              }
            },
          },
        ]
      );
    }
  };

  handleBackgroundMessage = async (message: any) => {
    console.log('Background message:', message);
    // Handle background message processing if needed
  };

  handleNotificationOpenApp = (message: any) => {
    console.log('Notification opened app:', message);
    
    if (message.data?.photoId) {
      // Navigate to the specific photo result
      setTimeout(() => {
        this.navigateToPhoto(message.data.photoId);
      }, 1000);
    }
  };

  navigateToPhoto(photoId: string) {
    // This should be called from a component with navigation access
    // For now, just log the photoId
    console.log('Should navigate to photo:', photoId);
    
    // In a real implementation, you would use a navigation service
    // or emit an event that the navigation component can listen to
  }

  async checkNotificationPermission() {
    const authStatus = await messaging().hasPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  }

  async unsubscribe() {
    try {
      // Remove token from database
      const user = store.getState().auth.user;
      if (user) {
        await this.saveTokenToDatabase('');
      }
      
      // Unsubscribe from topics if needed
      // await messaging().unsubscribeFromTopic('general');
      
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  }
}

export default new PushNotificationService();