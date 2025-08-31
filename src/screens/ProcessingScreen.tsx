import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
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
  const { photoId } = route.params;

  const { currentPhoto, isProcessing } = useSelector((state: RootState) => state.photo);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    startPulseAnimation();
    startRotateAnimation();

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
      // Small delay to show completion state
      setTimeout(() => {
        navigation.replace('Result', { photoId });
      }, 1500);
    }
  }, [currentPhoto, navigation, photoId]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const spin = rotateAnimation.interpolate({
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
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.innerCircle,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <Text style={styles.heroIcon}>🦸‍♀️</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.subtitleText}>{getSubtitleText()}</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: currentPhoto?.status === 'done' ? '100%' : '60%' }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentPhoto?.status === 'done' ? '100%' : '60%'} Complete
        </Text>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Did you know?</Text>
        <Text style={styles.tipsText}>
          Our AI analyzes your pet's features and automatically chooses the perfect hero theme - 
          from superheroes to fantasy warriors!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animationContainer: {
    marginBottom: 40,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    marginBottom: 30,
  },
  progressContainer: {
    width: width - 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});