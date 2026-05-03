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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon, Article as RawIcon, AutoAwesome as AIIcon } from '@mui/icons-material';
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

interface VoiceInputProps {
  open: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ open, onClose, onNoteCreated }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState('');
  const [mode, setMode] = React.useState<'ai' | 'raw'>('ai');
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSupported(false);
    }
  }, []);

  const handleClose = () => {
    if (isLoading) return;
    stopRecording();
    setTranscript('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const startRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      setError(`Microphone error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setError('');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const handleProcess = async () => {
    if (!transcript.trim()) {
      setError('No speech detected. Try recording again.');
      return;
    }

    try {
      setIsLoading(true);

      let noteContent: string;
      let noteTitle = 'Voice Note';
      let meta: { title?: string; tag?: string; summary?: string; difficulty?: 'beginner' | 'intermediate' | 'advanced' } = {};

      if (mode === 'raw') {
        setCurrentTask('Saving transcript...');
        noteContent = transcript.trim();
      } else {
        setCurrentTask('AI is processing your speech...');
        const explanation = await explainContent(transcript, 'text');

        if (explanation.startsWith('Error:')) {
          setError(explanation);
          setIsLoading(false);
          setCurrentTask('');
          return;
        }

        setCurrentTask('Generating note metadata...');
        meta = await generateNoteMeta(explanation);
        noteTitle = meta.title || 'Voice Note';
        noteContent = [
          '**Original Transcript:**',
          transcript.trim(),
          '',
          '---',
          '',
          explanation,
        ].join('\n');
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
        contentType: 'voice',
      };

      onNoteCreated(newNote);
      setIsLoading(false);
      setCurrentTask('');
      setSuccess(true);
      setTranscript('');
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <MicIcon />
        Voice → Note
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        {!supported ? (
          <Alert severity="warning">
            Your browser doesn't support speech recognition. Try Chrome or Edge.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click the mic to start recording. Speak clearly. When done, click Stop.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant={isRecording ? 'contained' : 'outlined'}
                color={isRecording ? 'error' : 'primary'}
                size="large"
                startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                sx={{ borderRadius: 6, px: 4, py: 1.5 }}
              >
                {isRecording ? 'Stop Recording' : transcript ? 'Record Again' : 'Start Recording'}
              </Button>
            </Box>

            {isRecording && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'error.main', animation: 'pulse 1s infinite' }} />
                <Typography variant="body2" color="error">Recording...</Typography>
              </Box>
            )}

            {transcript && (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 160, overflow: 'auto', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
                  Transcript:
                </Typography>
                <Typography variant="body2">{transcript}</Typography>
              </Paper>
            )}

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
              {mode === 'raw' ? 'Saves the transcript exactly as spoken, no AI processing.' : 'AI will structure and enhance your spoken notes.'}
            </Typography>

            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">{currentTask}</Typography>
              </Box>
            )}
          </>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Note saved! ✓</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>Cancel</Button>
        <Button
          onClick={handleProcess}
          variant="contained"
          disabled={isLoading || !transcript.trim() || isRecording}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <MicIcon />}
        >
          {isLoading ? 'Processing...' : 'Create Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoiceInput;
