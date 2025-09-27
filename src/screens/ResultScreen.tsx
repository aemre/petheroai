import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {useNavigation, useRoute, RouteProp} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import {AppDispatch, RootState} from "../store/store";
import {checkPhotoStatus, clearCurrentPhoto} from "../store/slices/photoSlice";
import {RootStackParamList} from "../navigation/AppNavigator";
import {useTranslation} from "../hooks/useTranslation";
import {theme} from "../theme";

type ResultScreenRouteProp = RouteProp<RootStackParamList, "Result">;
type ResultScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Result"
>;

const {width, height} = Dimensions.get("window");

export default function ResultScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const {photoId} = route.params;
  const {t} = useTranslation();

  const {currentPhoto} = useSelector((state: RootState) => state.photo);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (!currentPhoto && photoId) {
      dispatch(checkPhotoStatus(photoId));
    }
  }, [photoId, currentPhoto, dispatch]);

  const requestMediaLibraryPermission = async () => {
    const {status} = await MediaLibrary.requestPermissionsAsync();
    return status === "granted";
  };

  const handleDownload = async () => {
    if (!currentPhoto?.resultUrl) {
      Alert.alert(t("common.error"), t("result.noImageDownload"));
      return;
    }

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          t("result.permissionRequired"),
          t("result.permissionMessage")
        );
        return;
      }

      console.log("Downloading image from:", currentPhoto.resultUrl);

      // First, download the image to local storage
      const response = await fetch(currentPhoto.resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64WithoutPrefix = base64.split(",")[1];
          resolve(base64WithoutPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Create a temporary file
      const filename = `hero_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("Image saved to temp path:", tempPath);

      // Now save to photo library
      const asset = await MediaLibrary.createAssetAsync(tempPath);
      console.log("Asset created:", asset);

      // Try to create/add to album
      try {
        const album = await MediaLibrary.getAlbumAsync("Pet Hero AI");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("Pet Hero AI", asset, false);
        }
      } catch (albumError) {
        console.log(
          "Album creation/addition failed, but asset saved to gallery:",
          albumError
        );
        // Asset is still saved to gallery even if album operations fail
      }

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(tempPath);
      } catch (deleteError) {
        console.log("Failed to delete temp file:", deleteError);
      }

      Alert.alert(t("common.success"), t("result.savedSuccess"));
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(t("common.error"), t("result.saveFailed"));
    }
  };

  const handleShare = async () => {
    if (!currentPhoto?.resultUrl) {
      Alert.alert(t("common.error"), t("result.noImageShare"));
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t("common.error"), t("result.sharingUnavailable"));
        return;
      }

      console.log("Sharing image from:", currentPhoto.resultUrl);

      // Download image to local storage for sharing
      const response = await fetch(currentPhoto.resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64WithoutPrefix = base64.split(",")[1];
          resolve(base64WithoutPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Create a temporary file for sharing
      const filename = `hero_share_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(tempPath, {
        dialogTitle: "Share your Pet Hero transformation! 🦸‍♀️",
        mimeType: "image/jpeg",
      });

      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempPath);
        } catch (deleteError) {
          console.log("Failed to delete temp share file:", deleteError);
        }
      }, 5000); // 5 second delay to ensure sharing is complete
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert(t("common.error"), t("result.shareFailed"));
    }
  };

  const handleCreateAnother = () => {
    dispatch(clearCurrentPhoto());
    navigation.navigate("Home");
  };

  if (!currentPhoto || !currentPhoto.resultUrl) {
    return (
      <LinearGradient
        colors={["#F0F9FF", "#E0F2FE", "#BAE6FD"]}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>
          {t("result.loadingTransformation")}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#F0F9FF", "#E0F2FE", "#BAE6FD"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("result.title")}</Text>
          <Text style={styles.subtitle}>{t("result.subtitle")}</Text>
        </View>

        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <Text style={styles.imageLoadingText}>{t("common.loading")}</Text>
            </View>
          )}
          <Image
            source={{uri: currentPhoto.resultUrl}}
            style={styles.resultImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <Text style={styles.downloadIcon}>💾</Text>
            <Text style={styles.downloadText}>
              {t("result.downloadButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>📤</Text>
            <Text style={styles.shareText}>{t("result.shareButton")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.createAnotherButton}
            onPress={handleCreateAnother}
          >
            <Text style={styles.createAnotherText}>
              {t("result.createAnother")}
            </Text>
          </TouchableOpacity>

          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>{t("result.branding")}</Text>
          </View>
        </View>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: "#666",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: theme.typography.sizes["2xl"],
    fontFamily: theme.typography.fonts.bold,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: "#666",
    textAlign: "center",
  },
  imageContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[2],
    marginBottom: theme.spacing[6],
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: "relative",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    borderRadius: theme.borderRadius.xl,
  },
  imageLoadingText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: "#666",
  },
  resultImage: {
    width: width - 56,
    height: width - 56,
    borderRadius: theme.borderRadius.lg,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing[8],
  },
  downloadButton: {
    backgroundColor: "#4ECDC4",
    flex: 1,
    marginRight: theme.spacing[2],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  downloadIcon: {
    fontSize: theme.typography.sizes["2xl"],
    marginBottom: theme.spacing[1],
  },
  downloadText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
  },
  shareButton: {
    backgroundColor: "#FF6B6B",
    flex: 1,
    marginLeft: theme.spacing[2],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareIcon: {
    fontSize: theme.typography.sizes["2xl"],
    marginBottom: theme.spacing[1],
  },
  shareText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
  },
  bottomContainer: {
    alignItems: "center",
  },
  createAnotherButton: {
    backgroundColor: "#45B7D1",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[6],
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createAnotherText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
  },
  brandingContainer: {
    paddingVertical: theme.spacing[4],
  },
  brandingText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: "#999",
    textAlign: "center",
  },
});
