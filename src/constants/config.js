import { useColorScheme } from 'react-native';

export const BRISTOL_TYPES = {
  1: "Separate hard lumps (severe constipation)",
  2: "Sausage-shaped but lumpy (mild constipation)",
  3: "Like a sausage but with cracks (normal)",
  4: "Like a sausage or snake, smooth and soft (optimal)",
  5: "Soft blobs with clear-cut edges (lacking fiber)",
  6: "Fluffy pieces with ragged edges (mild diarrhea)",
  7: "Watery, no solid pieces (severe diarrhea)"
};

export const FOOD_COMMENTS = [
  "Fast meal",
  "Home cooked",
  "Restaurant dining",
  "Heavy meal",
  "Light snack",
  "Other..."
];

export const Colors = {
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#334155',
    title: '#1e293b',
    border: '#cbd5e1',
    muted: '#64748b',
    primary: '#4F46E5',
    secondaryBtn: '#F3F4F6',
    inputBg: '#f8fafc',
    historyRowBorder: '#e2e8f0',
    dropdownOptionBorder: '#f1f5f9',
    iconMuted: '#475569',
    danger: '#dc2626',
    success: '#16a34a',
    emptyText: '#94a3b8',
    foodBackground: '#dcfce7', // light-to-medium green
    foodBorder: '#86efac',
    outingBackground: '#dcc5ad', // medium brown
    outingBorder: '#a47551',
    popupBackground: '#e2e8f0', // a step darker than the page so popups stand out
    popupBorder: '#94a3b8',
    popupPressed: '#cbd5e1'
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    text: '#cbd5e1',
    title: '#f8fafc',
    border: '#334155',
    muted: '#94a3b8',
    primary: '#6366f1',
    secondaryBtn: '#334155',
    inputBg: '#0f172a',
    historyRowBorder: '#334155',
    dropdownOptionBorder: '#334155',
    iconMuted: '#cbd5e1',
    danger: '#ef4444',
    success: '#22c55e',
    emptyText: '#64748b',
    foodBackground: '#064e3b', // deep rich green for dark mode
    foodBorder: '#065f46',
    outingBackground: '#2f1702', // darker brown for dark mode
    outingBorder: '#5c3a1e',
    popupBackground: '#334155', // a step lighter than cards so popups stand out
    popupBorder: '#64748b',
    popupPressed: '#475569'
  }
};

export function useThemeColors() {
  const isDark = useColorScheme() === 'dark';
  return isDark ? Colors.dark : Colors.light;
}