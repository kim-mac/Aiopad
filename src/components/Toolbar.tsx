import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Popover,
  TextField,
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
  AutoFixHigh,
  Summarize,
  Psychology,
  Autorenew,
  SmartToy,
  Face,
  Close as CloseIcon,
  DragIndicator,
  CalendarToday,
} from '@mui/icons-material';
import { ThemeVariant, ColorMode } from '../themes';
import Keyboard from './Keyboard';
import SaveMenu from './SaveMenu';
import Draggable from 'react-draggable';
import { getSuggestions, summarizeText, improveWriting, paraphraseText, detectAIText, humanizeText, AIDetectionResult } from '../utils/ai';

interface ToolbarProps {
  content: string;
  setContent: (content: string) => void;
  onFontChange: (fontFamily: string, fontSize: number) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  noteTitle?: string;
}

interface AIDetectionDialogProps {
  open: boolean;
  onClose: () => void;
  detectionResult: AIDetectionResult | null;
}

const FONT_FAMILIES = [
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const FloatingCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [display, setDisplay] = React.useState('0');
  const [memory, setMemory] = React.useState<string | null>(null);
  const [operator, setOperator] = React.useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [calculatorScale, setCalculatorScale] = React.useState(1);

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

  const handleResizeStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startScale = calculatorScale;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newScale = startScale + Math.max(deltaX, deltaY) / 200;
      setCalculatorScale(Math.max(0.5, Math.min(2, newScale)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const commonButtonStyle = {
    minWidth: 'auto',
    width: 40 * calculatorScale,
    height: 40 * calculatorScale,
    m: 0.05,
    p: 0.5,
    borderRadius: 1,
    fontFamily: 'inherit',
    fontSize: 14 * calculatorScale,
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:active': {
      transform: 'translateY(1px)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
  };

  const getButtonStyle = (type: 'number' | 'operator' | 'function' | 'equals') => {
    const baseStyle = {
      ...commonButtonStyle,
      color: 'white',
      fontWeight: 500,
    };

    switch (type) {
      case 'number':
        return {
          ...baseStyle,
          background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)',
          '&:hover': {
            background: 'linear-gradient(145deg, #333333, #222222)',
          },
        };
      case 'operator':
        return {
          ...baseStyle,
          background: 'linear-gradient(145deg, #ff9500, #ff8000)',
          '&:hover': {
            background: 'linear-gradient(145deg, #ffa533, #ff9500)',
          },
        };
      case 'function':
        return {
          ...baseStyle,
          background: 'linear-gradient(145deg, #a5a5a5, #8a8a8a)',
          '&:hover': {
            background: 'linear-gradient(145deg, #b5b5b5, #9a9a9a)',
          },
        };
      case 'equals':
        return {
          ...baseStyle,
          background: 'linear-gradient(145deg, #ff9500, #ff8000)',
          '&:hover': {
            background: 'linear-gradient(145deg, #ffa533, #ff9500)',
          },
        };
    }
  };

  const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '6px', // small gap between buttons
    marginBottom: '8px',
  };
  const lastRowStyle = { ...rowStyle, marginBottom: 0 };
  const tightButtonStyle = {
    ...getButtonStyle('number'),
    m: 0,
    minWidth: 0,
    flex: 1,
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
          backgroundColor: '#1c1c1c',
          borderRadius: 2,
          overflow: 'hidden',
          transform: `scale(${calculatorScale})`,
          transformOrigin: 'top left',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        }}
      >
        <Box
          className="drag-handle"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            bgcolor: '#2c2c2c',
            cursor: 'move',
            userSelect: 'none',
            borderBottom: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DragIndicator sx={{ opacity: 0.5, color: 'white' }} />
            <Typography variant="subtitle2" sx={{ color: 'white' }}>Calculator</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ 
                opacity: 0.7, 
                '&:hover': { opacity: 1 },
                color: 'white',
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ p: 1, bgcolor: '#1c1c1c' }}>
          <Paper
            sx={{
              p: 2,
              mb: 1,
              textAlign: 'right',
              fontSize: `${1.5 * calculatorScale}rem`,
              fontFamily: 'monospace',
              minHeight: 48 * calculatorScale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              bgcolor: '#2c2c2c',
              color: 'white',
              borderRadius: 1,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {display}
          </Paper>
          <Box sx={rowStyle}>
            <Button onClick={() => !isDragging && handleClear()} sx={{ ...getButtonStyle('function'), m: 0, flex: 1 }}>C</Button>
            <Button onClick={() => !isDragging && handleBackspace()} sx={{ ...getButtonStyle('function'), m: 0, flex: 1 }}><Backspace sx={{ fontSize: 18 * calculatorScale }} /></Button>
            <Button onClick={() => !isDragging && handleOperator('/')} sx={{ ...getButtonStyle('operator'), m: 0, flex: 1 }}>÷</Button>
            <Button onClick={() => !isDragging && handleOperator('*')} sx={{ ...getButtonStyle('operator'), m: 0, flex: 1 }}>×</Button>
          </Box>
          <Box sx={rowStyle}>
            <Button onClick={() => !isDragging && handleNumber('7')} sx={tightButtonStyle}>7</Button>
            <Button onClick={() => !isDragging && handleNumber('8')} sx={tightButtonStyle}>8</Button>
            <Button onClick={() => !isDragging && handleNumber('9')} sx={tightButtonStyle}>9</Button>
            <Button onClick={() => !isDragging && handleOperator('-')} sx={{ ...getButtonStyle('operator'), m: 0, flex: 1 }}>-</Button>
          </Box>
          <Box sx={rowStyle}>
            <Button onClick={() => !isDragging && handleNumber('4')} sx={tightButtonStyle}>4</Button>
            <Button onClick={() => !isDragging && handleNumber('5')} sx={tightButtonStyle}>5</Button>
            <Button onClick={() => !isDragging && handleNumber('6')} sx={tightButtonStyle}>6</Button>
            <Button onClick={() => !isDragging && handleOperator('+')} sx={{ ...getButtonStyle('operator'), m: 0, flex: 1 }}>+</Button>
          </Box>
          <Box sx={rowStyle}>
            <Button onClick={() => !isDragging && handleNumber('1')} sx={tightButtonStyle}>1</Button>
            <Button onClick={() => !isDragging && handleNumber('2')} sx={tightButtonStyle}>2</Button>
            <Button onClick={() => !isDragging && handleNumber('3')} sx={tightButtonStyle}>3</Button>
            <Button onClick={() => !isDragging && handleEqual()} sx={{ ...getButtonStyle('equals'), m: 0, flex: 1, height: '100%' }}>=</Button>
          </Box>
          <Box sx={lastRowStyle}>
            <Button onClick={() => !isDragging && handleNumber('0')} sx={{ ...tightButtonStyle, flex: 2 }}>0</Button>
            <Button onClick={() => !isDragging && handleDecimal()} sx={tightButtonStyle}>.</Button>
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
                borderColor: 'rgba(255,255,255,0.5) transparent transparent transparent',
              },
            }}
            onMouseDown={handleResizeStart}
          />
        </Box>
      </Paper>
    </Draggable>
  );
};

