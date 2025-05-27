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
} from '@mui/icons-material';
import { ThemeVariant, ColorMode } from '../themes';

interface ToolbarProps {
  content: string;
  setContent: (content: string) => void;
  onFontChange: (fontFamily: string, fontSize: number) => void;
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
}) => {
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);
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
      ],
    },
  ];

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1,
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
                height: 32,
                '& .MuiButtonGroup-grouped': {
                  minWidth: 32,
                  px: 1,
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
                        fontSize: '1.25rem',
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
                height: 32,
                '& .MuiSelect-select': {
                  py: 0.5,
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
                height: 32,
                '& .MuiSelect-select': {
                  py: 0.5,
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
    </>
  );
};

export default Toolbar; 