import React from 'react';
import { Box, Typography, useTheme, TextField, CircularProgress, Tooltip, Paper, Chip } from '@mui/material';
import { Speed as SpeedIcon, Timer, EmojiEvents } from '@mui/icons-material';
import Toolbar from './Toolbar';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}

interface EditorProps {
  note: Note | undefined;
  onNoteChange: (changes: Partial<Note>) => void;
  fontFamily: string;
  fontSize: number;
  onFontChange: (fontFamily: string, fontSize: number) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

interface TypingMetrics {
  wpm: number;
  keystrokes: number;
  startTime: number;
  lastUpdate: number;
  samples: number[];
  maxWpm: number;
  totalTime: number;
  sessionStart: number;
}

const Editor: React.FC<EditorProps> = ({
  note,
  onNoteChange,
  fontFamily,
  fontSize,
  onFontChange,
  isSidebarOpen,
  onSidebarToggle,
}) => {
  const theme = useTheme();
  const [typingMetrics, setTypingMetrics] = React.useState<TypingMetrics>({
    wpm: 0,
    keystrokes: 0,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    samples: [],
    maxWpm: 0,
    totalTime: 0,
    sessionStart: Date.now(),
  });
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const updateTypingSpeed = (newContent: string, oldContent: string) => {
    const now = Date.now();
    const timeDiff = (now - typingMetrics.lastUpdate) / 1000;
    const charDiff = Math.abs(newContent.length - oldContent.length);

    if (charDiff > 0) {
      const instantWPM = (charDiff / 5) * (60 / timeDiff);

      setTypingMetrics(prev => {
        const newSamples = [...prev.samples, instantWPM].slice(-10);
        const avgWPM = newSamples.reduce((a, b) => a + b, 0) / newSamples.length;
        const roundedWPM = Math.round(avgWPM);
        const newMaxWpm = Math.max(prev.maxWpm, roundedWPM);

        return {
          wpm: roundedWPM,
          keystrokes: prev.keystrokes + charDiff,
          startTime: prev.startTime,
          lastUpdate: now,
          samples: newSamples,
          maxWpm: newMaxWpm,
          totalTime: prev.totalTime + timeDiff,
          sessionStart: prev.sessionStart,
        };
      });

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      setIsTyping(true);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 1500);
    }
  };

  const getSpeedColor = (wpm: number) => {
    if (wpm < 30) return theme.palette.info.main;
    if (wpm < 50) return theme.palette.success.main;
    if (wpm < 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSpeedLabel = (wpm: number) => {
    if (wpm < 30) return 'Relaxed';
    if (wpm < 50) return 'Steady';
    if (wpm < 70) return 'Swift';
    return 'Blazing';
  };

  const SpeedIndicator: React.FC<{ wpm: number, isTyping: boolean }> = ({ wpm, isTyping }) => {
    const isDark = theme.palette.mode === 'dark';

    const commonChipStyles = {
      height: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'background.paper',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'divider',
      '& .MuiChip-label': {
        px: 1.5,
        fontSize: '0.8125rem',
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
      },
      '& .MuiChip-icon': {
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
        fontSize: '1rem',
        ml: 0.5,
      },
      transition: 'all 0.2s ease',
    };

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.75,
          height: 28,
          p: 0.25,
          borderRadius: 1,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'background.default',
        }}
      >
        <Chip
          icon={<Timer />}
          label={formatTime(Math.floor((Date.now() - typingMetrics.sessionStart) / 1000))}
          variant="outlined"
          size="small"
          sx={commonChipStyles}
        />
        <Chip
          icon={<EmojiEvents />}
          label={`${typingMetrics.maxWpm} WPM`}
          variant="outlined"
          size="small"
          sx={commonChipStyles}
        />
        
        <Chip
          icon={
            <Box sx={{ position: 'relative', display: 'inline-flex', ml: 0.5 }}>
              <CircularProgress
                variant="determinate"
                value={Math.min((wpm / 100) * 100, 100)}
                size={16}
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
                  opacity: isTyping ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SpeedIcon
                  sx={{
                    fontSize: 10,
                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
                    opacity: isTyping ? 1 : 0.8,
                    transition: 'all 0.2s ease',
                  }}
                />
              </Box>
            </Box>
          }
          label={`${wpm} WPM`}
          variant="outlined"
          size="small"
          sx={{
            ...commonChipStyles,
            transform: isTyping ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      </Box>
    );
  };

  if (!note) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6">Select or create a note to begin</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <TextField
          value={note.title}
          onChange={(e) => onNoteChange({ title: e.target.value })}
          variant="standard"
          placeholder="Note title"
          sx={{
            mb: 2,
            '& .MuiInput-root': {
              fontSize: '1.5rem',
              fontWeight: 500,
              fontFamily: fontFamily,
            },
            '& .MuiInput-root:before': {
              borderBottom: 'none',
            },
            '& .MuiInput-root:hover:not(.Mui-disabled):before': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        />
        <Box
          sx={{
            mb: 2,
            borderRadius: 1,
            backgroundColor: 'background.paper',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Toolbar
            content={note.content}
            setContent={(content) => onNoteChange({ content })}
            onFontChange={onFontChange}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={onSidebarToggle}
            noteTitle={note.title}
          />
        </Box>
        <Box
          component="textarea"
          value={note.content}
          onChange={(e) => {
            const newContent = e.target.value;
            onNoteChange({ content: newContent });
            updateTypingSpeed(newContent, note.content);
          }}
          sx={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            p: 2,
            fontSize: fontSize,
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
            fontFamily: fontFamily,
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:focus': {
              outline: 'none',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 0 0 2px rgba(144, 202, 249, 0.2)' 
                : '0 4px 16px rgba(0,0,0,0.12)',
            },
          }}
        />
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Words: {getWordCount(note.content)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Characters: {getCharacterCount(note.content)}
            </Typography>
          </Box>
          <SpeedIndicator wpm={typingMetrics.wpm} isTyping={isTyping} />
        </Box>
      </Box>
    </Box>
  );
};

export default Editor; 