const AIDetectionDialog: React.FC<AIDetectionDialogProps> = ({
  open,
  onClose,
  detectionResult
}) => {
  if (!detectionResult) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI Text Detection Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color={detectionResult.isAIGenerated ? "error" : "success"}>
            {detectionResult.isAIGenerated ? "Likely AI Generated" : "Likely Human Written"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Confidence: {Math.round(detectionResult.confidence * 100)}%
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>Indicators:</Typography>
          <Box component="ul" sx={{ mt: 1 }}>
            {detectionResult.indicators.map((indicator, index) => (
              <Typography component="li" key={index}>
                {indicator}
              </Typography>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const Calendar: React.FC<{
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
}> = ({ open, anchorEl, onClose, onDateSelect }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect(newDate);
    onClose();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const days: React.ReactNode[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(<Box key={`empty-${i}`} sx={{ p: 1, textAlign: 'center' }} />);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    const isSelected = selectedDate && selectedDate.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    
    days.push(
      <Box
        key={day}
        onClick={() => handleDateClick(day)}
        sx={{
          p: 1,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 1,
          backgroundColor: isSelected ? 'primary.main' : isToday ? 'action.hover' : 'transparent',
          color: isSelected ? 'primary.contrastText' : 'text.primary',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
          },
          fontWeight: isToday ? 'bold' : 'normal',
        }}
      >
        {day}
      </Box>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Paper sx={{ p: 2, minWidth: 280 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6">{getMonthName(currentDate)}</Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronLeft sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Box key={day} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
              {day}
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {days}
        </Box>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              onDateSelect(today);
              onClose();
            }}
          >
            Today
          </Button>
        </Box>
      </Paper>
    </Popover>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({
  content,
  setContent,
  onFontChange,
  isSidebarOpen,
  onSidebarToggle,
  noteTitle = 'Untitled',
}) => {
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [fontFamily, setFontFamily] = React.useState('"JetBrains Mono", monospace');
  const [fontSize, setFontSize] = React.useState(16);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);
  const [aiDetectionDialogOpen, setAiDetectionDialogOpen] = useState(false);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  const isInitialized = React.useRef(false);
  const previousContent = React.useRef<string>('');
  const [activeFormatting, setActiveFormatting] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
  }>({ bold: false, italic: false, underline: false });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Initialize undo stack with current content only once
  useEffect(() => {
    if (!isInitialized.current && content !== '') {
      setUndoStack([content]);
      previousContent.current = content;
      isInitialized.current = true;
    }
  }, [content]);

  // Handle content changes and update undo stack
  useEffect(() => {
    if (!isUndoRedoAction && content !== '' && isInitialized.current) {
      // Only add to undo stack if content actually changed (not during undo/redo)
      if (previousContent.current !== content) {
        setUndoStack(prev => {
          // Don't add duplicate content
          if (prev.length > 0 && prev[prev.length - 1] === content) {
            return prev;
          }
          const newStack = [...prev, content];
          // Limit undo stack to 50 items to prevent memory issues
          return newStack.slice(-50);
        });
        // Only clear redo stack when there's a new content change
        setRedoStack([]);
        previousContent.current = content;
      }
    } else if (isUndoRedoAction) {
      // Update previous content during undo/redo operations
      previousContent.current = content;
    }
    setIsUndoRedoAction(false);
  }, [content, isUndoRedoAction]);

  // Add keyboard shortcuts for undo/redo and formatting
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        if (event.key === 'z') {
          event.preventDefault();
          handleUndo();
        } else if (event.key === 'y') {
          event.preventDefault();
          handleRedo();
        } else if (event.key === 'b') {
          event.preventDefault();
          handleFormat('bold');
        } else if (event.key === 'i') {
          event.preventDefault();
          handleFormat('italic');
        } else if (event.key === 'u') {
          event.preventDefault();
          handleFormat('underline');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array since handleUndo, handleRedo, and handleFormat are stable

  React.useEffect(() => {
    onFontChange(fontFamily, fontSize);
  }, [fontFamily, fontSize, onFontChange]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack];
      const currentState = newUndoStack.pop()!;
      const previousState = newUndoStack[newUndoStack.length - 1];
      
      setIsUndoRedoAction(true);
      setUndoStack(newUndoStack);
      setRedoStack(prev => {
        const newRedoStack = [...prev, currentState];
        // Limit redo stack to 50 items
        return newRedoStack.slice(-50);
      });
      setContent(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.pop()!;
      
      setIsUndoRedoAction(true);
      setRedoStack(newRedoStack);
      setUndoStack(prev => {
        const newUndoStack = [...prev, nextState];
        // Limit undo stack to 50 items
        return newUndoStack.slice(-50);
      });
      setContent(nextState);
    }
  };

  const handleFormat = (format: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        let formattedText = '';
        let newCursorPosition = start;
        
        switch (format) {
          case 'bold':
            formattedText = `**${selectedText}**`;
            newCursorPosition = start + formattedText.length;
            break;
          case 'italic':
            formattedText = `*${selectedText}*`;
            newCursorPosition = start + formattedText.length;
            break;
          case 'underline':
            formattedText = `__${selectedText}__`;
            newCursorPosition = start + formattedText.length;
            break;
          default:
            return;
        }
        
        const newContent = content.slice(0, start) + formattedText + content.slice(end);
        setContent(newContent);
        
        // Set cursor position after the formatted text
        setTimeout(() => {
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }, 0);
      } else {
        // If no text is selected, insert formatting markers and place cursor between them
        let markers = '';
        let cursorOffset = 0;
        
        switch (format) {
          case 'bold':
            markers = '****';
            cursorOffset = 2;
            break;
          case 'italic':
            markers = '**';
            cursorOffset = 1;
            break;
          case 'underline':
            markers = '____';
            cursorOffset = 2;
            break;
          default:
            return;
        }
        
        const newContent = content.slice(0, start) + markers + content.slice(end);
        setContent(newContent);
        
        // Place cursor between the formatting markers
        setTimeout(() => {
          textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
          textarea.focus();
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).catch(err => {
          console.error('Failed to copy text:', err);
        });
      }
    }
  };

  const handlePaste = async () => {
    try {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const clipboardText = await navigator.clipboard.readText();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.slice(0, start) + clipboardText + content.slice(end);
        setContent(newContent);
        
        setTimeout(() => {
          textarea.setSelectionRange(start + clipboardText.length, start + clipboardText.length);
          textarea.focus();
        }, 0);
      }
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleCut = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.slice(0, start) + content.slice(end);
          setContent(newContent);
          
          setTimeout(() => {
            textarea.setSelectionRange(start, start);
            textarea.focus();
          }, 0);
        }).catch(err => {
          console.error('Failed to cut text:', err);
        });
      }
    }
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

  const handleSaveClick = (event: React.MouseEvent<HTMLElement>) => {
    setSaveMenuAnchor(event.currentTarget);
  };

  const handleSaveMenuClose = () => {
    setSaveMenuAnchor(null);
  };

  const handleImproveWriting = async () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        setIsAiLoading(true);
        try {
          const improvedText = await improveWriting(selectedText);
          if (improvedText) {
            const newContent = content.slice(0, textarea.selectionStart) + 
                             improvedText + 
                             content.slice(textarea.selectionEnd);
            setContent(newContent);
          }
        } catch (error) {
          console.error('Error improving text:', error);
        } finally {
          setIsAiLoading(false);
        }
      }
    }
  };

  const handleSummarize = async () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        setIsAiLoading(true);
        try {
          const summary = await summarizeText(selectedText);
          if (summary) {
            const newContent = content.slice(0, textarea.selectionStart) + 
                             '\n\nSummary:\n' + summary + '\n\n' + 
                             content.slice(textarea.selectionEnd);
            setContent(newContent);
          }
        } catch (error) {
          console.error('Error summarizing text:', error);
        } finally {
          setIsAiLoading(false);
        }
      }
    }
  };

  const handleAutoComplete = async () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPosition);
      
      setIsAiLoading(true);
      try {
        const suggestion = await getSuggestions(textBeforeCursor);
        if (suggestion) {
          const newContent = content.slice(0, cursorPosition) + 
                           suggestion + 
                           content.slice(cursorPosition);
          setContent(newContent);
          
          setTimeout(() => {
            textarea.setSelectionRange(
              cursorPosition + suggestion.length,
              cursorPosition + suggestion.length
            );
            textarea.focus();
          }, 0);
        }
      } catch (error) {
        console.error('Error getting suggestions:', error);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const handleParaphrase = async () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        setIsAiLoading(true);
        try {
          const paraphrasedText = await paraphraseText(selectedText);
          if (paraphrasedText) {
            const newContent = content.slice(0, textarea.selectionStart) + 
                             paraphrasedText + 
                             content.slice(textarea.selectionEnd);
            setContent(newContent);
          }
        } catch (error) {
          console.error('Error paraphrasing text:', error);
        } finally {
          setIsAiLoading(false);
        }
      }
    }
  };

  const handleAIDetection = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        const result = detectAIText(selectedText);
        setAiDetectionResult(result);
        setAiDetectionDialogOpen(true);
      }
    }
  };

  const handleHumanize = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selectedText = content.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        setIsAiLoading(true);
        try {
          const humanizedText = humanizeText(selectedText);
          const newContent = content.slice(0, textarea.selectionStart) + 
                           humanizedText + 
                           content.slice(textarea.selectionEnd);
          setContent(newContent);
        } catch (error) {
          console.error('Error humanizing text:', error);
        } finally {
          setIsAiLoading(false);
        }
      }
    }
  };

  const handleListFormat = (listType: 'bullet' | 'numbered') => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        // Split selected text into lines and format each line
        const lines = selectedText.split('\n');
        const formattedLines = lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine === '') return line;
          
          if (listType === 'bullet') {
            return line.replace(/^\s*/, '• ');
          } else {
            return line.replace(/^\s*/, `${index + 1}. `);
          }
        });
        
        const formattedText = formattedLines.join('\n');
        const newContent = content.slice(0, start) + formattedText + content.slice(end);
        setContent(newContent);
        
        // Set cursor position after the formatted text
        setTimeout(() => {
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
          textarea.focus();
        }, 0);
      } else {
        // If no text is selected, insert a list item at cursor position
        const listMarker = listType === 'bullet' ? '• ' : '1. ';
        const newContent = content.slice(0, start) + listMarker + content.slice(end);
        setContent(newContent);
        
        // Place cursor after the list marker
        setTimeout(() => {
          textarea.setSelectionRange(start + listMarker.length, start + listMarker.length);
          textarea.focus();
        }, 0);
      }
    }
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLElement>) => {
    setCalendarAnchor(event.currentTarget);
    setCalendarOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const dateString = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const newContent = content.slice(0, start) + dateString + content.slice(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + dateString.length, start + dateString.length);
        textarea.focus();
      }, 0);
    }
  };

  const toolbarGroups = [
    {
      title: 'Clipboard',
      tools: [
        { icon: <ContentCopy />, action: handleCopy, tooltip: 'Copy (Ctrl+C)', disabled: false },
        { icon: <ContentPaste />, action: handlePaste, tooltip: 'Paste (Ctrl+V)', disabled: false },
        { icon: <ContentCut />, action: handleCut, tooltip: 'Cut (Ctrl+X)', disabled: false },
      ],
    },
    {
      title: 'History',
      tools: [
        { 
          icon: <Undo />, 
          action: handleUndo, 
          tooltip: 'Undo (Ctrl+Z)',
          disabled: undoStack.length <= 1
        },
        { 
          icon: <Redo />, 
          action: handleRedo, 
          tooltip: 'Redo (Ctrl+Y)',
          disabled: redoStack.length === 0
        },
      ],
    },
    {
      title: 'Formatting',
      tools: [
        { icon: <FormatBold />, action: () => handleFormat('bold'), tooltip: 'Bold (Ctrl+B)', disabled: false },
        { icon: <FormatItalic />, action: () => handleFormat('italic'), tooltip: 'Italic (Ctrl+I)', disabled: false },
        { icon: <FormatUnderlined />, action: () => handleFormat('underline'), tooltip: 'Underline (Ctrl+U)', disabled: false },
      ],
    },
    {
      title: 'Lists',
      tools: [
        { icon: <FormatListBulleted />, action: () => handleListFormat('bullet'), tooltip: 'Bullet List', disabled: false },
        { icon: <FormatListNumbered />, action: () => handleListFormat('numbered'), tooltip: 'Numbered List', disabled: false },
      ],
    },
    {
      title: 'File',
      tools: [
        { icon: <SaveAlt />, action: handleSaveClick, tooltip: 'Save As... (Ctrl+S)', disabled: false },
        { icon: <Share />, action: () => {}, tooltip: 'Share', disabled: false },
        { icon: <Calculate />, action: () => setCalculatorOpen(true), tooltip: 'Calculator', disabled: false },
        { icon: <KeyboardIcon />, action: () => setKeyboardOpen(true), tooltip: 'On-screen Keyboard', disabled: false },
        { icon: <CalendarToday />, action: handleCalendarClick, tooltip: 'Calendar', disabled: false },
      ],
    },
    {
      title: 'AI Tools',
      tools: [
        { 
          icon: <AutoFixHigh />, 
          action: handleImproveWriting, 
          tooltip: 'Improve Writing (Select text first)',
          disabled: false
        },
        { 
          icon: <Autorenew />, 
          action: handleParaphrase, 
          tooltip: 'Paraphrase (Select text first)',
          disabled: false
        },
        { 
          icon: <Summarize />, 
          action: handleSummarize, 
          tooltip: 'Summarize (Select text first)',
          disabled: false
        },
        { 
          icon: <Psychology />, 
          action: handleAutoComplete, 
          tooltip: 'AI Complete',
          disabled: false
        },
        { 
          icon: <SmartToy />, 
          action: handleAIDetection, 
          tooltip: 'Detect AI Text (Select text first)',
          disabled: false
        },
        { 
          icon: <Face />, 
          action: handleHumanize, 
          tooltip: 'Humanize Text (Select text first)',
          disabled: false
        },
      ],
    },
  ];

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
        }}
      >
        <Tooltip title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}>
          <IconButton 
            onClick={onSidebarToggle}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            {isSidebarOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Tooltip>

        {toolbarGroups.map((group, groupIndex) => (
          <React.Fragment key={group.title}>
            <ButtonGroup size="small" sx={{ height: 32 }}>
              {group.tools.map((tool, toolIndex) => (
                <Tooltip key={tool.tooltip} title={tool.tooltip}>
                  <IconButton
                    onClick={tool.action}
                    disabled={tool.disabled}
                    size="small"
                    sx={{
                      color: tool.disabled ? 'text.disabled' : 'text.secondary',
                      '&:hover': { 
                        color: tool.disabled ? 'text.disabled' : 'text.primary' 
                      },
                    }}
                  >
                    {tool.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </ButtonGroup>
            {groupIndex < toolbarGroups.length - 1 && (
              <Divider orientation="vertical" flexItem />
            )}
          </React.Fragment>
        ))}

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              sx={{
                height: 32,
                '& .MuiSelect-select': {
                  py: 0.5,
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
              sx={{
                height: 32,
                '& .MuiSelect-select': {
                  py: 0.5,
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

        {isAiLoading && (
          <CircularProgress
            size={24}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        )}
      </Box>

      {calculatorOpen && (
        <FloatingCalculator onClose={() => setCalculatorOpen(false)} />
      )}

      {keyboardOpen && (
        <Keyboard
          onKeyPress={handleKeyPress}
          onClose={() => setKeyboardOpen(false)}
        />
      )}

      <SaveMenu
        anchorEl={saveMenuAnchor}
        open={Boolean(saveMenuAnchor)}
        onClose={handleSaveMenuClose}
        noteTitle={noteTitle}
        noteContent={content}
      />

      <AIDetectionDialog
        open={aiDetectionDialogOpen}
        onClose={() => setAiDetectionDialogOpen(false)}
        detectionResult={aiDetectionResult}
      />

      <Calendar
        open={calendarOpen}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarOpen(false)}
        onDateSelect={handleDateSelect}
      />
    </>
  );
};

export default Toolbar; 