import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import DatePicker from "react-native-date-picker";
import {useSelector} from "react-redux";
import {RootState} from "../store/store";
import {useTranslation} from "../hooks/useTranslation";
import {VaccineService} from "../services/vaccineService";
import {
  VaccineRecord,
  VaccineFormData,
  VaccineType,
  VACCINE_LABELS,
  DOG_VACCINES,
  CAT_VACCINES,
} from "../types/vaccine";

const VaccineCardScreen: React.FC = () => {
  const {t} = useTranslation();
  const {user} = useSelector((state: RootState) => state.auth);
  const {petPreference, profile} = useSelector(
    (state: RootState) => state.user
  );

  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState<
    "administered" | "nextDue" | null
  >(null);

  // Form state
  const [formData, setFormData] = useState<VaccineFormData>({
    petName: profile?.petName || "",
    vaccineName: "",
    vaccineType: VaccineType.RABIES,
    administeredDate: new Date(),
    nextDueDate: undefined,
    veterinarianName: "",
    clinicName: "",
    batchNumber: "",
    notes: "",
  });

  const availableVaccines =
    petPreference === "cat" ? CAT_VACCINES : DOG_VACCINES;

  useEffect(() => {
    loadVaccines();
  }, []);

  const loadVaccines = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userVaccines = await VaccineService.getUserVaccines(user.uid);
      setVaccines(userVaccines);
    } catch (error) {
      console.error("Error loading vaccines:", error);
      Alert.alert("Error", "Failed to load vaccine records");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      petName: profile?.petName || "",
      vaccineName: "",
      vaccineType: VaccineType.RABIES,
      administeredDate: new Date(),
      nextDueDate: undefined,
      veterinarianName: "",
      clinicName: "",
      batchNumber: "",
      notes: "",
    });
    setEditingVaccine(null);
  };

  const handleAddVaccine = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditVaccine = (vaccine: VaccineRecord) => {
    setFormData({
      petName: vaccine.petName,
      vaccineName: vaccine.vaccineName,
      vaccineType: vaccine.vaccineType,
      administeredDate: new Date(vaccine.administeredDate),
      nextDueDate: vaccine.nextDueDate
        ? new Date(vaccine.nextDueDate)
        : undefined,
      veterinarianName: vaccine.veterinarianName,
      clinicName: vaccine.clinicName,
      batchNumber: vaccine.batchNumber || "",
      notes: vaccine.notes || "",
    });
    setEditingVaccine(vaccine);
    setShowAddModal(true);
  };

  const handleSaveVaccine = async () => {
    if (!user?.uid) return;

    // Validation
    if (
      !formData.petName.trim() ||
      !formData.vaccineName.trim() ||
      !formData.veterinarianName.trim() ||
      !formData.clinicName.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      if (editingVaccine) {
        await VaccineService.updateVaccine(editingVaccine.id, formData);
      } else {
        await VaccineService.createVaccine(user.uid, formData);
      }

      setShowAddModal(false);
      resetForm();
      loadVaccines();

      Alert.alert(
        "Success",
        editingVaccine
          ? "Vaccine updated successfully"
          : "Vaccine added successfully"
      );
    } catch (error) {
      console.error("Error saving vaccine:", error);
      Alert.alert("Error", "Failed to save vaccine record");
    }
  };

  const handleDeleteVaccine = (vaccine: VaccineRecord) => {
    Alert.alert(
      "Delete Vaccine",
      `Are you sure you want to delete ${vaccine.vaccineName}?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await VaccineService.deleteVaccine(vaccine.id);
              loadVaccines();
              Alert.alert("Success", "Vaccine deleted successfully");
            } catch (error) {
              console.error("Error deleting vaccine:", error);
              Alert.alert("Error", "Failed to delete vaccine record");
            }
          },
        },
      ]
    );
  };

  const handleShareCard = async () => {
    try {
      const cardText = generateVaccineCardText();

      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Share.share({
          message: cardText,
          title: `${formData.petName || "Pet"}'s Vaccine Card`,
        });
      }
    } catch (error) {
      console.error("Error sharing vaccine card:", error);
      Alert.alert("Error", "Failed to share vaccine card");
    }
  };

  const generateVaccineCardText = () => {
    const petName = profile?.petName || "My Pet";
    let cardText = `🏥 ${petName}'s Vaccine Card\n\n`;

    if (vaccines.length === 0) {
      cardText += "No vaccine records yet.\n";
    } else {
      vaccines.forEach((vaccine, index) => {
        cardText += `${index + 1}. ${vaccine.vaccineName}\n`;
        cardText += `   Type: ${VACCINE_LABELS[vaccine.vaccineType]}\n`;
        cardText += `   Date: ${new Date(
          vaccine.administeredDate
        ).toLocaleDateString()}\n`;
        cardText += `   Vet: ${vaccine.veterinarianName}\n`;
        cardText += `   Clinic: ${vaccine.clinicName}\n`;
        if (vaccine.nextDueDate && vaccine.nextDueDate !== null) {
          cardText += `   Next Due: ${new Date(
            vaccine.nextDueDate
          ).toLocaleDateString()}\n`;
        }
        cardText += "\n";
      });
    }

    cardText += "Generated by Pet Hero AI 🐕🐱";
    return cardText;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (nextDueDate?: string) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  const isDueSoon = (nextDueDate?: string) => {
    if (!nextDueDate) return false;
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return dueDate >= today && dueDate <= thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading vaccine records...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#f093fb"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏥 Vaccine Card</Text>
          <Text style={styles.subtitle}>
            {profile?.petName || "Your pet"}'s vaccination history
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareCard}
            >
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddVaccine}
            >
              <Text style={styles.addButtonText}>+ Add Vaccine</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vaccine List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {vaccines.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No vaccine records yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Vaccine" to start tracking your pet's vaccinations
              </Text>
            </View>
          ) : (
            vaccines.map((vaccine) => (
              <View key={vaccine.id} style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <View style={styles.vaccineInfo}>
                    <Text style={styles.vaccineName}>
                      {vaccine.vaccineName}
                    </Text>
                    <Text style={styles.vaccineType}>
                      {VACCINE_LABELS[vaccine.vaccineType]}
                    </Text>
                  </View>
                  <View style={styles.vaccineActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditVaccine(vaccine)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteVaccine(vaccine)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.vaccineDetails}>
                  <Text style={styles.detailText}>
                    📅 Administered: {formatDate(vaccine.administeredDate)}
                  </Text>
                  {vaccine.nextDueDate && (
                    <Text
                      style={[
                        styles.detailText,
                        isOverdue(vaccine.nextDueDate) && styles.overdueText,
                        isDueSoon(vaccine.nextDueDate) && styles.dueSoonText,
                      ]}
                    >
                      ⏰ Next Due: {formatDate(vaccine.nextDueDate)}
                      {isOverdue(vaccine.nextDueDate) && " (Overdue)"}
                      {isDueSoon(vaccine.nextDueDate) && " (Due Soon)"}
                    </Text>
                  )}
                  <Text style={styles.detailText}>
                    👨‍⚕️ {vaccine.veterinarianName}
                  </Text>
                  <Text style={styles.detailText}>🏥 {vaccine.clinicName}</Text>
                  {vaccine.batchNumber && vaccine.batchNumber !== null && (
                    <Text style={styles.detailText}>
                      📦 Batch: {vaccine.batchNumber}
                    </Text>
                  )}
                  {vaccine.notes && vaccine.notes !== null && (
                    <Text style={styles.detailText}>📝 {vaccine.notes}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingVaccine ? "Edit Vaccine" : "Add Vaccine"}
              </Text>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveVaccine}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Pet Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.petName}
                  onChangeText={(text) =>
                    setFormData({...formData, petName: text})
                  }
                  placeholder="Enter pet name"
                />
              </View>

              {/* Vaccine Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vaccine Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.vaccineName}
                  onChangeText={(text) =>
                    setFormData({...formData, vaccineName: text})
                  }
                  placeholder="e.g., Rabies, DHPP"
                />
              </View>

              {/* Vaccine Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vaccine Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.vaccineTypeContainer}>
                    {availableVaccines.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.vaccineTypeButton,
                          formData.vaccineType === type &&
                            styles.vaccineTypeButtonActive,
                        ]}
                        onPress={() =>
                          setFormData({...formData, vaccineType: type})
                        }
                      >
                        <Text
                          style={[
                            styles.vaccineTypeText,
                            formData.vaccineType === type &&
                              styles.vaccineTypeTextActive,
                          ]}
                        >
                          {VACCINE_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Administered Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Administered Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker("administered")}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.administeredDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Next Due Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Next Due Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker("nextDue")}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.nextDueDate
                      ? formData.nextDueDate.toLocaleDateString()
                      : "Select date"}
                  </Text>
                </TouchableOpacity>
                {formData.nextDueDate && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() =>
                      setFormData({...formData, nextDueDate: undefined})
                    }
                  >
                    <Text style={styles.clearDateText}>Clear Date</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Veterinarian Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Veterinarian Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.veterinarianName}
                  onChangeText={(text) =>
                    setFormData({...formData, veterinarianName: text})
                  }
                  placeholder="Dr. Smith"
                />
              </View>

              {/* Clinic Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clinic Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.clinicName}
                  onChangeText={(text) =>
                    setFormData({...formData, clinicName: text})
                  }
                  placeholder="Animal Hospital"
                />
              </View>

              {/* Batch Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Batch Number (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.batchNumber}
                  onChangeText={(text) =>
                    setFormData({...formData, batchNumber: text})
                  }
                  placeholder="Vaccine batch number"
                />
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
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
          </SafeAreaView>

          {/* Date Picker */}
          <DatePicker
            modal
            open={showDatePicker !== null}
            date={
              showDatePicker === "administered"
                ? formData.administeredDate
                : formData.nextDueDate || new Date()
            }
            mode="date"
            onConfirm={(date) => {
              if (showDatePicker === "administered") {
                setFormData({...formData, administeredDate: date});
              } else {
                setFormData({...formData, nextDueDate: date});
              }
              setShowDatePicker(null);
            }}
            onCancel={() => setShowDatePicker(null)}
          />
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
    color: "#ffffff",
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  addButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    opacity: 0.8,
  },
  vaccineCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vaccineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vaccineInfo: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  vaccineType: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  vaccineActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  vaccineDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  overdueText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  dueSoonText: {
    color: "#ea580c",
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#8B5CF6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalSaveButton: {
    padding: 4,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  clearDateText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  vaccineTypeContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  vaccineTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  vaccineTypeButtonActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  vaccineTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  vaccineTypeTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default VaccineCardScreen;
