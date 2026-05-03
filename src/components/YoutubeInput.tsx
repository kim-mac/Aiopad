import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { VideoLibrary as YouTubeIcon, Article as RawIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
import { fetchYouTubeTranscript } from '../services/youtube';
import { explainContent, generateNoteMeta } from '../services/nvidia';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date;
  isPinned?: boolean;
  isLocked?: boolean;
  password?: string;
  color?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: 'note' | 'todo' | 'handwriting';
  tag?: string;
  summary?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  contentType?: 'youtube' | 'pdf' | 'image' | 'url' | 'voice' | 'text';
  thumbnail?: string;
  sourceUrl?: string;
}

interface YoutubeInputProps {
  open: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

const YoutubeInput: React.FC<YoutubeInputProps> = ({ open, onClose, onNoteCreated }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState('');
  const [mode, setMode] = React.useState<'ai' | 'raw'>('ai');

  const handleClose = () => {
    if (isLoading) return;
    setUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please paste a YouTube URL.');
      return;
    }
    setError('');
    setSuccess(false);

    try {
      setIsLoading(true);
      setCurrentTask('Fetching transcript...');
      const result = await fetchYouTubeTranscript(trimmedUrl);

      if ('error' in result) {
        setError(result.error);
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      let noteContent: string;
      let noteTitle = result.title || 'YouTube Note';
      let meta: { title?: string; tag?: string; summary?: string; difficulty?: 'beginner' | 'intermediate' | 'advanced' } = {};

      if (mode === 'raw') {
        setCurrentTask('Saving transcript...');
        noteContent = [
          result.thumbnail ? `![thumbnail](${result.thumbnail})` : '',
          '',
          result.transcript,
        ].filter(Boolean).join('\n');
      } else {
        setCurrentTask('AI is analyzing the video...');
        const explanation = await explainContent(result.transcript, 'youtube');

        if (explanation.startsWith('Error:')) {
          setError(explanation);
          setIsLoading(false);
          setCurrentTask('');
          return;
        }

        setCurrentTask('Saving note...');
        meta = await generateNoteMeta(explanation);
        noteTitle = meta.title || result.title || 'YouTube Note';
        noteContent = [
          result.thumbnail ? `![thumbnail](${result.thumbnail})` : '',
          '',
          '---',
          '',
          explanation,
        ].filter(Boolean).join('\n');
      }

      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
        lastModified: new Date(),
        createdAt: new Date(),
        isPinned: false,
        isLocked: false,
        color: 'default',
        isArchived: false,
        isFavorite: false,
        type: 'note',
        tag: meta.tag,
        summary: meta.summary,
        difficulty: meta.difficulty,
        contentType: 'youtube',
        thumbnail: result.thumbnail,
        sourceUrl: trimmedUrl,
      };

      onNoteCreated(newNote);
      setIsLoading(false);
      setCurrentTask('');
      setSuccess(true);
      setUrl('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
      setCurrentTask('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleSubmit();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <YouTubeIcon color="error" />
        YouTube → Note
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Paste a YouTube URL and choose how to save it.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          placeholder="Paste a YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Save as:
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            size="small"
            disabled={isLoading}
          >
            <ToggleButton value="raw">
              <RawIcon sx={{ fontSize: 16, mr: 0.5 }} /> Raw Transcript
            </ToggleButton>
            <ToggleButton value="ai">
              <AIIcon sx={{ fontSize: 16, mr: 0.5 }} /> AI Summary
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="caption" color="text.disabled">
          {mode === 'raw' ? 'Saves the transcript exactly as-is, no AI processing.' : 'AI will explain and structure the content into a smart note.'}
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">{currentTask}</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>Note saved! ✓</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !url.trim()}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <YouTubeIcon />}
        >
          {isLoading ? 'Processing...' : 'Create Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default YoutubeInput;
