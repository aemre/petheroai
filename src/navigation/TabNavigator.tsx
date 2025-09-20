/*global require*/

import React, {useEffect, useRef} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import {useNavigation, CommonActions} from "@react-navigation/native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {LinearGradient} from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {useSelector, useDispatch} from "react-redux";
import {Alert} from "react-native";
import {AppDispatch, RootState} from "../store/store";
import {uploadAndProcessPhoto} from "../store/slices/photoSlice";
import {useTranslation} from "../hooks/useTranslation";
import HomeScreen from "../screens/HomeScreen";
import GalleryScreen from "../screens/GalleryScreen";
import CreateAnimationScreen from "../screens/CreateAnimationScreen";
import VaccineCardScreen from "../screens/VaccineCardScreen";
import PetTrackerScreen from "../screens/PetTrackerScreen";
import ProcessingScreen from "../screens/ProcessingScreen";
import ResultScreen from "../screens/ResultScreen";

export type TabParamList = {
  HomeTab: {showPurchaseModal?: boolean} | undefined;
  Gallery: undefined;
  Create: undefined;
  VaccineCard: undefined;
  PetTracker: undefined;
  Processing: {photoId: string; originalImageUri?: string};
  Result: {photoId: string};
};

const Tab = createBottomTabNavigator<TabParamList>();
const screenWidth = Dimensions.get("window").width;
const tabWidth = screenWidth / 5;

// Wrapper component to pass route parameters to HomeScreen
const HomeScreenWrapper = ({navigation, route: tabRoute}: any) => {
  // Get the route parameters - they should be passed from the parent navigator
  const routeParams = tabRoute?.params;
  console.log("🏠 HomeScreenWrapper route params:", routeParams);
  return <HomeScreen route={{params: routeParams}} />;
};

