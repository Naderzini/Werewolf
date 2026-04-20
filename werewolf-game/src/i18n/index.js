import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: 'ar',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const LANGUAGES = [
  { code: 'ar', label: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'en', label: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', dir: 'ltr', flag: '🇫🇷' },
];

export const isRTL = () => {
  return i18n.language === 'ar';
};

export default i18n;
