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
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
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

interface UrlInputProps {
  open: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Server error ${res.status}`);
  if (!data.content || data.content.length < 100) throw new Error('Page returned no readable content.');
  return data.content;
}

const UrlInput: React.FC<UrlInputProps> = ({ open, onClose, onNoteCreated }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState('');

  const handleClose = () => {
    if (isLoading) return;
    setUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a URL.'); return; }
    let validUrl = trimmed;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }
    setError('');
    setSuccess(false);

    try {
      setIsLoading(true);
      setCurrentTask('Fetching webpage content...');
      const pageText = await fetchUrlContent(validUrl);

      if (!pageText || pageText.length < 100) {
        setError('Could not extract readable content from this URL. The page may be behind a login or use JavaScript rendering.');
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      setCurrentTask('AI is summarizing the page...');
      const explanation = await explainContent(pageText, 'url');

      if (explanation.startsWith('Error:')) {
        setError(explanation);
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      setCurrentTask('Generating note metadata...');
      const meta = await generateNoteMeta(explanation);

      const content = [
        `🔗 ${validUrl}`,
        '',
        '---',
        '',
        explanation,
      ].join('\n');

      const newNote: Note = {
        id: Date.now().toString(),
        title: meta.title || new URL(validUrl).hostname,
        content,
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
        contentType: 'url',
        sourceUrl: validUrl,
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
    } catch (err) {
      setError(`Failed to fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      setCurrentTask('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <LinkIcon color="primary" />
        URL → Smart Note
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Paste any webpage URL. The AI will fetch and summarize the content into a structured note.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
          disabled={isLoading}
          variant="outlined"
          size="small"
        />

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">{currentTask}</Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Note saved! ✓</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !url.trim()}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
        >
          {isLoading ? 'Processing...' : 'Create Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UrlInput;
