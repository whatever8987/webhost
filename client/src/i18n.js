import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import the language detector plugin
import LanguageDetector from 'i18next-browser-languagedetector';
// LocalStorageCache is usually included with LanguageDetector or is implicitly used by it
// import LocalStorageCache from 'i18next-localstorage-cache'; // Explicit import usually not needed

// --- Import your translation files ---
// Make sure these paths are correct relative to this i18n.js file
import translationEN from './locales/en/translation.json'; // English
import translationES from './locales/es/translation.json'; // Spanish (example)
import translationVI from './locales/vi/translation.json'; // Vietnamese


// Define resources for all supported languages
const resources = {
  en: {
    translation: translationEN,
  },
  es: { // Example Spanish
    translation: translationES,
  },
  vi: { // Vietnamese
    translation: translationVI,
  },
  // Add other languages as needed
};

i18n
  // Add the language detector plugin
  .use(LanguageDetector)
  // Note: i18next-localstorage-cache is often used by LanguageDetector itself if enabled in detection options

  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)

  // Initialize i18next
  .init({
    resources, // Use the defined resources

    // --- Configuration for Language Detection ---
    detection: {
        // Order of detection. Detector tries sources in this order:
        order: [
            'localStorage', // Check if a language is saved in localStorage (from a previous visit/switch)
            'navigator',    // Check the user's browser language settings
            // 'cookie',    // Check for a cookie (less common for pure React SPAs)
            // 'sessionStorage', // Check sessionStorage
            // 'htmlTag',   // Check the lang attribute on the <html> tag
            // 'querystring', // Check query parameters (e.g., ?lng=es)
            // 'subdomain', // Check subdomain (e.g., es.yoursite.com)
            // 'path',      // Check path (e.g., yoursite.com/es/)
        ],

        // Cache the detected language in localStorage
        caches: ['localStorage'], // Save the detected or manually changed language here

        // Optional: Keys to use in different detection sources (e.g., 'lng' in querystring)
        // lookupQuerystring: 'lng',
        // lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng', // Key name in localStorage
        // lookupSessionStorage: 'i18nextLng',
        // lookupFromPathIndex: 0,
        // lookupFromSubdomainIndex: 0,
    },

    // Fallback language if detected language is not supported or translation is missing
    fallbackLng: 'en',

    // Options for key lookup
    keySeparator: '.', // Separator used in translation keys (e.g., 'navigation.dashboard')

    // Options for interpolation (replacing variables in strings)
    interpolation: {
      escapeValue: false, // React already prevents XSS
    },

    // Optional: Configure if you use React Suspense for lazy loading translations
    // react: {
    //     useSuspense: true // Set to true if you are lazy loading translation files
    // }
    // If useSuspense is true, components using useTranslation might need to be wrapped in <Suspense>
    // For simplicity here, we'll assume useSuspense: false or not configured (default)
  });

export default i18n;