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
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Sort as SortIcon,
  ChevronLeft,
  Menu as MenuIcon,
  PushPin as PinIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt?: Date; // Make it optional for backward compatibility
  isPinned?: boolean;
  isLocked?: boolean;
  password?: string;
}

interface SidebarProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNote: string | null;
  onNoteSelect: (noteId: string | null) => void;
  isOpen: boolean;
}

type SortOption = 'modified-desc' | 'modified-asc' | 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  setNotes,
  selectedNote,
  onNoteSelect,
  isOpen,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNotes, setSelectedNotes] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption>('modified-desc');
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null);
  const [lockDialogOpen, setLockDialogOpen] = React.useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      lastModified: new Date(),
      createdAt: new Date(),
      isPinned: false,
      isLocked: false,
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

  const togglePin = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setNotes(notes.map(note => 
      note.id === noteId 
        ? { ...note, isPinned: !note.isPinned, lastModified: new Date() }
        : note
    ));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, noteId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveNoteId(noteId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveNoteId(null);
  };

  const sortNotes = (notesToSort: Note[]): Note[] => {
    const sortedNotes = [...notesToSort];
    
    // First separate pinned and unpinned notes
    const pinnedNotes = sortedNotes.filter(note => note.isPinned);
    const unpinnedNotes = sortedNotes.filter(note => !note.isPinned);
    
    // Sort each group separately
    const sortGroup = (notes: Note[]) => {
      switch (sortBy) {
        case 'modified-desc':
          return notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        case 'modified-asc':
          return notes.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime());
        case 'created-desc':
          return notes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        case 'created-asc':
          return notes.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        case 'title-asc':
          return notes.sort((a, b) => a.title.localeCompare(b.title));
        case 'title-desc':
          return notes.sort((a, b) => b.title.localeCompare(a.title));
        default:
          return notes;
      }
    };

    // Return concatenated sorted groups with pinned notes first
    return [...sortGroup(pinnedNotes), ...sortGroup(unpinnedNotes)];
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

  const handleLockNote = () => {
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setLockDialogOpen(true);
    handleMenuClose();
  };

  const handleUnlockNote = () => {
    setPassword('');
    setPasswordError('');
    setUnlockDialogOpen(true);
    handleMenuClose();
  };

  const handleLockConfirm = () => {
    if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setNotes(notes.map(note =>
      note.id === activeNoteId
        ? { ...note, isLocked: true, password, lastModified: new Date() }
        : note
    ));
    setLockDialogOpen(false);
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleUnlockConfirm = () => {
    const note = notes.find(n => n.id === activeNoteId);
    if (note && note.password === password) {
      setNotes(notes.map(n =>
        n.id === activeNoteId
          ? { ...note, isLocked: false, password: undefined, lastModified: new Date() }
          : n
      ));
      setUnlockDialogOpen(false);
      setPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {note.isLocked && (
                    <LockIcon 
                      sx={{ 
                        fontSize: '1rem',
                        opacity: 0.5,
                        mr: 1,
                        color: 'primary.main'
                      }} 
                    />
                  )}
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, note.id)}
                    sx={{ opacity: 0.5 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {note.isPinned && (
                      <PinIcon 
                        sx={{ 
                          fontSize: '0.8rem', 
                          mr: 1, 
                          transform: 'rotate(45deg)',
                          color: 'primary.main'
                        }} 
                      />
                    )}
                    <Typography
                      sx={{
                        fontWeight: selectedNote === note.id ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {note.title}
                    </Typography>
                  </Box>
                }
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
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (activeNoteId) {
              togglePin(activeNoteId, e);
              handleMenuClose();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PinIcon sx={{ 
            fontSize: '1.2rem',
            transform: notes.find(n => n.id === activeNoteId)?.isPinned ? 'rotate(45deg)' : 'none'
          }} />
          <Typography>
            {notes.find(n => n.id === activeNoteId)?.isPinned ? 'Unpin note' : 'Pin note'}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const note = notes.find(n => n.id === activeNoteId);
            if (note?.isLocked) {
              handleUnlockNote();
            } else {
              handleLockNote();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {notes.find(n => n.id === activeNoteId)?.isLocked ? (
            <>
              <LockOpenIcon sx={{ fontSize: '1.2rem' }} />
              <Typography>Unlock note</Typography>
            </>
          ) : (
            <>
              <LockIcon sx={{ fontSize: '1.2rem' }} />
              <Typography>Lock note</Typography>
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (activeNoteId) {
              handleDeleteNote(activeNoteId);
              handleMenuClose();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'error.main',
          }}
        >
          <DeleteIcon sx={{ fontSize: '1.2rem' }} />
          <Typography>Delete note</Typography>
        </MenuItem>
      </Menu>

      {/* Lock Dialog */}
      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle>Lock Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(passwordError)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={Boolean(passwordError)}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLockConfirm} variant="contained">Lock</Button>
        </DialogActions>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={unlockDialogOpen} onClose={() => setUnlockDialogOpen(false)}>
        <DialogTitle>Unlock Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(passwordError)}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUnlockConfirm} variant="contained">Unlock</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar; 