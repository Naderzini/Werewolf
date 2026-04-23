import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    de: { translation: de },
    ru: { translation: ru },
    pt: { translation: pt },
    ja: { translation: ja },
    zh: { translation: zh },
    ko: { translation: ko },
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
  { code: 'es', label: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'pt', label: 'Português', dir: 'ltr', flag: '🇵🇹' },
  { code: 'ja', label: '日本語', dir: 'ltr', flag: '🇯🇵' },
  { code: 'zh', label: '中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', dir: 'ltr', flag: '🇰🇷' },
];

export const isRTL = () => {
  return i18n.language === 'ar';
};

export default i18n;
