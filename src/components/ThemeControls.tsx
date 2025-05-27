import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Palette,
} from '@mui/icons-material';
import { ThemeVariant, ColorMode } from '../themes';

const THEME_VARIANTS: { value: ThemeVariant; label: string; description: string; icon: string }[] = [
  {
    value: 'ocean',
    label: 'Ocean',
    description: 'Calming blue tones inspired by the sea',
    icon: '🌊',
  },
  {
    value: 'forest',
    label: 'Forest',
    description: 'Refreshing green theme inspired by nature',
    icon: '🌲',
  },
  {
    value: 'sunset',
    label: 'Sunset',
    description: 'Warm orange tones for a cozy feel',
    icon: '🌅',
  },
  {
    value: 'lavender',
    label: 'Lavender',
    description: 'Elegant purple theme for a royal touch',
    icon: '💜',
  },
  {
    value: 'blackwhite',
    label: 'Black & White',
    description: 'Classic monochromatic theme',
    icon: '⚫',
  },
];

interface ThemeControlsProps {
  mode: ColorMode;
  themeVariant: ThemeVariant;
  onThemeChange: (variant: ThemeVariant) => void;
  onToggleTheme: () => void;
}

const ThemeControls: React.FC<ThemeControlsProps> = ({
  mode,
  themeVariant,
  onThemeChange,
  onToggleTheme,
}) => {
  const [themeMenuAnchor, setThemeMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleThemeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleThemeVariantChange = (variant: ThemeVariant) => {
    onThemeChange(variant);
    handleThemeMenuClose();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 1,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderRadius: 100,
        padding: '4px',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Tooltip title="Change color theme">
        <IconButton
          onClick={handleThemeMenuOpen}
          size="small"
          sx={{
            borderRadius: 1,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Palette />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={themeMenuAnchor}
        open={Boolean(themeMenuAnchor)}
        onClose={handleThemeMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiList-root': {
              py: 1,
            },
          },
        }}
      >
        {THEME_VARIANTS.map((variant) => (
          <MenuItem
            key={variant.value}
            onClick={() => handleThemeVariantChange(variant.value)}
            selected={themeVariant === variant.value}
            sx={{
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1,
            }}
          >
            <Box
              sx={{
                fontSize: '1.2rem',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {variant.icon}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ fontWeight: 500 }}>{variant.label}</Box>
              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {variant.description}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
        <IconButton
          onClick={onToggleTheme}
          size="small"
          sx={{
            borderRadius: 1,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ThemeControls; 