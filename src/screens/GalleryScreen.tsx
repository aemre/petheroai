import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {useNavigation} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";

import {AppDispatch, RootState} from "../store/store";
import {TabParamList} from "../navigation/TabNavigator";
import {getUserPhotos} from "../services/firebase";
import {deleteUserPhoto} from "../services/cloudFunctions";
import {uploadAndProcessPhoto} from "../store/slices/photoSlice";
import AnimatedGalleryItem from "../components/AnimatedGalleryItem";
import {useTranslation} from "../hooks/useTranslation";
import {theme} from "../theme";

type GalleryScreenNavigationProp = StackNavigationProp<TabParamList, "Gallery">;

const {width} = Dimensions.get("window");
const itemSize = (width - 48) / 2; // 2 columns with padding

interface GalleryItem {
  id: string;
  originalUrl: string;
  resultUrl: string;
  theme: string;
  createdAt: string;
  status: "processing" | "done" | "error";
}

export default function GalleryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const {user} = useSelector((state: RootState) => state.auth);
  const {profile} = useSelector((state: RootState) => state.user);
  const {t, isRTL} = useTranslation();

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  // Image picker functions
  const requestCameraPermission = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const requestMediaLibraryPermission = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let hasPermission = false;

      if (useCamera) {
        hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(t("home.permissionNeeded"), t("home.cameraPermission"));
          return;
        }
      } else {
        hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) {
          Alert.alert(
            t("home.permissionNeeded"),
            t("home.photoLibraryPermission")
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
            exif: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false,
          });

      if (result && !result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      const errorMessage = error?.message || t("home.failedToSelectImage");
      Alert.alert(t("common.error"), errorMessage);
    }
  };

  const handleImageSelection = async (useCamera: boolean) => {
    const imageUri = await pickImage(useCamera);
    if (imageUri && user?.uid) {
      try {
        if (!profile || profile.credits <= 0) {
          Alert.alert(t("home.noCredits"), t("home.needCredits"));
          return;
        }

        console.log(
          "Uploading image for processing. Credits will be deducted automatically upon completion."
        );
        const result = await dispatch(
          uploadAndProcessPhoto({
            uri: imageUri,
            userId: user.uid,
          })
        ).unwrap();

        if (result?.id) {
          console.log("Image uploaded successfully:", result.id);
          navigation.navigate("Processing", {
            photoId: result.id,
            originalImageUri: imageUri,
          });
        }
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        Alert.alert(t("common.error"), t("home.failedToUpload"));
      }
    }
  };

  const handleCreateHero = async () => {
    if (!profile || profile.credits <= 0) {
      Alert.alert(t("home.noCredits"), t("home.needCredits"));
      return;
    }

    Alert.alert(t("home.selectPhoto"), t("home.selectPhotoMethod"), [
      {text: t("common.camera"), onPress: () => handleImageSelection(true)},
      {text: t("common.gallery"), onPress: () => handleImageSelection(false)},
      {text: t("common.cancel"), style: "cancel"},
    ]);
  };

  const loadGalleryItems = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      console.log("Loading gallery for user:", user.uid);

      const photos = await getUserPhotos(user.uid);

      const galleryData: GalleryItem[] = photos.map((photo: any) => ({
        id: photo.id,
        originalUrl: photo.originalUrl,
        resultUrl: photo.resultUrl,
        theme: photo.theme,
        createdAt: photo.createdAt,
        status: photo.status,
      }));

      console.log(`Loaded ${galleryData.length} photos`);
      setGalleryItems(galleryData);
    } catch (error) {
      console.error("Error loading gallery:", error);
      Alert.alert(t("common.error"), t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGalleryItems();
    setRefreshing(false);
  };

  const handleItemPress = (item: GalleryItem) => {
    if (item.status === "done") {
      navigation.navigate("Result", {photoId: item.id});
    } else if (item.status === "processing") {
      navigation.navigate("Processing", {photoId: item.id});
    }
  };

  const handleDeleteItem = (item: GalleryItem) => {
    Alert.alert(
      t("gallery.deleteConfirmTitle"),
      t("gallery.deleteConfirmMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("gallery.delete"),
          style: "destructive",
          onPress: () => performDelete(item),
        },
      ],
      {cancelable: true}
    );
  };

  const performDelete = async (item: GalleryItem) => {
    try {
      console.log("Deleting photo:", item.id);
      await deleteUserPhoto(item.id);

      // Remove item from local state
      setGalleryItems((prev) => prev.filter((photo) => photo.id !== item.id));

      Alert.alert(t("common.success"), t("gallery.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting photo:", error);
      Alert.alert(t("common.error"), t("gallery.deleteError"));
    }
  };

  const getThemeEmoji = (theme: string): string => {
    const themeEmojis: {[key: string]: string} = {
      "superhero with cape flying through the sky": "🦸‍♀️",
      "medieval knight in shining armor": "⚔️",
      "space astronaut exploring distant planets": "🚀",
      "fantasy wizard casting magical spells": "🧙‍♂️",
      "pirate captain sailing the seven seas": "🏴‍☠️",
      "ninja warrior in stealth mode": "🥷",
      "cowboy sheriff in the wild west": "🤠",
      "ancient gladiator in the colosseum": "🏛️",
      "steampunk inventor with mechanical gadgets": "⚙️",
      "cyber warrior in a futuristic world": "🤖",
      "royal king or queen with crown and robe": "👑",
      "detective with magnifying glass and coat": "🔍",
      "firefighter hero saving the day": "🚒",
      "arctic explorer in winter gear": "🧊",
      "jungle adventurer with safari equipment": "🌿",
    };
    return themeEmojis[theme] || "🦸‍♀️";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return t("gallery.today");
    } else if (diffInHours < 48) {
      return t("gallery.yesterday");
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} ${t("gallery.daysAgo")}`;
    }
  };

  const renderGalleryItem = ({item}: {item: GalleryItem}) => (
    <AnimatedGalleryItem
      item={item}
      itemSize={itemSize}
      onPress={handleItemPress}
      onDelete={handleDeleteItem}
      getThemeEmoji={getThemeEmoji}
      formatDate={formatDate}
    />
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, isRTL() && styles.emptyContainerRTL]}>
      <Text style={styles.emptyIcon}>🎨</Text>
      <Text style={[styles.emptyTitle, isRTL() && styles.textRTL]}>
        {t("gallery.empty")}
      </Text>
      <Text style={[styles.emptySubtitle, isRTL() && styles.textRTL]}>
        {t("gallery.emptySubtitle")}
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateHero}>
        <Text style={[styles.createButtonText, isRTL() && styles.textRTL]}>
          {t("gallery.createButton")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={
          theme.colors.gradients.primary as readonly [
            string,
            string,
            ...string[]
          ]
        }
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={theme.colors.white} />
        <Text style={[styles.loadingText, isRTL() && styles.textRTL]}>
          {t("common.loading")}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        theme.colors.gradients.light as readonly [string, string, ...string[]]
      }
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={galleryItems}
          renderItem={renderGalleryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.galleryContainer,
            galleryItems.length === 0 && styles.galleryContainerEmpty,
          ]}
          style={styles.flatList}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        {/* Bottom swipe instruction */}
        {galleryItems.length > 0 && (
          <View style={styles.bottomInstruction}>
            <Text style={[styles.instructionText, isRTL() && styles.textRTL]}>
              {t("gallery.swipeRight")}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: theme.spacing[4],
    fontSize: theme.typography.sizes.md,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.medium,
    fontFamily: theme.typography.fonts.medium,
  },
  flatList: {
    flex: 1,
  },
  galleryContainer: {
    padding: theme.spacing[2],
    paddingBottom: theme.spacing[8],
    paddingTop: theme.spacing[4],
  },
  galleryContainerEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[12],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: theme.typography.sizes["2xl"],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: theme.spacing[2],
    fontFamily: theme.typography.fonts.bold,
    textShadowColor: theme.colors.primary[900] + "40",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: theme.spacing[8],
    lineHeight: theme.typography.lineHeights.md,
    fontFamily: theme.typography.fonts.regular,
    opacity: 0.9,
    textShadowColor: theme.colors.primary[900] + "30",
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  createButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius["3xl"],
    ...theme.shadows.lg,
  },
  createButtonText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.medium,
  },
  textRTL: {
    textAlign: "right",
  },
  emptyContainerRTL: {
    alignItems: "flex-end",
  },
  bottomInstruction: {
    position: "absolute",
    bottom: theme.spacing[10],
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: theme.spacing[5],
  },
  instructionText: {
    backgroundColor: theme.colors.white + "99", // 60% opacity
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.base,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius["2xl"],
    textAlign: "center",
    overflow: "hidden",
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.medium,
    ...theme.shadows.base,
  },
});
