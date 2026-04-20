// Theme colors extracted from the HTML design
export const COLORS = {
  bg: '#05050e',
  surface: '#0d0d1c',
  surface2: '#12122a',
  border: '#1e1e3a',
  text: '#e8e8f0',
  muted: '#6060a0',
  wolf: '#ef4444',
  seer: '#d97706',
  mag: '#7c3aed',
  doc: '#059669',
  hunter: '#ea580c',
  village: '#22c55e',
  moon: '#c8a84b',
  white: '#ffffff',
  black: '#000000',
  nightBg: '#0a0a1f',
  dayBg: '#1a1400',
};

export const ROLE_COLORS = {
  wolf: { primary: '#ef4444', bg: '#0e0506', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
  villager: { primary: '#22c55e', bg: '#04100a', border: 'rgba(34,197,94,0.3)', text: '#4ade80' },
  seer: { primary: '#d97706', bg: '#0e0c02', border: 'rgba(217,119,6,0.3)', text: '#fbbf24' },
  witch: { primary: '#7c3aed', bg: '#080415', border: 'rgba(124,58,237,0.3)', text: '#c4b5fd' },
  doctor: { primary: '#059669', bg: '#020e08', border: 'rgba(5,150,105,0.3)', text: '#6ee7b7' },
  hunter: { primary: '#ea580c', bg: '#0e0602', border: 'rgba(234,88,12,0.3)', text: '#fb923c' },
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  }),
};
