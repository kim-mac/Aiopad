import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  ContentCopy,
  ContentPaste,
  ContentCut,
  Undo,
  Redo,
  SaveAlt,
  Share,
  Menu as MenuIcon,
  ChevronLeft,
  Calculate,
  Backspace,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { ThemeVariant, ColorMode } from '../themes';
import Keyboard from './Keyboard';

interface ToolbarProps {
  content: string;
  setContent: (content: string) => void;
  onFontChange: (fontFamily: string, fontSize: number) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const FONT_FAMILIES = [
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const Calculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [display, setDisplay] = React.useState('0');
  const [memory, setMemory] = React.useState<string | null>(null);
  const [operator, setOperator] = React.useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = React.useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    const value = parseFloat(display);

    if (memory === null) {
      setMemory(display);
    } else if (operator) {
      const currentValue = parseFloat(memory);
      let newValue: number;

      switch (operator) {
        case '+':
          newValue = currentValue + value;
          break;
        case '-':
          newValue = currentValue - value;
          break;
        case '*':
          newValue = currentValue * value;
          break;
        case '/':
          newValue = currentValue / value;
          break;
        default:
          return;
      }

      setMemory(String(newValue));
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(op);
  };

  const handleEqual = () => {
    if (!operator || !memory) return;

    const value = parseFloat(display);
    const memoryValue = parseFloat(memory);
    let result: number;

    switch (operator) {
      case '+':
        result = memoryValue + value;
        break;
      case '-':
        result = memoryValue - value;
        break;
      case '*':
        result = memoryValue * value;
        break;
      case '/':
        result = memoryValue / value;
        break;
      default:
        return;
    }

    setDisplay(String(result));
    setMemory(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setMemory(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    setDisplay(display.length === 1 ? '0' : display.slice(0, -1));
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  return (
    <Box sx={{ width: 280 }}>
      <Paper
        sx={{
          p: 2,
          mb: 2,
          textAlign: 'right',
          fontSize: '1.5rem',
          fontFamily: 'monospace',
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {display}
      </Paper>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={handleClear}>
            C
          </Button>
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={handleBackspace}>
            <Backspace />
          </Button>
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={() => handleOperator('/')}>
            ÷
          </Button>
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={() => handleOperator('*')}>
            ×
          </Button>
        </Grid>
        {[7, 8, 9].map((num) => (
          <Grid item xs={3} key={num}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNumber(String(num))}
            >
              {num}
            </Button>
          </Grid>
        ))}
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={() => handleOperator('-')}>
            -
          </Button>
        </Grid>
        {[4, 5, 6].map((num) => (
          <Grid item xs={3} key={num}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNumber(String(num))}
            >
              {num}
            </Button>
          </Grid>
        ))}
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={() => handleOperator('+')}>
            +
          </Button>
        </Grid>
        {[1, 2, 3].map((num) => (
          <Grid item xs={3} key={num}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNumber(String(num))}
            >
              {num}
            </Button>
          </Grid>
        ))}
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={handleEqual}>
            =
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleNumber('0')}
          >
            0
          </Button>
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth variant="outlined" onClick={handleDecimal}>
            .
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({
  content,
  setContent,
  onFontChange,
  isSidebarOpen,
  onSidebarToggle,
}) => {
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const [fontFamily, setFontFamily] = React.useState('"JetBrains Mono", monospace');
  const [fontSize, setFontSize] = React.useState(16);

  React.useEffect(() => {
    onFontChange(fontFamily, fontSize);
  }, [fontFamily, fontSize, onFontChange]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleUndo = () => {
    // Implementation of handleUndo
  };

  const handleRedo = () => {
    // Implementation of handleRedo
  };

  const handleFormat = (format: string) => {
    // Implementation of handleFormat
  };

  const handleCopy = () => {
    // Implementation of handleCopy
  };

  const handlePaste = () => {
    // Implementation of handlePaste
  };

  const handleCut = () => {
    // Implementation of handleCut
  };

  const handleKeyPress = (key: string) => {
    let newContent = content;
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      switch (key) {
        case '\b': // Backspace
          if (start === end) {
            newContent = content.slice(0, start - 1) + content.slice(end);
            setTimeout(() => {
              textarea.setSelectionRange(start - 1, start - 1);
            }, 0);
          } else {
            newContent = content.slice(0, start) + content.slice(end);
            setTimeout(() => {
              textarea.setSelectionRange(start, start);
            }, 0);
          }
          break;
        case '\n': // Enter
          newContent = content.slice(0, start) + '\n' + content.slice(end);
          setTimeout(() => {
            textarea.setSelectionRange(start + 1, start + 1);
          }, 0);
          break;
        case '\t': // Tab
          newContent = content.slice(0, start) + '    ' + content.slice(end);
          setTimeout(() => {
            textarea.setSelectionRange(start + 4, start + 4);
          }, 0);
          break;
        case '\u001b[A': // Up arrow
          const prevLineBreak = content.lastIndexOf('\n', start - 1);
          const prevPrevLineBreak = content.lastIndexOf('\n', prevLineBreak - 1);
          const currentLineOffset = start - (prevLineBreak + 1);
          if (prevLineBreak !== -1) {
            const targetPos = Math.min(
              prevPrevLineBreak + 1 + currentLineOffset,
              prevLineBreak
            );
            setTimeout(() => {
              textarea.setSelectionRange(targetPos, targetPos);
            }, 0);
          }
          return;
        case '\u001b[B': // Down arrow
          const nextLineBreak = content.indexOf('\n', start);
          if (nextLineBreak !== -1) {
            const currentLineStart = content.lastIndexOf('\n', start - 1) + 1;
            const currentLineOffset = start - currentLineStart;
            const targetPos = Math.min(
              nextLineBreak + 1 + currentLineOffset,
              content.indexOf('\n', nextLineBreak + 1) !== -1
                ? content.indexOf('\n', nextLineBreak + 1)
                : content.length
            );
            setTimeout(() => {
              textarea.setSelectionRange(targetPos, targetPos);
            }, 0);
          }
          return;
        case '\u001b[C': // Right arrow
          if (start < content.length) {
            setTimeout(() => {
              textarea.setSelectionRange(start + 1, start + 1);
            }, 0);
          }
          return;
        case '\u001b[D': // Left arrow
          if (start > 0) {
            setTimeout(() => {
              textarea.setSelectionRange(start - 1, start - 1);
            }, 0);
          }
          return;
        default:
          newContent = content.slice(0, start) + key + content.slice(end);
          setTimeout(() => {
            textarea.setSelectionRange(start + key.length, start + key.length);
          }, 0);
      }
      setContent(newContent);
      textarea.focus();
    }
  };

  const toolbarGroups = [
    {
      title: 'Clipboard',
      tools: [
        { icon: <ContentCopy />, action: handleCopy, tooltip: 'Copy (Ctrl+C)' },
        { icon: <ContentPaste />, action: handlePaste, tooltip: 'Paste (Ctrl+V)' },
        { icon: <ContentCut />, action: handleCut, tooltip: 'Cut (Ctrl+X)' },
      ],
    },
    {
      title: 'History',
      tools: [
        { icon: <Undo />, action: handleUndo, tooltip: 'Undo (Ctrl+Z)' },
        { icon: <Redo />, action: handleRedo, tooltip: 'Redo (Ctrl+Y)' },
      ],
    },
    {
      title: 'Formatting',
      tools: [
        { icon: <FormatBold />, action: () => handleFormat('bold'), tooltip: 'Bold (Ctrl+B)' },
        { icon: <FormatItalic />, action: () => handleFormat('italic'), tooltip: 'Italic (Ctrl+I)' },
        { icon: <FormatUnderlined />, action: () => handleFormat('underline'), tooltip: 'Underline (Ctrl+U)' },
      ],
    },
    {
      title: 'Lists',
      tools: [
        { icon: <FormatListBulleted />, action: () => {}, tooltip: 'Bullet List' },
        { icon: <FormatListNumbered />, action: () => {}, tooltip: 'Numbered List' },
      ],
    },
    {
      title: 'File',
      tools: [
        { icon: <SaveAlt />, action: () => {}, tooltip: 'Save (Ctrl+S)' },
        { icon: <Share />, action: () => {}, tooltip: 'Share' },
        { icon: <Calculate />, action: () => setCalculatorOpen(true), tooltip: 'Calculator' },
        { icon: <KeyboardIcon />, action: () => setKeyboardOpen(true), tooltip: 'On-screen Keyboard' },
      ],
    },
  ];

  return (
    <>
      <Box sx={{ 
        p: 0.5, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        minHeight: 40,
      }}>
        <Tooltip title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}>
          <IconButton 
            onClick={onSidebarToggle}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.2s ease',
                transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                fontSize: '1.2rem',
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'action.hover',
              borderRadius: 3,
            },
          }}
        >
          {toolbarGroups.map((group, index) => (
            <React.Fragment key={group.title}>
              <ButtonGroup 
                size="small" 
                sx={{ 
                  height: 28,
                  '& .MuiButtonGroup-grouped': {
                    minWidth: 28,
                    px: 0.75,
                  },
                }}
              >
                {group.tools.map((tool) => (
                  <Tooltip key={tool.tooltip} title={tool.tooltip}>
                    <IconButton
                      onClick={tool.action}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.1rem',
                        },
                      }}
                    >
                      {tool.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </ButtonGroup>
              {index < toolbarGroups.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              )}
            </React.Fragment>
          ))}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  height: 28,
                  '& .MuiSelect-select': {
                    py: 0.25,
                    lineHeight: '1.2',
                  },
                }}
              >
                {FONT_FAMILIES.map((font) => (
                  <MenuItem key={font.value} value={font.value}>
                    {font.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 70 }}>
              <Select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                variant="outlined"
                size="small"
                sx={{
                  height: 28,
                  '& .MuiSelect-select': {
                    py: 0.25,
                    lineHeight: '1.2',
                  },
                }}
              >
                {FONT_SIZES.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          },
        }}
      >
        <DialogTitle>Calculator</DialogTitle>
        <DialogContent>
          <Calculator onClose={() => setCalculatorOpen(false)} />
        </DialogContent>
      </Dialog>

      {keyboardOpen && (
        <Keyboard 
          onKeyPress={handleKeyPress}
          onClose={() => setKeyboardOpen(false)}
          scale={0.8}
        />
      )}
    </>
  );
};

export default Toolbar; 