import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  text = 'Loading...', 
  size = 'large', 
  color = '#FF6B6B' 
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.text, { color }]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  text: {
    marginTop: 10,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
  },
});