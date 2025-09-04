import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

import { AppDispatch, RootState } from '../store/store';
import { uploadAndProcessPhoto } from '../store/slices/photoSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { RootStackParamList } from '../navigation/AppNavigator';
import IAPService from '../services/iap';
import { useTranslation } from '../hooks/useTranslation';
import { verifyPurchase } from '../services/cloudFunctions';
import { Platform } from 'react-native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  const { profile, petPreference, isLoading: userLoading } = useSelector((state: RootState) => state.user);
  const { isUploading } = useSelector((state: RootState) => state.photo);
  const { t, isRTL } = useTranslation();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // No animations needed

  // Pet-specific content
  const getPetContent = () => {
    // Default to dog if petPreference is null or undefined
    const isDog = petPreference === 'dog' || petPreference === null;
    return {
      emoji: isDog ? '🐕' : '🐱',
      heroEmoji: isDog ? '🦸‍♂️' : '🦸‍♀️',
      image: isDog ? require('../../assets/dog.jpg') : require('../../assets/cat.jpg'),
      petName: isDog ? t('common.dog') : t('common.cat'),
      subtitle: isDog ? t('home.dogSubtitle') : t('home.catSubtitle'),
      actionText: isDog ? t('home.transformDog') : t('home.transformCat'),
      actionSubtext: isDog ? t('home.dogActionText') : t('home.catActionText'),
      gradientColors: isDog 
        ? ['#667eea', '#764ba2', '#f093fb'] as const
        : ['#fa709a', '#fee140', '#fa709a'] as const,
      iconGradient: isDog 
        ? ['#ff9a9e', '#fecfef', '#fecfef'] as const
        : ['#a8edea', '#fed6e3', '#a8edea'] as const,
    };
  };

  const petContent = getPetContent();

  useEffect(() => {
    initializeIAP();
  }, []);

  // Refresh user profile when screen comes into focus (to update credits after processing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.uid) {
        console.log('HomeScreen focused, refreshing user profile...');
        dispatch(fetchUserProfile(user.uid));
      }
    });

    return unsubscribe;
  }, [navigation, user?.uid, dispatch]);

  const initializeIAP = async () => {
    try {
      console.log('Initializing IAP...');
      await IAPService.initialize();
      
      // Check if IAPService has the getProducts method
      if (typeof IAPService.getProducts === 'function') {
        const { products } = await IAPService.getProducts();
        setProducts(products || []);
        console.log('IAP products loaded:', products?.length || 0);
      } else {
        console.warn('IAPService.getProducts is not available');
        setProducts([]);
      }
    } catch (error) {
      console.error('IAP initialization error:', error);
      console.log('Running without IAP support (likely simulator)');
      setProducts([]);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let hasPermission = false;
      
      if (useCamera) {
        hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(t('home.permissionNeeded'), t('home.cameraPermission'));
          return;
        }
      } else {
        hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) {
          Alert.alert(t('home.permissionNeeded'), t('home.photoLibraryPermission'));
          return;
        }
      }

      // Add timeout protection for iPad compatibility
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Image picker timeout')), 30000);
      });

      const pickerPromise = useCamera 
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false, // Reduce processing overhead
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            exif: false, // Reduce processing overhead
          });

      const result = await Promise.race([pickerPromise, timeoutPromise]);

      if (result && !result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      
      // Provide more specific error messages
      let errorMessage = t('home.failedToPickImage');
      if (error?.message?.includes('timeout')) {
        errorMessage = 'Camera operation timed out. Please try again.';
      } else if (error?.message?.includes('Camera')) {
        errorMessage = 'Camera not available. Please try using photo library instead.';
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleUploadPhoto = async () => {
    if (!profile || profile.credits <= 0) {
      Alert.alert(
        t('home.noCredits'),
        t('home.needCredits'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('home.buyCreditsAction'), onPress: () => setShowPurchaseModal(true) },
        ]
      );
      return;
    }

    Alert.alert(
      t('home.selectPhoto'),
      t('home.selectPhotoMethod'),
      [
        { text: t('common.camera'), onPress: () => handleImageSelection(true) },
        { text: t('common.gallery'), onPress: () => handleImageSelection(false) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleImageSelection = async (useCamera: boolean) => {
    const imageUri = await pickImage(useCamera);
    if (imageUri && user?.uid) {
      try {
        // Check if user has enough credits before uploading
        if (!profile || profile.credits <= 0) {
          Alert.alert(t('home.noCredits'), t('home.needCredits'));
          return;
        }

        // Upload and process the image
        // Credits will be automatically deducted by the cloud function when processing completes
        console.log('Uploading image for processing. Credits will be deducted automatically upon completion.');
        const result = await dispatch(uploadAndProcessPhoto({
          uri: imageUri,
          userId: user.uid,
        })).unwrap();

        if (result?.id) {
          console.log('Image uploaded successfully:', result.id);
          navigation.navigate('Processing', { 
            photoId: result.id, 
            originalImageUri: imageUri 
          });
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert(t('common.error'), t('home.failedToUpload'));
      }
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      console.log(`🛒 Starting purchase for product: ${productId}`);
      const purchase = await IAPService.purchaseProduct(productId);
      
      if (purchase && user?.uid) {
        console.log(`💳 Purchase successful, verifying with cloud function...`);
        
        // Verify purchase with secure cloud function
        // Handle both single purchase and array response from RNIap
        const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;
        const receipt = purchaseData.transactionReceipt || (purchaseData as any).purchaseToken || (purchaseData as any).purchaseTokenAndroid || '';
        
        const verificationResult = await verifyPurchase(
          receipt, 
          productId, 
          Platform.OS as 'ios' | 'android'
        );
        
        if (verificationResult.success) {
          console.log(`✅ Purchase verified! ${verificationResult.credits} credits added`);
          
          // Refresh user profile to get updated credits from server
          await dispatch(fetchUserProfile(user.uid));
          
          setShowPurchaseModal(false);
          Alert.alert(
            t('common.success'), 
            `${verificationResult.credits} ${t('home.purchaseModal.purchaseSuccess')}`
          );
        } else {
          console.error('❌ Purchase verification failed:', verificationResult.message);
          Alert.alert(t('common.error'), t('home.purchaseVerificationFailed'));
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(t('common.error'), t('home.purchaseModal.purchaseError'));
    }
  };

  // Debug logging
  console.log('HomeScreen render:', { 
    authLoading, 
    userLoading, 
    hasUser: !!user, 
    petPreference,
    profileCredits: profile?.credits 
  });

  // Show loading state only if auth is loading or no user
  if (authLoading || !user) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>🐕</Text>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const renderPurchaseModal = () => (
    <Modal
      visible={showPurchaseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPurchaseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('home.purchaseModal.title')}</Text>
          <Text style={styles.modalSubtitle}>{t('home.purchaseModal.subtitle')}</Text>
          
          {products
            .sort((a, b) => {
              // Sort by credits amount: 5, 10, 20
              const creditsA = IAPService.getCreditsFromProductId(a.productId || a.id);
              const creditsB = IAPService.getCreditsFromProductId(b.productId || b.id);
              return creditsA - creditsB;
            })
            .map((product, index) => {
            // Handle both productId and id properties
            const productId = product.productId || product.id;
            const displayInfo = IAPService.getProductDisplayInfo(productId);
            const credits = displayInfo.credits;
            
            // Handle different price properties
            const productPrice = product.price || parseFloat(product.displayPrice?.replace('$', '') || '0');
            
            const pricePerCredit = credits > 0 ? productPrice / credits : 0;
            const isPopular = displayInfo.badge === 'POPULAR';
            const isBestValue = displayInfo.badge === 'BEST VALUE';
            
            return (
              <TouchableOpacity
                key={productId}
                style={[styles.productButton, isPopular && styles.popularProduct]}
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
                    index % 2 === 0 ? '#ff6b6b' : '#4ecdc4',
                    index % 2 === 0 ? '#ff8e8e' : '#6ee0d5'
                  ]}
                  style={styles.productGradient}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>
                      {credits} {t('home.purchaseModal.credits')}
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
                      {product.localizedPrice || product.displayPrice || `$${productPrice.toFixed(2)}`}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPurchaseModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={petContent.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.heroIconContainer}>
            <View style={styles.petImageContainer}>
              <Image 
                source={petContent.image} 
                style={styles.petImage}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={styles.welcomeText}>{petContent.petName} Hero AI</Text>
          <Text style={styles.subtitle}>{petContent.subtitle}</Text>
          <View style={styles.decorativeLine} />
        </View>

        {/* Credits Card */}
        <View style={styles.creditsCard}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.creditsGradient}
          >
            <View style={styles.creditsHeader}>
              <View style={styles.creditsIconContainer}>
                <Text style={styles.creditsIcon}>{petContent.emoji}</Text>
              </View>
              <View style={styles.creditsInfo}>
                <Text style={styles.creditsLabel}>{t('home.yourCredits')}</Text>
                <Text style={styles.creditsValue}>{profile?.credits || 0}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.buyCreditsButton}
              onPress={() => setShowPurchaseModal(true)}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ff8e8e']}
                style={styles.buyCreditsGradient}
              >
                <Text style={styles.buyCreditsIcon}>+</Text>
                <Text style={styles.buyCreditsText}>{t('home.buyCredits')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Transform Pet Button */}
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              (!profile?.credits || profile.credits <= 0) && styles.buttonDisabled
            ]}
            onPress={handleUploadPhoto}
            disabled={isUploading || (!profile?.credits || profile.credits <= 0)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                (!profile?.credits || profile.credits <= 0) 
                  ? ['#cccccc', '#999999'] 
                  : ['#00b894', '#00a085']
              }
              style={styles.primaryButtonGradient}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.primaryButtonIcon}>
                    {isUploading ? '⏳' : '📸'}
                  </Text>
                </View>
                <Text style={styles.primaryButtonText}>
                  {isUploading ? t('home.uploading') : petContent.actionText}
                </Text>
                <Text style={styles.primaryButtonSubtext}>
                  {isUploading ? t('home.pleaseWait') : petContent.actionSubtext}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate('Gallery')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.secondaryButtonGradient}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.secondaryButtonIcon}>🖼️</Text>
                </View>
                <Text style={styles.secondaryButtonText}>{t('home.myHeroGallery')}</Text>
                <Text style={styles.secondaryButtonSubtext}>{t('home.viewTransformations')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How it Works Section */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.infoGradient}
          >
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>{t('home.howItWorks')}</Text>
            </View>
            
            <View style={styles.stepsContainer}>
              {[
                { icon: '💎', text: t('home.step1'), color: '#ff6b6b' },
                { icon: '📸', text: `${t('home.step2')}`, color: '#4ecdc4' },
                { icon: '🤖', text: t('home.step3'), color: '#a8edea' },
                { icon: '🎉', text: t('home.step4'), color: '#ffd93d' },
              ].map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                    <Text style={styles.stepEmoji}>{step.icon}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {renderPurchaseModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  petImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  heroEmoji: {
    fontSize: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
    lineHeight: 22,
  },
  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: '#ffffff',
    marginTop: 16,
    borderRadius: 2,
    opacity: 0.8,
  },

  // Credits Card Styles
  creditsCard: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  creditsGradient: {
    borderRadius: 20,
    padding: 20,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creditsIcon: {
    fontSize: 24,
  },
  creditsInfo: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  creditsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  buyCreditsButton: {
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyCreditsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyCreditsIcon: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
  buyCreditsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Action Container
  actionContainer: {
    marginBottom: 32,
  },

  // Primary Action Button
  primaryActionButton: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#00b894',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryButtonGradient: {
    borderRadius: 20,
    padding: 24,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonIcon: {
    fontSize: 28,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  primaryButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Secondary Action Button
  secondaryActionButton: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  secondaryButtonGradient: {
    borderRadius: 16,
    padding: 20,
  },
  secondaryButtonIcon: {
    fontSize: 24,
  },
  secondaryButtonText: {
    color: '#2c3e50',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  secondaryButtonSubtext: {
    color: '#34495e',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Info Card Styles
  infoCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoGradient: {
    borderRadius: 20,
    padding: 24,
  },
  infoHeader: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepEmoji: {
    fontSize: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 28,
    borderRadius: 24,
    width: width * 0.9,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
  },
  productButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  popularProduct: {
    shadowColor: '#4ecdc4',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  bestValueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  productGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    minHeight: 80,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  productDescription: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 6,
    lineHeight: 18,
  },
  productValueText: {
    color: 'white',
    fontSize: 11,
    opacity: 0.8,
    fontWeight: '600',
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});