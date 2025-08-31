import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { signInAnonymouslyThunk } from '../store/slices/authSlice';
import { fetchUserProfile } from '../store/slices/userSlice';

export default function SplashScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const result = await dispatch(signInAnonymouslyThunk()).unwrap();
        if (result?.uid) {
          await dispatch(fetchUserProfile(result.uid));
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <LinearGradient
      colors={['#FFE5E5', '#FFB3B3', '#FF8A80']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🦸‍♀️</Text>
        <Text style={styles.title}>Pet Hero AI</Text>
        <Text style={styles.subtitle}>Transform your pet into a hero</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>
          {error ? 'Connection error...' : 'Loading...'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logoText: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});