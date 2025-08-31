import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../store/store';
import { checkPhotoStatus } from '../store/slices/photoSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'Processing'>;
type ProcessingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Processing'>;

const { width } = Dimensions.get('window');

export default function ProcessingScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ProcessingScreenNavigationProp>();
  const route = useRoute<ProcessingScreenRouteProp>();
  const { photoId, originalImageUri } = route.params;

  const { currentPhoto, isProcessing } = useSelector((state: RootState) => state.photo);
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const transformProgress = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start transformation animation
    startTransformationAnimation();

    // Poll for photo status
    const interval = setInterval(() => {
      if (photoId) {
        dispatch(checkPhotoStatus(photoId));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [photoId, dispatch]);

  useEffect(() => {
    if (currentPhoto && currentPhoto.status === 'done') {
      // Complete the transformation animation first
      completeTransformation();
      
      // Then navigate to result
      setTimeout(() => {
        navigation.replace('Result', { photoId });
      }, 2000);
    }
  }, [currentPhoto, navigation, photoId]);

  const startTransformationAnimation = () => {
    // Start sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous sparkle rotation
    Animated.loop(
      Animated.timing(sparkleRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Start the bottom-to-top transformation overlay
    Animated.loop(
      Animated.sequence([
        Animated.timing(transformProgress, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(transformProgress, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Overlay opacity animation
    Animated.timing(overlayOpacity, {
      toValue: 0.7,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const completeTransformation = () => {
    // Final completion animation
    Animated.timing(transformProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const sparkleRotate = sparkleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusText = () => {
    if (!currentPhoto) {
      return 'Preparing your photo...';
    }
    
    switch (currentPhoto.status) {
      case 'processing':
        return 'AI is working its magic...';
      case 'done':
        return 'Transformation complete!';
      default:
        return 'Processing...';
    }
  };

  const getSubtitleText = () => {
    if (!currentPhoto) {
      return 'This may take a few moments';
    }
    
    switch (currentPhoto.status) {
      case 'processing':
        return 'Creating your pet hero transformation';
      case 'done':
        return 'Get ready to see your hero pet!';
      default:
        return 'Please wait...';
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Main Image Container */}
      <View style={styles.imageContainer}>
        {originalImageUri && (
          <View style={styles.imageWrapper}>
            {/* Original Image */}
            <Image 
              source={{ uri: originalImageUri }} 
              style={styles.originalImage}
              resizeMode="cover"
            />
            
            {/* Transformation Overlay with bottom-to-top animation */}
            <Animated.View
              style={[
                styles.transformationOverlay,
                {
                  opacity: overlayOpacity,
                  height: transformProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(138, 43, 226, 0.8)', 'rgba(75, 0, 130, 0.9)', 'rgba(25, 25, 112, 0.8)']}
                style={styles.gradientOverlay}
              />
            </Animated.View>

            {/* Sparkle Effects */}
            <Animated.View
              style={[
                styles.sparkleContainer,
                {
                  transform: [
                    { scale: sparkleScale },
                    { rotate: sparkleRotate },
                  ],
                },
              ]}
            >
              <Text style={styles.sparkle}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>⭐</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>💫</Text>
              <Text style={[styles.sparkle, styles.sparkle4]}>🌟</Text>
            </Animated.View>

            {/* Hero Transformation Indicator */}
            <View style={styles.heroIndicator}>
              <Text style={styles.heroIcon}>🦸‍♀️</Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Text */}
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.subtitleText}>{getSubtitleText()}</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { 
                width: transformProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['10%', currentPhoto?.status === 'done' ? '100%' : '75%'],
                }),
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Transforming your pet into a hero...
        </Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>🎭 AI Magic in Progress</Text>
        <Text style={styles.tipsText}>
          Watch as your pet transforms! Our AI is analyzing facial features and creating 
          the perfect heroic version while keeping their adorable characteristics.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  imageWrapper: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  originalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  transformationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gradientOverlay: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkle2: {
    top: '20%',
    right: '20%',
    fontSize: 16,
  },
  sparkle3: {
    bottom: '30%',
    left: '15%',
    fontSize: 18,
  },
  sparkle4: {
    top: '60%',
    right: '30%',
    fontSize: 14,
  },
  heroIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  heroIcon: {
    fontSize: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#B0C4DE',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    width: width - 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#B0C4DE',
    textAlign: 'center',
  },
  loadingContainer: {
    marginBottom: 20,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tipsText: {
    fontSize: 14,
    color: '#B0C4DE',
    lineHeight: 20,
    textAlign: 'center',
  },
});