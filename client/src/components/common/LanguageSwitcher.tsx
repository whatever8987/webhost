import { useTranslation } from 'react-i18next'; // Import the translation hook
import { Button } from '@/components/ui/button'; // Assuming you use Shadcn UI Button
import {
  DropdownMenu, // Assuming you use Shadcn UI DropdownMenu
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react'; // Assuming you use Lucide icons

export function LanguageSwitcher() {
  // The useTranslation hook gives us the `t` function for translations
  // and the `i18n` instance to interact with the i18n core (like changing language)
  const { i18n } = useTranslation();

  // Function to handle language change
  const changeLanguage = (lng: string) => {
    // i18n.changeLanguage(lng) does two main things:
    // 1. It sets the active language in the i18next instance.
    // 2. Because we configured LanguageDetector with `caches: ['localStorage']`,
    //    it automatically saves the chosen language code to localStorage
    //    under the key 'i18nextLng' (by default).
    // 3. It triggers updates in all components using useTranslation,
    //    causing them to re-render with the new language.
    i18n.changeLanguage(lng);
  };

  // Define the languages your application supports
  // Include English, Spanish, and Vietnamese with their codes and display names
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'vi', name: 'Tiếng Việt' }, // <<< Add Vietnamese here
    // Add other languages here as needed
    // { code: 'fr', name: 'Français' },
    // { code: 'de', name: 'Deutsch' },
  ];

  // Get the currently active language code from the i18n instance.
  // i18n.language can sometimes include region codes (e.g., 'en-US', 'es-ES').
  // We use includes() to match our base language codes ('en', 'es', 'vi').
  const currentLangCode = i18n.language;

  // Find the corresponding language object to display its full name in the button
  // If no exact match, fall back to displaying the code itself.
  const currentLang = languages.find(lang => currentLangCode.includes(lang.code))
    || { code: currentLangCode, name: currentLangCode.toUpperCase() }; // Fallback

  return (
    <DropdownMenu>
      {/* DropdownTrigger is the button that opens the menu */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" // Style as a ghost button (no background)
          size="sm"      // Small size
          className="gap-1" // Add a small gap between icon and text
          aria-label="Change language" // Accessibility: describes the button's purpose
        >
          <Globe className="h-4 w-4" /> {/* Globe icon */}
          {/* Display the name of the current language on medium/large screens */}
          <span className="hidden md:block text-sm font-normal">
             {currentLang.name}
          </span>
           {/* Optional: Display the language code on smaller screens if space is limited */}
           {/* <span className="md:hidden text-sm font-normal">{currentLang.code.toUpperCase()}</span> */}
        </Button>
      </DropdownMenuTrigger>
      {/* DropdownContent is the menu that appears when the button is clicked */}
      <DropdownMenuContent align="end" className="w-40"> {/* Align to the end, set a width */}
        {/* Map over the supported languages to create menu items */}
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code} // Use language code as the unique key
            onClick={() => changeLanguage(lang.code)} // Call changeLanguage when clicked
            // Highlight the currently active language option in the menu
            className={currentLangCode.includes(lang.code) ? 'bg-accent' : ''}
          >
            {lang.name} {/* Display the full name of the language */}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}