import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, i18n } from '../services/i18n';
import { useTranslation } from '../hooks/useTranslation';
import { theme } from '../theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  onLanguageSelect,
}) => {
  const { currentLanguage, isRTL } = useTranslation();
  
  const languages = i18n.getAvailableLanguages().map(code => ({
    code,
    name: i18n.getLanguageDisplayName(code),
    flag: i18n.getLanguageFlag(code),
  }));

  const handleLanguageSelect = async (language: Language) => {
    // Save language preference
    await AsyncStorage.setItem('language', language);
    onLanguageSelect(language);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, isRTL() && styles.containerRTL]}>
          <Text style={[styles.title, isRTL() && styles.textRTL]}>
            🌐 Select Language
          </Text>
          
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                currentLanguage === language.code && styles.selectedButton,
                isRTL() && styles.languageButtonRTL,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <Text style={[
                styles.languageName,
                currentLanguage === language.code && styles.selectedText,
                isRTL() && styles.textRTL,
              ]}>
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.closeButton, isRTL() && styles.closeButtonRTL]}
            onPress={onClose}
          >
            <Text style={[styles.closeText, isRTL() && styles.textRTL]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    margin: theme.spacing[5],
    minWidth: 280,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  containerRTL: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    marginBottom: theme.spacing[4],
    textAlign: 'center',
    color: '#333',
  },
  textRTL: {
    textAlign: 'right',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[2],
    backgroundColor: theme.colors.neutral[100],
  },
  languageButtonRTL: {
    flexDirection: 'row-reverse',
  },
  selectedButton: {
    backgroundColor: '#FF6B6B',
  },
  flag: {
    fontSize: theme.typography.sizes["2xl"],
    marginRight: theme.spacing[3],
  },
  languageName: {
    fontSize: theme.typography.sizes.md,
    flex: 1,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: theme.typography.sizes.lg,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    backgroundColor: '#f0f0f0',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeButtonRTL: {
    alignItems: 'center',
  },
  closeText: {
    fontSize: theme.typography.sizes.md,
    color: '#666',
    fontWeight: '500',
  },
});

export default LanguageSelector;