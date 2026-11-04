import React, { createContext, useContext, useEffect, useState } from 'react';
import { PresetPaletteId, ThemeMode } from '../types';
import { PRESET_PALETTES } from '../utils/themePresets';

interface ThemeContextType {
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  paletteId: PresetPaletteId;
  primaryColor: string;
  accentColor: string;
  setMode: (mode: ThemeMode) => void;
  setClinicTheme: (paletteId: PresetPaletteId, primary?: string, accent?: string) => void;
  previewTheme: (paletteId: PresetPaletteId, primary?: string, accent?: string) => void;
  resetPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('clinora_theme_mode') as ThemeMode) || 'system';
  });

  const [paletteId, setPaletteId] = useState<PresetPaletteId>('azul-saude');
  const [primaryColor, setPrimaryColor] = useState<string>('#0284c7');
  const [accentColor, setAccentColor] = useState<string>('#38bdf8');

  // Preview state for admin testing palettes before saving
  const [previewPalette, setPreviewPalette] = useState<{
    paletteId: PresetPaletteId;
    primary?: string;
    accent?: string;
  } | null>(null);

  // Determine system dark preference
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const effectiveMode: 'light' | 'dark' = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  // Active palette configuration
  const activePaletteId = previewPalette?.paletteId || paletteId;
  const preset = PRESET_PALETTES[activePaletteId] || PRESET_PALETTES['azul-saude'];

  const activePrimary = previewPalette?.primary || (activePaletteId === 'custom' ? primaryColor : (effectiveMode === 'dark' ? preset.primaryDark : preset.primaryLight));
  const activeAccent = previewPalette?.accent || (activePaletteId === 'custom' ? accentColor : (effectiveMode === 'dark' ? preset.accentDark : preset.accentLight));

  // Update HTML class & CSS variables
  useEffect(() => {
    const root = document.documentElement;

    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set CSS custom properties
    root.style.setProperty('--color-primary', activePrimary);
    root.style.setProperty('--color-accent', activeAccent);

    // Subtle background tint for badges & active states
    const isDark = effectiveMode === 'dark';
    root.style.setProperty('--color-primary-subtle', isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)');
    root.style.setProperty('--color-primary-hover', isDark ? '#38bdf8' : '#0369a1');

  }, [effectiveMode, activePrimary, activeAccent]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('clinora_theme_mode', newMode);
  };

  const setClinicTheme = (newPaletteId: PresetPaletteId, primary?: string, accent?: string) => {
    setPaletteId(newPaletteId);
    if (primary) setPrimaryColor(primary);
    if (accent) setAccentColor(accent);
    setPreviewPalette(null);
  };

  const previewTheme = (newPaletteId: PresetPaletteId, primary?: string, accent?: string) => {
    setPreviewPalette({ paletteId: newPaletteId, primary, accent });
  };

  const resetPreview = () => {
    setPreviewPalette(null);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        effectiveMode,
        paletteId: activePaletteId,
        primaryColor: activePrimary,
        accentColor: activeAccent,
        setMode,
        setClinicTheme,
        previewTheme,
        resetPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
