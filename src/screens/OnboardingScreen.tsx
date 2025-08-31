import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted, setPetPreference } from '../store/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type PetPreference = 'dog' | 'cat';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [selectedPreference, setSelectedPreference] = useState<PetPreference | null>(null);
  const dispatch = useDispatch();

  const handlePreferenceSelect = (preference: PetPreference) => {
    setSelectedPreference(preference);
  };

  const handleContinue = async () => {
    if (!selectedPreference) return;

    try {
      // Save preference to Redux store
      dispatch(setPetPreference(selectedPreference));
      dispatch(setOnboardingCompleted(true));

      // Persist onboarding completion to AsyncStorage
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('petPreference', selectedPreference);

      // Navigate to main app
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D4A5FF', '#C084FC']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Decorative paw prints */}
        <Text style={styles.pawTop}>🐾</Text>
        <Text style={styles.pawTopRight}>🐾</Text>
        
        <View style={styles.content}>
          {/* Question Text */}
          <Text style={styles.questionText}>
            Are you a cat{'\n'}or dog person?
          </Text>
          
          {/* Pet Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === 'cat' && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect('cat')}
            >
              <View style={styles.catContainer}>
                {/* Cat illustration */}
                <View style={styles.catFace}>
                  <View style={styles.catEarLeft} />
                  <View style={styles.catEarRight} />
                  <View style={styles.catHead}>
                    <View style={styles.catEyeLeft} />
                    <View style={styles.catEyeRight} />
                    <View style={styles.catNose} />
                    <View style={styles.catMouth} />
                    <View style={styles.catWhiskerLeft} />
                    <View style={styles.catWhiskerRight} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === 'dog' && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect('dog')}
            >
              <View style={styles.dogContainer}>
                {/* Dog illustration */}
                <View style={styles.dogFace}>
                  <View style={styles.dogEarLeft} />
                  <View style={styles.dogEarRight} />
                  <View style={styles.dogHead}>
                    <View style={styles.dogEyeLeft} />
                    <View style={styles.dogEyeRight} />
                    <View style={styles.dogSnout}>
                      <View style={styles.dogNose} />
                    </View>
                    <View style={styles.dogTongue} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedPreference && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedPreference}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  pawTop: {
    position: 'absolute',
    top: 60,
    left: 50,
    fontSize: 24,
    color: '#B794F6',
    opacity: 0.6,
    transform: [{ rotate: '-15deg' }],
  },
  pawTopRight: {
    position: 'absolute',
    top: 80,
    right: 40,
    fontSize: 20,
    color: '#B794F6',
    opacity: 0.5,
    transform: [{ rotate: '20deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  questionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 45,
    marginBottom: 60,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#FFF5E6',
    borderRadius: 24,
    width: width * 0.35,
    height: width * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.05 }],
  },
  
  // Cat styles
  catContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  catFace: {
    position: 'relative',
    alignItems: 'center',
  },
  catEarLeft: {
    position: 'absolute',
    top: -8,
    left: -15,
    width: 16,
    height: 20,
    backgroundColor: '#FF8C42',
    borderRadius: 8,
    transform: [{ rotate: '-30deg' }],
  },
  catEarRight: {
    position: 'absolute',
    top: -8,
    right: -15,
    width: 16,
    height: 20,
    backgroundColor: '#FF8C42',
    borderRadius: 8,
    transform: [{ rotate: '30deg' }],
  },
  catHead: {
    width: 60,
    height: 50,
    backgroundColor: '#FF8C42',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  catEyeLeft: {
    position: 'absolute',
    top: 12,
    left: 15,
    width: 8,
    height: 1,
    backgroundColor: '#2D3748',
    borderRadius: 4,
  },
  catEyeRight: {
    position: 'absolute',
    top: 12,
    right: 15,
    width: 8,
    height: 1,
    backgroundColor: '#2D3748',
    borderRadius: 4,
  },
  catNose: {
    position: 'absolute',
    top: 20,
    width: 4,
    height: 3,
    backgroundColor: '#2D3748',
    borderRadius: 2,
  },
  catMouth: {
    position: 'absolute',
    top: 25,
    width: 8,
    height: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3748',
    borderBottomWidth: 0,
  },
  catWhiskerLeft: {
    position: 'absolute',
    top: 22,
    left: 5,
    width: 12,
    height: 1,
    backgroundColor: '#2D3748',
  },
  catWhiskerRight: {
    position: 'absolute',
    top: 22,
    right: 5,
    width: 12,
    height: 1,
    backgroundColor: '#2D3748',
  },

  // Dog styles
  dogContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogFace: {
    position: 'relative',
    alignItems: 'center',
  },
  dogEarLeft: {
    position: 'absolute',
    top: 5,
    left: -12,
    width: 20,
    height: 25,
    backgroundColor: '#D2691E',
    borderRadius: 15,
    transform: [{ rotate: '-20deg' }],
  },
  dogEarRight: {
    position: 'absolute',
    top: 5,
    right: -12,
    width: 20,
    height: 25,
    backgroundColor: '#D2691E',
    borderRadius: 15,
    transform: [{ rotate: '20deg' }],
  },
  dogHead: {
    width: 55,
    height: 45,
    backgroundColor: '#CD853F',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dogEyeLeft: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 6,
    height: 6,
    backgroundColor: '#2D3748',
    borderRadius: 3,
  },
  dogEyeRight: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    backgroundColor: '#2D3748',
    borderRadius: 3,
  },
  dogSnout: {
    position: 'absolute',
    bottom: 8,
    width: 25,
    height: 18,
    backgroundColor: '#D2691E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogNose: {
    width: 6,
    height: 4,
    backgroundColor: '#2D3748',
    borderRadius: 3,
    marginTop: 2,
  },
  dogTongue: {
    position: 'absolute',
    bottom: -8,
    width: 8,
    height: 12,
    backgroundColor: '#E53E3E',
    borderRadius: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  continueButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 60,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: width * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;