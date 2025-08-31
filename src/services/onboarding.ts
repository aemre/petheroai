import AsyncStorage from '@react-native-async-storage/async-storage';
import { setOnboardingCompleted, setPetPreference } from '../store/slices/userSlice';
import { Dispatch } from '@reduxjs/toolkit';

export const loadOnboardingState = async (dispatch: Dispatch) => {
  try {
    const [onboardingCompleted, petPreference] = await Promise.all([
      AsyncStorage.getItem('onboardingCompleted'),
      AsyncStorage.getItem('petPreference'),
    ]);

    if (onboardingCompleted === 'true') {
      dispatch(setOnboardingCompleted(true));
    }

    if (petPreference === 'dog' || petPreference === 'cat') {
      dispatch(setPetPreference(petPreference));
    }
  } catch (error) {
    console.error('Error loading onboarding state:', error);
  }
};