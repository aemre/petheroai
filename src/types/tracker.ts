export interface FeedingRecord {
  id: string;
  userId: string;
  petName: string;
  foodType: string;
  amount: number; // in grams or cups
  unit: "grams" | "cups";
  timestamp: string; // ISO date string
  notes?: string | null;
  createdAt: string;
}

export interface WaterRecord {
  id: string;
  userId: string;
  petName: string;
  amount: number; // in ml
  timestamp: string; // ISO date string
  notes?: string | null;
  createdAt: string;
}

export interface WeightRecord {
  id: string;
  userId: string;
  petName: string;
  weight: number; // in kg
  timestamp: string; // ISO date string
  notes?: string | null;
  createdAt: string;
}

export interface FeedingSchedule {
  id: string;
  userId: string;
  petName: string;
  name: string; // e.g., "Morning Breakfast"
  time: string; // HH:MM format
  foodType: string;
  amount: number;
  unit: "grams" | "cups";
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
  notifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerNotification {
  id: string;
  userId: string;
  type: "feeding" | "water" | "weight" | "reminder";
  title: string;
  message: string;
  scheduledTime: string; // ISO date string
  isRead: boolean;
  isCompleted: boolean;
  relatedId?: string; // Related schedule or record ID
  createdAt: string;
}

export interface DailyTrackerSummary {
  date: string; // YYYY-MM-DD
  petName: string;
  feeding: {
    totalAmount: number;
    unit: string;
    recordsCount: number;
    scheduledCount: number;
    completionRate: number;
  };
  water: {
    totalAmount: number; // ml
    recordsCount: number;
    recommendedAmount: number;
    completionRate: number;
  };
  weight?: {
    weight: number;
    change: number; // compared to previous record
  };
}

export interface TrackerFormData {
  petName: string;
  type: "feeding" | "water" | "weight";
  amount: number;
  unit?: "grams" | "cups" | "ml" | "kg";
  foodType?: string;
  timestamp: Date;
  notes?: string;
}

export interface ScheduleFormData {
  petName: string;
  name: string;
  time: string;
  foodType: string;
  amount: number;
  unit: "grams" | "cups";
  days: number[];
  notifications: boolean;
}

export const FOOD_TYPES = [
  "Dry Food",
  "Wet Food",
  "Raw Food",
  "Treats",
  "Supplements",
  "Other",
];

export const FEEDING_UNITS = [
  {label: "Grams", value: "grams" as const},
  {label: "Cups", value: "cups" as const},
];

export const DAYS_OF_WEEK = [
  {label: "Sunday", value: 0},
  {label: "Monday", value: 1},
  {label: "Tuesday", value: 2},
  {label: "Wednesday", value: 3},
  {label: "Thursday", value: 4},
  {label: "Friday", value: 5},
  {label: "Saturday", value: 6},
];

// Recommended daily water intake (ml per kg of body weight)
export const WATER_INTAKE_RECOMMENDATIONS = {
  dog: 50, // 50ml per kg
  cat: 60, // 60ml per kg
  bird: 50, // 50ml per kg
};

// Smart notification intervals (in minutes)
export const NOTIFICATION_INTERVALS = {
  feeding: {
    reminder: 30, // 30 minutes before scheduled time
    overdue: 60, // 1 hour after scheduled time
  },
  water: {
    reminder: 120, // 2 hours if no water recorded
    lowIntake: 240, // 4 hours if below recommended intake
  },
  weight: {
    reminder: 10080, // 1 week reminder for weight check
  },
};
