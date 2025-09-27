import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {LineChart, BarChart} from "react-native-chart-kit";
import DatePicker from "react-native-date-picker";
import {useSelector, useDispatch} from "react-redux";
import {RootState} from "../store/store";
import {useTranslation} from "../hooks/useTranslation";
import {setUser} from "../store/slices/authSlice";
import {setPetName} from "../store/slices/userSlice";
import {convertFirebaseUserToDTO} from "../types/dto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import auth, {
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  linkWithCredential,
} from "@react-native-firebase/auth";
import {TrackerService} from "../services/trackerService";
import {SuggestionService} from "../services/suggestionService";
import {
  theme,
  blackWithOpacity,
  primaryWithOpacity,
  successWithOpacity,
  warningWithOpacity,
  errorWithOpacity,
} from "../theme";
import {
  TrackerFormData,
  ScheduleFormData,
  FeedingRecord,
  WaterRecord,
  WeightRecord,
  FeedingSchedule,
  DailyTrackerSummary,
  FOOD_TYPES,
  FEEDING_UNITS,
  DAYS_OF_WEEK,
} from "../types/tracker";

const {width} = Dimensions.get("window");

const PetTrackerScreen: React.FC = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {profile, petPreference} = useSelector(
    (state: RootState) => state.user
  );

  // Get auth instance once at component level to avoid deprecation warnings
  const authInstance = auth();

  // Debug log for user state
  console.log("Current user state:", {
    uid: user?.uid,
    email: user?.email,
    isAnonymous: user?.isAnonymous,
    hasUser: !!user,
    emailVerified: user?.emailVerified,
  });

  // Also log Firebase current user for comparison
  console.log("Firebase current user:", {
    uid: authInstance.currentUser?.uid,
    email: authInstance.currentUser?.email,
    isAnonymous: authInstance.currentUser?.isAnonymous,
    emailVerified: authInstance.currentUser?.emailVerified,
  });

  // State
  const [activeTab, setActiveTab] = useState<
    "overview" | "feeding" | "water" | "weight" | "schedules" | "account"
  >("overview");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Account tab state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showSuggestionsHistory, setShowSuggestionsHistory] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionType, setSuggestionType] = useState<
    "feature" | "bug" | "general"
  >("feature");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  // Pet name modal state
  const [showPetNameModal, setShowPetNameModal] = useState(false);
  const [petNameInput, setPetNameInput] = useState("");

  // Data
  const [dailySummary, setDailySummary] = useState<DailyTrackerSummary | null>(
    null
  );
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);

  // Form data
  const [formData, setFormData] = useState<TrackerFormData>({
    petName: profile?.petName || "",
    type: "feeding",
    amount: 0,
    unit: "grams",
    foodType: "Dry Food",
    timestamp: new Date(),
    notes: "",
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile?.petName) {
      setFormData((prev) => ({
        ...prev,
        petName: profile.petName,
      }));
      setScheduleFormData((prev) => ({
        ...prev,
        petName: profile.petName,
      }));
    }
  }, [profile?.petName]);

  const [scheduleFormData, setScheduleFormData] = useState<ScheduleFormData>({
    petName: profile?.petName || "",
    name: "",
    time: "08:00",
    foodType: "Dry Food",
    amount: 0,
    unit: "grams",
    days: [1, 2, 3, 4, 5, 6, 0], // All days by default
    notifications: true,
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Reload data when user or profile changes
  useEffect(() => {
    if (user?.uid && profile?.petName) {
      console.log("👤 User or profile changed, reloading data");
      loadData();
    }
  }, [user?.uid, profile?.petName]);

  // Refresh user data when component mounts or user changes
  useEffect(() => {
    const refreshUserData = () => {
      // Force refresh of user state from Firebase
      const currentUser = authInstance.currentUser;
      if (currentUser) {
        currentUser.reload();
        console.log("User data refreshed:", {
          uid: currentUser.uid,
          email: currentUser.email,
          isAnonymous: currentUser.isAnonymous,
        });
      }
    };

    refreshUserData();
  }, [user?.uid]); // Add user.uid as dependency to refresh when user changes

  const loadData = async () => {
    if (!user?.uid || !profile?.petName) {
      console.log("❌ Cannot load data - missing user or pet info:", {
        hasUser: !!user?.uid,
        hasPetName: !!profile?.petName,
        uid: user?.uid,
        petName: profile?.petName,
      });
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Loading tracker data for:", {
        uid: user.uid,
        petName: profile.petName,
        selectedDate: selectedDate.toDateString(),
        petWeight: profile.petWeight,
        petPreference: petPreference,
      });

      // Load daily summary
      const summary = await TrackerService.getDailySummary(
        user.uid,
        profile.petName,
        selectedDate,
        profile.petWeight
          ? parseFloat(profile.petWeight.toString())
          : undefined,
        petPreference as "dog" | "cat" | "bird"
      );

      console.log("📊 Daily summary loaded:", summary);
      setDailySummary(summary);

      // Load recent records (last 7 days)
      const weekAgo = new Date(selectedDate);
      weekAgo.setDate(weekAgo.getDate() - 7);

      console.log(
        "📅 Loading records from:",
        weekAgo.toDateString(),
        "to:",
        selectedDate.toDateString()
      );

      const [feeding, water, weight, feedingSchedules] = await Promise.all([
        TrackerService.getFeedingRecords(
          user.uid,
          profile.petName,
          weekAgo,
          selectedDate
        ),
        TrackerService.getWaterRecords(
          user.uid,
          profile.petName,
          weekAgo,
          selectedDate
        ),
        TrackerService.getWeightRecords(
          user.uid,
          profile.petName,
          weekAgo,
          selectedDate
        ),
        TrackerService.getFeedingSchedules(user.uid, profile.petName),
      ]);

      console.log("📋 Records loaded:", {
        feeding: feeding.length,
        water: water.length,
        weight: weight.length,
        schedules: feedingSchedules.length,
      });

      setFeedingRecords(feeding);
      setWaterRecords(water);
      setWeightRecords(weight);
      setSchedules(feedingSchedules);
    } catch (error) {
      console.error("❌ Error loading tracker data:", error);
      Alert.alert("Error", "Failed to load tracker data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!user?.uid) return;

    // Ensure pet name is set
    const currentPetName = formData.petName || profile?.petName || "";
    if (!currentPetName) {
      Alert.alert(
        "Error",
        "Pet name is required. Please complete your profile first."
      );
      return;
    }

    // Update form data with current pet name if it's missing
    const updatedFormData = {
      ...formData,
      petName: currentPetName,
    };

    try {
      setLoading(true);
      console.log("💾 Adding record:", {
        type: updatedFormData.type,
        amount: updatedFormData.amount,
        petName: updatedFormData.petName,
        timestamp: updatedFormData.timestamp.toISOString(),
        userId: user.uid,
      });

      console.log("🐕 Profile data:", {
        profilePetName: profile?.petName,
        formDataPetName: formData.petName,
        updatedPetName: currentPetName,
        hasProfile: !!profile,
      });

      let recordId: string;
      switch (updatedFormData.type) {
        case "feeding":
          recordId = await TrackerService.createFeedingRecord(
            user.uid,
            updatedFormData
          );
          break;
        case "water":
          recordId = await TrackerService.createWaterRecord(
            user.uid,
            updatedFormData
          );
          break;
        case "weight":
          recordId = await TrackerService.createWeightRecord(
            user.uid,
            updatedFormData
          );
          break;
        default:
          throw new Error(`Unknown record type: ${updatedFormData.type}`);
      }

      console.log("✅ Record added successfully:", recordId);

      setShowAddModal(false);
      resetForm();

      // Reload data to refresh the overview
      console.log("🔄 Reloading data after adding record...");
      await loadData();

      Alert.alert(
        "Success",
        `${updatedFormData.type} record added successfully`
      );
    } catch (error) {
      console.error("❌ Error adding record:", error);
      Alert.alert("Error", "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      await TrackerService.createFeedingSchedule(user.uid, scheduleFormData);
      setShowScheduleModal(false);
      resetScheduleForm();
      loadData();
      Alert.alert("Success", "Feeding schedule created successfully");
    } catch (error) {
      console.error("Error creating schedule:", error);
      Alert.alert("Error", "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      petName: profile?.petName || "",
      type: "feeding",
      amount: 0,
      unit: "grams",
      foodType: "Dry Food",
      timestamp: new Date(),
      notes: "",
    });
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      petName: profile?.petName || "",
      name: "",
      time: "08:00",
      foodType: "Dry Food",
      amount: 0,
      unit: "grams",
      days: [1, 2, 3, 4, 5, 6, 0],
      notifications: true,
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getChartData = () => {
    if (activeTab === "water" && waterRecords.length > 0) {
      const last7Days = waterRecords.slice(0, 7).reverse();
      return {
        labels: last7Days.map((record) =>
          new Date(record.timestamp).getDate().toString()
        ),
        datasets: [
          {
            data: last7Days.map((record) => record.amount),
            color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    } else if (activeTab === "weight" && weightRecords.length > 0) {
      const last7Days = weightRecords.slice(0, 7).reverse();
      return {
        labels: last7Days.map((record) =>
          new Date(record.timestamp).getDate().toString()
        ),
        datasets: [
          {
            data: last7Days.map((record) => record.weight),
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }
    return null;
  };

  const renderAccount = () => (
    <View style={styles.accountContainer}>
      {/* User Info Section */}
      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>Account Information</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>User ID:</Text>
            <Text style={styles.accountValue}>
              {user?.uid?.substring(0, 8)}...
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Account Type:</Text>
            <Text style={styles.accountValue}>
              {user?.isAnonymous ? "Anonymous" : "Email Linked"}
            </Text>
          </View>
          {user?.email && (
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email:</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
            </View>
          )}
          {user?.email && (
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email Verified:</Text>
              <Text
                style={[
                  styles.accountValue,
                  {
                    color: user.emailVerified
                      ? theme.colors.success[500]
                      : theme.colors.warning[500],
                  },
                ]}
              >
                {user.emailVerified ? "Verified" : "Not Verified"}
              </Text>
            </View>
          )}
          {profile?.petName && (
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Pet Name:</Text>
              <Text style={styles.accountValue}>{profile.petName}</Text>
            </View>
          )}
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Credits:</Text>
            <Text style={styles.accountValue}>{profile?.credits || 0}</Text>
          </View>
        </View>
      </View>

      {/* Current Account Status Alert */}
      {user && !user.isAnonymous && (
        <View style={styles.accountSection}>
          <Text style={styles.accountSectionTitle}>Account Status</Text>
          <View
            style={[
              styles.accountCard,
              {backgroundColor: `${theme.colors.success[500]}1A`}, // 10% opacity
            ]}
          >
            <Text
              style={[
                styles.accountDescription,
                {
                  color: theme.colors.success[500],
                  fontFamily: theme.typography.fonts.semibold,
                },
              ]}
            >
              Your account is successfully linked with: {user.email}
            </Text>
            <Text style={styles.accountDescription}>
              You can now sign in with this email from any device to access your
              data.
            </Text>
          </View>
        </View>
      )}

      {/* Debug & Refresh Section */}
      <View style={styles.accountSection}>
        <TouchableOpacity
          style={[
            styles.accountButton,
            {backgroundColor: primaryWithOpacity(0.2)},
          ]}
          onPress={async () => {
            try {
              const currentUser = authInstance.currentUser;
              if (currentUser) {
                await currentUser.reload();
                Alert.alert("Refreshed", "Account status has been updated!");
              }
            } catch (error) {
              console.error("Error refreshing user:", error);
            }
          }}
        >
          <Text style={styles.accountButtonText}>Refresh Account Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.accountButton,
            {
              backgroundColor: warningWithOpacity(0.2),
              marginTop: theme.spacing[2],
            },
          ]}
          onPress={async () => {
            try {
              const currentUser = authInstance.currentUser;
              console.log("=== FIREBASE DEBUG INFO ===");
              console.log("Auth instance:", authInstance);
              console.log("Current user:", currentUser);
              console.log("User email:", currentUser?.email);
              console.log("Email verified:", currentUser?.emailVerified);
              console.log("User providers:", currentUser?.providerData);
              console.log("Auth domain:", authInstance.app.options.authDomain);
              console.log("Project ID:", authInstance.app.options.projectId);
              console.log("=== END DEBUG INFO ===");

              Alert.alert(
                "Debug Info",
                `User: ${currentUser?.email || "No user"}\nVerified: ${
                  currentUser?.emailVerified || false
                }\nProject: ${authInstance.app.options.projectId}`
              );
            } catch (error: any) {
              console.error("Debug error:", error);
              Alert.alert("Debug Error", error.message);
            }
          }}
        >
          <Text style={styles.accountButtonText}>Debug Firebase Info</Text>
        </TouchableOpacity>
      </View>

      {/* Password Management Section */}
      {user && !user.isAnonymous && (
        <View style={styles.accountSection}>
          <Text style={styles.accountSectionTitle}>Password Management</Text>
          <Text style={styles.accountDescription}>
            You can change your password after verifying your email address.
          </Text>

          <TouchableOpacity
            style={[
              styles.accountButton,
              {backgroundColor: successWithOpacity(0.2)},
            ]}
            onPress={async () => {
              try {
                console.log("Sending password reset email to:", user.email);
                await sendPasswordResetEmail(authInstance, user.email || "");
                console.log("Password reset email sent successfully");
                Alert.alert(
                  "Password Reset Email Sent",
                  "Check your email for password reset instructions."
                );
              } catch (error: any) {
                console.error("Error sending password reset email:", error);
                Alert.alert(
                  "Error",
                  `Failed to send password reset email: ${
                    error.message || error
                  }`
                );
              }
            }}
          >
            <Text style={styles.accountButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Management Actions */}
      {user?.isAnonymous ? (
        <View style={styles.accountSection}>
          <Text style={styles.accountSectionTitle}>Link Your Account</Text>
          <Text style={styles.accountDescription}>
            Link your anonymous account with an email to secure your data and
            never lose your progress.
          </Text>
          <TouchableOpacity
            style={styles.accountButton}
            onPress={() => setShowEmailModal(true)}
            disabled={isCheckingAccount}
          >
            <Text style={styles.accountButtonText}>
              {isCheckingAccount ? "Checking..." : "Link with Email"}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.accountDescription,
              {marginTop: theme.spacing[4], textAlign: "center"},
            ]}
          >
            Or if you already have an account:
          </Text>

          <TouchableOpacity
            style={[
              styles.accountButton,
              {
                backgroundColor: successWithOpacity(0.2),
                marginTop: theme.spacing[2],
              },
            ]}
            onPress={() => setShowLoginModal(true)}
          >
            <Text style={styles.accountButtonText}>Login with Email</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.accountSection}>
          <Text style={styles.accountSectionTitle}>Email Account</Text>
          <Text style={styles.accountDescription}>
            Your account is linked with {user?.email}. You can manage your email
            settings below.
          </Text>

          {!user?.emailVerified && (
            <TouchableOpacity
              style={[
                styles.accountButton,
                {backgroundColor: warningWithOpacity(0.2)},
              ]}
              onPress={async () => {
                try {
                  const currentUser = authInstance.currentUser;
                  if (currentUser) {
                    console.log(
                      "Sending email verification to:",
                      currentUser.email
                    );
                    await sendEmailVerification(currentUser);
                    console.log("Email verification sent successfully");
                    Alert.alert(
                      "Verification Email Sent",
                      "Please check your email and click the verification link."
                    );
                  } else {
                    console.log("No current user found for email verification");
                    Alert.alert("Error", "No user is currently signed in.");
                  }
                } catch (error: any) {
                  console.error("Error sending verification email:", error);
                  Alert.alert(
                    "Error",
                    `Failed to send verification email: ${
                      error.message || error
                    }`
                  );
                }
              }}
            >
              <Text style={styles.accountButtonText}>
                Resend Verification Email
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.accountButton,
              {
                backgroundColor: errorWithOpacity(0.2),
                marginTop: theme.spacing[3],
              },
            ]}
            onPress={() => {
              Alert.alert(
                "Unlink Email Account",
                "This will convert your account back to anonymous. You'll lose the ability to recover your data if you switch devices. Are you sure?",
                [
                  {text: "Cancel", style: "cancel"},
                  {
                    text: "Unlink",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        // Note: Firebase doesn't allow unlinking the last provider
                        // This would require more complex account management
                        Alert.alert(
                          "Info",
                          "Account unlinking requires signing out and creating a new anonymous account. Please contact support if needed."
                        );
                      } catch (error) {
                        Alert.alert("Error", "Failed to unlink account.");
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.accountButtonText}>Unlink Email Account</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions Section */}
      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>Send Feedback</Text>
        <Text style={styles.accountDescription}>
          Help us improve the app by sharing your suggestions, reporting bugs,
          or asking questions.
        </Text>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => setShowSuggestionModal(true)}
        >
          <Text style={styles.accountButtonText}>Send Suggestion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountButton, {marginTop: theme.spacing[3]}]}
          onPress={() => loadUserSuggestions()}
        >
          <Text style={styles.accountButtonText}>View My Suggestions</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>App Information</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Version:</Text>
            <Text style={styles.accountValue}>1.0.0</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Build:</Text>
            <Text style={styles.accountValue}>2024.01</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const checkAccountStatus = async (email: string) => {
    try {
      setIsCheckingAccount(true);
      console.log("Checking account status for:", email);
      console.log("Current user email:", user?.email);
      console.log("Current user isAnonymous:", user?.isAnonymous);

      // Check if this email is already linked to current user
      if (user?.email === email) {
        console.log("Email is already linked to current user");
        Alert.alert(
          "Already Linked",
          "This email is already linked to your current account!",
          [{text: "OK"}]
        );
        return false;
      }

      // Try to sign in with the email to see if it exists
      console.log("Fetching sign-in methods for:", email);
      const methods = await fetchSignInMethodsForEmail(authInstance, email);
      console.log("Sign-in methods found:", methods);

      if (methods.length > 0) {
        // Email is already registered
        Alert.alert(
          "Email Already Registered",
          `This email (${email}) is already registered with: ${methods.join(
            ", "
          )}.\n\nWould you like to sign in with this email instead?`,
          [
            {text: "Cancel", style: "cancel"},
            {
              text: "Sign In",
              onPress: () => {
                Alert.alert(
                  "Sign In Required",
                  "Please sign out and sign in with this email from the main login screen to access your existing account."
                );
              },
            },
          ]
        );
        return false;
      }

      console.log("Email is available for linking");
      return true;
    } catch (error: any) {
      console.error("Error checking account status:", error);

      // If the error is network related, warn user but allow them to continue
      if (error.code === "auth/network-request-failed") {
        Alert.alert(
          "Network Error",
          "Unable to verify email status due to network issues. Continue with linking?",
          [
            {text: "Cancel", style: "cancel"},
            {text: "Continue", onPress: () => true},
          ]
        );
        return false;
      }

      return true; // Continue with linking if check fails
    } finally {
      setIsCheckingAccount(false);
    }
  };

  const handleLinkEmail = async () => {
    if (!emailInput.trim()) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!passwordInput.trim()) {
      Alert.alert("Error", "Please enter a password");
      return;
    }

    if (passwordInput.trim().length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!user?.isAnonymous) {
      if (user?.email === emailInput.trim()) {
        Alert.alert(
          "Already Linked",
          `This email (${emailInput.trim()}) is already linked to your current account!`,
          [{text: "OK"}]
        );
      } else {
        Alert.alert(
          "Account Already Linked",
          `Your account is already linked with ${user?.email}. You cannot link multiple emails to the same account.`,
          [{text: "OK"}]
        );
      }
      return;
    }

    // Check if email is already in use
    const canProceed = await checkAccountStatus(emailInput.trim());
    if (!canProceed) {
      return;
    }

    try {
      setLoading(true);

      // Create email credential with user-provided password
      const credential = EmailAuthProvider.credential(
        emailInput.trim(),
        passwordInput.trim()
      );

      // Store current user data before linking
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        throw new Error("No current user found");
      }

      console.log("Current user before linking:", {
        uid: currentUser.uid,
        isAnonymous: currentUser.isAnonymous,
        email: currentUser.email,
      });

      // Link the anonymous account
      const result = await linkWithCredential(currentUser, credential);
      console.log("Link result:", {
        uid: result?.user?.uid,
        email: result?.user?.email,
        isAnonymous: result?.user?.isAnonymous,
      });

      // Verify the UID remained the same (account was linked, not replaced)
      if (result?.user?.uid !== currentUser.uid) {
        console.error(
          "ERROR: User ID changed during linking! Data may be lost."
        );
        Alert.alert(
          "Account Linking Issue",
          "There was an issue with account linking. Your data may not be preserved. Please contact support.",
          [{text: "OK"}]
        );
        return;
      }

      if (result) {
        try {
          // Update Redux store with the linked user
          const userDTO = convertFirebaseUserToDTO(result.user);
          dispatch(setUser(userDTO));

          // Send email verification after linking
          console.log(
            "Sending email verification to linked user:",
            result.user.email
          );
          await sendEmailVerification(result.user);
          console.log("Email verification sent successfully to linked user");

          Alert.alert(
            "Success!",
            `Your account has been linked with ${emailInput.trim()}!\n\nYou can now sign in with:\nEmail: ${emailInput.trim()}\nPassword: (the password you just entered)\n\nWe've also sent a verification email.`,
            [
              {
                text: "OK",
                onPress: () => {
                  setShowEmailModal(false);
                  setEmailInput("");
                  setPasswordInput("");
                  // Force refresh of user data to show updated account status
                  setTimeout(() => {
                    const currentUser = authInstance.currentUser;
                    if (currentUser) {
                      currentUser.reload();
                    }
                  }, 1000);
                },
              },
            ]
          );
        } catch (verificationError: any) {
          console.error("Error sending email verification:", verificationError);
          // Even if email verification fails, the account is still linked
          // Make sure Redux store is updated even if verification fails
          const userDTO = convertFirebaseUserToDTO(result.user);
          dispatch(setUser(userDTO));

          Alert.alert(
            "Account Linked!",
            `Your account has been successfully linked with ${emailInput.trim()}! You can now sign in with this email and your password. (Email verification could not be sent, but your account is secure.)`,
            [
              {
                text: "OK",
                onPress: () => {
                  setShowEmailModal(false);
                  setEmailInput("");
                  setPasswordInput("");
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error("Error linking email:", error);

      let errorMessage = "Failed to link email. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        // Show the registered email information
        try {
          const methods = await fetchSignInMethodsForEmail(
            authInstance,
            emailInput.trim()
          );
          Alert.alert(
            "Email Already Registered",
            `This email (${emailInput.trim()}) is already registered with: ${methods.join(
              ", "
            )}.\n\nThis means either:\n• The account linking was successful previously\n• This email belongs to another account\n\nPlease check your account status above or sign in with this email from the login screen.`,
            [
              {text: "Check Status", onPress: () => setShowEmailModal(false)},
              {text: "Try Different Email", style: "cancel"},
            ]
          );
        } catch (fetchError) {
          Alert.alert(
            "Email Already Registered",
            `This email (${emailInput.trim()}) is already registered with another account.\n\nPlease check your account status above or try signing in with this email from the login screen.`,
            [{text: "OK", onPress: () => setShowEmailModal(false)}]
          );
        }
        return;
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please try again.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Please sign out and sign back in, then try linking your email again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithEmail = async () => {
    if (!loginEmailInput.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!loginPasswordInput.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmailInput.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        loginEmailInput.trim(),
        loginPasswordInput.trim()
      );

      console.log("Login successful:", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        isAnonymous: userCredential.user.isAnonymous,
      });

      // Update Redux store with the new user
      const userDTO = convertFirebaseUserToDTO(userCredential.user);
      dispatch(setUser(userDTO));

      Alert.alert(
        "Login Successful!",
        `Welcome back! You're now signed in with ${loginEmailInput.trim()}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowLoginModal(false);
              setLoginEmailInput("");
              setLoginPasswordInput("");
              // Force refresh of user data and reload the component
              setTimeout(() => {
                const currentUser = authInstance.currentUser;
                if (currentUser) {
                  currentUser.reload();
                }
                // Force a re-render by reloading data
                loadData();
              }, 500);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error logging in:", error);

      let errorMessage = "Failed to login. Please check your credentials.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim()) {
      Alert.alert("Error", "Please enter your suggestion");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);

      // Send suggestion to Firebase
      const suggestionId = await SuggestionService.createSuggestion(
        user.uid,
        {
          suggestionType,
          description: suggestionText,
        },
        user.email || undefined
      );

      console.log("Suggestion sent with ID:", suggestionId);

      Alert.alert(
        "Thank You!",
        "Your suggestion has been sent successfully. We appreciate your feedback!",
        [{text: "OK", onPress: () => setShowSuggestionModal(false)}]
      );
      setSuggestionText("");
      setSuggestionType("feature");
    } catch (error) {
      console.error("Error sending suggestion:", error);
      Alert.alert("Error", "Failed to send suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserSuggestions = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const suggestions = await SuggestionService.getUserSuggestions(user.uid);
      setUserSuggestions(suggestions);
      setShowSuggestionsHistory(true);
    } catch (error) {
      console.error("Error loading user suggestions:", error);
      Alert.alert("Error", "Failed to load your suggestions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return theme.colors.warning[500];
      case "reviewed":
        return theme.colors.primary[500];
      case "implemented":
        return theme.colors.success[500];
      case "rejected":
        return theme.colors.error[500];
      default:
        return theme.colors.gray[400];
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "pending":
        return "";
      case "reviewed":
        return "";
      case "implemented":
        return "";
      case "rejected":
        return "";
      default:
        return "";
    }
  };

  const handleAddPetName = async () => {
    if (!petNameInput.trim()) {
      Alert.alert("Error", "Please enter your pet's name");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const trimmedName = petNameInput.trim();

      console.log("Adding pet name:", trimmedName);

      // Save pet name to Redux store (same as onboarding)
      dispatch(setPetName(trimmedName));

      // Persist pet name to AsyncStorage (same as onboarding)
      await AsyncStorage.setItem("petName", trimmedName);

      // Save pet name to Firebase (partial update, not full onboarding)
      await firestore().collection("users").doc(user.uid).update({
        petName: trimmedName,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ Pet name saved successfully:", trimmedName);

      Alert.alert(
        "Success!",
        `Pet name "${trimmedName}" has been added! You can now start tracking.`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowPetNameModal(false);
              setPetNameInput("");
              // Force reload to update the UI
              loadData();
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error adding pet name:", error);
      Alert.alert("Error", "Failed to add pet name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Pet Name Missing Alert */}
      {!profile?.petName && (
        <View style={styles.petNameMissingCard}>
          <Text style={styles.petNameMissingTitle}>
            Welcome to Pet Tracker!
          </Text>
          <Text style={styles.petNameMissingText}>
            To get started with tracking your pet's health, please add your
            pet's name.
          </Text>
          <TouchableOpacity
            style={styles.addPetButton}
            onPress={() => setShowPetNameModal(true)}
          >
            <Text style={styles.addPetButtonText}>Add Pet Name</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Selector */}
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateSelectorText}>
          {selectedDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {/* Daily Summary Cards - Only show if pet name exists */}
      {dailySummary && profile?.petName && (
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Feeding</Text>
            <Text style={styles.summaryCardValue}>
              {dailySummary.feeding.totalAmount} {dailySummary.feeding.unit}
            </Text>
            <Text style={styles.summaryCardSubtext}>
              {dailySummary.feeding.recordsCount}/
              {dailySummary.feeding.scheduledCount} meals
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailySummary.feeding.completionRate}%`,
                    backgroundColor: theme.colors.success[500],
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Water</Text>
            <Text style={styles.summaryCardValue}>
              {dailySummary.water.totalAmount} ml
            </Text>
            <Text style={styles.summaryCardSubtext}>
              of {dailySummary.water.recommendedAmount} ml recommended
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      dailySummary.water.completionRate,
                      100
                    )}%`,
                    backgroundColor: theme.colors.primary[500],
                  },
                ]}
              />
            </View>
          </View>

          {dailySummary.weight && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Weight</Text>
              <Text style={styles.summaryCardValue}>
                {dailySummary.weight.weight} kg
              </Text>
              <Text
                style={[
                  styles.summaryCardSubtext,
                  {
                    color:
                      dailySummary.weight.change >= 0
                        ? theme.colors.success[500]
                        : theme.colors.error[500],
                  },
                ]}
              >
                {dailySummary.weight.change >= 0 ? "+" : ""}
                {dailySummary.weight.change.toFixed(1)} kg
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Actions - Only show if pet name exists */}
      {profile?.petName && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setFormData({...formData, type: "feeding"});
              setShowAddModal(true);
            }}
          >
            <Text style={styles.quickActionText}>Add Feeding</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setFormData({...formData, type: "water"});
              setShowAddModal(true);
            }}
          >
            <Text style={styles.quickActionText}>Add Water</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setFormData({...formData, type: "weight"});
              setShowAddModal(true);
            }}
          >
            <Text style={styles.quickActionText}>Add Weight</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecordsList = () => {
    let records: any[] = [];
    let emptyMessage = "";

    switch (activeTab) {
      case "feeding":
        records = feedingRecords;
        emptyMessage = "No feeding records yet";
        break;
      case "water":
        records = waterRecords;
        emptyMessage = "No water records yet";
        break;
      case "weight":
        records = weightRecords;
        emptyMessage = "No weight records yet";
        break;
      case "schedules":
        records = schedules;
        emptyMessage = "No feeding schedules yet";
        break;
    }

    if (records.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the + button to add your first record
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recordsList}>
        {records.map((record, index) => (
          <View key={record.id || index} style={styles.recordCard}>
            {activeTab === "schedules" ? (
              <>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{record.name}</Text>
                  <Text style={styles.recordTime}>
                    {formatTime(record.time)}
                  </Text>
                </View>
                <Text style={styles.recordDetails}>
                  {record.amount} {record.unit} of {record.foodType}
                </Text>
                <Text style={styles.recordDays}>
                  {record.days
                    .map((day: number) =>
                      DAYS_OF_WEEK.find((d) => d.value === day)?.label.slice(
                        0,
                        3
                      )
                    )
                    .join(", ")}
                </Text>
                <View style={styles.recordStatus}>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: record.isActive
                          ? theme.colors.success[500]
                          : theme.colors.gray[400],
                      },
                    ]}
                  >
                    {record.isActive ? "Active" : "Inactive"}
                  </Text>
                  {record.notifications && (
                    <Text style={styles.notificationIcon}>Bell</Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>
                    {activeTab === "feeding" &&
                      `${record.amount} ${record.unit}`}
                    {activeTab === "water" && `${record.amount} ml`}
                    {activeTab === "weight" && `${record.weight} kg`}
                  </Text>
                  <Text style={styles.recordTime}>
                    {new Date(record.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {activeTab === "feeding" && (
                  <Text style={styles.recordDetails}>{record.foodType}</Text>
                )}
                {record.notes && (
                  <Text style={styles.recordNotes}>{record.notes}</Text>
                )}
                <Text style={styles.recordDate}>
                  {new Date(
                    record.timestamp || record.createdAt
                  ).toLocaleDateString()}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    if (!chartData) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {activeTab === "water" ? "Water Intake (ml)" : "Weight (kg)"} - Last 7
          Days
        </Text>
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.white,
            backgroundGradientFrom: theme.colors.white,
            backgroundGradientTo: theme.colors.white,
            decimalPlaces: activeTab === "weight" ? 1 : 0,
            color: (opacity = 1) => blackWithOpacity(opacity),
            labelColor: (opacity = 1) => blackWithOpacity(opacity),
            style: {
              borderRadius: theme.borderRadius.xl,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  if (loading && !dailySummary) {
    return (
      <LinearGradient
        colors={theme.colors.gradients.primary}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading tracker data...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.colors.gradients.primary}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pet Tracker</Text>
          <Text style={styles.subtitle}>
            {profile?.petName || "Your pet"}'s health tracking
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollView}
          >
            {[
              "overview",
              "feeding",
              "water",
              "weight",
              "schedules",
              "account",
            ].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === "overview" && renderOverview()}
          {(activeTab === "water" || activeTab === "weight") && renderChart()}
          {activeTab === "account" && renderAccount()}
          {activeTab !== "overview" &&
            activeTab !== "account" &&
            renderRecordsList()}
        </ScrollView>

        {/* Floating Action Button - Hide on account tab and when no pet name */}
        {activeTab !== "account" && profile?.petName && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (activeTab === "schedules") {
                setShowScheduleModal(true);
              } else if (activeTab === "overview") {
                // Default to feeding for overview tab
                setFormData({...formData, type: "feeding"});
                setShowAddModal(true);
              } else if (
                activeTab === "feeding" ||
                activeTab === "water" ||
                activeTab === "weight"
              ) {
                setFormData({...formData, type: activeTab});
                setShowAddModal(true);
              } else {
                // For other tabs, default to feeding
                setFormData({...formData, type: "feeding"});
                setShowAddModal(true);
              }
            }}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}

        {/* Add Record Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Add{" "}
                {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}{" "}
                Record
              </Text>
              <TouchableOpacity onPress={handleAddRecord}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {formData.type === "feeding"
                    ? "Amount"
                    : formData.type === "water"
                    ? "Amount (ml)"
                    : "Weight (kg)"}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.amount.toString()}
                  onChangeText={(text) =>
                    setFormData({...formData, amount: parseFloat(text) || 0})
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              {/* Unit Selection (for feeding) */}
              {formData.type === "feeding" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <View style={styles.unitSelector}>
                    {FEEDING_UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit.value}
                        style={[
                          styles.unitButton,
                          formData.unit === unit.value &&
                            styles.unitButtonActive,
                        ]}
                        onPress={() =>
                          setFormData({...formData, unit: unit.value})
                        }
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            formData.unit === unit.value &&
                              styles.unitButtonTextActive,
                          ]}
                        >
                          {unit.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Food Type (for feeding) */}
              {formData.type === "feeding" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Food Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.foodTypeContainer}>
                      {FOOD_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.foodTypeButton,
                            formData.foodType === type &&
                              styles.foodTypeButtonActive,
                          ]}
                          onPress={() =>
                            setFormData({...formData, foodType: type})
                          }
                        >
                          <Text
                            style={[
                              styles.foodTypeText,
                              formData.foodType === type &&
                                styles.foodTypeTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Timestamp */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date & Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.timestamp.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData({...formData, notes: text})
                  }
                  placeholder="Add any notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add Schedule Modal */}
        <Modal
          visible={showScheduleModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Feeding Schedule</Text>
              <TouchableOpacity onPress={handleAddSchedule}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Schedule Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Schedule Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={scheduleFormData.name}
                  onChangeText={(text) =>
                    setScheduleFormData({...scheduleFormData, name: text})
                  }
                  placeholder="e.g., Morning Breakfast"
                />
              </View>

              {/* Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={scheduleFormData.time}
                  onChangeText={(text) =>
                    setScheduleFormData({...scheduleFormData, time: text})
                  }
                  placeholder="08:00"
                />
              </View>

              {/* Amount & Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  value={scheduleFormData.amount.toString()}
                  onChangeText={(text) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      amount: parseFloat(text) || 0,
                    })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              {/* Days */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Days</Text>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        scheduleFormData.days.includes(day.value) &&
                          styles.dayButtonActive,
                      ]}
                      onPress={() => {
                        const newDays = scheduleFormData.days.includes(
                          day.value
                        )
                          ? scheduleFormData.days.filter((d) => d !== day.value)
                          : [...scheduleFormData.days, day.value];
                        setScheduleFormData({
                          ...scheduleFormData,
                          days: newDays,
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          scheduleFormData.days.includes(day.value) &&
                            styles.dayButtonTextActive,
                        ]}
                      >
                        {day.label.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Date Picker */}
        <DatePicker
          modal
          open={showDatePicker}
          date={showAddModal ? formData.timestamp : selectedDate}
          mode={showAddModal ? "datetime" : "date"}
          onConfirm={(date) => {
            if (showAddModal) {
              setFormData({...formData, timestamp: date});
            } else {
              setSelectedDate(date);
            }
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />

        {/* Email Linking Modal */}
        <Modal
          visible={showEmailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEmailModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Link Email</Text>
              <TouchableOpacity
                onPress={handleLinkEmail}
                disabled={loading || isCheckingAccount}
              >
                <Text
                  style={[
                    styles.modalSaveText,
                    (loading || isCheckingAccount) && {opacity: 0.5},
                  ]}
                >
                  {loading
                    ? "Linking..."
                    : isCheckingAccount
                    ? "Checking..."
                    : "Link"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Enter your password (min 6 characters)"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modalDescription}>
                We'll link your anonymous account with this email and password.
                You can use these credentials to sign in on any device and
                recover your data.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Email Login Modal */}
        <Modal
          visible={showLoginModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLoginModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Login with Email</Text>
              <TouchableOpacity
                onPress={handleLoginWithEmail}
                disabled={loading}
              >
                <Text style={[styles.modalSaveText, loading && {opacity: 0.5}]}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={loginEmailInput}
                  onChangeText={setLoginEmailInput}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={loginPasswordInput}
                  onChangeText={setLoginPasswordInput}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modalDescription}>
                Sign in with your existing email account. This will replace your
                anonymous account and load your saved data.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Suggestion Modal */}
        <Modal
          visible={showSuggestionModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSuggestionModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSuggestionModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={handleSendSuggestion}>
                <Text style={styles.modalSaveText}>Send</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feedback Type</Text>
                <View style={styles.suggestionTypeContainer}>
                  {[
                    {
                      key: "feature",
                      label: "Feature Request",
                      color: theme.colors.success[500],
                    },
                    {
                      key: "bug",
                      label: "Bug Report",
                      color: theme.colors.error[500],
                    },
                    {
                      key: "general",
                      label: "General Feedback",
                      color: "#2196F3",
                    },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.suggestionTypeButton,
                        suggestionType === type.key && {
                          backgroundColor: type.color,
                        },
                      ]}
                      onPress={() => setSuggestionType(type.key as any)}
                    >
                      <Text
                        style={[
                          styles.suggestionTypeText,
                          suggestionType === type.key && {color: "white"},
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Feedback</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={suggestionText}
                  onChangeText={setSuggestionText}
                  placeholder="Tell us what you think..."
                  multiline
                  numberOfLines={6}
                />
              </View>
              <Text style={styles.modalDescription}>
                Your feedback helps us improve the app. Thank you for taking the
                time to share your thoughts!
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Suggestions History Modal */}
        <Modal
          visible={showSuggestionsHistory}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSuggestionsHistory(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowSuggestionsHistory(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>My Suggestions</Text>
              <View style={{width: 50}} />
            </View>

            <ScrollView style={styles.modalContent}>
              {userSuggestions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No suggestions yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your submitted suggestions will appear here
                  </Text>
                </View>
              ) : (
                userSuggestions.map((suggestion, index) => (
                  <View
                    key={suggestion.id || index}
                    style={styles.suggestionHistoryCard}
                  >
                    <View style={styles.suggestionHistoryHeader}>
                      <Text style={styles.suggestionHistoryType}>
                        {suggestion.suggestionType.charAt(0).toUpperCase() +
                          suggestion.suggestionType.slice(1)}
                      </Text>
                      <View
                        style={[
                          styles.suggestionStatusBadge,
                          {backgroundColor: getStatusColor(suggestion.status)},
                        ]}
                      >
                        <Text style={styles.suggestionStatusText}>
                          {suggestion.status.charAt(0).toUpperCase() +
                            suggestion.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={styles.suggestionHistoryTitle}
                      numberOfLines={2}
                    >
                      {suggestion.title}
                    </Text>
                    <Text
                      style={styles.suggestionHistoryDescription}
                      numberOfLines={3}
                    >
                      {suggestion.description}
                    </Text>
                    <Text style={styles.suggestionHistoryDate}>
                      Submitted:{" "}
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Pet Name Modal */}
        <Modal
          visible={showPetNameModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPetNameModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPetNameModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Pet Name</Text>
              <TouchableOpacity onPress={handleAddPetName} disabled={loading}>
                <Text style={[styles.modalSaveText, loading && {opacity: 0.5}]}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pet Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={petNameInput}
                  onChangeText={setPetNameInput}
                  placeholder="Enter your pet's name"
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              <Text style={styles.modalDescription}>
                Enter your pet's name to start tracking their health and
                activities.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    marginTop: theme.spacing[4],
  },
  header: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.sizes["4xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.white,
    textAlign: "center",
    textShadowColor: blackWithOpacity(0.3),
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.9,
    fontFamily: theme.typography.fonts.medium,
    marginTop: theme.spacing[2],
  },
  tabContainer: {
    height: 32,
  },
  tabScrollView: {
    paddingHorizontal: theme.spacing[5],
  },
  tab: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: 2,
    marginRight: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[100],
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: theme.colors.primary[500],
  },
  tabText: {
    color: theme.colors.primary[600],
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.semibold,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[5],
    paddingTop: 0,
  },

  // Overview styles
  overviewContainer: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  petNameMissingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFB74D",
    borderStyle: "dashed",
  },
  petNameMissingTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    color: "#FF9800",
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  petNameMissingText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray666,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  addPetButton: {
    backgroundColor: "#FF9800",
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    borderRadius: 25,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addPetButtonText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    textAlign: "center",
  },
  dateSelector: {
    backgroundColor: theme.colors.white,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing[5],
    borderRadius: 25,
    alignItems: "center",
    marginBottom: theme.spacing[3],
    marginTop: 0,
  },
  dateSelectorText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
  },
  summaryCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: theme.spacing[6],
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    width: "48%",
    marginBottom: theme.spacing[3],
  },
  summaryCardTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.gray333,
    marginBottom: theme.spacing[2],
  },
  summaryCardValue: {
    fontSize: theme.typography.sizes["2xl"],
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray333,
    marginBottom: theme.spacing[1],
  },
  summaryCardSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray666,
    marginBottom: theme.spacing[2],
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  quickActionButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.xl,
    width: "32%",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  quickActionText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.semibold,
    textAlign: "center",
  },

  // Chart styles
  chartContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[5],
  },
  chartTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.gray333,
    marginBottom: theme.spacing[4],
    textAlign: "center",
  },
  chart: {
    borderRadius: theme.borderRadius.xl,
  },

  // Records list styles
  recordsList: {
    paddingBottom: 100,
  },
  recordCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  recordTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.gray333,
  },
  recordTime: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  recordDetails: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    marginBottom: theme.spacing[1],
  },
  recordNotes: {
    fontSize: theme.typography.sizes.base,
    color: "#888",
    fontStyle: "italic",
    marginBottom: theme.spacing[1],
  },
  recordDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gray999,
  },
  recordDays: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    marginBottom: theme.spacing[2],
  },
  recordStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.semibold,
  },
  notificationIcon: {
    fontSize: theme.typography.sizes.md,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  emptyStateSubtext: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.8,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: theme.colors.white,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabText: {
    fontSize: theme.typography.sizes["2xl"],
    fontFamily: theme.typography.fonts.semibold,
    color: "#fa709a",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalCloseText: {
    fontSize: theme.typography.sizes.md,
    color: "#fa709a",
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.gray333,
  },
  modalSaveText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: "#fa709a",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[5],
  },
  inputGroup: {
    marginBottom: theme.spacing[6],
  },
  inputLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.gray333,
    marginBottom: theme.spacing[2],
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: "#f9fafb",
  },
  dateButtonText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.gray333,
  },
  unitSelector: {
    flexDirection: "row",
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius["2xl"],
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  unitButtonActive: {
    backgroundColor: "#fa709a",
    borderColor: "#fa709a",
  },
  unitButtonText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  unitButtonTextActive: {
    color: theme.colors.white,
    fontFamily: theme.typography.fonts.semibold,
  },
  foodTypeContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: theme.spacing[1],
  },
  foodTypeButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius["2xl"],
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  foodTypeButtonActive: {
    backgroundColor: "#fa709a",
    borderColor: "#fa709a",
  },
  foodTypeText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  foodTypeTextActive: {
    color: theme.colors.white,
    fontFamily: theme.typography.fonts.semibold,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius["2xl"],
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  dayButtonActive: {
    backgroundColor: "#fa709a",
    borderColor: "#fa709a",
  },
  dayButtonText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  dayButtonTextActive: {
    color: theme.colors.white,
    fontFamily: theme.typography.fonts.semibold,
  },

  // Account styles
  accountContainer: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  accountSection: {
    marginBottom: theme.spacing[6],
  },
  accountSectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing[3],
    textShadowColor: blackWithOpacity(0.3),
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  accountDescription: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  accountLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.gray333,
  },
  accountValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  accountButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "theme.colors.white",
  },
  accountButtonText: {
    color: theme.colors.primary[700],
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
  },
  modalDescription: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    lineHeight: 20,
    marginTop: theme.spacing[4],
    textAlign: "center",
  },
  suggestionTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionTypeButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius["2xl"],
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    marginBottom: theme.spacing[2],
  },
  suggestionTypeText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.gray666,
    fontFamily: theme.typography.fonts.medium,
  },
  suggestionHistoryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  suggestionHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  suggestionHistoryType: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.semibold,
    color: "#374151",
  },
  suggestionStatusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.lg,
  },
  suggestionStatusText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.semibold,
    color: theme.colors.white,
  },
  suggestionHistoryTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semibold,
    color: "#111827",
    marginBottom: theme.spacing[2],
    lineHeight: 20,
  },
  suggestionHistoryDescription: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: theme.spacing[2],
  },
  suggestionHistoryDate: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.light,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});

export default PetTrackerScreen;
