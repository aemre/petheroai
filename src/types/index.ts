export interface User {
  uid: string;
  isAnonymous: boolean;
  createdAt?: Date;
}

export interface UserProfile {
  credits: number;
  premium: boolean;
  createdAt: Date;
  fcmToken?: string;
}

export interface Photo {
  id: string;
  userId: string;
  originalUrl: string;
  resultUrl?: string;
  status: 'processing' | 'done' | 'error';
  theme?: string;
  analysis?: string;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  credits: number;
  receipt: string;
  platform: 'ios' | 'android';
  verifiedAt: Date;
}

export interface Product {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  price: number;
  currency: string;
}

export interface NavigationParams {
  Splash: undefined;
  Home: undefined;
  Processing: { photoId: string };
  Result: { photoId: string };
}

export type PhotoStatus = 'processing' | 'done' | 'error';
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'cancelled';