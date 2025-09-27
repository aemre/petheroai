import firestore from "@react-native-firebase/firestore";
import {
  FeedingRecord,
  WaterRecord,
  WeightRecord,
  FeedingSchedule,
  TrackerNotification,
  TrackerFormData,
  ScheduleFormData,
  DailyTrackerSummary,
  WATER_INTAKE_RECOMMENDATIONS,
} from "../types/tracker";

const COLLECTIONS = {
  FEEDING: "feeding_records",
  WATER: "water_records",
  WEIGHT: "weight_records",
  SCHEDULES: "feeding_schedules",
  NOTIFICATIONS: "tracker_notifications",
};

export class TrackerService {
  // FEEDING RECORDS
  static async createFeedingRecord(
    userId: string,
    data: TrackerFormData
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const record: Omit<FeedingRecord, "id"> = {
        userId,
        petName: data.petName,
        foodType: data.foodType || "Dry Food",
        amount: data.amount,
        unit: data.unit as "grams" | "cups",
        timestamp: data.timestamp.toISOString(),
        notes: data.notes || null,
        createdAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.FEEDING)
        .add(record);

      console.log("Feeding record created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating feeding record:", error);
      throw new Error("Failed to create feeding record");
    }
  }

  static async getFeedingRecords(
    userId: string,
    petName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FeedingRecord[]> {
    try {
      let query = firestore()
        .collection(COLLECTIONS.FEEDING)
        .where("userId", "==", userId);

      if (petName) {
        query = query.where("petName", "==", petName);
      }

      const querySnapshot = await query.get();
      const records: FeedingRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = {id: doc.id, ...doc.data()} as FeedingRecord;

        // Filter by date range if provided
        if (startDate || endDate) {
          const recordDate = new Date(data.timestamp);
          if (startDate && recordDate < startDate) return;
          if (endDate && recordDate > endDate) return;
        }

        records.push(data);
      });

      // Sort by timestamp (newest first)
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return records;
    } catch (error) {
      console.error("Error getting feeding records:", error);
      throw new Error("Failed to retrieve feeding records");
    }
  }

  // WATER RECORDS
  static async createWaterRecord(
    userId: string,
    data: TrackerFormData
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const record: Omit<WaterRecord, "id"> = {
        userId,
        petName: data.petName,
        amount: data.amount,
        timestamp: data.timestamp.toISOString(),
        notes: data.notes || null,
        createdAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.WATER)
        .add(record);

      console.log("Water record created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating water record:", error);
      throw new Error("Failed to create water record");
    }
  }

  static async getWaterRecords(
    userId: string,
    petName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WaterRecord[]> {
    try {
      let query = firestore()
        .collection(COLLECTIONS.WATER)
        .where("userId", "==", userId);

      if (petName) {
        query = query.where("petName", "==", petName);
      }

      const querySnapshot = await query.get();
      const records: WaterRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = {id: doc.id, ...doc.data()} as WaterRecord;

        // Filter by date range if provided
        if (startDate || endDate) {
          const recordDate = new Date(data.timestamp);
          if (startDate && recordDate < startDate) return;
          if (endDate && recordDate > endDate) return;
        }

        records.push(data);
      });

      // Sort by timestamp (newest first)
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return records;
    } catch (error) {
      console.error("Error getting water records:", error);
      throw new Error("Failed to retrieve water records");
    }
  }

  // WEIGHT RECORDS
  static async createWeightRecord(
    userId: string,
    data: TrackerFormData
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const record: Omit<WeightRecord, "id"> = {
        userId,
        petName: data.petName,
        weight: data.amount, // amount is weight in kg
        timestamp: data.timestamp.toISOString(),
        notes: data.notes || null,
        createdAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.WEIGHT)
        .add(record);

      console.log("Weight record created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating weight record:", error);
      throw new Error("Failed to create weight record");
    }
  }

  static async getWeightRecords(
    userId: string,
    petName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WeightRecord[]> {
    try {
      let query = firestore()
        .collection(COLLECTIONS.WEIGHT)
        .where("userId", "==", userId);

      if (petName) {
        query = query.where("petName", "==", petName);
      }

      const querySnapshot = await query.get();
      const records: WeightRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = {id: doc.id, ...doc.data()} as WeightRecord;

        // Filter by date range if provided
        if (startDate || endDate) {
          const recordDate = new Date(data.timestamp);
          if (startDate && recordDate < startDate) return;
          if (endDate && recordDate > endDate) return;
        }

        records.push(data);
      });

      // Sort by timestamp (newest first)
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return records;
    } catch (error) {
      console.error("Error getting weight records:", error);
      throw new Error("Failed to retrieve weight records");
    }
  }

  // FEEDING SCHEDULES
  static async createFeedingSchedule(
    userId: string,
    data: ScheduleFormData
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const schedule: Omit<FeedingSchedule, "id"> = {
        userId,
        petName: data.petName,
        name: data.name,
        time: data.time,
        foodType: data.foodType,
        amount: data.amount,
        unit: data.unit,
        days: data.days,
        isActive: true,
        notifications: data.notifications,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.SCHEDULES)
        .add(schedule);

      console.log("Feeding schedule created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating feeding schedule:", error);
      throw new Error("Failed to create feeding schedule");
    }
  }

  static async getFeedingSchedules(
    userId: string,
    petName?: string
  ): Promise<FeedingSchedule[]> {
    try {
      let query = firestore()
        .collection(COLLECTIONS.SCHEDULES)
        .where("userId", "==", userId);

      if (petName) {
        query = query.where("petName", "==", petName);
      }

      const querySnapshot = await query.get();
      const schedules: FeedingSchedule[] = [];

      querySnapshot.forEach((doc) => {
        schedules.push({
          id: doc.id,
          ...doc.data(),
        } as FeedingSchedule);
      });

      return schedules;
    } catch (error) {
      console.error("Error getting feeding schedules:", error);
      throw new Error("Failed to retrieve feeding schedules");
    }
  }

  static async updateFeedingSchedule(
    scheduleId: string,
    updates: Partial<ScheduleFormData & {isActive: boolean}>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await firestore()
        .collection(COLLECTIONS.SCHEDULES)
        .doc(scheduleId)
        .update(updateData);

      console.log("Feeding schedule updated:", scheduleId);
    } catch (error) {
      console.error("Error updating feeding schedule:", error);
      throw new Error("Failed to update feeding schedule");
    }
  }

  static async deleteFeedingSchedule(scheduleId: string): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.SCHEDULES)
        .doc(scheduleId)
        .delete();

      console.log("Feeding schedule deleted:", scheduleId);
    } catch (error) {
      console.error("Error deleting feeding schedule:", error);
      throw new Error("Failed to delete feeding schedule");
    }
  }

  // NOTIFICATIONS
  static async createNotification(
    userId: string,
    notification: Omit<TrackerNotification, "id" | "createdAt">
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const notificationData: Omit<TrackerNotification, "id"> = {
        ...notification,
        userId,
        createdAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS)
        .add(notificationData);

      console.log("Notification created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  static async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<TrackerNotification[]> {
    try {
      let query = firestore()
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where("userId", "==", userId);

      if (unreadOnly) {
        query = query.where("isRead", "==", false);
      }

      const querySnapshot = await query.get();
      const notifications: TrackerNotification[] = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as TrackerNotification);
      });

      // Sort by scheduled time (newest first)
      notifications.sort(
        (a, b) =>
          new Date(b.scheduledTime).getTime() -
          new Date(a.scheduledTime).getTime()
      );

      return notifications;
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw new Error("Failed to retrieve notifications");
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS)
        .doc(notificationId)
        .update({isRead: true});

      console.log("Notification marked as read:", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  // ANALYTICS & INSIGHTS
  static async getDailySummary(
    userId: string,
    petName: string,
    date: Date,
    petWeight?: number,
    petType?: "dog" | "cat" | "bird"
  ): Promise<DailyTrackerSummary> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get feeding records for the day
      const feedingRecords = await this.getFeedingRecords(
        userId,
        petName,
        startOfDay,
        endOfDay
      );

      // Get water records for the day
      const waterRecords = await this.getWaterRecords(
        userId,
        petName,
        startOfDay,
        endOfDay
      );

      // Get weight record for the day (if any)
      const weightRecords = await this.getWeightRecords(
        userId,
        petName,
        startOfDay,
        endOfDay
      );

      // Get feeding schedules for the day
      const schedules = await this.getFeedingSchedules(userId, petName);
      const todaySchedules = schedules.filter((schedule) => {
        const dayOfWeek = date.getDay();
        return schedule.isActive && schedule.days.includes(dayOfWeek);
      });

      // Calculate feeding summary
      const totalFeedingAmount = feedingRecords.reduce(
        (sum, record) => sum + record.amount,
        0
      );
      const feedingUnit =
        feedingRecords.length > 0 ? feedingRecords[0].unit : "grams";
      const feedingCompletionRate =
        todaySchedules.length > 0
          ? (feedingRecords.length / todaySchedules.length) * 100
          : 0;

      // Calculate water summary
      const totalWaterAmount = waterRecords.reduce(
        (sum, record) => sum + record.amount,
        0
      );
      const recommendedWater =
        petWeight && petType
          ? petWeight * WATER_INTAKE_RECOMMENDATIONS[petType]
          : 500; // Default 500ml
      const waterCompletionRate = (totalWaterAmount / recommendedWater) * 100;

      // Calculate weight summary
      let weightSummary: DailyTrackerSummary["weight"] | undefined;
      if (weightRecords.length > 0) {
        const latestWeight = weightRecords[0];

        // Get previous weight record for comparison
        const previousWeightRecords = await this.getWeightRecords(
          userId,
          petName,
          undefined,
          startOfDay
        );
        const previousWeight =
          previousWeightRecords.length > 0
            ? previousWeightRecords[0].weight
            : latestWeight.weight;

        weightSummary = {
          weight: latestWeight.weight,
          change: latestWeight.weight - previousWeight,
        };
      }

      const summary: DailyTrackerSummary = {
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
        petName,
        feeding: {
          totalAmount: totalFeedingAmount,
          unit: feedingUnit,
          recordsCount: feedingRecords.length,
          scheduledCount: todaySchedules.length,
          completionRate: Math.min(feedingCompletionRate, 100),
        },
        water: {
          totalAmount: totalWaterAmount,
          recordsCount: waterRecords.length,
          recommendedAmount: recommendedWater,
          completionRate: Math.min(waterCompletionRate, 100),
        },
        weight: weightSummary,
      };

      return summary;
    } catch (error) {
      console.error("Error getting daily summary:", error);
      throw new Error("Failed to get daily summary");
    }
  }

  // DELETE RECORDS
  static async deleteRecord(
    type: "feeding" | "water" | "weight",
    recordId: string
  ): Promise<void> {
    try {
      const collection =
        type === "feeding"
          ? COLLECTIONS.FEEDING
          : type === "water"
          ? COLLECTIONS.WATER
          : COLLECTIONS.WEIGHT;

      await firestore().collection(collection).doc(recordId).delete();

      console.log(`${type} record deleted:`, recordId);
    } catch (error) {
      console.error(`Error deleting ${type} record:`, error);
      throw new Error(`Failed to delete ${type} record`);
    }
  }
}
