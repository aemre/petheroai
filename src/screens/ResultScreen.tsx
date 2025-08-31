import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { AppDispatch, RootState } from '../store/store';
import { checkPhotoStatus, clearCurrentPhoto } from '../store/slices/photoSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;

const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const { photoId } = route.params;

  const { currentPhoto } = useSelector((state: RootState) => state.photo);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (!currentPhoto && photoId) {
      dispatch(checkPhotoStatus(photoId));
    }
  }, [photoId, currentPhoto, dispatch]);

  const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  };

  const handleDownload = async () => {
    if (!currentPhoto?.resultUrl) {
      Alert.alert('Error', 'No image to download');
      return;
    }

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Media library permission is needed to save the image'
        );
        return;
      }

      console.log('Downloading image from:', currentPhoto.resultUrl);

      // First, download the image to local storage
      const response = await fetch(currentPhoto.resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64WithoutPrefix = base64.split(',')[1];
          resolve(base64WithoutPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Create a temporary file
      const filename = `hero_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Image saved to temp path:', tempPath);

      // Now save to photo library
      const asset = await MediaLibrary.createAssetAsync(tempPath);
      console.log('Asset created:', asset);

      // Try to create/add to album
      try {
        const album = await MediaLibrary.getAlbumAsync('Pet Hero AI');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Pet Hero AI', asset, false);
        }
      } catch (albumError) {
        console.log('Album creation/addition failed, but asset saved to gallery:', albumError);
        // Asset is still saved to gallery even if album operations fail
      }

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(tempPath);
      } catch (deleteError) {
        console.log('Failed to delete temp file:', deleteError);
      }
      
      Alert.alert('Success', 'Hero image saved to your gallery! 🦸‍♀️');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!currentPhoto?.resultUrl) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      console.log('Sharing image from:', currentPhoto.resultUrl);

      // Download image to local storage for sharing
      const response = await fetch(currentPhoto.resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64WithoutPrefix = base64.split(',')[1];
          resolve(base64WithoutPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Create a temporary file for sharing
      const filename = `hero_share_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(tempPath, {
        dialogTitle: 'Share your Pet Hero transformation! 🦸‍♀️',
        mimeType: 'image/jpeg',
      });

      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempPath);
        } catch (deleteError) {
          console.log('Failed to delete temp share file:', deleteError);
        }
      }, 5000); // 5 second delay to ensure sharing is complete

    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  const handleCreateAnother = () => {
    dispatch(clearCurrentPhoto());
    navigation.navigate('Home');
  };

  if (!currentPhoto || !currentPhoto.resultUrl) {
    return (
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Loading your hero transformation...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#F0F9FF', '#E0F2FE', '#BAE6FD']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Transformation Complete!</Text>
        <Text style={styles.subtitle}>Your pet is now a hero!</Text>
      </View>

      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <Text style={styles.imageLoadingText}>Loading...</Text>
          </View>
        )}
        <Image
          source={{ uri: currentPhoto.resultUrl }}
          style={styles.resultImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          resizeMode="contain"
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Text style={styles.downloadIcon}>💾</Text>
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.createAnotherButton} onPress={handleCreateAnother}>
          <Text style={styles.createAnotherText}>Create Another Hero</Text>
        </TouchableOpacity>

        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>Made with Pet Hero AI ✨</Text>
        </View>
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: 'relative',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 16,
  },
  imageLoadingText: {
    fontSize: 16,
    color: '#666',
  },
  resultImage: {
    width: width - 56,
    height: width - 56,
    borderRadius: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  downloadButton: {
    backgroundColor: '#4ECDC4',
    flex: 1,
    marginRight: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  downloadIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#FF6B6B',
    flex: 1,
    marginLeft: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  shareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    alignItems: 'center',
  },
  createAnotherButton: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createAnotherText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  brandingContainer: {
    paddingVertical: 16,
  },
  brandingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});