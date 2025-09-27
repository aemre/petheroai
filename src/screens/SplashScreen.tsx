import React, {useEffect} from "react";
import {View, Text, StyleSheet, ActivityIndicator, Image} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "../store/store";
import {checkAuthStateThunk} from "../store/slices/authSlice";
import {fetchUserProfile} from "../store/slices/userSlice";
import {useTranslation} from "../hooks/useTranslation";
import {theme} from "../theme";

export default function SplashScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {isLoading, error} = useSelector((state: RootState) => state.auth);
  const {t} = useTranslation();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("SplashScreen: Checking auth state...");
        const result = await dispatch(checkAuthStateThunk()).unwrap();
        if (result?.uid) {
          console.log(
            "SplashScreen: Loading user profile for uid:",
            result.uid
          );
          await dispatch(fetchUserProfile(result.uid));
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <LinearGradient
      colors={["#FFE5E5", "#FFB3B3", "#FF8A80"]}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/appstore.jpeg")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t("app.name")}</Text>
        <Text style={styles.subtitle}>{t("app.tagline")}</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary[500]} />
        <Text style={styles.loadingText}>
          {error ? t("common.connectionError") : t("common.loading")}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[5],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 100,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing[5],
    borderRadius: theme.borderRadius["2xl"],
  },
  title: {
    fontSize: theme.typography.sizes["4xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.secondary[500],
    marginBottom: 10,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray666,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing[4],
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray666,
  },
});
