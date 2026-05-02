import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Style as FlashcardIcon,
  ChevronLeft,
  ChevronRight,
  Flip as FlipIcon,
  Refresh as RestartIcon,
} from '@mui/icons-material';
import { generateFlashcards } from '../services/nvidia';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsDialogProps {
  open: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
}

const FlashcardsDialog: React.FC<FlashcardsDialogProps> = ({
  open,
  onClose,
  noteTitle,
  noteContent,
}) => {
  const [cards, setCards] = React.useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [generated, setGenerated] = React.useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    const result = await generateFlashcards(noteContent);
    setIsLoading(false);
    if (result.length === 0) {
      setError('Could not generate flashcards. The note may be too short or unclear.');
      return;
    }
    setCards(result);
    setCurrentIndex(0);
    setFlipped(false);
    setGenerated(true);
  };

  React.useEffect(() => {
    if (open && !generated && !isLoading) {
      handleGenerate();
    }
  }, [open]);

  const handleClose = () => {
    if (isLoading) return;
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setGenerated(false);
    setError('');
    onClose();
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  const current = cards[currentIndex];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <FlashcardIcon color="warning" />
        Flashcards — {noteTitle}
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        {isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              AI is generating flashcards from your note...
            </Typography>
          </Box>
        )}

        {error && !isLoading && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button onClick={handleGenerate} variant="outlined" startIcon={<RestartIcon />}>
              Try Again
            </Button>
          </Box>
        )}

        {!isLoading && generated && cards.length > 0 && current && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip label={`${currentIndex + 1} / ${cards.length}`} size="small" variant="outlined" />
              <Button
                size="small"
                startIcon={<RestartIcon />}
                onClick={handleRestart}
                variant="text"
              >
                Restart
              </Button>
            </Box>

            <Paper
              onClick={() => setFlipped((f) => !f)}
              elevation={4}
              sx={{
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                borderRadius: 3,
                cursor: 'pointer',
                textAlign: 'center',
                background: flipped
                  ? 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
                  : 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                color: '#fff',
                transition: 'background 0.3s',
                userSelect: 'none',
              }}
            >
              <Chip
                label={flipped ? 'Answer' : 'Question'}
                size="small"
                sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem' }}
              />
              <Typography variant="h6" fontWeight={400} sx={{ lineHeight: 1.4 }}>
                {flipped ? current.back : current.front}
              </Typography>
              <Box sx={{ mt: 2, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlipIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">Click to flip</Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
              <IconButton onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {flipped ? 'Answer revealed' : 'Tap card to see answer'}
              </Typography>
              <IconButton onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { setGenerated(false); handleGenerate(); }} disabled={isLoading} variant="outlined" startIcon={<RestartIcon />}>
          Regenerate
        </Button>
        <Button onClick={handleClose} disabled={isLoading} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlashcardsDialog;
