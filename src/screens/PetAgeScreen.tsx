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
import {useDispatch} from "react-redux";
import {setPetAge} from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import {Language} from "../services/i18n";
import AgePicker from "../components/AgePicker";
import {moderateVerticalScale} from "../utils/normalize";
import {DEVICE_WIDTH} from "../utils/dimensions";
import {theme} from "../theme";

const {width, height} = Dimensions.get("window");

interface PetAgeScreenProps {
  navigation: any;
}

const PetAgeScreen: React.FC<PetAgeScreenProps> = ({navigation}) => {
  const [selectedAge, setSelectedAge] = useState<number>(1);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentGradient, setCurrentGradient] = useState<
    [string, string, string]
  >(["#FFE4E6", "#FBB6CE", "#F687B3"]);
  const [nextGradient, setNextGradient] = useState<[string, string, string]>([
    "#FFE4E6",
    "#FBB6CE",
    "#F687B3",
  ]);
  const fadeAnim = useRef(new Animated.Value(0)).current; // 0 = show current, 1 = show next
  const dispatch = useDispatch();
  const {t, changeLanguage, isRTL} = useTranslation();

  // Function to get gradient colors based on age
  const getGradientColors = (age: number): [string, string, string] => {
    if (age <= 1) {
      // Puppy - Light, playful colors (light pink to light purple)
      return ["#FFE4E6", "#FBB6CE", "#F687B3"];
    } else if (age <= 3) {
      // Young - Bright, energetic colors (light blue to purple)
      return ["#E0F2FE", "#A7F3D0", "#6EE7B7"];
    } else if (age <= 7) {
      // Adult - Original gradient (purple theme)
      return ["#E8D5FF", "#D4A5FF", "#C084FC"];
    } else if (age <= 12) {
      // Mature - Deeper, more sophisticated colors
      return ["#DDD6FE", "#C4B5FD", "#A78BFA"];
    } else {
      // Senior - Warm, gentle colors (golden to orange)
      return ["#FEF3C7", "#FCD34D", "#F59E0B"];
    }
  };

  // Animate gradient transition when age changes
  useEffect(() => {
    const newColors = getGradientColors(selectedAge);
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
  }, [selectedAge, currentGradient, fadeAnim]);

  const handleAgeChange = (age: number) => {
    setSelectedAge(age);
  };

  const handleContinue = async () => {
    try {
      // Save pet age to Redux store
      dispatch(setPetAge(selectedAge));

      // Persist pet age to AsyncStorage
      await AsyncStorage.setItem("petAge", selectedAge.toString());

      // Navigate to weight screen
      navigation.navigate("PetWeight");
    } catch (error) {
      console.error("Error saving pet age:", error);
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
            {t("onboarding.ageQuestion")}
          </Text>

          {/* Age Picker */}
          <View style={styles.pickerContainer}>
            <AgePicker
              onChange={handleAgeChange}
              min={0}
              max={25}
              initialHeight={selectedAge}
              type="number"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isRTL() && styles.continueButtonRTL]}
            onPress={handleContinue}
          >
            <Text
              style={[styles.continueButtonText, isRTL() && styles.textRTL]}
            >
              {t("common.continue")}
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
    color: theme.colors.gray[600],
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
    marginBottom: 30,
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

export default PetAgeScreen;
