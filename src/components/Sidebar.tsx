import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
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
  useTheme,
  Collapse,
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
  Palette as PaletteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckBox as CheckBoxIcon,
  Note as NoteIcon,
  Draw as DrawIcon,
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
  color?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: 'note' | 'todo' | 'handwriting';
  tasks?: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }>;
}

interface SidebarProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  selectedNote: string | null;
  onNoteSelect: (noteId: string | null) => void;
  isOpen: boolean;
}

type SortOption = 'modified-desc' | 'modified-asc' | 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';

const NOTE_COLORS = {
  default: {
    light: 'transparent',
    dark: 'transparent'
  },
  red: {
    light: '#ffebee',
    dark: '#3b1219'
  },
  orange: {
    light: '#fff3e0',
    dark: '#332611'
  },
  yellow: {
    light: '#fffde7',
    dark: '#2d2b15'
  },
  green: {
    light: '#e8f5e9',
    dark: '#1a2e1b'
  },
  blue: {
    light: '#e3f2fd',
    dark: '#1a2733'
  },
  purple: {
    light: '#f3e5f5',
    dark: '#221a2d'
  },
  teal: {
    light: '#e0f2f1',
    dark: '#1a2c2c'
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  setNotes,
  selectedNote,
  onNoteSelect,
  isOpen,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNotes, setSelectedNotes] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption>('modified-desc');
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [colorMenuAnchorEl, setColorMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null);
  const [lockDialogOpen, setLockDialogOpen] = React.useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [showArchived, setShowArchived] = React.useState(false);
  const [showFavorites, setShowFavorites] = React.useState(true);
  const [addNoteMenuAnchor, setAddNoteMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleAddNoteMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAddNoteMenuAnchor(event.currentTarget);
  };

  const handleAddNoteMenuClose = () => {
    setAddNoteMenuAnchor(null);
  };

  const handleAddNote = (type: 'note' | 'todo' | 'handwriting' = 'note') => {
    const newNote: Note = {
      id: Date.now().toString(),
      title:
        type === 'todo'
          ? 'New To-Do List'
          : type === 'handwriting'
          ? 'New Handwriting Note'
          : 'New Note',
      content: '',
      lastModified: new Date(),
      createdAt: new Date(),
      isPinned: false,
      isLocked: false,
      color: 'default',
      isArchived: false,
      isFavorite: false,
      type: type === 'handwriting' ? 'handwriting' : type,
      tasks:
        type === 'todo'
          ? [
              { id: '1', text: 'Add your first task here', completed: false },
            ]
          : undefined,
    };
    setNotes([newNote, ...notes]);
    onNoteSelect(newNote.id);
    handleAddNoteMenuClose();
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

  const handleColorMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setColorMenuAnchorEl(event.currentTarget);
  };

  const handleColorMenuClose = () => {
    setColorMenuAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    if (activeNoteId) {
      setNotes(notes.map(note =>
        note.id === activeNoteId
          ? { ...note, color, lastModified: new Date() }
          : note
      ));
    }
    handleColorMenuClose();
    handleMenuClose();
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

  const getNoteBackgroundColor = (colorName: string | undefined) => {
    if (!colorName || colorName === 'default') return 'transparent';
    const colorSet = NOTE_COLORS[colorName as keyof typeof NOTE_COLORS];
    return isDarkMode ? colorSet.dark : colorSet.light;
  };

  const getTextColor = (colorName: string | undefined) => {
    if (!colorName || colorName === 'default') {
      return 'inherit';
    }
    return isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)';
  };

  const handleArchiveNote = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, isArchived: true, lastModified: new Date() }
        : note
    ));
    if (selectedNote === noteId) {
      onNoteSelect(null);
    }
  };

  const handleUnarchiveNote = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, isArchived: false, lastModified: new Date() }
        : note
    ));
  };

  const handleToggleFavorite = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, isFavorite: !note.isFavorite, lastModified: new Date() }
        : note
    ));
  };

  const favoriteNotes = filteredNotes.filter(note => note.isFavorite && !note.isArchived);
  const activeNotes = filteredNotes.filter(note => !note.isFavorite && !note.isArchived);
  const archivedNotes = filteredNotes.filter(note => note.isArchived);

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
              onClick={handleAddNoteMenuOpen}
              color="primary"
              size="small"
              sx={{ borderRadius: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={addNoteMenuAnchor}
            open={Boolean(addNoteMenuAnchor)}
            onClose={handleAddNoteMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={() => handleAddNote('note')}>
              <ListItemIcon>
                <NoteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="New Note" secondary="Create a regular note" />
            </MenuItem>
            <MenuItem onClick={() => handleAddNote('todo')}>
              <ListItemIcon>
                <CheckBoxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="New To-Do List" secondary="Create a checklist" />
            </MenuItem>
            <MenuItem onClick={() => handleAddNote('handwriting')}>
              <ListItemIcon>
                <DrawIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="New Handwriting Note" secondary="Create a handwriting note" />
            </MenuItem>
          </Menu>
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
        {favoriteNotes.length > 0 && (
          <>
            <ListItem
              button
              onClick={() => setShowFavorites(!showFavorites)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
                    <Typography variant="subtitle2" sx={{ color: 'warning.main' }}>
                      Favorites
                    </Typography>
                  </Box>
                }
              />
              {showFavorites ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={showFavorites} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {favoriteNotes.map((note) => (
                  <ListItem
                    key={note.id}
                    disablePadding
                    sx={{
                      backgroundColor: getNoteBackgroundColor(note.color),
                      transition: 'background-color 0.2s',
                      '& .MuiTypography-root': {
                        color: getTextColor(note.color),
                      },
                      '& .MuiTypography-colorTextSecondary': {
                        color: theme => note.color && note.color !== 'default'
                          ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)')
                          : theme.palette.text.secondary,
                      },
                    }}
                    secondaryAction={
                      !isSelectionMode && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {note.isLocked && (
                            <LockIcon 
                              sx={{ 
                                fontSize: '1rem',
                                opacity: 0.5,
                                mr: 1,
                                color: note.color && note.color !== 'default'
                                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'primary.main')
                                  : 'primary.main'
                              }} 
                            />
                          )}
                          <IconButton
                            edge="end"
                            onClick={(e) => handleMenuOpen(e, note.id)}
                            sx={{ 
                              opacity: 0.5,
                              color: note.color && note.color !== 'default'
                                ? getTextColor(note.color)
                                : 'inherit'
                            }}
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
                      sx={{ 
                        pr: isSelectionMode ? 2 : 7,
                        '&.Mui-selected': {
                          backgroundColor: theme => note.color && note.color !== 'default'
                            ? (isDarkMode 
                              ? `${getNoteBackgroundColor(note.color)}cc`
                              : `${getNoteBackgroundColor(note.color)}80`)
                            : theme.palette.action.selected,
                        },
                        '&:hover': {
                          backgroundColor: theme => note.color && note.color !== 'default'
                            ? (isDarkMode 
                              ? `${getNoteBackgroundColor(note.color)}99`
                              : `${getNoteBackgroundColor(note.color)}60`)
                            : theme.palette.action.hover,
                        },
                      }}
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
                                  color: note.color && note.color !== 'default'
                                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'primary.main')
                                    : 'primary.main'
                                }} 
                              />
                            )}
                            {note.type === 'todo' && (
                              <CheckBoxIcon 
                                sx={{ 
                                  fontSize: '0.8rem', 
                                  mr: 1,
                                  color: note.color && note.color !== 'default'
                                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'success.main')
                                    : 'success.main'
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
                              sx={{ display: 'block' }}
                            >
                              Modified: {formatDateTime(note.lastModified)}
                            </Typography>
                            {note.createdAt && (
                              <Typography
                                component="span"
                                variant="body2"
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
            </Collapse>
          </>
        )}

        {activeNotes.map((note) => (
          <ListItem
            key={note.id}
            disablePadding
            sx={{
              backgroundColor: getNoteBackgroundColor(note.color),
              transition: 'background-color 0.2s',
              '& .MuiTypography-root': {
                color: getTextColor(note.color),
              },
              '& .MuiTypography-colorTextSecondary': {
                color: theme => note.color && note.color !== 'default'
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)')
                  : theme.palette.text.secondary,
              },
            }}
            secondaryAction={
              !isSelectionMode && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {note.isLocked && (
                    <LockIcon 
                      sx={{ 
                        fontSize: '1rem',
                        opacity: 0.5,
                        mr: 1,
                        color: note.color && note.color !== 'default'
                          ? (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'primary.main')
                          : 'primary.main'
                      }} 
                    />
                  )}
                <IconButton
                  edge="end"
                    onClick={(e) => handleMenuOpen(e, note.id)}
                    sx={{ 
                      opacity: 0.5,
                      color: note.color && note.color !== 'default'
                        ? getTextColor(note.color)
                        : 'inherit'
                    }}
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
              sx={{ 
                pr: isSelectionMode ? 2 : 7,
                '&.Mui-selected': {
                  backgroundColor: theme => note.color && note.color !== 'default'
                    ? (isDarkMode 
                      ? `${getNoteBackgroundColor(note.color)}cc`  // 80% opacity for better contrast
                      : `${getNoteBackgroundColor(note.color)}80`)
                    : theme.palette.action.selected,
                },
                '&:hover': {
                  backgroundColor: theme => note.color && note.color !== 'default'
                    ? (isDarkMode 
                      ? `${getNoteBackgroundColor(note.color)}99`  // 60% opacity for hover
                      : `${getNoteBackgroundColor(note.color)}60`)
                    : theme.palette.action.hover,
                },
              }}
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
                          color: note.color && note.color !== 'default'
                            ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'primary.main')
                            : 'primary.main'
                        }} 
                      />
                    )}
                    {note.type === 'todo' && (
                      <CheckBoxIcon 
                        sx={{ 
                          fontSize: '0.8rem', 
                          mr: 1,
                          color: note.color && note.color !== 'default'
                            ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'success.main')
                            : 'success.main'
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
                      sx={{ display: 'block' }}
                    >
                      Modified: {formatDateTime(note.lastModified)}
                    </Typography>
                    {note.createdAt && (
                      <Typography
                        component="span"
                        variant="body2"
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

        {archivedNotes.length > 0 && (
          <>
            <ListItem
              button
              onClick={() => setShowArchived(!showArchived)}
              sx={{
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
                mt: 2,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArchiveIcon sx={{ fontSize: '1.2rem', opacity: 0.7 }} />
                    <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                      Archived Notes
                    </Typography>
                  </Box>
                }
              />
              {showArchived ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={showArchived} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {archivedNotes.map((note) => (
                  <ListItem
                    key={note.id}
                    disablePadding
                    sx={{
                      backgroundColor: getNoteBackgroundColor(note.color),
                      transition: 'background-color 0.2s',
                      opacity: 0.8,
                      '& .MuiTypography-root': {
                        color: getTextColor(note.color),
                      },
                      '& .MuiTypography-colorTextSecondary': {
                        color: theme => note.color && note.color !== 'default'
                          ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)')
                          : theme.palette.text.secondary,
                      },
                    }}
                    secondaryAction={
                      !isSelectionMode && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {note.isLocked && (
                            <LockIcon 
                              sx={{ 
                                fontSize: '1rem',
                                opacity: 0.5,
                                mr: 1,
                                color: note.color && note.color !== 'default'
                                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'primary.main')
                                  : 'primary.main'
                              }} 
                            />
                          )}
                          <IconButton
                            edge="end"
                            onClick={(e) => handleMenuOpen(e, note.id)}
                            sx={{ 
                              opacity: 0.5,
                              color: note.color && note.color !== 'default'
                                ? getTextColor(note.color)
                                : 'inherit'
                            }}
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
                      sx={{ 
                        pr: isSelectionMode ? 2 : 7,
                        '&.Mui-selected': {
                          backgroundColor: theme => note.color && note.color !== 'default'
                            ? (isDarkMode 
                              ? `${getNoteBackgroundColor(note.color)}cc`
                              : `${getNoteBackgroundColor(note.color)}80`)
                            : theme.palette.action.selected,
                        },
                        '&:hover': {
                          backgroundColor: theme => note.color && note.color !== 'default'
                            ? (isDarkMode 
                              ? `${getNoteBackgroundColor(note.color)}99`
                              : `${getNoteBackgroundColor(note.color)}60`)
                            : theme.palette.action.hover,
                        },
                      }}
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
                                  color: note.color && note.color !== 'default'
                                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'primary.main')
                                    : 'primary.main'
                                }} 
                              />
                            )}
                            {note.type === 'todo' && (
                              <CheckBoxIcon 
                                sx={{ 
                                  fontSize: '0.8rem', 
                                  mr: 1,
                                  color: note.color && note.color !== 'default'
                                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'success.main')
                                    : 'success.main'
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
                              sx={{ display: 'block' }}
                            >
                              Modified: {formatDateTime(note.lastModified)}
                            </Typography>
                            {note.createdAt && (
                              <Typography
                                component="span"
                                variant="body2"
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
            </Collapse>
          </>
        )}
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
            if (activeNoteId) {
              handleToggleFavorite(activeNoteId);
              handleMenuClose();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {notes.find(n => n.id === activeNoteId)?.isFavorite ? (
            <>
              <StarIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
              <Typography>Remove from favorites</Typography>
            </>
          ) : (
            <>
              <StarBorderIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
              <Typography>Add to favorites</Typography>
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={handleColorMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PaletteIcon sx={{ fontSize: '1.2rem' }} />
          <Typography>Change color</Typography>
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
          onClick={() => {
            const note = notes.find(n => n.id === activeNoteId);
            if (note?.isArchived) {
              handleUnarchiveNote(activeNoteId!);
            } else {
              handleArchiveNote(activeNoteId!);
            }
            handleMenuClose();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {notes.find(n => n.id === activeNoteId)?.isArchived ? (
            <>
              <UnarchiveIcon sx={{ fontSize: '1.2rem' }} />
              <Typography>Unarchive note</Typography>
            </>
          ) : (
            <>
              <ArchiveIcon sx={{ fontSize: '1.2rem' }} />
              <Typography>Archive note</Typography>
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

      {/* Color Menu */}
      <Menu
        anchorEl={colorMenuAnchorEl}
        open={Boolean(colorMenuAnchorEl)}
        onClose={handleColorMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {Object.entries(NOTE_COLORS).map(([colorName, colorValue]) => (
          <MenuItem
            key={colorName}
            onClick={() => handleColorSelect(colorName)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 150,
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1,
                backgroundColor: isDarkMode ? colorValue.dark : colorValue.light,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <Typography sx={{ textTransform: 'capitalize' }}>
              {colorName}
            </Typography>
          </MenuItem>
        ))}
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