import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';

interface GalleryItem {
  id: string;
  originalUrl: string;
  resultUrl: string;
  theme: string;
  createdAt: string;
  status: 'processing' | 'done' | 'error';
}

interface AnimatedGalleryItemProps {
  item: GalleryItem;
  itemSize: number;
  onPress: (item: GalleryItem) => void;
  getThemeEmoji: (theme: string) => string;
  formatDate: (dateString: string) => string;
}

const AnimatedGalleryItem: React.FC<AnimatedGalleryItemProps> = ({
  item,
  itemSize,
  onPress,
  getThemeEmoji,
  formatDate,
}) => {
  const [isTransformed, setIsTransformed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const { t, isRTL } = useTranslation();
  
  // Animation values - initialize to show hero state
  const slideX = useRef(new Animated.Value(-itemSize)).current; // Original image off-screen initially
  const sparkleScale = useRef(new Animated.Value(1)).current; // Start with sparkles visible
  const sparkleRotation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0.8)).current; // Start with overlay visible
  
  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationY, translationX, velocityY, velocityX } = event.nativeEvent;
    
    if (item.status !== 'done') return;
    
    // Check if this is more of a horizontal gesture than vertical
    const isHorizontalGesture = Math.abs(translationX) > Math.abs(translationY) * 1.5;
    
    // Only process if it's clearly a horizontal swipe gesture
    if (!isHorizontalGesture) return;
    
    // Minimum threshold to start gesture
    const minSwipeThreshold = 15;
    if (Math.abs(translationX) < minSwipeThreshold) return;
    
    // Handle horizontal swipes
    if (translationX > 0) {
      // Right swipe - slide original over hero (if currently showing hero)
      if (isTransformed) {
        const clampedX = Math.min(translationX, itemSize);
        slideX.setValue(clampedX);
        
        // Update overlay opacity as original covers hero
        const progress = 1 - (clampedX / itemSize);
        overlayOpacity.setValue(progress * 0.8);
      }
    } else {
      // Left swipe - slide original back to show hero (if currently showing original)
      if (!isTransformed) {
        const clampedX = Math.max(translationX, -itemSize);
        // Original image slides back: starts at 0, goes toward negative
        slideX.setValue(clampedX);
        
        // Update overlay opacity based on slide progress
        const progress = Math.abs(clampedX) / itemSize;
        overlayOpacity.setValue(progress * 0.8);
      }
    }
  };

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationY, translationX, velocityY, velocityX } = event.nativeEvent;
    
    if (item.status !== 'done') return;
    
    if (state === State.BEGAN) {
      // Start if it's clearly a horizontal gesture
      const isHorizontalStart = Math.abs(translationX) > Math.abs(translationY) * 1.5;
      if (isHorizontalStart) {
        setIsDragging(true);
      }
    } else if (state === State.END || state === State.CANCELLED) {
      setIsDragging(false);
      
      // Check if this was a valid swipe gesture
      const isHorizontalGesture = Math.abs(translationX) > Math.abs(translationY) * 1.5;
      const hasEnoughVelocity = Math.abs(velocityX) > 400; // Minimum velocity threshold
      const hasMinimumDistance = Math.abs(translationX) > 25;
      
      const isValidSwipe = isHorizontalGesture && (hasEnoughVelocity || hasMinimumDistance);
      
      if (isValidSwipe) {
        const isRightSwipe = translationX > 0;
        const isLeftSwipe = translationX < 0;
        const swipeThreshold = itemSize * 0.25;
        
        if (isRightSwipe && isTransformed) {
          // Right swipe to show original (slide original over hero)
          const shouldShowOriginal = Math.abs(translationX) > swipeThreshold || hasEnoughVelocity;
          if (shouldShowOriginal) {
            resetToOriginal();
          } else {
            completeTransformation();
          }
        } else if (isLeftSwipe && !isTransformed) {
          // Left swipe to show hero (slide original away)
          const shouldShowHero = Math.abs(translationX) > swipeThreshold || hasEnoughVelocity;
          if (shouldShowHero) {
            completeTransformation();
          } else {
            resetToOriginal();
          }
        } else {
          // Maintain current state
          if (isTransformed) {
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            
            Animated.timing(overlayOpacity, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.spring(slideX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        }
      } else {
        // Not a valid swipe, return to current state
        if (isTransformed) {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          
          Animated.timing(overlayOpacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    }
  };

  const completeTransformation = () => {
    setIsTransformed(true);
    
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: -itemSize, // Slide original completely off to the left
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const resetToOriginal = () => {
    setIsTransformed(false);
    
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: 0, // Original image covers hero
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const startSparkleAnimation = () => {
    // Continuous sparkle rotation only - no scaling animation
    Animated.loop(
      Animated.timing(sparkleRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const handlePress = () => {
    if (!isDragging) {
      onPress(item);
    }
  };

  const handleDoubleTap = (event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && item.status === 'done') {
      if (isTransformed) {
        resetToOriginal();
      } else {
        completeTransformation();
      }
    }
  };

  // Start sparkle animation on mount
  useEffect(() => {
    startSparkleAnimation();
  }, []);

  const sparkleRotate = sparkleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TapGestureHandler
      onHandlerStateChange={handleDoubleTap}
      numberOfTaps={2}
      enabled={item.status === 'done'}
    >
      <Animated.View>
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
          enabled={item.status === 'done'}
          shouldCancelWhenOutside={true}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-35, 35]}
          maxPointers={1}
        >
          <Animated.View>
            <TouchableOpacity
              style={[styles.galleryItem, { width: itemSize, height: itemSize + 60 }]}
              onPress={handlePress}
              activeOpacity={0.9}
            >
          <View style={[styles.imageContainer, { width: itemSize, height: itemSize }]}>
            {/* Processing/Error Overlays */}
            {item.status === 'processing' && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.processingText, isRTL() && styles.textRTL]}>
                  {t('gallery.processing')}
                </Text>
              </View>
            )}
            {item.status === 'error' && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>❌</Text>
              </View>
            )}

            {/* Hero/Result Image (initially shown) */}
            {item.status === 'done' && (
              <View style={[styles.heroImageBase, { width: itemSize, height: itemSize }]}>
                <Image
                  source={{ uri: item.resultUrl }}
                  style={[styles.galleryImage, { width: itemSize, height: itemSize }]}
                  resizeMode="cover"
                />
                
                {/* Transformation Overlay - always visible for hero */}
                <Animated.View
                  style={[
                    styles.transformationOverlay,
                    { opacity: overlayOpacity },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(138, 43, 226, 0.6)', 'rgba(75, 0, 130, 0.7)', 'rgba(25, 25, 112, 0.6)']}
                    style={styles.gradientOverlay}
                  />
                </Animated.View>

                {/* Sparkle Effects - always visible for hero */}
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

                
              </View>
            )}

            {/* Original Image (slides over hero to show original) */}
            <Animated.View
              style={[
                styles.heroImageContainer,
                {
                  width: itemSize,
                  height: itemSize,
                  left: 0,
                  transform: [{ translateX: slideX }],
                },
              ]}
            >
              <Image
                source={{ uri: item.originalUrl }}
                style={[styles.galleryImage, { width: itemSize, height: itemSize }]}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Interaction Indicator for hero view */}
            {item.status === 'done' && isTransformed && (
              <View style={styles.swipeIndicator}>
                <Text style={[styles.swipeText, isRTL() && styles.textRTL]}>
                  {t('gallery.swipeRight')}
                </Text>
              </View>
            )}

            {/* Transform Back Indicator for original view */}
            {item.status === 'done' && !isTransformed && (
              <View style={styles.swipeIndicator}>
                <Text style={[styles.swipeText, isRTL() && styles.textRTL]}>
                  {t('gallery.swipeLeft')}
                </Text>
              </View>
            )}
          </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  );
};

const styles = StyleSheet.create({
  galleryItem: {
    marginBottom: 16,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  galleryImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroImageBase: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  errorOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,0,0,0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorText: {
    fontSize: 12,
  },
  transformationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gradientOverlay: {
    flex: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    fontSize: 16,
  },
  sparkle2: {
    top: '20%',
    right: '20%',
    fontSize: 12,
  },
  sparkle3: {
    bottom: '30%',
    left: '15%',
    fontSize: 14,
  },
  sparkle4: {
    top: '60%',
    right: '30%',
    fontSize: 10,
  },
  heroIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 4,
  },
  heroIcon: {
    fontSize: 16,
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
  },
  swipeText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  itemInfo: {
    padding: 12,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 9,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default AnimatedGalleryItem;