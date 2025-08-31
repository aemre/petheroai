import I18n from 'react-native-i18n';
import { I18nManager } from 'react-native';

// Import locale files
import en from '../locales/en.json';
import tr from '../locales/tr.json';
import ar from '../locales/ar.json';

export type Language = 'en' | 'tr' | 'ar';

// Configure I18n
I18n.fallbacks = true;
I18n.translations = {
  en,
  tr,
  ar,
};

// Default language
I18n.defaultLocale = 'en';

class I18nService {
  private currentLanguage: Language = 'en';

  constructor() {
    // Set initial language based on device locale or default
    const deviceLocale = I18n.currentLocale().split('-')[0] as Language;
    if (['en', 'tr', 'ar'].includes(deviceLocale)) {
      this.setLanguage(deviceLocale);
    } else {
      this.setLanguage('en');
    }
  }

  setLanguage(language: Language) {
    this.currentLanguage = language;
    I18n.locale = language;
    
    // Set RTL for Arabic
    if (language === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }

  t(key: string, options?: any): string {
    return I18n.t(key, options);
  }

  // Helper method to get available languages
  getAvailableLanguages(): Language[] {
    return ['en', 'tr', 'ar'];
  }

  // Helper method to get language display names
  getLanguageDisplayName(language: Language): string {
    const displayNames = {
      en: 'English',
      tr: 'Türkçe',
      ar: 'العربية',
    };
    return displayNames[language];
  }

  // Helper method to get language flags
  getLanguageFlag(language: Language): string {
    const flags = {
      en: '🇺🇸',
      tr: '🇹🇷',
      ar: '🇸🇦',
    };
    return flags[language];
  }
}

export const i18n = new I18nService();