import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  }, [i18n.language]);

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="w-4 h-4 text-sidebar-foreground/60" />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded-lg px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
