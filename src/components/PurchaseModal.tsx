import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "../hooks/useTranslation";
import {AppDispatch, RootState} from "../store/store";
import {fetchUserProfile} from "../store/slices/userSlice";
import IAPService from "../services/iap";
import {verifyPurchase} from "../services/cloudFunctions";

const {width, height} = Dimensions.get("window");

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  products: any[];
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  visible,
  onClose,
  products,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);
  const {t} = useTranslation();

  const handlePurchase = async (productId: string) => {
    try {
      console.log(`🛒 Starting purchase for product: ${productId}`);
      const purchase = await IAPService.purchaseProduct(productId);

      if (purchase && user?.uid) {
        console.log(`💳 Purchase successful, verifying with cloud function...`);

        // Verify purchase with secure cloud function
        // Handle both single purchase and array response from RNIap
        const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;
        const receipt =
          purchaseData.transactionReceipt ||
          (purchaseData as any).purchaseToken ||
          (purchaseData as any).purchaseTokenAndroid ||
          "";

        const verificationResult = await verifyPurchase(
          receipt,
          productId,
          Platform.OS as "ios" | "android"
        );

        if (verificationResult.success) {
          console.log(
            `✅ Purchase verified! ${verificationResult.credits} credits added`
          );

          // Refresh user profile to get updated credits from server
          await dispatch(fetchUserProfile(user.uid));

          onClose();
          Alert.alert(
            t("common.success"),
            `${verificationResult.credits} ${t(
              "home.purchaseModal.purchaseSuccess"
            )}`
          );
        } else {
          console.error(
            "❌ Purchase verification failed:",
            verificationResult.message
          );
          Alert.alert(t("common.error"), t("home.purchaseVerificationFailed"));
        }
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert(t("common.error"), t("home.purchaseModal.purchaseError"));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("home.purchaseModal.title")}</Text>
          <Text style={styles.modalSubtitle}>
            {t("home.purchaseModal.subtitle")}
          </Text>

          {products
            .sort((a, b) => {
              // Sort by credits amount: 5, 10, 20
              const creditsA = IAPService.getCreditsFromProductId(
                a.productId || a.id
              );
              const creditsB = IAPService.getCreditsFromProductId(
                b.productId || b.id
              );
              return creditsA - creditsB;
            })
            .map((product, index) => {
              // Handle both productId and id properties
              const productId = product.productId || product.id;
              const displayInfo = IAPService.getProductDisplayInfo(productId);
              const credits = displayInfo.credits;

              // Handle different price properties
              const productPrice =
                product.price ||
                parseFloat(product.displayPrice?.replace("$", "") || "0");

              const pricePerCredit = credits > 0 ? productPrice / credits : 0;
              const isPopular = displayInfo.badge === "POPULAR";
              const isBestValue = displayInfo.badge === "BEST VALUE";

              return (
                <TouchableOpacity
                  key={productId}
                  style={[
                    styles.productButton,
                    isPopular && styles.popularProduct,
                  ]}
                  onPress={() => handlePurchase(productId)}
                  activeOpacity={0.8}
                >
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}
                  {isBestValue && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueBadgeText}>BEST VALUE</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={[
                      index % 2 === 0 ? "#ff6b6b" : "#4ecdc4",
                      index % 2 === 0 ? "#ff8e8e" : "#6ee0d5",
                    ]}
                    style={styles.productGradient}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle}>
                        {credits} {t("home.purchaseModal.credits")}
                      </Text>
                      <Text style={styles.productDescription}>
                        {displayInfo.description}
                      </Text>
                      <Text style={styles.productValueText}>
                        ${pricePerCredit.toFixed(2)} per credit
                      </Text>
                    </View>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPrice}>
                        {product.localizedPrice ||
                          product.displayPrice ||
                          `$${productPrice.toFixed(2)}`}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 28,
    borderRadius: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 28,
    fontWeight: "500",
  },
  productButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#ff6b6b",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  popularProduct: {
    shadowColor: "#4ecdc4",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  bestValueBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  productGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    minHeight: 80,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  productDescription: {
    color: "white",
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 6,
    lineHeight: 18,
  },
  productValueText: {
    color: "white",
    fontSize: 11,
    opacity: 0.8,
    fontWeight: "600",
  },
  productPriceContainer: {
    alignItems: "flex-end",
  },
  productPrice: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  closeButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PurchaseModal;
