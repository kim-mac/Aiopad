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
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color={detectionResult.isAIGenerated ? "error" : "success"}>
            {detectionResult.isAIGenerated ? "Likely AI Generated" : "Likely Human Written"}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Confidence: {Math.round(detectionResult.confidence * 100)}%
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Indicators:
          </Typography>
          <Box component="ul" sx={{ mt: 1 }}>
            {detectionResult.indicators.map((indicator, index) => (
              <Typography component="li" key={index}>
                {indicator}
              </Typography>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <Box sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose} fullWidth>
          Close
        </Button>
      </Box>
    </Dialog>
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

  useEffect(() => {
    setUndoStack(prev => [...prev, content]);
    setRedoStack([]);
  }, [content]);

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
      
      setUndoStack(newUndoStack);
      setRedoStack(prev => [...prev, currentState]);
      setContent(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.pop()!;
      
      setRedoStack(newRedoStack);
      setUndoStack(prev => [...prev, nextState]);
      setContent(nextState);
    }
  };

  const handleFormat = (format: string) => {
    // Implementation of handleFormat
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
        { icon: <SaveAlt />, action: handleSaveClick, tooltip: 'Save As... (Ctrl+S)' },
        { icon: <Share />, action: () => {}, tooltip: 'Share' },
        { icon: <Calculate />, action: () => setCalculatorOpen(true), tooltip: 'Calculator' },
        { icon: <KeyboardIcon />, action: () => setKeyboardOpen(true), tooltip: 'On-screen Keyboard' },
      ],
    },
    {
      title: 'AI Tools',
      tools: [
        { 
          icon: <AutoFixHigh />, 
          action: handleImproveWriting, 
          tooltip: 'Improve Writing (Select text first)' 
        },
        { 
          icon: <Autorenew />, 
          action: handleParaphrase, 
          tooltip: 'Paraphrase (Select text first)' 
        },
        { 
          icon: <Summarize />, 
          action: handleSummarize, 
          tooltip: 'Summarize (Select text first)' 
        },
        { 
          icon: <Psychology />, 
          action: handleAutoComplete, 
          tooltip: 'AI Complete' 
        },
        { 
          icon: <SmartToy />, 
          action: handleAIDetection, 
          tooltip: 'Detect AI Text (Select text first)' 
        },
        { 
          icon: <Face />, 
          action: handleHumanize, 
          tooltip: 'Humanize Text (Select text first)' 
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
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' },
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
    </>
  );
};

export default Toolbar; 