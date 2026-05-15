import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('aquagrid_lang') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
    },
    lng: savedLang || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Sync language change to localStorage whenever it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('aquagrid_lang', lng);
  document.documentElement.lang = lng;
});

// Apply saved language to html element on init
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang || 'en';
}

export default i18n;