import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {setPetSpecies, setOnboardingCompleted} from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from "../hooks/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import PurchaseModal from "../components/PurchaseModal";
import {Language} from "../services/i18n";
import IAPService from "../services/iap";
import {RootState} from "../store/store";
import petData from "../data.json";
import {theme} from "../theme";

const {width, height} = Dimensions.get("window");

interface PetSpeciesScreenProps {
  navigation: any;
}

const PetSpeciesScreen: React.FC<PetSpeciesScreenProps> = ({navigation}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const dispatch = useDispatch();
  const {t, changeLanguage, isRTL} = useTranslation();
  const {petPreference} = useSelector((state: RootState) => state.user);

  // Get species data based on pet preference
  const getSpeciesData = () => {
    switch (petPreference) {
      case "dog":
        return petData.dogs || [];
      case "cat":
        return petData.cats || [];
      case "bird":
        return petData.birds || [];
      default:
        return [];
    }
  };

  const speciesData = getSpeciesData();

  // Initialize IAP products
  useEffect(() => {
    initializeIAP();
  }, []);

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

  // Filter species based on search query
  const filteredSpecies = speciesData.filter((species: any) =>
    species.english.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpeciesSelect = (species: string) => {
    setSelectedSpecies(species);
  };

  const handleContinue = async () => {
    if (!selectedSpecies) return;

    try {
      // Save pet species to Redux store
      dispatch(setPetSpecies(selectedSpecies));

      // Persist pet species to AsyncStorage
      await AsyncStorage.setItem("petSpecies", selectedSpecies);

      // Navigate to name screen
      navigation.navigate("PetName");
    } catch (error) {
      console.error("Error saving pet species:", error);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed
      dispatch(setOnboardingCompleted(true));

      // Save empty values for all remaining onboarding steps
      dispatch(setPetSpecies(""));

      // Persist onboarding completion and empty values to AsyncStorage
      await AsyncStorage.setItem("onboardingCompleted", "true");
      await AsyncStorage.setItem("petSpecies", "");
      await AsyncStorage.setItem("petName", "");
      await AsyncStorage.setItem("petAge", "");
      await AsyncStorage.setItem("petWeight", "");

      // Navigate directly to main app and show purchase modal
      console.log(
        "🎯 PetSpeciesScreen (skip): Navigating to MainApp with showPurchaseModal: true"
      );
      navigation.replace("MainApp", {showPurchaseModal: true});
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      // Still navigate to home even if storage fails
      navigation.replace("MainApp");
    }
  };

  const getQuestionText = () => {
    switch (petPreference) {
      case "dog":
        return t("onboarding.dogSpeciesQuestion");
      case "cat":
        return t("onboarding.catSpeciesQuestion");
      case "bird":
        return t("onboarding.birdSpeciesQuestion");
      default:
        return t("onboarding.speciesQuestion");
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
            {getQuestionText()}
          </Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, isRTL() && styles.searchInputRTL]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("onboarding.searchSpecies")}
              placeholderTextColor="#A0AEC0"
            />
          </View>

          {/* Species List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.speciesContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredSpecies.length > 0 ? (
              filteredSpecies.map((species: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.speciesButton,
                    selectedSpecies === species.english &&
                      styles.selectedSpecies,
                  ]}
                  onPress={() => handleSpeciesSelect(species.english)}
                >
                  <Text
                    style={[
                      styles.speciesButtonText,
                      selectedSpecies === species.english &&
                        styles.selectedSpeciesText,
                      isRTL() && styles.textRTL,
                    ]}
                  >
                    {species.english}
                  </Text>
                  <Text
                    style={[
                      styles.speciesLatinText,
                      selectedSpecies === species.english &&
                        styles.selectedSpeciesText,
                      isRTL() && styles.textRTL,
                    ]}
                  >
                    {species.latin}
                  </Text>
                  <Text
                    style={[
                      styles.speciesLifespanText,
                      selectedSpecies === species.english &&
                        styles.selectedSpeciesText,
                      isRTL() && styles.textRTL,
                    ]}
                  >
                    {t("onboarding.lifespan")}: {species.lifespan}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noResultsText, isRTL() && styles.textRTL]}>
                {t("onboarding.noSpeciesFound")}
              </Text>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Skip Button */}
            <TouchableOpacity
              style={[styles.skipButton, isRTL() && styles.skipButtonRTL]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, isRTL() && styles.textRTL]}>
                {t("common.skip")} All
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedSpecies && styles.disabledButton,
                isRTL() && styles.continueButtonRTL,
              ]}
              onPress={handleContinue}
              disabled={!selectedSpecies}
            >
              <Text
                style={[styles.continueButtonText, isRTL() && styles.textRTL]}
              >
                {t("common.continue")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageSelect={(language: Language) => {
          changeLanguage(language);
        }}
      />

      <PurchaseModal
        visible={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        products={products}
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
    paddingHorizontal: theme.spacing[8],
    paddingTop: height * 0.1,
    paddingBottom: 30,
  },
  questionText: {
    fontSize: theme.typography.sizes["2xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray[600],
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 30,
  },
  searchContainer: {
    marginBottom: theme.spacing[5],
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius["2xl"],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: 15,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray[600],
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  searchInputRTL: {
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
    marginBottom: theme.spacing[5],
  },
  speciesContainer: {
    paddingBottom: theme.spacing[5],
  },
  speciesButton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
    marginBottom: theme.spacing[3],
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedSpecies: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[500],
  },
  speciesButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "bold",
    color: theme.colors.gray[600],
    marginBottom: theme.spacing[1],
  },
  speciesLatinText: {
    fontSize: theme.typography.sizes.base,
    fontStyle: "italic",
    color: "#718096",
    marginBottom: 2,
  },
  speciesLifespanText: {
    fontSize: theme.typography.sizes.sm,
    color: "#A0AEC0",
  },
  selectedSpeciesText: {
    color: theme.colors.white,
  },
  noResultsText: {
    fontSize: theme.typography.sizes.md,
    color: "#718096",
    textAlign: "center",
    marginTop: theme.spacing[10],
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
  },
  skipButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    flex: 1,
  },
  skipButtonRTL: {
    alignSelf: "center",
  },
  skipButtonText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: "center",
    flex: 1,
    shadowColor: theme.colors.black,
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
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
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
    shadowColor: theme.colors.black,
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

export default PetSpeciesScreen;
