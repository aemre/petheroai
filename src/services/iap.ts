import RNIap, {
  Product,
  Purchase,
  PurchaseError,
  SubscriptionPurchase,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
} from 'react-native-iap';

const itemSKUs = {
  credits5: 'com.pethero.credits5',
  credits10: 'com.pethero.credits10',
  credits20: 'com.pethero.credits20',
};

const subscriptionSKUs = {
  premium_monthly: 'com.pethero.premium.monthly',
};

class IAPService {
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;

  async initialize() {
    try {
      console.log('Initializing IAP service...');
      await initConnection();
      console.log('IAP connection established');
      
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        (purchase: ProductPurchase | SubscriptionPurchase) => {
          console.log('Purchase updated:', purchase);
          this.handlePurchaseUpdate(purchase);
        },
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.error('Purchase error:', error);
        },
      );
      
      console.log('IAP service initialized successfully');
    } catch (error) {
      console.error('IAP initialization error:', error);
      console.log('IAP services may not be available (simulator/testing environment)');
    }
  }

  async getProducts() {
    try {
      console.log('Getting IAP products...');
      const products = await RNIap.getProducts(Object.values(itemSKUs));
      const subscriptions = await RNIap.getSubscriptions(Object.values(subscriptionSKUs));
      console.log('IAP products retrieved successfully');
      return { products, subscriptions };
    } catch (error) {
      console.error('Error getting products:', error);
      console.log('IAP not available (likely simulator environment)');
      return { products: [], subscriptions: [] };
    }
  }

  async purchaseProduct(productId: string) {
    try {
      const purchase = await RNIap.requestPurchase(productId, false);
      return purchase;
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }

  async purchaseSubscription(subscriptionId: string) {
    try {
      const purchase = await RNIap.requestSubscription(subscriptionId);
      return purchase;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  private async handlePurchaseUpdate(purchase: ProductPurchase | SubscriptionPurchase) {
    try {
      const receipt = purchase.transactionReceipt;
      
      // Verify the purchase with your backend or Firebase Function
      // await verifyPurchase(purchase);
      
      // Acknowledge/finish the purchase
      if (purchase.productId.includes('credits')) {
        await RNIap.finishTransaction(purchase, false);
      } else {
        await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
      }
    } catch (error) {
      console.error('Error handling purchase:', error);
    }
  }

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

  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }
}

export default new IAPService();
export { itemSKUs, subscriptionSKUs };