import React, {useState, useRef, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  TapGestureHandlerStateChangeEvent,
  LongPressGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import {LinearGradient} from "expo-linear-gradient";
import {useTranslation} from "../hooks/useTranslation";
import {theme} from "../theme";

interface GalleryItem {
  id: string;
  originalUrl: string;
  resultUrl: string;
  theme: string;
  createdAt: string;
  status: "processing" | "done" | "error";
}

interface AnimatedGalleryItemProps {
  item: GalleryItem;
  itemSize: number;
  onPress: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem) => void;
  getThemeEmoji: (theme: string) => string;
  formatDate: (dateString: string) => string;
}

const AnimatedGalleryItem: React.FC<AnimatedGalleryItemProps> = ({
  item,
  itemSize,
  onPress,
  onDelete,
  getThemeEmoji,
  formatDate,
}) => {
  const [isTransformed, setIsTransformed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const {t, isRTL} = useTranslation();

  // Animation values - initialize to show hero state
  const slideX = useRef(new Animated.Value(-itemSize)).current; // Original image off-screen initially
  const sparkleScale = useRef(new Animated.Value(1)).current; // Start with sparkles visible
  const sparkleRotation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0.8)).current; // Start with overlay visible

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const {translationY, translationX, velocityY, velocityX} =
      event.nativeEvent;

    if (item.status !== "done") return;

    // Check if this is more of a horizontal gesture than vertical
    const isHorizontalGesture =
      Math.abs(translationX) > Math.abs(translationY) * 1.5;

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
        const progress = 1 - clampedX / itemSize;
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
    const {state, translationY, translationX, velocityY, velocityX} =
      event.nativeEvent;

    if (item.status !== "done") return;

    if (state === State.BEGAN) {
      // Start if it's clearly a horizontal gesture
      const isHorizontalStart =
        Math.abs(translationX) > Math.abs(translationY) * 1.5;
      if (isHorizontalStart) {
        setIsDragging(true);
      }
    } else if (state === State.END || state === State.CANCELLED) {
      setIsDragging(false);

      // Check if this was a valid swipe gesture
      const isHorizontalGesture =
        Math.abs(translationX) > Math.abs(translationY) * 1.5;
      const hasEnoughVelocity = Math.abs(velocityX) > 400; // Minimum velocity threshold
      const hasMinimumDistance = Math.abs(translationX) > 25;

      const isValidSwipe =
        isHorizontalGesture && (hasEnoughVelocity || hasMinimumDistance);

      if (isValidSwipe) {
        const isRightSwipe = translationX > 0;
        const isLeftSwipe = translationX < 0;
        const swipeThreshold = itemSize * 0.25;

        if (isRightSwipe && isTransformed) {
          // Right swipe to show original (slide original over hero)
          const shouldShowOriginal =
            Math.abs(translationX) > swipeThreshold || hasEnoughVelocity;
          if (shouldShowOriginal) {
            resetToOriginal();
          } else {
            completeTransformation();
          }
        } else if (isLeftSwipe && !isTransformed) {
          // Left swipe to show hero (slide original away)
          const shouldShowHero =
            Math.abs(translationX) > swipeThreshold || hasEnoughVelocity;
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
    if (event.nativeEvent.state === State.ACTIVE && item.status === "done") {
      if (isTransformed) {
        resetToOriginal();
      } else {
        completeTransformation();
      }
    }
  };

  const handleLongPress = (event: LongPressGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && onDelete) {
      setShowDeleteButton(true);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item);
    }
    setShowDeleteButton(false);
  };

  const hideDeleteButton = () => {
    setShowDeleteButton(false);
  };

  // Start sparkle animation on mount
  useEffect(() => {
    startSparkleAnimation();
  }, []);

  const sparkleRotate = sparkleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LongPressGestureHandler
      onHandlerStateChange={handleLongPress}
      enabled={!!onDelete}
      minDurationMs={800}
    >
      <Animated.View>
        <TapGestureHandler
          onHandlerStateChange={handleDoubleTap}
          numberOfTaps={2}
          enabled={item.status === "done"}
        >
          <Animated.View>
            <PanGestureHandler
              onGestureEvent={handleGestureEvent}
              onHandlerStateChange={handleStateChange}
              enabled={item.status === "done"}
              shouldCancelWhenOutside={true}
              activeOffsetX={[-20, 20]}
              failOffsetY={[-35, 35]}
              maxPointers={1}
            >
              <Animated.View>
                <TouchableOpacity
                  style={[
                    styles.galleryItem,
                    {width: itemSize, height: itemSize},
                  ]}
                  onPress={handlePress}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.imageContainer,
                      {width: itemSize, height: itemSize},
                    ]}
                  >
                    {/* Processing/Error Overlays */}
                    {item.status === "processing" && (
                      <View style={styles.processingOverlay}>
                        <ActivityIndicator
                          color={theme.colors.white}
                          size="small"
                        />
                        <Text
                          style={[
                            styles.processingText,
                            isRTL() && styles.textRTL,
                          ]}
                        >
                          {t("gallery.processing")}
                        </Text>
                      </View>
                    )}
                    {item.status === "error" && (
                      <View style={styles.errorOverlay}>
                        <Text style={styles.errorText}>❌</Text>
                      </View>
                    )}

                    {/* Hero/Result Image (initially shown) */}
                    {item.status === "done" && (
                      <View
                        style={[
                          styles.heroImageBase,
                          {width: itemSize, height: itemSize},
                        ]}
                      >
                        <Image
                          source={{uri: item.resultUrl}}
                          style={[
                            styles.galleryImage,
                            {width: itemSize, height: itemSize},
                          ]}
                          resizeMode="cover"
                        />

                        {/* Transformation Overlay - always visible for hero */}
                        <Animated.View
                          style={[
                            styles.transformationOverlay,
                            {opacity: overlayOpacity},
                          ]}
                        >
                          <LinearGradient
                            colors={
                              theme.colors.gradients.primary as readonly [
                                string,
                                string,
                                ...string[]
                              ]
                            }
                            style={styles.gradientOverlay}
                          />
                        </Animated.View>

                        {/* Sparkle Effects - always visible for hero */}
                        <Animated.View
                          style={[
                            styles.sparkleContainer,
                            {
                              transform: [
                                {scale: sparkleScale},
                                {rotate: sparkleRotate},
                              ],
                            },
                          ]}
                        >
                          <Text style={styles.sparkle}>✨</Text>
                          <Text style={[styles.sparkle, styles.sparkle2]}>
                            ⭐
                          </Text>
                          <Text style={[styles.sparkle, styles.sparkle3]}>
                            💫
                          </Text>
                          <Text style={[styles.sparkle, styles.sparkle4]}>
                            🌟
                          </Text>
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
                          transform: [{translateX: slideX}],
                        },
                      ]}
                    >
                      <Image
                        source={{uri: item.originalUrl}}
                        style={[
                          styles.galleryImage,
                          {width: itemSize, height: itemSize},
                        ]}
                        resizeMode="cover"
                      />
                    </Animated.View>
                  </View>
                  {/* Delete Button Overlay */}
                  {showDeleteButton && (
                    <TouchableOpacity
                      style={styles.deleteOverlay}
                      onPress={hideDeleteButton}
                      activeOpacity={1}
                    >
                      <View style={styles.deleteButtonContainer}>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={handleDelete}
                        >
                          <Text style={styles.deleteIcon}>🗑️</Text>
                          <Text
                            style={[
                              styles.deleteText,
                              isRTL() && styles.textRTL,
                            ]}
                          >
                            {t("gallery.delete")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={hideDeleteButton}
                        >
                          <Text
                            style={[
                              styles.cancelText,
                              isRTL() && styles.textRTL,
                            ]}
                          >
                            {t("common.cancel")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const styles = StyleSheet.create({
  galleryItem: {
    marginBottom: theme.spacing[2],
    marginHorizontal: theme.spacing[1],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  galleryImage: {
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  heroImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  heroImageBase: {
    position: "relative",
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary[800] + "B3", // 70% opacity
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  processingText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing[1],
    fontWeight: theme.typography.weights.medium,
    fontFamily: theme.typography.fonts.medium,
  },
  errorOverlay: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    backgroundColor: theme.colors.error[500] + "CC", // 80% opacity
    borderRadius: theme.borderRadius.lg,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...theme.shadows.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
  },
  transformationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  gradientOverlay: {
    flex: 1,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  sparkleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  sparkle: {
    position: "absolute",
    fontSize: theme.typography.sizes.md,
  },
  sparkle2: {
    top: "20%",
    right: "20%",
    fontSize: theme.typography.sizes.sm,
  },
  sparkle3: {
    bottom: "30%",
    left: "15%",
    fontSize: theme.typography.sizes.base,
  },
  sparkle4: {
    top: "60%",
    right: "30%",
    fontSize: theme.typography.sizes.xs,
  },
  heroIndicator: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing[1],
    ...theme.shadows.sm,
  },
  heroIcon: {
    fontSize: theme.typography.sizes.md,
  },
  itemInfo: {
    padding: theme.spacing[3],
  },
  themeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing[1],
    fontFamily: theme.typography.fonts.medium,
  },
  dateText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary[400],
    marginBottom: theme.spacing[1],
    fontFamily: theme.typography.fonts.regular,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.secondary[500],
    fontWeight: theme.typography.weights.medium,
    fontFamily: theme.typography.fonts.medium,
  },
  textRTL: {
    textAlign: "right",
  },
  deleteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary[900] + "CC", // 80% opacity
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    borderRadius: theme.borderRadius.lg,
  },
  deleteButtonContainer: {
    alignItems: "center",
    gap: theme.spacing[3],
  },
  deleteButton: {
    backgroundColor: theme.colors.error[500],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius["2xl"],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    ...theme.shadows.md,
  },
  deleteIcon: {
    fontSize: theme.typography.sizes.md,
  },
  deleteText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.medium,
  },
  cancelButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
  },
  cancelText: {
    color: theme.colors.primary[600],
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    fontFamily: theme.typography.fonts.medium,
  },
});

export default AnimatedGalleryItem;
