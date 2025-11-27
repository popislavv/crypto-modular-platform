import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import sr from './locales/sr/translation.json';

const fallbackLng = 'en';
const storedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
const initialLang = storedLang || fallbackLng;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sr: { translation: sr },
    },
    lng: initialLang,
    fallbackLng,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
