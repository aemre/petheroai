import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useNavigation} from "@react-navigation/native";
import {useTranslation} from "../hooks/useTranslation";
import {useSelector} from "react-redux";
import {RootState} from "../store/store";
import * as ImagePicker from "expo-image-picker";

const CreateAnimationScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {profile} = useSelector((state: RootState) => state.user);

  const requestCameraPermission = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const requestMediaLibraryPermission = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const handleCreateAnimation = () => {
    if (!profile || profile.credits <= 0) {
      Alert.alert(
        "No Credits",
        "You need credits to create animations. Please purchase credits first.",
        [
          {text: "Cancel", style: "cancel"},
          {
            text: "Buy Credits",
            onPress: () => navigation.navigate("HomeTab" as never),
          },
        ]
      );
      return;
    }

    Alert.alert("Create Animation", "Choose how to add your pet's photo", [
      {text: "Camera", onPress: () => handleImageSelection(true)},
      {text: "Gallery", onPress: () => handleImageSelection(false)},
      {text: "Cancel", style: "cancel"},
    ]);
  };

  const handleImageSelection = async (useCamera: boolean) => {
    try {
      let hasPermission = false;

      if (useCamera) {
        hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert("Permission Needed", "Camera permission is required");
          return;
        }
      } else {
        hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Needed",
            "Photo library permission is required"
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Navigate back to Home tab and trigger the upload process
        navigation.navigate("HomeTab" as never);
        // You can add additional logic here to trigger the upload
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  return (
    <LinearGradient
      colors={["#4ecdc4", "#44a08d", "#093637"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎬</Text>
          </View>
          <Text style={styles.title}>Create Animation</Text>
          <Text style={styles.subtitle}>
            Transform your pet into an amazing hero!
          </Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAnimation}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#ff6b6b", "#ff8e8e"]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonIcon}>📸</Text>
              <Text style={styles.buttonText}>Start Creating</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.creditsInfo}>
            <Text style={styles.creditsText}>
              Credits: {profile?.credits || 0}
            </Text>
          </View>
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
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
    marginBottom: 40,
  },
  createButton: {
    borderRadius: 25,
    shadowColor: "#ff6b6b",
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 32,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  creditsInfo: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  creditsText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CreateAnimationScreen;
