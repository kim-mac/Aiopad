import { ThemeOptions } from '@mui/material';

export type ThemeVariant = 
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'blackwhite';
export type ColorMode = 'light' | 'dark';

const themeColors = {
  ocean: {
    light: {
      primary: { main: '#0288d1', dark: '#01579b', light: '#03a9f4' },
      background: { default: '#e3f2fd', paper: '#ffffff' },
      text: { primary: '#0d47a1', secondary: '#1565c0' },
      divider: '#bbdefb',
    },
    dark: {
      primary: { main: '#29b6f6', dark: '#0288d1', light: '#4fc3f7' },
      background: { default: '#0d47a1', paper: '#1565c0' },
      text: { primary: '#e3f2fd', secondary: '#bbdefb' },
      divider: '#1976d2',
    },
  },
  forest: {
    light: {
      primary: { main: '#2e7d32', dark: '#1b5e20', light: '#43a047' },
      background: { default: '#f1f8e9', paper: '#ffffff' },
      text: { primary: '#1b5e20', secondary: '#33691e' },
      divider: '#c5e1a5',
    },
    dark: {
      primary: { main: '#66bb6a', dark: '#43a047', light: '#81c784' },
      background: { default: '#1b5e20', paper: '#2e7d32' },
      text: { primary: '#f1f8e9', secondary: '#dcedc8' },
      divider: '#388e3c',
    },
  },
  sunset: {
    light: {
      primary: { main: '#f57c00', dark: '#e65100', light: '#fb8c00' },
      background: { default: '#fff3e0', paper: '#ffffff' },
      text: { primary: '#e65100', secondary: '#f57c00' },
      divider: '#ffe0b2',
    },
    dark: {
      primary: { main: '#ffb74d', dark: '#ffa726', light: '#ffcc80' },
      background: { default: '#e65100', paper: '#f57c00' },
      text: { primary: '#fff3e0', secondary: '#ffe0b2' },
      divider: '#fb8c00',
    },
  },
  lavender: {
    light: {
      primary: { main: '#7b1fa2', dark: '#4a148c', light: '#9c27b0' },
      background: { default: '#f3e5f5', paper: '#ffffff' },
      text: { primary: '#4a148c', secondary: '#6a1b9a' },
      divider: '#e1bee7',
    },
    dark: {
      primary: { main: '#ba68c8', dark: '#ab47bc', light: '#ce93d8' },
      background: { default: '#4a148c', paper: '#6a1b9a' },
      text: { primary: '#f3e5f5', secondary: '#e1bee7' },
      divider: '#7b1fa2',
    },
  },
  blackwhite: {
    light: {
      primary: { main: '#000000', dark: '#333333', light: '#666666' },
      background: { default: '#ffffff', paper: '#ffffff' },
      text: { primary: '#000000', secondary: '#333333' },
      divider: '#cccccc',
    },
    dark: {
      primary: { main: '#ffffff', dark: '#cccccc', light: '#eeeeee' },
      background: { default: '#000000', paper: '#111111' },
      text: { primary: '#ffffff', secondary: '#cccccc' },
      divider: '#333333',
    },
  },
};

export const getThemeOptions = (variant: ThemeVariant, mode: ColorMode): ThemeOptions => {
  const colors = themeColors[variant][mode];

  return {
    palette: {
      mode,
      ...colors,
    },
    typography: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
  };
}; 