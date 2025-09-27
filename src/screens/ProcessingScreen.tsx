import React, {useEffect, useRef} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {useNavigation, useRoute, RouteProp} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";

import {AppDispatch, RootState} from "../store/store";
import {checkPhotoStatus} from "../store/slices/photoSlice";
import {RootStackParamList} from "../navigation/AppNavigator";
import {theme} from "../theme";

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, "Processing">;
type ProcessingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Processing"
>;

const {width} = Dimensions.get("window");

export default function ProcessingScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ProcessingScreenNavigationProp>();
  const route = useRoute<ProcessingScreenRouteProp>();
  const {photoId, originalImageUri} = route.params;

  const {currentPhoto, isProcessing} = useSelector(
    (state: RootState) => state.photo
  );

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
    if (currentPhoto && currentPhoto.status === "done") {
      // Complete the transformation animation first
      completeTransformation();

      // Then navigate to result
      setTimeout(() => {
        navigation.replace("Result", {photoId});
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
    outputRange: ["0deg", "360deg"],
  });

  const getStatusText = () => {
    if (!currentPhoto) {
      return "Preparing your photo...";
    }

    switch (currentPhoto.status) {
      case "processing":
        return "AI is working its magic...";
      case "done":
        return "Transformation complete!";
      default:
        return t("processing.processing");
    }
  };

  const getSubtitleText = () => {
    if (!currentPhoto) {
      return t("processing.patience");
    }

    switch (currentPhoto.status) {
      case "processing":
        return "Creating your pet hero transformation";
      case "done":
        return "Get ready to see your hero pet!";
      default:
        return "Please wait...";
    }
  };

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      {/* Main Image Container */}
      <View style={styles.imageContainer}>
        {originalImageUri && (
          <View style={styles.imageWrapper}>
            {/* Original Image */}
            <Image
              source={{uri: originalImageUri}}
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
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(138, 43, 226, 0.8)",
                  "rgba(75, 0, 130, 0.9)",
                  "rgba(25, 25, 112, 0.8)",
                ]}
                style={styles.gradientOverlay}
              />
            </Animated.View>

            {/* Sparkle Effects */}
            <Animated.View
              style={[
                styles.sparkleContainer,
                {
                  transform: [{scale: sparkleScale}, {rotate: sparkleRotate}],
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
                  outputRange: [
                    "10%",
                    currentPhoto?.status === "done" ? "100%" : "75%",
                  ],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Transforming your pet into a hero...
        </Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary[500]} />
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>🎭 AI Magic in Progress</Text>
        <Text style={styles.tipsText}>
          Watch as your pet transforms! Our AI is analyzing facial features and
          creating the perfect heroic version while keeping their adorable
          characteristics.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing[5],
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing[10],
  },
  imageWrapper: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: theme.borderRadius["2xl"],
    overflow: "hidden",
    position: "relative",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  originalImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius["2xl"],
  },
  transformationOverlay: {
    position: "absolute",
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
    fontSize: theme.typography.sizes.xl,
  },
  sparkle2: {
    top: "20%",
    right: "20%",
    fontSize: theme.typography.sizes.md,
  },
  sparkle3: {
    bottom: "30%",
    left: "15%",
    fontSize: theme.typography.sizes.lg,
  },
  sparkle4: {
    top: "60%",
    right: "30%",
    fontSize: theme.typography.sizes.base,
  },
  heroIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius["2xl"],
    padding: theme.spacing[2],
  },
  heroIcon: {
    fontSize: theme.typography.sizes["2xl"],
  },
  textContainer: {
    alignItems: "center",
    marginVertical: theme.spacing[5],
  },
  statusText: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  subtitleText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: "#B0C4DE",
    textAlign: "center",
    lineHeight: 22,
  },
  progressContainer: {
    width: width - 40,
    alignItems: "center",
    marginBottom: theme.spacing[5],
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: theme.colors.white,
    borderRadius: 3,
    marginBottom: theme.spacing[2],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF6B6B",
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: "#B0C4DE",
    textAlign: "center",
  },
  loadingContainer: {
    marginBottom: theme.spacing[5],
  },
  tipsContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    width: "100%",
    marginBottom: theme.spacing[5],
  },
  tipsTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  tipsText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: "#B0C4DE",
    lineHeight: 20,
    textAlign: "center",
  },
});
