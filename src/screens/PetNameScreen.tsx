import React, {useState, useRef, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch} from "react-redux";
import {setOnboardingCompleted, setPetName} from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import {Language} from "../services/i18n";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import {theme} from "../theme";

const {width, height} = Dimensions.get("window");

interface PetNameScreenProps {
  navigation: any;
}

// Interface for animated letters
interface AnimatedLetter {
  id: string;
  letter: string;
  animation: Animated.Value;
  fadeAnimation: Animated.Value;
  isDeleting: boolean;
}

const PetNameScreen: React.FC<PetNameScreenProps> = ({navigation}) => {
  const [petName, setPetNameInput] = useState<string>("");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isValidName, setIsValidName] = useState(true);
  const [animatedLetters, setAnimatedLetters] = useState<AnimatedLetter[]>([]);
  const dispatch = useDispatch();
  const {t, changeLanguage, isRTL} = useTranslation();
  const textInputRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus the text input and open keyboard when component mounts
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle animated letters when text changes
  useEffect(() => {
    const currentText = petName;
    const previousLength = animatedLetters.length;
    const currentLength = currentText.length;

    if (currentLength > previousLength) {
      // Letter was added
      const newLetter = currentText[currentLength - 1];
      const letterObj: AnimatedLetter = {
        id: `${currentLength - 1}-${newLetter}-${Date.now()}`,
        letter: newLetter,
        animation: new Animated.Value(-80), // Start above screen
        fadeAnimation: new Animated.Value(1),
        isDeleting: false,
      };

      setAnimatedLetters((prev) => {
        // Add subtle bounce to existing letters
        prev.forEach((existingLetter, index) => {
          Animated.sequence([
            Animated.timing(existingLetter.animation, {
              toValue: -5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.spring(existingLetter.animation, {
              toValue: 0,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }),
          ]).start();
        });

        return [...prev, letterObj];
      });

      // Animate the new letter falling down with bounce
      Animated.sequence([
        Animated.timing(letterObj.animation, {
          toValue: 10, // Slight overshoot
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(letterObj.animation, {
          toValue: 0,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentLength < previousLength) {
      // Letter was deleted
      const lettersToDelete = animatedLetters.slice(currentLength);

      // Animate deletion of removed letters
      lettersToDelete.forEach((letter, index) => {
        Animated.parallel([
          Animated.timing(letter.fadeAnimation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(letter.animation, {
            toValue: -30,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Remove deleted letters after animation
      setTimeout(() => {
        setAnimatedLetters((prev) => prev.slice(0, currentLength));
      }, 150);
    } else if (currentLength === previousLength) {
      // Text length same, but content might have changed (e.g., character replacement)
      const updatedLetters = currentText.split("").map((letter, index) => {
        if (
          index < animatedLetters.length &&
          animatedLetters[index].letter !== letter
        ) {
          // Letter was replaced
          return {
            ...animatedLetters[index],
            letter,
            id: `${index}-${letter}-${Date.now()}`, // New ID for replaced letter
          };
        }
        return (
          animatedLetters[index] || {
            id: `${index}-${letter}-${Date.now()}`,
            letter,
            animation: new Animated.Value(0),
            fadeAnimation: new Animated.Value(1),
            isDeleting: false,
          }
        );
      });

      setAnimatedLetters(updatedLetters);
    }
  }, [petName]);

  // Validate name input
  useEffect(() => {
    const trimmedName = petName.trim();
    if (trimmedName.length === 0) {
      setIsValidName(true);
      return;
    }

    // Check if name contains only letters and spaces
    const isValid =
      /^[a-zA-Z\s]+$/.test(trimmedName) && trimmedName.length >= 2;
    setIsValidName(isValid);
  }, [petName]);

  const handleNameChange = (text: string) => {
    setPetNameInput(text);
    // Haptic feedback on typing
    if (text.length > petName.length) {
      ReactNativeHapticFeedback.trigger("impactLight");
    }
  };

  const handleContinue = async () => {
    if (!petName.trim() || !isValidName) return;

    try {
      // Haptic feedback for success
      ReactNativeHapticFeedback.trigger("notificationSuccess");

      // Save pet name to Redux store
      dispatch(setPetName(petName.trim()));

      // Persist pet name to AsyncStorage
      await AsyncStorage.setItem("petName", petName.trim());

      // Navigate to age screen
      navigation.navigate("PetAge");
    } catch (error) {
      console.error("Error saving pet name:", error);
      ReactNativeHapticFeedback.trigger("notificationError");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Render animated letter cubes
  const renderAnimatedLetters = () => {
    return (
      <View style={styles.animatedLettersContainer}>
        {animatedLetters.map((letterObj, index) => (
          <Animated.View
            key={letterObj.id}
            style={[
              styles.letterCube,
              {
                opacity: letterObj.fadeAnimation,
                transform: [
                  {
                    translateY: letterObj.animation,
                  },
                  {
                    scale: letterObj.fadeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.letterText}>
              {letterObj.letter === " " ? "␣" : letterObj.letter.toUpperCase()}
            </Text>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
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

          <Animated.View
            style={[
              styles.content,
              isRTL() && styles.contentRTL,
              {
                opacity: fadeAnim,
                transform: [{scale: scaleAnim}],
              },
            ]}
          >
            {/* Question Text */}
            <Text style={[styles.questionText, isRTL() && styles.textRTL]}>
              {t("onboarding.petNameQuestion")}
            </Text>

            {/* Animated Letter Cubes Display */}
            {renderAnimatedLetters()}

            {/* Premium Name Input Container */}
            <View
              style={[
                styles.inputContainer,
                !isValidName && petName.trim().length > 0 && styles.inputError,
              ]}
            >
              <TextInput
                ref={textInputRef}
                style={[styles.textInput, isRTL() && styles.textInputRTL]}
                value={petName}
                onChangeText={handleNameChange}
                placeholder={t("onboarding.petNamePlaceholder")}
                placeholderTextColor="#A0AEC0"
                autoFocus={false}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                maxLength={20}
              />
              {/* Input validation indicator */}
              {petName.trim().length > 0 && (
                <View style={styles.validationIndicator}>
                  <Text
                    style={[
                      styles.validationIcon,
                      {color: isValidName ? "#10B981" : "#EF4444"},
                    ]}
                  >
                    {isValidName ? "✓" : "✗"}
                  </Text>
                </View>
              )}
            </View>

            {/* Validation feedback */}
            {!isValidName && petName.trim().length > 0 && (
              <Text style={[styles.errorText, isRTL() && styles.textRTL]}>
                {t("onboarding.nameValidationError")}
              </Text>
            )}

            {/* Character count with better styling */}
            <Text style={[styles.characterCount, isRTL() && styles.textRTL]}>
              {petName.length}/20 {petName.length >= 18 && "⚠️"}
            </Text>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!petName.trim() || !isValidName) && styles.disabledButton,
                isRTL() && styles.continueButtonRTL,
              ]}
              onPress={handleContinue}
              disabled={!petName.trim() || !isValidName}
            >
              <Text
                style={[styles.continueButtonText, isRTL() && styles.textRTL]}
              >
                {t("common.continue")}
                {isValidName && petName.trim() ? "✨" : ""}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>

        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
          onLanguageSelect={(language: Language) => {
            changeLanguage(language);
          }}
        />
      </LinearGradient>
    </TouchableWithoutFeedback>
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
    justifyContent: "center",
    paddingHorizontal: theme.spacing[8],
    paddingTop: height * 0.1,
    paddingBottom: 50,
  },
  questionText: {
    fontSize: theme.typography.sizes["4xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray[600],
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 60,
  },
  inputContainer: {
    marginBottom: theme.spacing[5],
    alignItems: "center",
    position: "relative",
  },
  inputError: {
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  textInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: theme.spacing[5],
    paddingRight: 55, // Make room for validation indicator
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray[600],
    textAlign: "center",
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  textInputRTL: {
    textAlign: "center", // Keep center alignment for RTL
  },
  characterCount: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: "#718096",
    textAlign: "center",
    marginBottom: theme.spacing[10],
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
    fontWeight: "bold",
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
  validationIndicator: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{translateY: -10}],
  },
  validationIcon: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "bold",
  },
  errorText: {
    color: theme.colors.error[500],
    fontSize: theme.typography.sizes.base,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },
  animatedLettersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
    marginBottom: theme.spacing[5],
    paddingHorizontal: theme.spacing[5],
  },
  letterCube: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: theme.spacing[1],
    marginVertical: 3,
    shadowColor: theme.colors.primary[500],
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(139, 92, 246, 0.5)",
    borderTopColor: theme.colors.white, // 3D effect
    borderLeftColor: theme.colors.white,
    borderBottomColor: "rgba(139, 92, 246, 0.7)",
    borderRightColor: "rgba(139, 92, 246, 0.6)",
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: theme.typography.sizes["2xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray[600],
    textAlign: "center",
  },
});

export default PetNameScreen;
