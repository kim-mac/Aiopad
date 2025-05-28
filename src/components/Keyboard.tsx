import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Backspace,
  KeyboardReturn,
  SpaceBar,
  KeyboardCapslock,
  KeyboardTab,
  Close as CloseIcon,
  DragIndicator,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import Draggable from 'react-draggable';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  scale?: number;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, onClose, scale = 1 }) => {
  const theme = useTheme();
  const [capsLock, setCapsLock] = React.useState(false);
  const [shift, setShift] = React.useState(false);
  const [keyboardScale, setKeyboardScale] = React.useState(scale);
  const [isDragging, setIsDragging] = React.useState(false);

  const rows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ];

  const shiftKeys: { [key: string]: string } = {
    '`': '~', '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_',
    '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"',
    ',': '<', '.': '>', '/': '?'
  };

  const handleKeyPress = (key: string) => {
    let output = key;
    if (shift || capsLock) {
      if (key.length === 1 && key.match(/[a-z]/)) {
        output = key.toUpperCase();
      } else if (shift && shiftKeys[key]) {
        output = shiftKeys[key];
      }
    }
    onKeyPress(output);
    if (shift) setShift(false);
  };

  const handleArrowKey = (direction: string) => {
    switch (direction) {
      case 'up':
        onKeyPress('\u001b[A');
        break;
      case 'down':
        onKeyPress('\u001b[B');
        break;
      case 'right':
        onKeyPress('\u001b[C');
        break;
      case 'left':
        onKeyPress('\u001b[D');
        break;
    }
  };

  const commonButtonStyle = {
    minWidth: 'auto',
    width: 40 * keyboardScale,
    height: 40 * keyboardScale,
    m: 0.25,
    p: 0.5,
    borderRadius: 1,
    fontFamily: 'inherit',
    fontSize: 14 * keyboardScale,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    color: 'text.primary',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = keyboardScale;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newScale = startScale + Math.max(deltaX, deltaY) / 200;
      setKeyboardScale(Math.max(0.5, Math.min(2, newScale)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Draggable
      handle=".drag-handle"
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
    >
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          zIndex: 1300,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          transform: `scale(${keyboardScale})`,
          transformOrigin: 'top left',
        }}
      >
        <Box
          className="drag-handle"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            bgcolor: 'background.default',
            cursor: 'move',
            userSelect: 'none',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DragIndicator sx={{ opacity: 0.5 }} />
            <Typography variant="subtitle2">Keyboard</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            p: 1,
            userSelect: 'none',
          }}
        >
          {rows.map((row, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {i === 2 && (
                <Button
                  onClick={() => setCapsLock(!capsLock)}
                  sx={{
                    ...commonButtonStyle,
                    width: 60 * keyboardScale,
                    backgroundColor: capsLock
                      ? theme.palette.primary.main
                      : commonButtonStyle.backgroundColor,
                    color: capsLock ? 'white' : 'text.primary',
                  }}
                >
                  <KeyboardCapslock sx={{ fontSize: 18 * keyboardScale }} />
                </Button>
              )}
              {row.map((key) => (
                <Button
                  key={key}
                  onClick={() => !isDragging && handleKeyPress(key)}
                  sx={commonButtonStyle}
                >
                  {shift || capsLock
                    ? key.length === 1 && key.match(/[a-z]/)
                      ? key.toUpperCase()
                      : shiftKeys[key] || key
                    : key}
                </Button>
              ))}
              {i === 0 && (
                <Button
                  onClick={() => !isDragging && handleKeyPress('\b')}
                  sx={{ ...commonButtonStyle, width: 60 * keyboardScale }}
                >
                  <Backspace sx={{ fontSize: 18 * keyboardScale }} />
                </Button>
              )}
              {i === 1 && (
                <Button
                  onClick={() => !isDragging && handleKeyPress('\n')}
                  sx={{ ...commonButtonStyle, width: 60 * keyboardScale }}
                >
                  <KeyboardReturn sx={{ fontSize: 18 * keyboardScale }} />
                </Button>
              )}
              {i === 2 && (
                <Button
                  onClick={() => !isDragging && handleKeyPress('\n')}
                  sx={{ ...commonButtonStyle, width: 60 * keyboardScale }}
                >
                  <KeyboardReturn sx={{ fontSize: 18 * keyboardScale }} />
                </Button>
              )}
            </Box>
          ))}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Button
              onClick={() => !isDragging && setShift(!shift)}
              sx={{
                ...commonButtonStyle,
                width: 80 * keyboardScale,
                backgroundColor: shift
                  ? theme.palette.primary.main
                  : commonButtonStyle.backgroundColor,
                color: shift ? 'white' : 'text.primary',
              }}
            >
              Shift
            </Button>
            <Button
              onClick={() => !isDragging && handleKeyPress(' ')}
              sx={{ ...commonButtonStyle, width: 160 * keyboardScale }}
            >
              <SpaceBar sx={{ fontSize: 18 * keyboardScale }} />
            </Button>
            <Box sx={{ 
              display: 'grid',
              gridTemplateAreas: `
                ". up ."
                "left down right"
              `,
              gap: 0.5,
              ml: 0.5,
              mr: 0.5,
            }}>
              <Button
                onClick={() => !isDragging && handleArrowKey('up')}
                sx={{ 
                  ...commonButtonStyle,
                  width: 40 * keyboardScale,
                  gridArea: 'up',
                  mx: 'auto',
                }}
              >
                <KeyboardArrowUp sx={{ fontSize: 18 * keyboardScale }} />
              </Button>
              <Button
                onClick={() => !isDragging && handleArrowKey('left')}
                sx={{ 
                  ...commonButtonStyle,
                  width: 40 * keyboardScale,
                  gridArea: 'left',
                }}
              >
                <KeyboardArrowLeft sx={{ fontSize: 18 * keyboardScale }} />
              </Button>
              <Button
                onClick={() => !isDragging && handleArrowKey('down')}
                sx={{ 
                  ...commonButtonStyle,
                  width: 40 * keyboardScale,
                  gridArea: 'down',
                }}
              >
                <KeyboardArrowDown sx={{ fontSize: 18 * keyboardScale }} />
              </Button>
              <Button
                onClick={() => !isDragging && handleArrowKey('right')}
                sx={{ 
                  ...commonButtonStyle,
                  width: 40 * keyboardScale,
                  gridArea: 'right',
                }}
              >
                <KeyboardArrowRight sx={{ fontSize: 18 * keyboardScale }} />
              </Button>
            </Box>
            <Button
              onClick={() => !isDragging && handleKeyPress('\t')}
              sx={{ ...commonButtonStyle, width: 80 * keyboardScale }}
            >
              <KeyboardTab sx={{ fontSize: 18 * keyboardScale }} />
            </Button>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 20,
              height: 20,
              cursor: 'se-resize',
              opacity: 0.5,
              '&:hover': { opacity: 1 },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 2,
                bottom: 2,
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '0 0 10px 10px',
                borderColor: `transparent transparent ${theme.palette.text.secondary} transparent`,
              },
            }}
            onMouseDown={handleResizeStart}
          />
        </Box>
      </Paper>
    </Draggable>
  );
};

export default Keyboard; 