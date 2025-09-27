import AsyncStorage from "@react-native-async-storage/async-storage";
import {TrackerService} from "./trackerService";
import {
  FeedingSchedule,
  TrackerNotification,
  NOTIFICATION_INTERVALS,
  WATER_INTAKE_RECOMMENDATIONS,
} from "../types/tracker";

export class NotificationService {
  private static STORAGE_KEYS = {
    LAST_WATER_REMINDER: "lastWaterReminder",
    LAST_WEIGHT_REMINDER: "lastWeightReminder",
    NOTIFICATION_SETTINGS: "notificationSettings",
  };

  // Check and create smart notifications
  static async checkAndCreateNotifications(
    userId: string,
    petName: string,
    petType?: "dog" | "cat" | "bird",
    petWeight?: number
  ) {
    try {
      console.log("🔔 Checking smart notifications for:", petName);

      // Get current time
      const now = new Date();

      // Check feeding schedule notifications
      await this.checkFeedingNotifications(userId, petName);

      // Check water intake notifications
      await this.checkWaterNotifications(userId, petName, petType, petWeight);

      // Check weight reminder notifications
      await this.checkWeightNotifications(userId, petName);

      console.log("✅ Smart notification check completed");
    } catch (error) {
      console.error("❌ Error checking notifications:", error);
    }
  }

