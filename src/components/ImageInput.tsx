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
} from '@mui/material';
import { Image as ImageIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { analyzeImage, generateNoteMeta } from '../services/nvidia';

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

interface ImageInputProps {
  open: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ImageInput: React.FC<ImageInputProps> = ({ open, onClose, onNoteCreated }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string>('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isLoading) return;
    setFile(null);
    setPreview('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleFileSelect = async (selected: File) => {
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Please select a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB.');
      return;
    }
    setFile(selected);
    setError('');
    const dataUrl = await fileToBase64(selected);
    setPreview(dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleSubmit = async () => {
    if (!file || !preview) return;
    setError('');
    setSuccess(false);

    try {
      setIsLoading(true);
      setCurrentTask('Sending image to AI...');
      const analysis = await analyzeImage(preview);

      if (analysis.startsWith('Error:')) {
        setError(analysis);
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      setCurrentTask('Generating note metadata...');
      const meta = await generateNoteMeta(analysis);

      const content = [
        `🖼️ Image: ${file.name}`,
        '',
        '---',
        '',
        analysis,
      ].join('\n');

      const newNote: Note = {
        id: Date.now().toString(),
        title: meta.title || `Image Note: ${file.name}`,
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
        contentType: 'image',
        thumbnail: preview,
        sourceUrl: file.name,
      };

      onNoteCreated(newNote);
      setIsLoading(false);
      setCurrentTask('');
      setSuccess(true);
      setFile(null);
      setPreview('');
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
        <ImageIcon color="primary" />
        Image → Smart Note
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload an image (photo, diagram, screenshot). The AI will extract text and describe what it sees.
        </Typography>

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragOver ? 'primary.main' : preview ? 'success.main' : 'divider',
            borderRadius: 2,
            p: preview ? 1 : 4,
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: dragOver ? 'action.hover' : 'transparent',
            transition: 'all 0.2s',
            overflow: 'hidden',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {preview ? (
            <Box>
              <img
                src={preview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {file?.name} — Click to change
              </Typography>
            </Box>
          ) : (
            <>
              <UploadIcon sx={{ fontSize: 40, mb: 1, color: 'text.secondary' }} />
              <Typography variant="body1">Drag & drop an image or click to browse</Typography>
              <Typography variant="body2" color="text.secondary">JPEG, PNG, WebP, GIF — Max 10 MB</Typography>
            </>
          )}
        </Box>

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
          disabled={isLoading || !file}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ImageIcon />}
        >
          {isLoading ? 'Processing...' : 'Create Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageInput;
