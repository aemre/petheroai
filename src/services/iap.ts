import * as ExpoIAP from 'expo-iap';
import { Platform } from 'react-native';

const itemSKUs = {
  credits5: 'com.pethero.credits5',
  credits10: 'com.pethero.credits10',
  credits20: 'com.pethero.credits20',
};

const subscriptionSKUs = {
  premium_monthly: 'com.pethero.premium.monthly',
};

class IAPService {
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Initialize connection to the store
   */
  async initialize(): Promise<void> {
    if (this.isConnected) return;
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._initConnection();
    return this.connectionPromise;
  }

  private async _initConnection(): Promise<void> {
    try {
      console.log('🔗 Initializing IAP service with expo-iap...');
      console.log('📱 Platform:', Platform.OS);
      
      await ExpoIAP.initConnection();
      this.isConnected = true;
      console.log('✅ IAP connection established successfully');
    } catch (error) {
      console.error('❌ IAP initialization error:', error);
      console.log('⚠️ IAP services may not be available (simulator/testing environment)');
      console.log('💡 If you have StoreKit file configured, make sure you\'re running with proper setup');
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Disconnect from the store
   */
  async endConnection(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await ExpoIAP.endConnection();
      this.isConnected = false;
      console.log('🔌 IAP service disconnected from store');
    } catch (error) {
      console.error('❌ Error disconnecting from store:', error);
    }
  }

  /**
   * Get available products from the store
   */
  async getProducts() {
    try {
      await this.initialize();
      
      console.log('🔍 Getting IAP products with expo-iap...');
      console.log('📦 Product SKUs to fetch:', Object.values(itemSKUs));
      console.log('📱 Subscription SKUs to fetch:', Object.values(subscriptionSKUs));
      
      const productIds = Object.values(itemSKUs);
      const subscriptionIds = Object.values(subscriptionSKUs);
      
      const products = await ExpoIAP.getProducts(productIds);
      console.log('✅ Products retrieved:', products?.length || 0, 'items');
      console.log('📋 Product details:', products);
      
      // Validate product configurations
      this.validateProductConfigurations(products);
      
      const subscriptions = await ExpoIAP.getProducts(subscriptionIds);
      console.log('✅ Subscriptions retrieved:', subscriptions?.length || 0, 'items');
      console.log('📋 Subscription details:', subscriptions);
      
      if (products.length === 0 && subscriptions.length === 0) {
        console.warn('⚠️ No products found! Check:');
        console.warn('  • Product IDs match StoreKit configuration exactly');
        console.warn('  • Products are in "Ready to Submit" or "Approved" status');
        console.warn('  • Bundle ID matches App Store Connect');
        console.warn('  • StoreKit configuration is properly loaded');
      }
      
      console.log('🎉 IAP products retrieved successfully');
      return { products, subscriptions };
    } catch (error) {
      console.error('❌ Error getting products:', error);
      console.log('⚠️ This could be because:');
      console.log('  • Running in simulator without StoreKit testing enabled');
      console.log('  • StoreKit configuration file not loaded');
      console.log('  • Network/App Store connection issues');
      console.log('  • Product IDs not configured in App Store Connect');
      return { products: [], subscriptions: [] };
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string) {
    try {
      await this.initialize();
      
      console.log('💳 Initiating purchase for product:', productId);
      const result = await ExpoIAP.requestPurchase({ 
        request: Platform.OS === 'ios' 
          ? { sku: productId }
          : { skus: [productId] },
        type: 'inapp'
      });
      console.log('✅ Purchase completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Purchase error:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(subscriptionId: string) {
    try {
      await this.initialize();
      
      console.log('📱 Initiating subscription purchase:', subscriptionId);
      const result = await ExpoIAP.requestPurchase({ 
        request: Platform.OS === 'ios' 
          ? { sku: subscriptionId }
          : { skus: [subscriptionId], subscriptionOffers: [{ sku: subscriptionId, offerToken: '' }] },
        type: 'subs'
      });
      console.log('✅ Subscription purchase completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Subscription error:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    try {
      await this.initialize();
      
      console.log('🔄 Restoring previous purchases...');
      const availablePurchases = await ExpoIAP.getAvailablePurchases();
      console.log('✅ Restored purchases:', availablePurchases);

      // Filter for our app's products - use the correct property name
      const validPurchases = availablePurchases.filter(purchase => {
        const productId = (purchase as any).productId || (purchase as any).sku || '';
        return [...Object.values(itemSKUs), ...Object.values(subscriptionSKUs)].includes(productId);
      });

      return validPurchases;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Get current purchase history
   */
  async getPurchaseHistory() {
    try {
      await this.initialize();
      
      const availablePurchases = await ExpoIAP.getAvailablePurchases();
      console.log('📜 Purchase history:', availablePurchases);
      return availablePurchases;
    } catch (error) {
      console.error('❌ Failed to get purchase history:', error);
      return [];
    }
  }

  /**
   * Get credits from product ID
   */
  getCreditsFromProductId(productId: string): number {
    switch (productId) {
      case itemSKUs.credits5:
        return 5;
      case itemSKUs.credits10:
        return 10;
      case itemSKUs.credits20:
        return 20;
      default:
        return 0;
    }
  }

  /**
   * Validate product configurations against expected values
   */
  private validateProductConfigurations(products: any[]) {
    console.log('🔍 Validating product configurations...');
    
    products.forEach(product => {
      const productId = product.productId || product.id;
      console.log('🔍 Validating product:', productId, 'from object:', Object.keys(product));
      
      const expectedCredits = this.getCreditsFromProductId(productId);
      const displayInfo = this.getProductDisplayInfo(productId);
      
      // Check if product description mentions correct credit amount
      const description = product.description || '';
      const title = product.title || product.displayName || '';
      
      // Extract number from description/title to see if it matches expected credits
      const descriptionMatch = description.match(/(\d+)\s*credits?/i);
      const titleMatch = title.match(/(\d+)\s*credits?/i);
      
      if (descriptionMatch) {
        const describedCredits = parseInt(descriptionMatch[1]);
        if (describedCredits !== expectedCredits && expectedCredits > 0) {
          console.warn(`⚠️ Product ${product.productId} configuration mismatch:`);
          console.warn(`  Expected: ${expectedCredits} credits`);
          console.warn(`  Description says: ${describedCredits} credits`);
          console.warn(`  Using correct value: ${expectedCredits} credits`);
        }
      }
      
      if (titleMatch) {
        const titledCredits = parseInt(titleMatch[1]);
        if (titledCredits !== expectedCredits && expectedCredits > 0) {
          console.warn(`⚠️ Product ${product.productId} title mismatch:`);
          console.warn(`  Expected: ${expectedCredits} credits`);
          console.warn(`  Title says: ${titledCredits} credits`);
          console.warn(`  Using correct value: ${expectedCredits} credits`);
        }
      }
      
      // Log what we're actually using
      console.log(`✅ Product ${productId}: Using ${expectedCredits} credits (${displayInfo.badge || 'Standard'})`);
    });
  }

  /**
   * Get product display info with correct credit amounts
   */
  getProductDisplayInfo(productId: string) {
    const credits = this.getCreditsFromProductId(productId);
    
    switch (productId) {
      case itemSKUs.credits5:
        return {
          credits,
          title: `${credits} Credits Pack`,
          description: `Get ${credits} credits to start your pet transformation journey! Great value starter pack.`,
          badge: 'BEST VALUE'
        };
      case itemSKUs.credits10:
        return {
          credits,
          title: `${credits} Credits Pack`,
          description: `Get ${credits} credits for amazing pet transformations! Popular choice for regular users.`,
          badge: 'POPULAR'
        };
      case itemSKUs.credits20:
        return {
          credits,
          title: `${credits} Credits Pack`,
          description: `Get ${credits} credits to transform your pets into epic heroes! Perfect for multiple transformations.`,
          badge: null
        };
      default:
        return {
          credits,
          title: `${credits} Credits`,
          description: `Get ${credits} credits for pet transformations`,
          badge: null
        };
    }
  }

  /**
   * Check if user has premium access
   */
  async hasPremiumAccess(): Promise<boolean> {
    try {
      const purchases = await this.getPurchaseHistory();
      const premiumPurchases = purchases.filter(purchase => {
        const productId = (purchase as any).productId || (purchase as any).sku || '';
        return Object.values(subscriptionSKUs).includes(productId);
      });
      
      // For simplicity, check if there's any premium purchase
      // In production, you'd want to verify expiration dates
      return premiumPurchases.length > 0;
    } catch (error) {
      console.error('❌ Failed to check premium access:', error);
      return false;
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    console.log('🧹 Cleaning up IAP service...');
    this.endConnection();
  }
}

export default new IAPService();
export { itemSKUs, subscriptionSKUs };