  // Check feeding schedule notifications
  private static async checkFeedingNotifications(
    userId: string,
    petName: string
  ) {
    try {
      const schedules = await TrackerService.getFeedingSchedules(
        userId,
        petName
      );
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      for (const schedule of schedules) {
        if (!schedule.isActive || !schedule.notifications) continue;
        if (!schedule.days.includes(today)) continue;

        // Parse schedule time
        const [hours, minutes] = schedule.time.split(":").map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Check if we need to send a reminder (30 minutes before)
        const reminderTime = new Date(
          scheduledTime.getTime() -
            NOTIFICATION_INTERVALS.feeding.reminder * 60 * 1000
        );
        const overdueTime = new Date(
          scheduledTime.getTime() +
            NOTIFICATION_INTERVALS.feeding.overdue * 60 * 1000
        );

        // Send reminder notification
        if (now >= reminderTime && now < scheduledTime) {
          await this.createNotificationIfNotExists(userId, {
            type: "feeding",
            title: `🍽️ Feeding Reminder`,
            message: `${schedule.name} is coming up in 30 minutes for ${petName}`,
            scheduledTime: reminderTime.toISOString(),
            isRead: false,
            isCompleted: false,
            relatedId: schedule.id,
          });
        }

        // Send overdue notification
        if (now >= overdueTime) {
          // Check if feeding was recorded
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todayFeedings = await TrackerService.getFeedingRecords(
            userId,
            petName,
            today,
            tomorrow
          );
          const scheduledFeeding = todayFeedings.find((feeding) => {
            const feedingTime = new Date(feeding.timestamp);
            const timeDiff = Math.abs(
              feedingTime.getTime() - scheduledTime.getTime()
            );
            return timeDiff <= 2 * 60 * 60 * 1000; // Within 2 hours of scheduled time
          });

          if (!scheduledFeeding) {
            await this.createNotificationIfNotExists(userId, {
              type: "feeding",
              title: `⏰ Feeding Overdue`,
              message: `${schedule.name} is overdue for ${petName}`,
              scheduledTime: overdueTime.toISOString(),
              isRead: false,
              isCompleted: false,
              relatedId: schedule.id,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking feeding notifications:", error);
    }
  }

  // Check water intake notifications
  private static async checkWaterNotifications(
    userId: string,
    petName: string,
    petType?: "dog" | "cat" | "bird",
    petWeight?: number
  ) {
    try {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's water records
      const todayWater = await TrackerService.getWaterRecords(
        userId,
        petName,
        today,
        now
      );
      const totalWaterToday = todayWater.reduce(
        (sum, record) => sum + record.amount,
        0
      );

      // Calculate recommended water intake
      const recommendedWater =
        petWeight && petType
          ? petWeight * WATER_INTAKE_RECOMMENDATIONS[petType]
          : 500;

      // Check if water intake is low (less than 50% of recommended)
      if (totalWaterToday < recommendedWater * 0.5) {
        const lastWaterTime =
          todayWater.length > 0
            ? new Date(todayWater[0].timestamp)
            : new Date(today.getTime() - 24 * 60 * 60 * 1000); // Yesterday if no water today

        const hoursSinceLastWater =
          (now.getTime() - lastWaterTime.getTime()) / (1000 * 60 * 60);

        // Send reminder if it's been more than 4 hours since last water
        if (hoursSinceLastWater >= 4) {
          const lastReminder = await AsyncStorage.getItem(
            this.STORAGE_KEYS.LAST_WATER_REMINDER
          );
          const lastReminderTime = lastReminder
            ? new Date(lastReminder)
            : new Date(0);
          const hoursSinceLastReminder =
            (now.getTime() - lastReminderTime.getTime()) / (1000 * 60 * 60);

          // Only send reminder if it's been more than 2 hours since last reminder
          if (hoursSinceLastReminder >= 2) {
            await this.createNotificationIfNotExists(userId, {
              type: "water",
              title: `💧 Water Reminder`,
              message: `${petName} needs more water! Only ${totalWaterToday}ml of ${recommendedWater}ml recommended today.`,
              scheduledTime: now.toISOString(),
              isRead: false,
              isCompleted: false,
            });

            await AsyncStorage.setItem(
              this.STORAGE_KEYS.LAST_WATER_REMINDER,
              now.toISOString()
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking water notifications:", error);
    }
  }

  // Check weight reminder notifications
  private static async checkWeightNotifications(
    userId: string,
    petName: string
  ) {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get recent weight records
      const recentWeights = await TrackerService.getWeightRecords(
        userId,
        petName,
        weekAgo,
        now
      );

      // If no weight recorded in the last week, send reminder
      if (recentWeights.length === 0) {
        const lastReminder = await AsyncStorage.getItem(
          this.STORAGE_KEYS.LAST_WEIGHT_REMINDER
        );
        const lastReminderTime = lastReminder
          ? new Date(lastReminder)
          : new Date(0);
        const daysSinceLastReminder =
          (now.getTime() - lastReminderTime.getTime()) / (1000 * 60 * 60 * 24);

        // Only send reminder once per week
        if (daysSinceLastReminder >= 7) {
          await this.createNotificationIfNotExists(userId, {
            type: "weight",
            title: `⚖️ Weight Check Reminder`,
            message: `Time to weigh ${petName}! Regular weight monitoring helps track their health.`,
            scheduledTime: now.toISOString(),
            isRead: false,
            isCompleted: false,
          });

          await AsyncStorage.setItem(
            this.STORAGE_KEYS.LAST_WEIGHT_REMINDER,
            now.toISOString()
          );
        }
      }
    } catch (error) {
      console.error("Error checking weight notifications:", error);
    }
  }

  // Create notification if it doesn't already exist
  private static async createNotificationIfNotExists(
    userId: string,
    notification: Omit<TrackerNotification, "id" | "userId" | "createdAt">
  ) {
    try {
      // Check if similar notification already exists (within last hour)
      const existingNotifications = await TrackerService.getNotifications(
        userId,
        true
      );
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const similarNotification = existingNotifications.find(
        (existing) =>
          existing.type === notification.type &&
          existing.title === notification.title &&
          new Date(existing.scheduledTime) > hourAgo &&
          (!notification.relatedId ||
            existing.relatedId === notification.relatedId)
      );

      if (!similarNotification) {
        await TrackerService.createNotification(userId, notification);
        console.log("📱 Created notification:", notification.title);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  // Get smart insights based on tracking data
  static async getSmartInsights(
    userId: string,
    petName: string,
    petType?: "dog" | "cat" | "bird",
    petWeight?: number
  ): Promise<string[]> {
    try {
      const insights: string[] = [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get recent data
      const [feedingRecords, waterRecords, weightRecords] = await Promise.all([
        TrackerService.getFeedingRecords(userId, petName, weekAgo, now),
        TrackerService.getWaterRecords(userId, petName, weekAgo, now),
        TrackerService.getWeightRecords(userId, petName, weekAgo, now),
      ]);

      // Feeding insights
      if (feedingRecords.length > 0) {
        const avgDailyFeedings = feedingRecords.length / 7;
        if (avgDailyFeedings < 2) {
          insights.push(
            `🍽️ ${petName} is eating less than usual. Consider consulting your vet if this continues.`
          );
        } else if (avgDailyFeedings > 4) {
          insights.push(
            `🍽️ ${petName} is eating more frequently. Monitor portion sizes to maintain healthy weight.`
          );
        }

        // Check feeding consistency
        const feedingTimes = feedingRecords.map((record) =>
          new Date(record.timestamp).getHours()
        );
        const uniqueHours = [...new Set(feedingTimes)];
        if (uniqueHours.length > 6) {
          insights.push(
            `⏰ Try to establish more consistent feeding times for ${petName} to improve digestion.`
          );
        }
      }

      // Water insights
      if (waterRecords.length > 0 && petWeight && petType) {
        const totalWater = waterRecords.reduce(
          (sum, record) => sum + record.amount,
          0
        );
        const avgDailyWater = totalWater / 7;
        const recommendedDaily =
          petWeight * WATER_INTAKE_RECOMMENDATIONS[petType];

        if (avgDailyWater < recommendedDaily * 0.7) {
          insights.push(
            `💧 ${petName} may be drinking less water than recommended. Ensure fresh water is always available.`
          );
        } else if (avgDailyWater > recommendedDaily * 1.5) {
          insights.push(
            `💧 ${petName} is drinking more water than usual. Monitor for any health changes and consult your vet if concerned.`
          );
        }
      }

      // Weight insights
      if (weightRecords.length >= 2) {
        const latestWeight = weightRecords[0].weight;
        const previousWeight = weightRecords[1].weight;
        const weightChange = latestWeight - previousWeight;
        const changePercentage = (weightChange / previousWeight) * 100;

        if (Math.abs(changePercentage) > 5) {
          const direction = weightChange > 0 ? "gained" : "lost";
          insights.push(
            `⚖️ ${petName} has ${direction} ${Math.abs(weightChange).toFixed(
              1
            )}kg recently. Consider discussing with your vet.`
          );
        }
      }

      // General health insights
      if (feedingRecords.length === 0 && waterRecords.length === 0) {
        insights.push(
          `📊 Start tracking ${petName}'s daily habits to get personalized health insights!`
        );
      }

      return insights;
    } catch (error) {
      console.error("Error generating insights:", error);
      return [];
    }
  }

  // Schedule daily notification check (to be called from app initialization)
  static async scheduleDailyCheck(
    userId: string,
    petName: string,
    petType?: "dog" | "cat" | "bird",
    petWeight?: number
  ) {
    try {
      // This would typically be handled by a background task or push notification service
      // For now, we'll just run the check immediately
      await this.checkAndCreateNotifications(
        userId,
        petName,
        petType,
        petWeight
      );

      console.log("📅 Daily notification check scheduled");
    } catch (error) {
      console.error("Error scheduling daily check:", error);
    }
  }

  // Mark feeding as completed (when user adds feeding record)
  static async markFeedingCompleted(userId: string, scheduleId: string) {
    try {
      const notifications = await TrackerService.getNotifications(userId, true);
      const relatedNotifications = notifications.filter(
        (n) =>
          n.type === "feeding" && n.relatedId === scheduleId && !n.isCompleted
      );

      for (const notification of relatedNotifications) {
        await TrackerService.markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error("Error marking feeding completed:", error);
    }
  }

  // Get notification settings
  static async getNotificationSettings(): Promise<{
    feedingReminders: boolean;
    waterReminders: boolean;
    weightReminders: boolean;
  }> {
    try {
      const settings = await AsyncStorage.getItem(
        this.STORAGE_KEYS.NOTIFICATION_SETTINGS
      );
      return settings
        ? JSON.parse(settings)
        : {
            feedingReminders: true,
            waterReminders: true,
            weightReminders: true,
          };
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return {
        feedingReminders: true,
        waterReminders: true,
        weightReminders: true,
      };
    }
  }

  // Update notification settings
  static async updateNotificationSettings(settings: {
    feedingReminders: boolean;
    waterReminders: boolean;
    weightReminders: boolean;
  }) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(settings)
      );
      console.log("✅ Notification settings updated");
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  }
}
