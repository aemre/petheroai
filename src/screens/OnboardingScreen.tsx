import React, {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch} from "react-redux";
import {
  setOnboardingCompleted,
  setPetPreference,
} from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import {Language} from "../services/i18n";
import {theme} from "../theme";

const {width, height} = Dimensions.get("window");

type PetPreference = "dog" | "cat" | "bird";

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({navigation}) => {
  const [selectedPreference, setSelectedPreference] =
    useState<PetPreference | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const dispatch = useDispatch();
  const {t, changeLanguage, isRTL} = useTranslation();

  const handlePreferenceSelect = (preference: PetPreference) => {
    setSelectedPreference(preference);
  };

  const handleContinue = async () => {
    if (!selectedPreference) return;

    try {
      // Save preference to Redux store
      dispatch(setPetPreference(selectedPreference));

      // Persist preference to AsyncStorage
      await AsyncStorage.setItem("petPreference", selectedPreference);

      // Navigate to species selection screen
      navigation.navigate("PetSpecies");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  };

  return (
    <LinearGradient
      colors={["#E8D5FF", "#D4A5FF", "#C084FC"]}
      style={styles.container}
    >
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
            {t("onboarding.question")}
          </Text>

          {/* Pet Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === "cat" && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect("cat")}
            >
              <Image
                source={require("../../assets/cat.jpg")}
                style={styles.petImage}
                resizeMode="cover"
              />
              <Text style={styles.petLabel}>{t("common.cat")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === "dog" && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect("dog")}
            >
              <Image
                source={require("../../assets/dog.jpg")}
                style={styles.petImage}
                resizeMode="cover"
              />
              <Text style={styles.petLabel}>{t("common.dog")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === "bird" && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect("bird")}
            >
              <View style={styles.birdIconContainer}>
                <Text style={styles.birdIcon}>🦅</Text>
              </View>
              <Text style={styles.petLabel}>{t("common.bird")}</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedPreference && styles.disabledButton,
              isRTL() && styles.continueButtonRTL,
            ]}
            onPress={handleContinue}
            disabled={!selectedPreference}
          >
            <Text
              style={[styles.continueButtonText, isRTL() && styles.textRTL]}
            >
              {t("onboarding.getStarted")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageSelect={(language: Language) => {
          changeLanguage(language);
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: "space-between",

    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  questionText: {
    fontSize: theme.typography.sizes["5xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray[600],
    textAlign: "center",
    lineHeight: 45,
    marginBottom: 60,
  },
  optionsContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: theme.spacing[10],
  },
  optionButton: {
    backgroundColor: "#FFF5E6",
    borderRadius: theme.borderRadius["2xl"],
    width: width * 0.28,
    height: width * 0.32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "transparent",
    paddingVertical: theme.spacing[2],
  },
  selectedOption: {
    borderColor: theme.colors.primary[500],
    transform: [{scale: 1.05}],
  },
  petImage: {
    width: "80%",
    height: "65%",
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing[1],
  },
  petLabel: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray[600],
    textAlign: "center",
  },
  birdIconContainer: {
    width: "80%",
    height: "65%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing[1],
  },
  birdIcon: {
    fontSize: theme.typography.sizes["6xl"],
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
    backgroundColor: theme.colors.white,
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

export default OnboardingScreen;
