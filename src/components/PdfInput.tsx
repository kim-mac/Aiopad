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
import { PictureAsPdf as PdfIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
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

interface PdfInputProps {
  open: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('latin1', { fatal: false });
  const raw = decoder.decode(uint8Array);

  const textBlocks: string[] = [];

  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const text = tjMatch[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ');
      if (text.trim()) textBlocks.push(text);
    }
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(inner)) !== null) {
        const text = strMatch[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ');
        if (text.trim()) textBlocks.push(text);
      }
    }
  }

  const joined = textBlocks.join(' ').replace(/\s{3,}/g, '\n\n').trim();
  return joined;
}

const PdfInput: React.FC<PdfInputProps> = ({ open, onClose, onNoteCreated }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTask, setCurrentTask] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isLoading) return;
    setFile(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleFileSelect = (selected: File) => {
    if (!selected.name.endsWith('.pdf') && selected.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError('PDF must be smaller than 20 MB.');
      return;
    }
    setFile(selected);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setError('');
    setSuccess(false);

    try {
      setIsLoading(true);
      setCurrentTask('Extracting text from PDF...');
      const extractedText = await extractTextFromPDF(file);

      if (!extractedText || extractedText.length < 50) {
        setError('Could not extract readable text from this PDF. It may be scanned or image-based.');
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      setCurrentTask('AI is analyzing the document...');
      const explanation = await explainContent(extractedText.slice(0, 8000), 'pdf');

      if (explanation.startsWith('Error:')) {
        setError(explanation);
        setIsLoading(false);
        setCurrentTask('');
        return;
      }

      setCurrentTask('Generating note metadata...');
      const meta = await generateNoteMeta(explanation);

      const content = [
        `📄 ${file.name}`,
        '',
        '---',
        '',
        explanation,
      ].join('\n');

      const newNote: Note = {
        id: Date.now().toString(),
        title: meta.title || file.name.replace('.pdf', ''),
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
        contentType: 'pdf',
        sourceUrl: file.name,
      };

      onNoteCreated(newNote);
      setIsLoading(false);
      setCurrentTask('');
      setSuccess(true);
      setFile(null);
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
        <PdfIcon color="error" />
        PDF → Smart Note
      </DialogTitle>

      {isLoading && <LinearProgress />}

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a PDF document and the AI will extract, explain, and structure it as a study note.
        </Typography>

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragOver ? 'primary.main' : file ? 'success.main' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: dragOver ? 'action.hover' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {file ? (
            <>
              <PdfIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight={500}>{file.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {(file.size / 1024).toFixed(0)} KB — Click to change
              </Typography>
            </>
          ) : (
            <>
              <UploadIcon sx={{ fontSize: 40, mb: 1, color: 'text.secondary' }} />
              <Typography variant="body1">Drag & drop a PDF or click to browse</Typography>
              <Typography variant="body2" color="text.secondary">Max 20 MB</Typography>
            </>
          )}
        </Box>

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
          disabled={isLoading || !file}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
        >
          {isLoading ? 'Processing...' : 'Create Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfInput;
