import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface Note {
  id: string;
  title: string;
  content: string;
  tag?: string;
  summary?: string;
  difficulty?: string;
  contentType?: string;
  createdAt?: Date;
  lastModified?: Date;
}

interface ShareNoteDialogProps {
  open: boolean;
  onClose: () => void;
  note: Note;
}

function buildMarkdown(note: Note): string {
  const lines: string[] = [];
  lines.push(`# ${note.title}`);
  lines.push('');
  if (note.tag || note.difficulty || note.contentType) {
    const chips: string[] = [];
    if (note.tag) chips.push(`Tag: ${note.tag}`);
    if (note.difficulty) chips.push(`Level: ${note.difficulty}`);
    if (note.contentType) chips.push(`Source: ${note.contentType}`);
    lines.push(chips.join(' · '));
    lines.push('');
  }
  if (note.summary) {
    lines.push(`> ${note.summary}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push(note.content);
  lines.push('');
  lines.push('---');
  lines.push(`*Exported from Aiopad — ${new Date().toLocaleDateString()}*`);
  return lines.join('\n');
}

function buildShareableUrl(note: Note): string {
  const data = {
    title: note.title,
    content: note.content.slice(0, 5000),
    tag: note.tag,
    summary: note.summary,
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const url = new URL(window.location.href);
  url.searchParams.set('share', encoded);
  return url.toString();
}

const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({ open, onClose, note }) => {
  const [copiedMd, setCopiedMd] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const markdown = React.useMemo(() => buildMarkdown(note), [note]);
  const shareUrl = React.useMemo(() => buildShareableUrl(note), [note]);

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <ShareIcon color="primary" />
        Share Note
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Share this note as Markdown text or via a shareable link.
        </Typography>

        {(note.tag || note.difficulty) && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {note.tag && <Chip label={note.tag} size="small" variant="outlined" />}
            {note.difficulty && <Chip label={note.difficulty} size="small" color="primary" variant="outlined" />}
            {note.contentType && <Chip label={note.contentType} size="small" color="secondary" variant="outlined" />}
          </Box>
        )}

        {note.summary && (
          <Alert severity="info" icon={false} sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2">{note.summary}</Typography>
          </Alert>
        )}

        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          Markdown Export
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={markdown}
          InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={copiedMd ? <CheckIcon color="success" /> : <CopyIcon />}
          onClick={copyMarkdown}
          sx={{ mb: 2 }}
          color={copiedMd ? 'success' : 'primary'}
        >
          {copiedMd ? 'Copied!' : 'Copy as Markdown'}
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          Shareable Link
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Anyone with this link can view the note in Aiopad.
        </Typography>
        <TextField
          fullWidth
          value={shareUrl}
          InputProps={{ readOnly: true, sx: { fontSize: '0.75rem' } }}
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          variant="contained"
          startIcon={copiedUrl ? <CheckIcon /> : <CopyIcon />}
          onClick={copyUrl}
          color={copiedUrl ? 'success' : 'primary'}
        >
          {copiedUrl ? 'Link Copied!' : 'Copy Share Link'}
        </Button>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareNoteDialog;
