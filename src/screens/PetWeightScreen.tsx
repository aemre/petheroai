import React, {useState, useRef, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {setOnboardingCompleted, setPetWeight} from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import {Language} from "../services/i18n";
import WeightPicker from "../components/WeightPicker";
import {moderateVerticalScale} from "../utils/normalize";
import {DEVICE_WIDTH} from "../utils/dimensions";
import {
  updateUserProfileWithOnboarding,
  OnboardingData,
} from "../services/firebase";
import {RootState} from "../store/store";
import auth from "@react-native-firebase/auth";
import {theme} from "../theme";

const {width, height} = Dimensions.get("window");

interface PetWeightScreenProps {
  navigation: any;
}

const PetWeightScreen: React.FC<PetWeightScreenProps> = ({navigation}) => {
  const [selectedWeight, setSelectedWeight] = useState<number>(10);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGradient, setCurrentGradient] = useState<
    [string, string, string]
  >(["#E8D5FF", "#D4A5FF", "#C084FC"]);
  const [nextGradient, setNextGradient] = useState<[string, string, string]>([
    "#E8D5FF",
    "#D4A5FF",
    "#C084FC",
  ]);
  const fadeAnim = useRef(new Animated.Value(0)).current; // 0 = show current, 1 = show next
  const dispatch = useDispatch();
  const {t, changeLanguage, isRTL} = useTranslation();

  // Function to get gradient colors based on weight
  const getGradientColors = (weight: number): [string, string, string] => {
    if (weight <= 5) {
      // Very small pets - Light, delicate colors (soft pastels)
      return ["#FFF0F5", "#FFE4E1", "#FFB6C1"];
    } else if (weight <= 15) {
      // Small pets - Gentle, bright colors (light blues and greens)
      return ["#E0F6FF", "#87CEEB", "#4682B4"];
    } else if (weight <= 30) {
      // Medium pets - Original balanced colors (purple theme)
      return ["#E8D5FF", "#D4A5FF", "#C084FC"];
    } else if (weight <= 50) {
      // Large pets - Strong, confident colors (deeper purples)
      return ["#DDD6FE", "#A78BFA", "#7C3AED"];
    } else {
      // Very large pets - Bold, powerful colors (deep blues and purples)
      return ["#C7D2FE", "#818CF8", "#4F46E5"];
    }
  };

  // Get all onboarding data from Redux store
  const {petPreference, petSpecies, petName, petAge} = useSelector(
    (state: RootState) => state.user
  );

  // Animate gradient transition when weight changes
  useEffect(() => {
    const newColors = getGradientColors(selectedWeight);
    if (JSON.stringify(newColors) !== JSON.stringify(currentGradient)) {
      // Set the next gradient to the new colors
      setNextGradient(newColors);

      // Animate cross-fade from current to next
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        // After animation completes, swap the gradients
        setCurrentGradient(newColors);
        setNextGradient(currentGradient);
        fadeAnim.setValue(0);
      });
    }
  }, [selectedWeight, currentGradient, fadeAnim]);

  const handleWeightChange = (weight: number) => {
    setSelectedWeight(weight);
  };

  const handleContinue = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // Save pet weight to Redux store (convert to string for consistency)
      dispatch(setPetWeight(selectedWeight.toString()));
      dispatch(setOnboardingCompleted(true));

      // Persist onboarding completion and pet weight to AsyncStorage
      await AsyncStorage.setItem("onboardingCompleted", "true");
      await AsyncStorage.setItem("petWeight", selectedWeight.toString());

      // Get current user
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Prepare onboarding data for Firebase
      if (!petPreference || !petSpecies || !petName || petAge === null) {
        throw new Error("Missing onboarding data");
      }

      const onboardingData: OnboardingData = {
        petPreference,
        petSpecies,
        petName,
        petAge,
        petWeight: selectedWeight.toString(),
      };

      // Save all onboarding data to Firebase
      await updateUserProfileWithOnboarding(currentUser.uid, onboardingData);

      console.log(
        "✅ Onboarding completed and saved to Firebase:",
        onboardingData
      );

      // Navigate to main app and show purchase modal
      console.log(
        "🎯 PetWeightScreen: Navigating to MainApp with showPurchaseModal: true"
      );
      navigation.replace("MainApp", {showPurchaseModal: true});
    } catch (error) {
      console.error("❌ Error completing onboarding:", error);
      // Still navigate to home even if Firebase update fails and show purchase modal
      console.log(
        "🎯 PetWeightScreen (error): Navigating to MainApp with showPurchaseModal: true"
      );
      navigation.replace("MainApp", {showPurchaseModal: true});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Base gradient - always visible */}
      <LinearGradient
        colors={currentGradient}
        style={styles.absoluteGradient}
      />

      {/* Overlay gradient - fades in/out for smooth transitions */}
      <Animated.View style={[styles.absoluteGradient, {opacity: fadeAnim}]}>
        <LinearGradient colors={nextGradient} style={styles.container} />
      </Animated.View>

      {/* Content layer */}
      <SafeAreaView style={styles.safeArea}>
        {/* Language Selector Button */}
        <TouchableOpacity
          style={[styles.languageButton, isRTL() && styles.languageButtonRTL]}
          onPress={() => setShowLanguageSelector(true)}
        >
          <Text style={styles.languageIcon}>🌐</Text>
        </TouchableOpacity>

        {/* Decorative paw prints */}
        <Text style={styles.pawTop}>🐾</Text>
        <Text style={styles.pawTopRight}>🐾</Text>

        <View style={[styles.content, isRTL() && styles.contentRTL]}>
          {/* Question Text */}
          <Text style={[styles.questionText, isRTL() && styles.textRTL]}>
            {t("onboarding.weightQuestion")}
          </Text>

          {/* Weight Picker */}
          <View style={styles.pickerContainer}>
            <WeightPicker
              onChange={handleWeightChange}
              min={1}
              max={100}
              initialWeight={selectedWeight}
              type="kg"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.disabledButton,
              isRTL() && styles.continueButtonRTL,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text
              style={[styles.continueButtonText, isRTL() && styles.textRTL]}
            >
              {isLoading ? t("common.loading") : t("onboarding.complete")}
            </Text>
          </TouchableOpacity>
        </View>

        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
          onLanguageSelect={(language: Language) => {
            changeLanguage(language);
          }}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    position: "relative",
  },
  pawTop: {
    position: "absolute",
    top: 60,
    left: 50,
    fontSize: theme.typography.sizes["2xl"],
    color: theme.colors.primary[300],
    opacity: 0.6,
    transform: [{rotate: "-15deg"}],
  },
  pawTopRight: {
    position: "absolute",
    top: 80,
    right: 40,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.primary[300],
    opacity: 0.5,
    transform: [{rotate: "20deg"}],
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[8],
    paddingTop: height * 0.08,
    paddingBottom: 30,
  },
  questionText: {
    fontSize: theme.typography.sizes["3xl"],
    fontFamily: theme.typography.fonts.bold,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 30,
  },
  pickerContainer: {
    flex: 1,
    marginTop: moderateVerticalScale(20),
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: DEVICE_WIDTH,
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 60,
    alignItems: "center",
    alignSelf: "center",
    minWidth: width * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#A0AEC0",
    opacity: 0.6,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
  },
  languageButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "theme.colors.white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  languageButtonRTL: {
    right: "auto",
    left: 20,
  },
  languageIcon: {
    fontSize: theme.typography.sizes["2xl"],
  },
  textRTL: {
    textAlign: "right",
  },
  contentRTL: {
    alignItems: "flex-end",
  },
  continueButtonRTL: {
    alignSelf: "center",
  },
});

export default PetWeightScreen;
