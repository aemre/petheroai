import firestore from "@react-native-firebase/firestore";

export interface Suggestion {
  id: string;
  userId: string;
  userEmail?: string | null;
  suggestionType: "feature" | "bug" | "general";
  title: string;
  description: string;
  deviceInfo: {
    platform: string;
    version: string;
    model?: string | null;
  };
  appInfo: {
    version: string;
    build: string;
  };
  status: "pending" | "reviewed" | "implemented" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionFormData {
  suggestionType: "feature" | "bug" | "general";
  description: string;
}

const COLLECTION_NAME = "suggestions";

export class SuggestionService {
  static async createSuggestion(
    userId: string,
    data: SuggestionFormData,
    userEmail?: string
  ): Promise<string> {
    try {
      const now = new Date().toISOString();

      // Generate title based on type and first few words
      const title = this.generateTitle(data.suggestionType, data.description);

      // Get device and app info
      const deviceInfo = this.getDeviceInfo();
      const appInfo = this.getAppInfo();

      const suggestion: Omit<Suggestion, "id"> = {
        userId,
        userEmail: userEmail || null, // Convert undefined to null
        suggestionType: data.suggestionType,
        title,
        description: data.description,
        deviceInfo,
        appInfo,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      // Ensure no undefined values
      Object.keys(suggestion).forEach((key) => {
        if ((suggestion as any)[key] === undefined) {
          (suggestion as any)[key] = null;
        }
      });

      const docRef = await firestore()
        .collection(COLLECTION_NAME)
        .add(suggestion);

      console.log("Suggestion created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating suggestion:", error);
      throw new Error("Failed to create suggestion");
    }
  }

  static async getUserSuggestions(userId: string): Promise<Suggestion[]> {
    try {
      const querySnapshot = await firestore()
        .collection(COLLECTION_NAME)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const suggestions: Suggestion[] = [];
      querySnapshot.forEach((doc) => {
        suggestions.push({
          id: doc.id,
          ...doc.data(),
        } as Suggestion);
      });

      return suggestions;
    } catch (error) {
      console.error("Error getting user suggestions:", error);
      // Fallback query without orderBy if index is not ready
      try {
        const querySnapshot = await firestore()
          .collection(COLLECTION_NAME)
          .where("userId", "==", userId)
          .get();

        const suggestions: Suggestion[] = [];
        querySnapshot.forEach((doc) => {
          suggestions.push({
            id: doc.id,
            ...doc.data(),
          } as Suggestion);
        });

        // Sort in memory
        suggestions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return suggestions;
      } catch (fallbackError) {
        console.error("Error with fallback query:", fallbackError);
        throw new Error("Failed to retrieve suggestions");
      }
    }
  }

  static async updateSuggestionStatus(
    suggestionId: string,
    status: Suggestion["status"]
  ): Promise<void> {
    try {
      await firestore().collection(COLLECTION_NAME).doc(suggestionId).update({
        status,
        updatedAt: new Date().toISOString(),
      });

      console.log("Suggestion status updated:", suggestionId, status);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      throw new Error("Failed to update suggestion status");
    }
  }

  static async deleteSuggestion(suggestionId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTION_NAME).doc(suggestionId).delete();

      console.log("Suggestion deleted:", suggestionId);
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      throw new Error("Failed to delete suggestion");
    }
  }

  // Helper methods
  private static generateTitle(
    type: "feature" | "bug" | "general",
    description: string
  ): string {
    const prefix = {
      feature: "Feature Request:",
      bug: "Bug Report:",
      general: "Feedback:",
    };

    // Get first 50 characters of description for title
    const shortDescription =
      description.length > 50
        ? description.substring(0, 50) + "..."
        : description;

    return `${prefix[type]} ${shortDescription}`;
  }

  private static getDeviceInfo() {
    // In a real app, you would use react-native-device-info
    // For now, we'll use basic info
    const platform = require("react-native").Platform;

    return {
      platform: platform.OS,
      version: platform.Version.toString(),
      model: "Unknown" as string, // Would be device model, ensuring it's not undefined
    };
  }

  private static getAppInfo() {
    return {
      version: "1.0.0",
      build: "2024.01",
    };
  }

  // Get suggestion statistics (for admin dashboard)
  static async getSuggestionStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const querySnapshot = await firestore().collection(COLLECTION_NAME).get();

      const stats = {
        total: 0,
        byType: {feature: 0, bug: 0, general: 0},
        byStatus: {pending: 0, reviewed: 0, implemented: 0, rejected: 0},
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Suggestion;
        stats.total++;
        stats.byType[data.suggestionType]++;
        stats.byStatus[data.status]++;
      });

      return stats;
    } catch (error) {
      console.error("Error getting suggestion stats:", error);
      throw new Error("Failed to get suggestion statistics");
    }
  }
}
