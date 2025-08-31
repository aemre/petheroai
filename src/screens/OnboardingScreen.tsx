import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to Pet Hero AI!</Text>
          <Text style={styles.subtitle}>Let's get to know you better</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Are you a...</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === 'dog' && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect('dog')}
            >
              <Text style={styles.optionEmoji}>🐕</Text>
              <Text style={[
                styles.optionText,
                selectedPreference === 'dog' && styles.selectedOptionText,
              ]}>
                Dog Person
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPreference === 'cat' && styles.selectedOption,
              ]}
              onPress={() => handlePreferenceSelect('cat')}
            >
              <Text style={styles.optionEmoji}>🐱</Text>
              <Text style={[
                styles.optionText,
                selectedPreference === 'cat' && styles.selectedOptionText,
              ]}>
                Cat Person
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPreference && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedPreference}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedPreference && styles.disabledButtonText,
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: width * 0.35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedOption: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#3498db',
  },
  continueButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#ecf0f1',
  },
});

export default OnboardingScreen;