import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {useNavigation} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";

const {width, height} = Dimensions.get("window");

import {AppDispatch, RootState} from "../store/store";
import {uploadAndProcessPhoto} from "../store/slices/photoSlice";
import {fetchUserProfile} from "../store/slices/userSlice";
import {TabParamList} from "../navigation/TabNavigator";
import IAPService from "../services/iap";
import {useTranslation} from "../hooks/useTranslation";
import PurchaseModal from "../components/PurchaseModal";
import {theme, blackWithOpacity} from "../theme";

type HomeScreenNavigationProp = StackNavigationProp<TabParamList, "HomeTab">;

export default function HomeScreen({route}: {route?: any}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {user, isLoading: authLoading} = useSelector(
    (state: RootState) => state.auth
  );
  const {
    profile,
    petPreference,
    isLoading: userLoading,
  } = useSelector((state: RootState) => state.user);
  const {isUploading} = useSelector((state: RootState) => state.photo);
  const {t, isRTL} = useTranslation();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // No animations needed

  // Pet-specific content
  const getPetContent = () => {
    // Default to dog if petPreference is null or undefined
    const isDog = petPreference === "dog" || petPreference === null;
    return {
      emoji: isDog ? "🐕" : "🐱",
      heroEmoji: isDog ? "🦸‍♂️" : "🦸‍♀️",
      image: isDog
        ? require("../../assets/dog.jpg")
        : require("../../assets/cat.jpg"),
      petName: isDog ? t("common.dog") : t("common.cat"),
      subtitle: isDog ? t("home.dogSubtitle") : t("home.catSubtitle"),
      actionText: isDog ? t("home.transformDog") : t("home.transformCat"),
      actionSubtext: isDog ? t("home.dogActionText") : t("home.catActionText"),
      gradientColors: isDog
        ? theme.colors.gradients.primary
        : theme.colors.gradients.secondary,
      iconGradient: isDog
        ? theme.colors.gradients.accent
        : theme.colors.gradients.light,
    };
  };

  const petContent = getPetContent();

  useEffect(() => {
    initializeIAP();
  }, []);

  // Handle navigation parameter to show purchase modal
  useEffect(() => {
    console.log("🏠 HomeScreen route params:", route?.params);
    if (route?.params?.showPurchaseModal) {
      console.log("🎯 HomeScreen: Showing purchase modal");
      setShowPurchaseModal(true);
    }
  }, [route?.params?.showPurchaseModal]);

  // Refresh user profile when screen comes into focus (to update credits after processing)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user?.uid) {
        console.log("HomeScreen focused, refreshing user profile...");
        dispatch(fetchUserProfile(user.uid));
      }
    });

    return unsubscribe;
  }, [navigation, user?.uid, dispatch]);

  const initializeIAP = async () => {
    try {
      console.log("Initializing IAP...");
      await IAPService.initialize();

      // Check if IAPService has the getProducts method
      if (typeof IAPService.getProducts === "function") {
        const {products} = await IAPService.getProducts();
        setProducts(products || []);
        console.log("IAP products loaded:", products?.length || 0);
      } else {
        console.warn("IAPService.getProducts is not available");
        setProducts([]);
      }
    } catch (error) {
      console.error("IAP initialization error:", error);
      console.log("Running without IAP support (likely simulator)");
      setProducts([]);
    }
  };

  const requestCameraPermission = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const requestMediaLibraryPermission = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let hasPermission = false;

      if (useCamera) {
        hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(t("home.permissionNeeded"), t("home.cameraPermission"));
          return;
        }
      } else {
        hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) {
          Alert.alert(
            t("home.permissionNeeded"),
            t("home.photoLibraryPermission")
          );
          return;
        }
      }

      // Add timeout protection for iPad compatibility
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Image picker timeout")), 30000);
      });

      const pickerPromise = useCamera
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false, // Reduce processing overhead
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false, // Reduce processing overhead
          });

      const result = await Promise.race([pickerPromise, timeoutPromise]);

      if (result && !result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error: any) {
      console.error("Error picking image:", error);

      // Provide more specific error messages
      let errorMessage = t("home.failedToPickImage");
      if (error?.message?.includes("timeout")) {
        errorMessage = "Camera operation timed out. Please try again.";
      } else if (error?.message?.includes("Camera")) {
        errorMessage =
          "Camera not available. Please try using photo library instead.";
      }

      Alert.alert(t("common.error"), errorMessage);
    }
  };

  const handleUploadPhoto = async () => {
    if (!profile || profile.credits <= 0) {
      Alert.alert(t("home.noCredits"), t("home.needCredits"), [
        {text: t("common.cancel"), style: "cancel"},
        {
          text: t("home.buyCreditsAction"),
          onPress: () => setShowPurchaseModal(true),
        },
      ]);
      return;
    }

    Alert.alert(t("home.selectPhoto"), t("home.selectPhotoMethod"), [
      {text: t("common.camera"), onPress: () => handleImageSelection(true)},
      {text: t("common.gallery"), onPress: () => handleImageSelection(false)},
      {text: t("common.cancel"), style: "cancel"},
    ]);
  };

  const handleImageSelection = async (useCamera: boolean) => {
    const imageUri = await pickImage(useCamera);
    if (imageUri && user?.uid) {
      try {
        // Check if user has enough credits before uploading
        if (!profile || profile.credits <= 0) {
          Alert.alert(t("home.noCredits"), t("home.needCredits"));
          return;
        }

        // Upload and process the image
        // Credits will be automatically deducted by the cloud function when processing completes
        console.log(
          "Uploading image for processing. Credits will be deducted automatically upon completion."
        );
        const result = await dispatch(
          uploadAndProcessPhoto({
            uri: imageUri,
            userId: user.uid,
          })
        ).unwrap();

        if (result?.id) {
          console.log("Image uploaded successfully:", result.id);
          navigation.navigate("Processing", {
            photoId: result.id,
            originalImageUri: imageUri,
          });
        }
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        Alert.alert(t("common.error"), t("home.failedToUpload"));
      }
    }
  };

  // Debug logging
  console.log("HomeScreen render:", {
    authLoading,
    userLoading,
    hasUser: !!user,
    petPreference,
    profileCredits: profile?.credits,
  });

  // Show loading state only if auth is loading or no user
  if (authLoading || !user) {
    return (
      <LinearGradient
        colors={theme.colors.gradients.primary}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>🐕</Text>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.colors.gradients.primary}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.heroIconContainer}>
            <View style={styles.petImageContainer}>
              <Image
                source={petContent.image}
                style={styles.petImage}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={styles.welcomeText}>{petContent.petName} Hero AI</Text>
          <Text style={styles.subtitle}>{petContent.subtitle}</Text>
          <View style={styles.decorativeLine} />
        </View>

        {/* Credits Card */}
        <View style={styles.creditsCard}>
          <LinearGradient
            colors={theme.colors.gradients.light}
            style={styles.creditsGradient}
          >
            <View style={styles.creditsHeader}>
              <View style={styles.creditsIconContainer}>
                <Text style={styles.creditsIcon}>{petContent.emoji}</Text>
              </View>
              <View style={styles.creditsInfo}>
                <Text style={styles.creditsLabel}>{t("home.yourCredits")}</Text>
                <Text style={styles.creditsValue}>{profile?.credits || 0}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.buyCreditsButton}
              onPress={() => setShowPurchaseModal(true)}
            >
              <LinearGradient
                colors={theme.colors.gradients.error}
                style={styles.buyCreditsGradient}
              >
                <Text style={styles.buyCreditsIcon}>+</Text>
                <Text style={styles.buyCreditsText}>
                  {t("home.buyCredits")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Transform Pet Button */}
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              (!profile?.credits || profile.credits <= 0) &&
                styles.buttonDisabled,
            ]}
            onPress={handleUploadPhoto}
            disabled={isUploading || !profile?.credits || profile.credits <= 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !profile?.credits || profile.credits <= 0
                  ? theme.colors.gradients.disabled
                  : theme.colors.gradients.success
              }
              style={styles.primaryButtonGradient}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.primaryButtonIcon}>
                    {isUploading ? "⏳" : "📸"}
                  </Text>
                </View>
                <Text style={styles.primaryButtonText}>
                  {isUploading ? t("home.uploading") : petContent.actionText}
                </Text>
                <Text style={styles.primaryButtonSubtext}>
                  {isUploading
                    ? t("home.pleaseWait")
                    : petContent.actionSubtext}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate("Gallery")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.colors.gradients.light}
              style={styles.secondaryButtonGradient}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.secondaryButtonIcon}>🖼️</Text>
                </View>
                <Text style={styles.secondaryButtonText}>
                  {t("home.myHeroGallery")}
                </Text>
                <Text style={styles.secondaryButtonSubtext}>
                  {t("home.viewTransformations")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How it Works Section */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={theme.colors.gradients.light}
            style={styles.infoGradient}
          >
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>{t("home.howItWorks")}</Text>
            </View>

            <View style={styles.stepsContainer}>
              {[
                {
                  icon: "💎",
                  text: t("home.step1"),
                  color: theme.colors.secondary[500],
                },
                {
                  icon: "📸",
                  text: `${t("home.step2")}`,
                  color: theme.colors.accent[500],
                },
                {
                  icon: "🤖",
                  text: t("home.step3"),
                  color: theme.colors.primary[500],
                },
                {
                  icon: "🎉",
                  text: t("home.step4"),
                  color: theme.colors.warning[500],
                },
              ].map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepIcon,
                      {backgroundColor: step.color + "20"},
                    ]}
                  >
                    <Text style={styles.stepEmoji}>{step.icon}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      <PurchaseModal
        visible={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        products={products}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[5],
    paddingTop: 60,
    paddingBottom: theme.spacing[10],
  },

  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[8],
  },
  heroIconContainer: {
    marginBottom: theme.spacing[4],
  },
  petImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
  },
  petImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  heroOverlay: {
    position: "absolute",
    bottom: -5,
    right: -5,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  heroEmoji: {
    fontSize: theme.typography.sizes["2xl"],
  },
  welcomeText: {
    fontSize: theme.typography.sizes["4xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing[2],
    textAlign: "center",
    textShadowColor: blackWithOpacity(0.3),
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.9,
    fontFamily: theme.typography.fonts.medium,
    lineHeight: 22,
  },
  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing[4],
    borderRadius: 2,
    opacity: 0.8,
  },

  // Credits Card Styles
  creditsCard: {
    marginBottom: theme.spacing[6],
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  creditsGradient: {
    borderRadius: theme.borderRadius["2xl"],
    padding: theme.spacing[5],
  },
  creditsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  creditsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing[4],
  },
  creditsIcon: {
    fontSize: theme.typography.sizes["2xl"],
  },
  creditsInfo: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    marginBottom: theme.spacing[1],
    fontFamily: theme.typography.fonts.medium,
  },
  creditsValue: {
    fontSize: theme.typography.sizes["3xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray333,
  },
  buyCreditsButton: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.secondary[500],
    shadowColor: theme.colors.secondary[500],
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyCreditsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  buyCreditsIcon: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.white,
    fontFamily: theme.typography.fonts.bold,
    marginRight: theme.spacing[2],
  },
  buyCreditsText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.bold,
  },

  // Action Container
  actionContainer: {
    marginBottom: theme.spacing[8],
  },

  // Primary Action Button
  primaryActionButton: {
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: theme.colors.success[500],
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: "theme.colors.white",
  },
  primaryButtonGradient: {
    borderRadius: theme.borderRadius["2xl"],
    padding: theme.spacing[6],
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "theme.colors.white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  primaryButtonIcon: {
    fontSize: theme.typography.sizes["3xl"],
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    marginBottom: theme.spacing[1],
    textAlign: "center",
    textShadowColor: blackWithOpacity(0.5),
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  primaryButtonSubtext: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.medium,
    textAlign: "center",
    textShadowColor: blackWithOpacity(0.3),
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },

  // Secondary Action Button
  secondaryActionButton: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "theme.colors.white",
  },
  secondaryButtonGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
  },
  secondaryButtonIcon: {
    fontSize: theme.typography.sizes["2xl"],
  },
  secondaryButtonText: {
    color: theme.colors.gray[700],
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.bold,
    marginBottom: theme.spacing[1],
    textAlign: "center",
    textShadowColor: theme.colors.white,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  secondaryButtonSubtext: {
    color: theme.colors.gray[600],
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.medium,
    textAlign: "center",
    textShadowColor: theme.colors.white,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Info Card Styles
  infoCard: {
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoGradient: {
    borderRadius: theme.borderRadius["2xl"],
    padding: theme.spacing[6],
  },
  infoHeader: {
    marginBottom: theme.spacing[5],
  },
  infoTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray333,
    textAlign: "center",
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing[4],
  },
  stepEmoji: {
    fontSize: theme.typography.sizes.xl,
  },
  stepText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray333,
    fontFamily: theme.typography.fonts.semibold,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
    fontFamily: theme.typography.fonts.bold,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: theme.spacing[4],
  },
  loadingText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.semibold,
    textShadowColor: blackWithOpacity(0.3),
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
});
