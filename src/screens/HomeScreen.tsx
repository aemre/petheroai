import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

import { AppDispatch, RootState } from '../store/store';
import { uploadAndProcessPhoto } from '../store/slices/photoSlice';
import { addCredits, decrementCredits, toggleTestMode } from '../store/slices/userSlice';
import { RootStackParamList } from '../navigation/AppNavigator';
import IAPService, { itemSKUs } from '../services/iap';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, testMode } = useSelector((state: RootState) => state.user);
  const { isUploading } = useSelector((state: RootState) => state.photo);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    initializeIAP();
  }, []);

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
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
          return;
        }
      } else {
        hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) {
          Alert.alert('Permission needed', 'Photo library permission is required');
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUploadPhoto = async () => {
    if (!testMode && (!profile || profile.credits <= 0)) {
      Alert.alert(
        'No Credits',
        'You need credits to transform your pet. Please purchase credits first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => setShowPurchaseModal(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Select Photo',
      'Choose how you want to add your pet photo',
      [
        { text: 'Camera', onPress: () => handleImageSelection(true) },
        { text: 'Gallery', onPress: () => handleImageSelection(false) },
        { text: 'Cancel', style: 'cancel' },
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
          navigation.navigate('Processing', { photoId: result.id });
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', 'Failed to upload photo');
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
        Alert.alert('Success', `${credits} credits added to your account!`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Purchase failed');
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
          <Text style={styles.modalTitle}>Buy Credits</Text>
          <Text style={styles.modalSubtitle}>Choose your credit package</Text>
          
          {products.map((product) => (
            <TouchableOpacity
              key={product.productId}
              style={styles.productButton}
              onPress={() => handlePurchase(product.productId)}
            >
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productPrice}>{product.localizedPrice}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPurchaseModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={['#FFE8E8', '#FFD0D0', '#FFC1C1']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>🦸‍♀️ Pet Hero AI</Text>
          <Text style={styles.subtitle}>Transform your pet into a hero!</Text>
        </View>

        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>
            Credits: {testMode ? '∞ (Test Mode)' : (profile?.credits || 0)}
          </Text>
          <View style={styles.creditsButtons}>
            <TouchableOpacity
              style={[styles.testModeButton, testMode && styles.testModeButtonActive]}
              onPress={() => dispatch(toggleTestMode())}
            >
              <Text style={[styles.testModeButtonText, testMode && styles.testModeButtonTextActive]}>
                {testMode ? '🧪 Test ON' : '🧪 Test OFF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buyCreditsButton}
              onPress={() => setShowPurchaseModal(true)}
            >
              <Text style={styles.buyCreditsText}>+ Buy Credits</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Text style={styles.galleryButtonIcon}>🖼️</Text>
            <Text style={styles.galleryButtonText}>My Hero Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!testMode && (!profile?.credits || profile.credits <= 0)) && styles.uploadButtonDisabled
            ]}
            onPress={handleUploadPhoto}
            disabled={isUploading || (!testMode && (!profile?.credits || profile.credits <= 0))}
          >
            <Text style={styles.uploadButtonIcon}>📸</Text>
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Transform Pet'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoStep}>1. Purchase credits</Text>
          <Text style={styles.infoStep}>2. Upload your pet's photo</Text>
          <Text style={styles.infoStep}>3. AI transforms them into a hero</Text>
          <Text style={styles.infoStep}>4. Download & share the result!</Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  creditsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  creditsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  buyCreditsButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyCreditsText: {
    color: 'white',
    fontWeight: '600',
  },
  creditsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testModeButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  testModeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  testModeButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  testModeButtonTextActive: {
    color: 'white',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  galleryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  galleryButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  productButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});