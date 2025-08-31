import { useState, useEffect } from 'react';
import { i18n, Language } from '../services/i18n';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(i18n.getCurrentLanguage());

  const t = (key: string): string => {
    return i18n.t(key);
  };

  const changeLanguage = (language: Language) => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
  };

  const isRTL = (): boolean => {
    return i18n.isRTL();
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL,
  };
};