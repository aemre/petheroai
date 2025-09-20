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
    fontSize: 24,
    color: "#B794F6",
    opacity: 0.6,
    transform: [{rotate: "-15deg"}],
  },
  pawTopRight: {
    position: "absolute",
    top: 80,
    right: 40,
    fontSize: 20,
    color: "#B794F6",
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
    fontSize: 36,
    fontWeight: "bold",
    color: "#4A5568",
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
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: "#FFF5E6",
    borderRadius: 20,
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
    paddingVertical: 8,
  },
  selectedOption: {
    borderColor: "#8B5CF6",
    transform: [{scale: 1.05}],
  },
  petImage: {
    width: "80%",
    height: "65%",
    borderRadius: 16,
    marginBottom: 4,
  },
  petLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A5568",
    textAlign: "center",
  },
  birdIconContainer: {
    width: "80%",
    height: "65%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 16,
    marginBottom: 4,
  },
  birdIcon: {
    fontSize: 48,
  },
  continueButton: {
    backgroundColor: "#8B5CF6",
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
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  languageButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    fontSize: 24,
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
