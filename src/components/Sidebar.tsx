import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  TextField,
  Checkbox,
  Button,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Sort as SortIcon,
  ChevronLeft,
  Menu as MenuIcon,
} from '@mui/icons-material';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date; // Make it optional for backward compatibility
}

interface SidebarProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNote: string | null;
  onNoteSelect: (noteId: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type SortOption = 'modified-desc' | 'modified-asc' | 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  setNotes,
  selectedNote,
  onNoteSelect,
  isOpen,
  onToggle,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNotes, setSelectedNotes] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption>('modified-desc');

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      lastModified: new Date(),
      createdAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    onNoteSelect(newNote.id);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId));
    if (selectedNote === noteId) {
      onNoteSelect(notes[0]?.id || null);
    }
  };

  const handleDeleteSelected = () => {
    setNotes(notes.filter((note) => !selectedNotes.includes(note.id)));
    if (selectedNote && selectedNotes.includes(selectedNote)) {
      onNoteSelect(null);
    }
    setSelectedNotes([]);
    setIsSelectionMode(false);
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const sortNotes = (notesToSort: Note[]): Note[] => {
    const sortedNotes = [...notesToSort];
    switch (sortBy) {
      case 'modified-desc':
        return sortedNotes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      case 'modified-asc':
        return sortedNotes.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime());
      case 'created-desc':
        return sortedNotes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      case 'created-asc':
        return sortedNotes.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
      case 'title-asc':
        return sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sortedNotes.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedNotes;
    }
  };

  const filteredNotes = React.useMemo(() => {
    const filtered = notes.filter((note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return sortNotes(filtered);
  }, [notes, searchTerm, sortBy]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        backgroundColor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '4px 0 12px rgba(0,0,0,0.3)'
            : '4px 0 12px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            position: 'absolute',
            right: -16,
            backgroundColor: 'background.paper',
            height: 72,
            width: 16,
            minWidth: 16,
            padding: 0,
            borderRadius: '0 4px 4px 0',
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            boxShadow: (theme) => 
              theme.palette.mode === 'dark'
                ? '4px 0 12px rgba(0,0,0,0.3)'
                : '4px 0 12px rgba(0,0,0,0.1)',
            border: 1,
            borderLeft: 0,
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'text.primary',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -1,
              bottom: -1,
              left: -1,
              width: 1,
              backgroundColor: 'background.paper',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(0)' : 'rotate(180deg)',
            },
          }}
        >
          <ChevronLeft />
        </IconButton>
      </Box>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Notes</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Add new note">
            <IconButton
              onClick={handleAddNote}
              color="primary"
              size="small"
              sx={{ borderRadius: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle selection mode">
            <IconButton
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (!isSelectionMode) {
                  setSelectedNotes([]);
                }
              }}
              color={isSelectionMode ? 'primary' : 'default'}
              size="small"
              sx={{ borderRadius: 1 }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ px: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2, width: '100%' }}
        />
        <FormControl size="small" fullWidth>
          <InputLabel id="sort-select-label">Sort by</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            startAdornment={<SortIcon sx={{ mr: 1, opacity: 0.5 }} />}
          >
            <MenuItem value="modified-desc">Last modified (newest)</MenuItem>
            <MenuItem value="modified-asc">Last modified (oldest)</MenuItem>
            <MenuItem value="created-desc">Date created (newest)</MenuItem>
            <MenuItem value="created-asc">Date created (oldest)</MenuItem>
            <MenuItem value="title-asc">Title (A-Z)</MenuItem>
            <MenuItem value="title-desc">Title (Z-A)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {isSelectionMode && selectedNotes.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSelected}
            fullWidth
            size="small"
          >
            Delete Selected ({selectedNotes.length})
          </Button>
        </Box>
      )}
      <Divider />
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {filteredNotes.map((note) => (
          <ListItem
            key={note.id}
            disablePadding
            secondaryAction={
              !isSelectionMode && (
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  sx={{ opacity: 0.5 }}
                >
                  <DeleteIcon />
                </IconButton>
              )
            }
          >
            <ListItemButton
              selected={selectedNote === note.id}
              onClick={() =>
                isSelectionMode
                  ? toggleNoteSelection(note.id)
                  : onNoteSelect(note.id)
              }
              sx={{ pr: isSelectionMode ? 2 : 7 }}
            >
              {isSelectionMode && (
                <Checkbox
                  checked={selectedNotes.includes(note.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleNoteSelection(note.id)}
                  edge="start"
                  sx={{ mr: 1 }}
                />
              )}
              <ListItemText
                primary={note.title}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      Modified: {formatDateTime(note.lastModified)}
                    </Typography>
                    {note.createdAt && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Created: {formatDateTime(note.createdAt)}
                      </Typography>
                    )}
                  </React.Fragment>
                }
                primaryTypographyProps={{
                  sx: {
                    fontWeight: selectedNote === note.id ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 