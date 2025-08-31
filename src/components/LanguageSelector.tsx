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
    borderRadius: 16,
    padding: 24,
    margin: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  textRTL: {
    textAlign: 'right',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  languageButtonRTL: {
    flexDirection: 'row-reverse',
  },
  selectedButton: {
    backgroundColor: '#FF6B6B',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonRTL: {
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default LanguageSelector;