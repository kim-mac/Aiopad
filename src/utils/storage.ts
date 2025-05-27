import { ThemeVariant, ColorMode } from '../themes';

const THEME_VARIANT_KEY = 'notepad-theme-variant';
const COLOR_MODE_KEY = 'notepad-color-mode';

export const saveThemePreference = (variant: ThemeVariant, mode: ColorMode) => {
  localStorage.setItem(THEME_VARIANT_KEY, variant);
  localStorage.setItem(COLOR_MODE_KEY, mode);
};

export const getThemePreference = (): { variant: ThemeVariant; mode: ColorMode } | null => {
  const savedVariant = localStorage.getItem(THEME_VARIANT_KEY) as ThemeVariant;
  const savedMode = localStorage.getItem(COLOR_MODE_KEY) as ColorMode;

  if (savedVariant && savedMode) {
    return { variant: savedVariant, mode: savedMode };
  }
  return null;
}; 