export default function TabNavigator({route}: {route?: any}) {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);
  const {profile} = useSelector((state: RootState) => state.user);
  const {t} = useTranslation();

  // Handle route parameters when TabNavigator receives them
  useEffect(() => {
    console.log("TabNavigator route params:", route?.params);
    if (route?.params?.showPurchaseModal) {
      console.log("🎯 TabNavigator: Triggering purchase modal");
      // Small delay to ensure navigation is complete
      const timer = setTimeout(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: "HomeTab",
            params: {showPurchaseModal: true},
          })
        );
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [route?.params, navigation]);

  const CustomTabBar = ({state, descriptors, navigation}: any) => {
    const animatedItemValues = useRef<Animated.Value[]>([]);
    const animatedBubbleValues = useRef<Animated.Value[]>([]);
    const animatedMiniBubbleValues = useRef<Animated.Value[]>([]);
    const animatedImageValues = useRef<Animated.Value[]>([]);
    const lastSelectedIndex = useRef<number | null>(null);

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

        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error("Image picker timeout")), 30000);
        });

        const pickerPromise = useCamera
          ? ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
              exif: false,
            })
          : ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
              exif: false,
            });

        const result = await Promise.race([pickerPromise, timeoutPromise]);

        if (result && !result.canceled && result.assets && result.assets[0]) {
          return result.assets[0].uri;
        }
      } catch (error: any) {
        console.error("Error picking image:", error);
        let errorMessage = t("home.failedToPickImage");
        if (error?.message?.includes("timeout")) {
          errorMessage = "Camera operation timed out. Please try again.";
        } else if (error?.message?.includes("Camera")) {
          errorMessage =
            "Camera not available. Please try using photo library instead.";
        }
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
            navigation.navigate("Processing" as any, {
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

    const handleUploadPhoto = async () => {
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

    // Initialize animated values
    if (animatedItemValues.current.length === 0) {
      state.routes.forEach((_: any, index: number) => {
        animatedItemValues.current[index] = new Animated.Value(0);
        animatedBubbleValues.current[index] = new Animated.Value(0);
        animatedImageValues.current[index] = new Animated.Value(0);
        animatedMiniBubbleValues.current[index] = new Animated.Value(0);
      });

      // Initialize the first tab (HomeTab) as selected
      setTimeout(() => {
        if (state.index === 0 && lastSelectedIndex.current === null) {
          startAnimation(0);
          lastSelectedIndex.current = 0;
        }
      }, 100);
    }

    const startAnimation = (index: number) => {
      Animated.parallel([
        Animated.timing(animatedItemValues.current[index], {
          toValue: -30,
          duration: 500,
          delay: 300,
          easing: Easing.in(Easing.elastic(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(animatedMiniBubbleValues.current[index], {
          toValue: 1,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedBubbleValues.current[index], {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.out(Easing.ease)),
          useNativeDriver: true,
        }),
        Animated.timing(animatedImageValues.current[index], {
          toValue: 1,
          duration: 800,
          useNativeDriver: false, // tintColor doesn't support native driver
        }),
      ]).start();
    };

    const endAnimation = (index: number) => {
      Animated.parallel([
        Animated.timing(animatedItemValues.current[index], {
          toValue: 0,
          duration: 400,
          delay: 350,
          useNativeDriver: true,
        }),
        Animated.timing(animatedMiniBubbleValues.current[index], {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
        Animated.timing(animatedBubbleValues.current[index], {
          toValue: 0,
          duration: 750,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedImageValues.current[index], {
          toValue: 0,
          duration: 400,
          delay: 350,
          useNativeDriver: false,
        }),
      ]).start();
    };

    return (
      <View style={styles.customTabBar}>
        {state.routes.map((route: any, index: number) => {
          const {options} = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;

          // Skip hidden screens
          if (route.name === "Processing" || route.name === "Result") {
            return null;
          }

          const onPress = () => {
            // Special handling for Create button - it's an action button, not a tab
            if (route.name === "Create") {
              handleUploadPhoto();
              return;
            }

            if (index === lastSelectedIndex.current) {
              return;
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              startAnimation(index);

              if (lastSelectedIndex.current !== null) {
                endAnimation(lastSelectedIndex.current);
              }

              lastSelectedIndex.current = index;
              navigation.navigate(route.name);
            }
          };

          let iconSource;
          let fallbackIcon = "";

          try {
            switch (route.name) {
              case "HomeTab":
                iconSource = require("../../assets/home.png");
                fallbackIcon = "🏠";
                break;
              case "Gallery":
                iconSource = require("../../assets/gallery.png");
                fallbackIcon = "🖼️";
                break;
              case "Create":
                iconSource = require("../../assets/plus.png");
                fallbackIcon = "➕";
                break;
              case "VaccineCard":
                iconSource = require("../../assets/vaccine.jpg");
                fallbackIcon = "🏥";
                break;
              case "PetTracker":
                iconSource = require("../../assets/tracker.jpg");
                fallbackIcon = "📊";
                break;
            }
          } catch (error) {
            console.error(`Error loading icon for ${route.name}:`, error);
            iconSource = null;
          }

          // Animated styles
          const animatedItemStyle = {
            transform: [{translateY: animatedItemValues.current[index]}],
          };

          // Special rendering for Create button - no animations, just static button
          if (route.name === "Create") {
            return (
              <TouchableWithoutFeedback key={route.key} onPress={onPress}>
                <View style={styles.createButton}>
                  <Image
                    source={iconSource}
                    style={styles.createButtonIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableWithoutFeedback>
            );
          }

          // Check if this tab is currently focused
          const isCurrentlyFocused = state.index === index;

          return (
            <TouchableWithoutFeedback key={route.key} onPress={onPress}>
              <Animated.View style={[styles.tabItem, animatedItemStyle]}>
                {/* Container with border for focused state */}
                <View
                  style={[
                    styles.iconContainer,
                    isCurrentlyFocused && styles.iconContainerFocused,
                  ]}
                >
                  {iconSource ? (
                    <Animated.Image
                      source={iconSource}
                      style={styles.iconImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Animated.Text
                      style={[styles.iconText, {color: "#8B5CF6"}]}
                    >
                      {fallbackIcon}
                    </Animated.Text>
                  )}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreenWrapper}
        options={{tabBarLabel: "Home"}}
        initialParams={route?.params}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{tabBarLabel: "Gallery"}}
      />
      <Tab.Screen
        name="Create"
        component={CreateAnimationScreen}
        options={{tabBarLabel: "Create"}}
      />
      <Tab.Screen
        name="VaccineCard"
        component={VaccineCardScreen}
        options={{tabBarLabel: "Vaccines"}}
      />
      <Tab.Screen
        name="PetTracker"
        component={PetTrackerScreen}
        options={{tabBarLabel: "Tracker"}}
      />

      {/* Hidden screens for navigation */}
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: {display: "none"},
        }}
      />
      <Tab.Screen
        name="Result"
        component={ResultScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: {display: "none"},
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: 90,
    paddingBottom: 20,
    paddingTop: 10,
    width: screenWidth,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: 70,
  },
  iconContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: "transparent",
  },
  iconContainerFocused: {
    borderWidth: 2,
    borderColor: "#8B5CF6",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  iconImage: {
    width: 50,
    height: 50,
  },
  iconText: {
    fontSize: 24,
    color: "#8B5CF6",
  },
  titleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  createButton: {
    backgroundColor: "white",
    borderRadius: 30,
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    borderWidth: 2,
    borderColor: "black",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonIcon: {
    width: 40,
    height: 40,
  },
  createButtonText: {
    fontSize: 24,
    color: "white",
  },
});
