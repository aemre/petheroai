import React from "react";
import {View, Text, StyleSheet, SafeAreaView} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useTranslation} from "../hooks/useTranslation";

const VaccineCardScreen: React.FC = () => {
  const {t} = useTranslation();

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#f093fb"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>🏥 Vaccine Card</Text>
          <Text style={styles.subtitle}>
            Keep track of your pet's vaccination history
          </Text>
          <Text style={styles.comingSoon}>Coming Soon!</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "500",
    lineHeight: 24,
    marginBottom: 32,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
});

export default VaccineCardScreen;
