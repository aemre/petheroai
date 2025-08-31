import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
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
import { addCredits, decrementCredits } from '../store/slices/userSlice';
import { RootStackParamList } from '../navigation/AppNavigator';
import IAPService from '../services/iap';
import { useTranslation } from '../hooks/useTranslation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, petPreference } = useSelector((state: RootState) => state.user);
  const { isUploading } = useSelector((state: RootState) => state.photo);
  const { t, isRTL } = useTranslation();

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);

  // Pet-specific content
  const getPetContent = () => {
    const isDog = petPreference === 'dog';
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
    startEntryAnimation();
  }, []);

  const startEntryAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('home.failedToPickImage'));
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
        dispatch(decrementCredits());
        const result = await dispatch(uploadAndProcessPhoto({
          uri: imageUri,
          userId: user.uid,
        })).unwrap();

        if (result?.id) {
          navigation.navigate('Processing', { 
            photoId: result.id, 
            originalImageUri: imageUri 
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(t('common.error'), t('home.failedToUpload'));
      }
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      const purchase = await IAPService.purchaseProduct(productId);
      if (purchase && user?.uid) {
        const credits = IAPService.getCreditsFromProductId(productId);
        await dispatch(addCredits({ userId: user.uid, credits }));
        setShowPurchaseModal(false);
        Alert.alert(t('common.success'), `${credits} ${t('home.purchaseModal.purchaseSuccess')}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(t('common.error'), t('home.purchaseModal.purchaseError'));
    }
  };

  const renderPurchaseModal = () => (
    <Modal
      visible={showPurchaseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPurchaseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>💎 Buy Credits</Text>
          <Text style={styles.modalSubtitle}>Choose your credit package to continue transforming pets!</Text>
          
          {products.map((product, index) => (
            <TouchableOpacity
              key={product.productId}
              style={styles.productButton}
              onPress={() => handlePurchase(product.productId)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  index % 2 === 0 ? '#ff6b6b' : '#4ecdc4',
                  index % 2 === 0 ? '#ff8e8e' : '#6ee0d5'
                ]}
                style={styles.productGradient}
              >
                <View>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={[styles.productTitle, { fontSize: 14, opacity: 0.8 }]}>
                    {IAPService.getCreditsFromProductId(product.productId)} Credits
                  </Text>
                </View>
                <Text style={styles.productPrice}>{product.localizedPrice}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPurchaseModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
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
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
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
        </Animated.View>

        {/* Animated Credits Card */}
        <Animated.View 
          style={[
            styles.creditsCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
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
        </Animated.View>

        {/* Main Action Buttons */}
        <Animated.View 
          style={[
            styles.actionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
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
                  : ['#4ecdc4', '#44a08d']
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
              colors={['#a8edea', '#fed6e3']}
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
        </Animated.View>

        {/* How it Works Section */}
        <Animated.View 
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
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
        </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
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
  },
  primaryButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Secondary Action Button
  secondaryActionButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButtonGradient: {
    borderRadius: 16,
    padding: 20,
  },
  secondaryButtonIcon: {
    fontSize: 24,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  secondaryButtonSubtext: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Info Card Styles
  infoCard: {
    borderRadius: 20,
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
  },
  productGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  productTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  productPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
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
});