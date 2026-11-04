import { PaletteDefinition, PresetPaletteId } from '../types';

export const PRESET_PALETTES: Record<PresetPaletteId, PaletteDefinition> = {
  'azul-saude': {
    id: 'azul-saude',
    name: 'Azul Saúde',
    description: 'Clássico da saúde: transmite calma, confiança e serenidade.',
    primaryLight: '#0284c7', // Sky 600
    accentLight: '#38bdf8',  // Sky 400
    primaryDark: '#38bdf8',  // Sky 400
    accentDark: '#7dd3fc',   // Sky 300
    sampleBgLight: '#f0f9ff',
    sampleBgDark: '#0c4a6e',
  },
  'verde-saude': {
    id: 'verde-saude',
    name: 'Verde Saúde',
    description: 'Vitalidade e bem-estar: ideal para nutrição, fisioterapia e reabilitação.',
    primaryLight: '#059669', // Emerald 600
    accentLight: '#34d399',  // Emerald 400
    primaryDark: '#34d399',  // Emerald 400
    accentDark: '#6ee7b7',   // Emerald 300
    sampleBgLight: '#ecfdf5',
    sampleBgDark: '#064e3b',
  },
  'turquesa': {
    id: 'turquesa',
    name: 'Turquesa',
    description: 'Moderno e revigorante: equilíbrio entre azul e verde.',
    primaryLight: '#0d9488', // Teal 600
    accentLight: '#2dd4bf',  // Teal 400
    primaryDark: '#2dd4bf',  // Teal 400
    accentDark: '#5eead4',   // Teal 300
    sampleBgLight: '#f0fdfa',
    sampleBgDark: '#134e4a',
  },
  'lavanda': {
    id: 'lavanda',
    name: 'Lavanda',
    description: 'Elegante e acolhedor: perfeito para psicologia e terapias integrativas.',
    primaryLight: '#7c3aed', // Violet 600
    accentLight: '#a78bfa',  // Violet 400
    primaryDark: '#a78bfa',  // Violet 400
    accentDark: '#c4b5fd',   // Violet 300
    sampleBgLight: '#f5f3ff',
    sampleBgDark: '#4c1d95',
  },
  'grafite': {
    id: 'grafite',
    name: 'Grafite',
    description: 'Sóbrio e minimalista: estética contemporânea em tons neutros refinados.',
    primaryLight: '#334155', // Slate 700
    accentLight: '#64748b',  // Slate 500
    primaryDark: '#94a3b8',  // Slate 400
    accentDark: '#cbd5e1',   // Slate 300
    sampleBgLight: '#f8fafc',
    sampleBgDark: '#1e293b',
  },
  'azul-premium': {
    id: 'azul-premium',
    name: 'Azul Premium',
    description: 'Corporativo e institucional: azul marinho com detalhes brilhantes.',
    primaryLight: '#1e40af', // Blue 800
    accentLight: '#60a5fa',  // Blue 400
    primaryDark: '#60a5fa',  // Blue 400
    accentDark: '#93c5fd',   // Blue 300
    sampleBgLight: '#eff6ff',
    sampleBgDark: '#172554',
  },
  'esmeralda': {
    id: 'esmeralda',
    name: 'Esmeralda',
    description: 'Profundo e prestigioso: verde floresta de alta sofisticação.',
    primaryLight: '#065f46', // Emerald 800
    accentLight: '#10b981',  // Emerald 500
    primaryDark: '#10b981',  // Emerald 500
    accentDark: '#34d399',   // Emerald 400
    sampleBgLight: '#f0fdf4',
    sampleBgDark: '#022c22',
  },
  'custom': {
    id: 'custom',
    name: 'Personalizado',
    description: 'Identidade visual própria com cores customizadas pela clínica.',
    primaryLight: '#0284c7',
    accentLight: '#38bdf8',
    primaryDark: '#38bdf8',
    accentDark: '#7dd3fc',
    sampleBgLight: '#f8fafc',
    sampleBgDark: '#0f172a',
  }
};
