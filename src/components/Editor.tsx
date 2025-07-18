import React from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  TextField, 
  CircularProgress, 
  Tooltip, 
  Paper, 
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemButton,
  FormControl,
  Select,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { 
  Speed as SpeedIcon, 
  Timer, 
  EmojiEvents,
  Add as AddIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Draw as DrawIcon,
} from '@mui/icons-material';
import Toolbar from './Toolbar';
import HandwritingCanvas from './HandwritingCanvas';

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  type?: 'note' | 'todo';
  tasks?: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    taskType?: 'one-time' | 'daily';
    lastCompleted?: Date;
  }>;
  tabs?: Array<{
    id: string;
    name: string;
    tasks: Array<{
      id: string;
      text: string;
      completed: boolean;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: Date;
      taskType?: 'one-time' | 'daily';
      lastCompleted?: Date;
    }>;
  }>;
}

interface EditorProps {
  note: Note | undefined;
  onNoteChange: (changes: Partial<Note>) => void;
  fontFamily: string;
  fontSize: number;
  onFontChange: (fontFamily: string, fontSize: number) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

interface TypingMetrics {
  wpm: number;
  keystrokes: number;
  startTime: number;
  lastUpdate: number;
  samples: number[];
  maxWpm: number;
  totalTime: number;
  sessionStart: number;
}

const Editor: React.FC<EditorProps> = ({
  note,
  onNoteChange,
  fontFamily,
  fontSize,
  onFontChange,
  isSidebarOpen,
  onSidebarToggle,
}) => {
  const theme = useTheme();
  const [typingMetrics, setTypingMetrics] = React.useState<TypingMetrics>({
    wpm: 0,
    keystrokes: 0,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    samples: [],
    maxWpm: 0,
    totalTime: 0,
    sessionStart: Date.now(),
  });
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  // Sorting and filtering state
  const [sortBy, setSortBy] = React.useState<'priority' | 'dueDate' | 'creationDate' | 'name'>('priority');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [filterCompleted, setFilterCompleted] = React.useState<'all' | 'completed' | 'pending'>('all');
  const [filterPriority, setFilterPriority] = React.useState<'all' | 'high' | 'medium' | 'low' | 'none'>('all');
  const [filterType, setFilterType] = React.useState<'all' | 'one-time' | 'daily'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Tab management state
  const [selectedTabId, setSelectedTabId] = React.useState<string | null>(null);
  
  // Handwriting mode state
  const [isHandwritingMode, setIsHandwritingMode] = React.useState(false);

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const handleTaskToggle = (taskId: string) => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.map(task => {
      if (task.id === taskId) {
        const newCompleted = !task.completed;
        return { 
          ...task, 
          completed: newCompleted,
          lastCompleted: newCompleted ? new Date() : undefined
        };
      }
      return task;
    });
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const handleTaskTextChange = (taskId: string, newText: string) => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, text: newText } : task
    );
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const handleAddTask = () => {
    const currentTasks = getCurrentTasks();
    
    const newTask = {
      id: Date.now().toString(),
      text: 'New task',
      completed: false,
      priority: undefined,
      dueDate: undefined,
      taskType: 'one-time' as const,
      lastCompleted: undefined,
    };
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks([...currentTasks, newTask]);
    } else {
      onNoteChange({ tasks: [...(note?.tasks || []), newTask] });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const handleTaskPriorityChange = (taskId: string, priority: 'low' | 'medium' | 'high') => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, priority } : task
    );
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const handleTaskDueDateChange = (taskId: string, dueDate: Date | null) => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, dueDate: dueDate || undefined } : task
    );
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const handleTaskTypeChange = (taskId: string, taskType: 'one-time' | 'daily') => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, taskType } : task
    );
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const resetDailyTasks = () => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    console.log('Resetting daily tasks...');
    console.log('Current tasks:', currentTasks);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const updatedTasks = currentTasks.map(task => {
      if (task.taskType === 'daily') {
        console.log(`Processing daily task: ${task.text}, completed: ${task.completed}, lastCompleted: ${task.lastCompleted}`);
        
        // If task has a lastCompleted date, check if it's from before today
        if (task.lastCompleted) {
          const lastCompletedDate = new Date(task.lastCompleted);
          lastCompletedDate.setHours(0, 0, 0, 0);
          
          console.log(`Last completed date: ${lastCompletedDate}, Today: ${today}`);
          
          // Reset if last completed was before today
          if (lastCompletedDate < today) {
            console.log(`Resetting task: ${task.text}`);
            return { ...task, completed: false, lastCompleted: undefined };
          }
        } else if (task.completed) {
          // If task is completed but has no lastCompleted date, reset it
          console.log(`Resetting completed task without lastCompleted: ${task.text}`);
          return { ...task, completed: false };
        }
      }
      return task;
    });
    
    console.log('Updated tasks:', updatedTasks);
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  const forceResetAllDaily = () => {
    const currentTasks = getCurrentTasks();
    if (!currentTasks.length) return;
    
    console.log('Force resetting all daily tasks...');
    
    const updatedTasks = currentTasks.map(task => {
      if (task.taskType === 'daily') {
        console.log(`Force resetting daily task: ${task.text}`);
        return { ...task, completed: false, lastCompleted: undefined };
      }
      return task;
    });
    
    if (note?.tabs && selectedTabId) {
      updateCurrentTabTasks(updatedTasks);
    } else {
      onNoteChange({ tasks: updatedTasks });
    }
  };

  // Tab management functions
  const getCurrentTasks = () => {
    if (!note) return [];
    
    // If using tabs, return tasks from selected tab
    if (note.tabs && note.tabs.length > 0) {
      const selectedTab = note.tabs.find(tab => tab.id === selectedTabId);
      return selectedTab?.tasks || [];
    }
    
    // Fallback to legacy tasks
    return note.tasks || [];
  };

  const createNewTab = () => {
    if (!note) return;
    
    const newTab = {
      id: Date.now().toString(),
      name: `Tab ${(note.tabs?.length || 0) + 1}`,
      tasks: []
    };
    
    const updatedTabs = [...(note.tabs || []), newTab];
    onNoteChange({ tabs: updatedTabs });
    setSelectedTabId(newTab.id);
  };

  const deleteTab = (tabId: string) => {
    if (!note?.tabs) return;
    
    const updatedTabs = note.tabs.filter(tab => tab.id !== tabId);
    
    // If deleting the selected tab, select the first available tab
    let newSelectedTabId = selectedTabId;
    if (tabId === selectedTabId) {
      newSelectedTabId = updatedTabs.length > 0 ? updatedTabs[0].id : null;
    }
    
    onNoteChange({ tabs: updatedTabs });
    setSelectedTabId(newSelectedTabId);
  };

  const updateTabName = (tabId: string, newName: string) => {
    if (!note?.tabs) return;
    
    const updatedTabs = note.tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    );
    
    onNoteChange({ tabs: updatedTabs });
  };

  const updateCurrentTabTasks = (updatedTasks: any[]) => {
    if (!note?.tabs || !selectedTabId) return;
    
    const updatedTabs = note.tabs.map(tab =>
      tab.id === selectedTabId ? { ...tab, tasks: updatedTasks } : tab
    );
    
    onNoteChange({ tabs: updatedTabs });
  };

  // Initialize selected tab when note changes
  React.useEffect(() => {
    if (note?.tabs && note.tabs.length > 0) {
      if (!selectedTabId || !note.tabs.find(tab => tab.id === selectedTabId)) {
        setSelectedTabId(note.tabs[0].id);
      }
    } else {
      setSelectedTabId(null);
    }
  }, [note?.id, note?.tabs]);

  // Reset daily tasks when component mounts or note changes
  React.useEffect(() => {
    if (note?.type === 'todo') {
      resetDailyTasks();
    }
  }, [note?.id]); // Only run when note ID changes, not on every task change

  const getPriorityWeight = (priority: 'low' | 'medium' | 'high' | undefined) => {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  };

  const sortTasksByPriority = (tasks: any[]) => {
    return [...tasks].sort((a, b) => {
      const aWeight = getPriorityWeight(a.priority);
      const bWeight = getPriorityWeight(b.priority);
      return bWeight - aWeight; // High priority first
    });
  };

  const sortAndFilterTasks = (tasks: any[]) => {
    if (!tasks) return [];

    // First, filter tasks
    let filteredTasks = tasks.filter(task => {
      // Filter by completion status
      if (filterCompleted === 'completed' && !task.completed) return false;
      if (filterCompleted === 'pending' && task.completed) return false;

      // Filter by priority
      if (filterPriority !== 'all') {
        if (filterPriority === 'none' && task.priority) return false;
        if (filterPriority !== 'none' && task.priority !== filterPriority) return false;
      }

      // Filter by task type
      if (filterType !== 'all' && task.taskType !== filterType) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const taskText = task.text.toLowerCase();
        const priority = task.priority?.toLowerCase() || '';
        const taskType = task.taskType?.toLowerCase() || '';
        
        if (!taskText.includes(query) && 
            !priority.includes(query) && 
            !taskType.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Then, sort tasks
    filteredTasks.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'priority':
          aValue = getPriorityWeight(a.priority);
          bValue = getPriorityWeight(b.priority);
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'creationDate':
          aValue = new Date(a.id).getTime(); // Using task ID as creation date
          bValue = new Date(b.id).getTime();
          break;
        case 'name':
          aValue = a.text.toLowerCase();
          bValue = b.text.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filteredTasks;
  };

  const getCompletedTaskCount = () => {
    const currentTasks = getCurrentTasks();
    return currentTasks.filter(task => task.completed).length;
  };

  const getTotalTaskCount = () => {
    const currentTasks = getCurrentTasks();
    return currentTasks.length;
  };

  const getFilteredTaskCount = () => {
    const currentTasks = getCurrentTasks();
    return sortAndFilterTasks(currentTasks).length;
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const updateTypingSpeed = (newContent: string, oldContent: string) => {
    const now = Date.now();
    const timeDiff = (now - typingMetrics.lastUpdate) / 1000;
    const charDiff = Math.abs(newContent.length - oldContent.length);

    if (charDiff > 0) {
      const instantWPM = (charDiff / 5) * (60 / timeDiff);

      setTypingMetrics(prev => {
        const newSamples = [...prev.samples, instantWPM].slice(-10);
        const avgWPM = newSamples.reduce((a, b) => a + b, 0) / newSamples.length;
        const roundedWPM = Math.round(avgWPM);
        const newMaxWpm = Math.max(prev.maxWpm, roundedWPM);

        return {
          wpm: roundedWPM,
          keystrokes: prev.keystrokes + charDiff,
          startTime: prev.startTime,
          lastUpdate: now,
          samples: newSamples,
          maxWpm: newMaxWpm,
          totalTime: prev.totalTime + timeDiff,
          sessionStart: prev.sessionStart,
        };
      });

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      setIsTyping(true);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 1500);
    }
  };

  const getSpeedColor = (wpm: number) => {
    if (wpm < 30) return theme.palette.info.main;
    if (wpm < 50) return theme.palette.success.main;
    if (wpm < 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSpeedLabel = (wpm: number) => {
    if (wpm < 30) return 'Relaxed';
    if (wpm < 50) return 'Steady';
    if (wpm < 70) return 'Swift';
    return 'Blazing';
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | undefined) => {
    switch (priority) {
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      case 'low':
        return 'success.main';
      default:
        return 'text.secondary';
    }
  };

  const formatDueDate = (dueDate: Date | undefined) => {
    if (!dueDate) return '';
    return dueDate.toLocaleDateString();
  };

  const isOverdue = (dueDate: Date | undefined) => {
    if (!dueDate) return false;
    return new Date() > dueDate;
  };

  const handleHandwritingTextConverted = (text: string) => {
    // Append the converted text to the current note content
    const currentContent = note?.content || '';
    const newContent = currentContent + (currentContent ? '\n\n' : '') + text;
    onNoteChange({ content: newContent });
    setIsHandwritingMode(false); // Switch back to text mode
  };

  const SpeedIndicator: React.FC<{ wpm: number, isTyping: boolean }> = ({ wpm, isTyping }) => {
    const isDark = theme.palette.mode === 'dark';

    const commonChipStyles = {
      height: 28,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'background.paper',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'divider',
      '& .MuiChip-label': {
        px: 1.5,
        fontSize: '0.8125rem',
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
      },
      '& .MuiChip-icon': {
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
        fontSize: '1rem',
        ml: 0.5,
      },
      transition: 'all 0.2s ease',
    };

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.75,
          height: 28,
          p: 0.25,
          borderRadius: 1,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'background.default',
        }}
      >
        <Chip
          icon={<Timer />}
          label={formatTime(Math.floor((Date.now() - typingMetrics.sessionStart) / 1000))}
          variant="outlined"
          size="small"
          sx={commonChipStyles}
        />
        <Chip
          icon={<EmojiEvents />}
          label={`${typingMetrics.maxWpm} WPM`}
          variant="outlined"
          size="small"
          sx={commonChipStyles}
        />
        
        <Chip
          icon={
            <Box sx={{ position: 'relative', display: 'inline-flex', ml: 0.5 }}>
              <CircularProgress
                variant="determinate"
                value={Math.min((wpm / 100) * 100, 100)}
                size={16}
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
                  opacity: isTyping ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SpeedIcon
                  sx={{
                    fontSize: 10,
                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
                    opacity: isTyping ? 1 : 0.8,
                    transition: 'all 0.2s ease',
                  }}
                />
              </Box>
            </Box>
          }
          label={`${wpm} WPM`}
          variant="outlined"
          size="small"
          sx={{
            ...commonChipStyles,
            transform: isTyping ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      </Box>
    );
  };

  if (!note) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6">Select or create a note to begin</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
        <TextField
          value={note.title}
          onChange={(e) => onNoteChange({ title: e.target.value })}
          variant="standard"
          placeholder="Note title"
          sx={{
            mb: 2,
            '& .MuiInput-root': {
              fontSize: '1.5rem',
              fontWeight: 500,
              fontFamily: fontFamily,
            },
            '& .MuiInput-root:before': {
              borderBottom: 'none',
            },
            '& .MuiInput-root:hover:not(.Mui-disabled):before': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        />
        <Box
          sx={{
            mb: 2,
            borderRadius: 1,
            backgroundColor: 'background.paper',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Toolbar
            content={note.content}
            setContent={(content) => onNoteChange({ content })}
            onFontChange={onFontChange}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={onSidebarToggle}
            noteTitle={note.title}
          />
        </Box>

        {/* Handwriting Mode Toggle */}
        {note.type !== 'todo' && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={isHandwritingMode ? 'handwriting' : 'text'}
              exclusive
              onChange={(event, newMode) => {
                if (newMode !== null) {
                  setIsHandwritingMode(newMode === 'handwriting');
                }
              }}
              aria-label="text alignment"
              size="small"
            >
              <ToggleButton value="text" aria-label="text mode">
                <EditIcon sx={{ mr: 1 }} />
                Text
              </ToggleButton>
              <ToggleButton value="handwriting" aria-label="handwriting mode">
                <DrawIcon sx={{ mr: 1 }} />
                Handwriting
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        
        {note.type === 'todo' ? (
          <Box
            sx={{
              flex: 1,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 200px)', // Ensure container doesn't exceed viewport
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddTask}
                variant="outlined"
                size="small"
              >
                Add Task
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={createNewTab}
                  variant="text"
                  size="small"
                  color="primary"
                >
                  New Tab
                </Button>
                <Button
                  startIcon={<Timer />}
                  onClick={resetDailyTasks}
                  variant="text"
                  size="small"
                  color="info"
                >
                  Reset Daily Tasks
                </Button>
                <Button
                  startIcon={<Timer />}
                  onClick={forceResetAllDaily}
                  variant="text"
                  size="small"
                  color="warning"
                >
                  Force Reset All Daily
                </Button>
              </Box>
            </Box>
            
            {/* Tab Navigation */}
            {note?.tabs && note.tabs.length > 0 && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', overflow: 'auto' }}>
                  {note.tabs.map((tab) => (
                    <Box
                      key={tab.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderBottom: 2,
                        borderColor: selectedTabId === tab.id ? 'primary.main' : 'transparent',
                        backgroundColor: selectedTabId === tab.id ? 'action.selected' : 'transparent',
                        cursor: 'pointer',
                        minWidth: 'fit-content',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => setSelectedTabId(tab.id)}
                    >
                      <TextField
                        value={tab.name}
                        onChange={(e) => updateTabName(tab.id, e.target.value)}
                        variant="standard"
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          '& .MuiInput-root': {
                            fontSize: '0.875rem',
                            fontWeight: selectedTabId === tab.id ? 600 : 400,
                            color: selectedTabId === tab.id ? 'primary.main' : 'text.primary',
                          },
                          '& .MuiInput-root:before': {
                            borderBottom: 'none',
                          },
                          '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                            borderBottom: 'none',
                          },
                          '& .MuiInput-root:after': {
                            borderBottom: 'none',
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTab(tab.id);
                        }}
                        sx={{ 
                          opacity: 0.5, 
                          '&:hover': { opacity: 1 },
                          p: 0.5,
                          ml: 0.5
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                  size="small"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ 
                    minWidth: 150,
                    '& .MuiInputBase-input': {
                      py: 0.5,
                      fontSize: '0.75rem',
                      minHeight: 'auto'
                    }
                  }}
                />
                
                {/* Sort Controls */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    size="small"
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 0.5,
                        fontSize: '0.75rem',
                        minHeight: 'auto'
                      }
                    }}
                  >
                    <MenuItem value="priority">Priority</MenuItem>
                    <MenuItem value="dueDate">Due Date</MenuItem>
                    <MenuItem value="creationDate">Creation Date</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    size="small"
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 0.5,
                        fontSize: '0.75rem',
                        minHeight: 'auto'
                      }
                    }}
                  >
                    <MenuItem value="desc">Desc</MenuItem>
                    <MenuItem value="asc">Asc</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Filter Controls */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={filterCompleted}
                    onChange={(e) => setFilterCompleted(e.target.value as any)}
                    size="small"
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 0.5,
                        fontSize: '0.75rem',
                        minHeight: 'auto'
                      }
                    }}
                  >
                    <MenuItem value="all">All Tasks</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    size="small"
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 0.5,
                        fontSize: '0.75rem',
                        minHeight: 'auto'
                      }
                    }}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="none">No Priority</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    size="small"
                    sx={{ 
                      '& .MuiSelect-select': { 
                        py: 0.5,
                        fontSize: '0.75rem',
                        minHeight: 'auto'
                      }
                    }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="one-time">One-time</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Clear Filters Button */}
                {(filterCompleted !== 'all' || filterPriority !== 'all' || filterType !== 'all' || searchQuery) && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      setFilterCompleted('all');
                      setFilterPriority('all');
                      setFilterType('all');
                      setSearchQuery('');
                    }}
                    color="secondary"
                    sx={{ 
                      py: 0.5,
                      fontSize: '0.75rem',
                      minHeight: 'auto'
                    }}
                  >
                    Clear
                  </Button>
                )}
                
                {/* Task Count */}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center', fontSize: '0.75rem' }}>
                  {getFilteredTaskCount()}/{getTotalTaskCount()}
                </Typography>
              </Box>
            </Box>
                          <List sx={{ 
                flex: 1, 
                overflow: 'auto',
                maxHeight: 'calc(100vh - 300px)', // Ensure there's always room for scrolling
                minHeight: 200, // Minimum height for the list
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  },
                },
              }}>
                {sortAndFilterTasks(getCurrentTasks()).map((task) => {
                // Ensure task has all required fields
                const safeTask = {
                  id: task.id || Date.now().toString(),
                  text: task.text || 'Untitled task',
                  completed: task.completed || false,
                  priority: task.priority || undefined,
                  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                  taskType: task.taskType || 'one-time',
                  lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
                };
                
                return (
                <ListItem
                  key={task.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <ListItemIcon>
                      <Checkbox
                        checked={safeTask.completed}
                        onChange={() => handleTaskToggle(safeTask.id)}
                        sx={{
                          '&.Mui-checked': {
                            color: 'primary.main',
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <TextField
                          value={safeTask.text}
                          onChange={(e) => handleTaskTextChange(safeTask.id, e.target.value)}
                          variant="standard"
                          fullWidth
                          sx={{
                            '& .MuiInput-root': {
                              textDecoration: safeTask.completed ? 'line-through' : 'none',
                              color: safeTask.completed ? 'text.secondary' : 'text.primary',
                              fontSize: fontSize,
                              fontFamily: fontFamily,
                            },
                            '& .MuiInput-root:before': {
                              borderBottom: 'none',
                            },
                            '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                            },
                          }}
                        />
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={safeTask.priority || ''}
                          onChange={(e) => handleTaskPriorityChange(safeTask.id, e.target.value as 'low' | 'medium' | 'high')}
                          size="small"
                          displayEmpty
                          sx={{ 
                            '& .MuiSelect-select': { 
                              py: 0.5,
                              fontSize: '0.75rem',
                              minHeight: 'auto'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <FlagIcon sx={{ fontSize: '0.875rem', mr: 0.5, opacity: 0.5 }} />
                            Priority
                          </MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={safeTask.taskType}
                          onChange={(e) => handleTaskTypeChange(safeTask.id, e.target.value as 'one-time' | 'daily')}
                          size="small"
                          sx={{ 
                            '& .MuiSelect-select': { 
                              py: 0.5,
                              fontSize: '0.75rem',
                              minHeight: 'auto'
                            }
                          }}
                        >
                          <MenuItem value="one-time">One-time</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        type="date"
                        size="small"
                        value={safeTask.dueDate ? safeTask.dueDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          handleTaskDueDateChange(safeTask.id, date);
                        }}
                        sx={{ 
                          minWidth: 120,
                          '& .MuiInputBase-input': {
                            py: 0.5,
                            fontSize: '0.75rem',
                            minHeight: 'auto'
                          }
                        }}
                        placeholder="Due date"
                      />
                      <IconButton
                        onClick={() => handleDeleteTask(safeTask.id)}
                        size="small"
                        sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {(safeTask.priority || safeTask.dueDate) && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: 7 }}>
                      {safeTask.priority && (
                        <Chip
                          icon={<FlagIcon />}
                          label={safeTask.priority.charAt(0).toUpperCase() + safeTask.priority.slice(1)}
                          size="small"
                          color={safeTask.priority === 'high' ? 'error' : safeTask.priority === 'medium' ? 'warning' : 'success'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {safeTask.dueDate && (
                        <Chip
                          icon={<ScheduleIcon />}
                          label={formatDueDate(safeTask.dueDate)}
                          size="small"
                          color={isOverdue(safeTask.dueDate) ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {safeTask.taskType === 'daily' && (
                        <Chip
                          icon={<Timer />}
                          label="Daily"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {safeTask.lastCompleted && (
                        <Chip
                          icon={<EmojiEvents />}
                          label={`Last: ${formatDueDate(safeTask.lastCompleted)}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}
                </ListItem>
                                  );
                })}
                {sortAndFilterTasks(getCurrentTasks()).length === 0 && (
                  <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">
                      {getTotalTaskCount() > 0 ? 'No tasks match the current filters.' : 'No tasks yet. Add your first task!'}
                    </Typography>
                  </Box>
                )}
              </List>
          </Box>
        ) : (
          <>
            {isHandwritingMode ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  p: 2,
                  overflow: 'auto',
                }}
              >
                <HandwritingCanvas
                  onTextConverted={handleHandwritingTextConverted}
                  width={Math.min(800, window.innerWidth - 100)}
                  height={Math.min(600, window.innerHeight - 300)}
                  strokeColor={theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}
                  backgroundColor={theme.palette.background.paper}
                />
              </Box>
            ) : (
              <Box
                component="textarea"
                value={note.content}
                onChange={(e) => {
                  const newContent = e.target.value;
                  onNoteChange({ content: newContent });
                  updateTypingSpeed(newContent, note.content);
                }}
                sx={{
                  flex: 1,
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  p: 2,
                  fontSize: fontSize,
                  lineHeight: 1.6,
                  letterSpacing: '-0.01em',
                  fontFamily: fontFamily,
                  backgroundColor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:focus': {
                    outline: 'none',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 0 0 2px rgba(144, 202, 249, 0.2)' 
                      : '0 4px 16px rgba(0,0,0,0.12)',
                  },
                }}
              />
            )}
          </>
        )}
        
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            {note.type === 'todo' ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Tasks: {getCompletedTaskCount()}/{getTotalTaskCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress: {getTotalTaskCount() > 0 ? Math.round((getCompletedTaskCount() / getTotalTaskCount()) * 100) : 0}%
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Words: {getWordCount(note.content)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Characters: {getCharacterCount(note.content)}
                </Typography>
              </>
            )}
          </Box>
          {note.type !== 'todo' && !isHandwritingMode && <SpeedIndicator wpm={typingMetrics.wpm} isTyping={isTyping} />}
        </Box>
      </Box>
    </Box>
  );
};

export default Editor; 