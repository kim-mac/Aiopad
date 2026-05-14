import React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material';
import { chatWithNotes } from '../services/nvidia';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  notes: Note[];
  onClose: () => void;
  /** When opened from voice with a question, sent once per `autoSubmitKey` bump */
  seedQuestion?: string;
  autoSubmitKey?: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ notes, onClose, seedQuestion, autoSubmitKey = 0 }) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      text: `Hi! I've loaded **${notes.length} note${notes.length !== 1 ? 's' : ''}** into my context. Ask me anything about them — I can summarize, compare, find connections, or answer questions.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const isSendingRef = React.useRef(false);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    return notes
      .slice(0, 20)
      .map((n) => `### ${n.title}\n${n.content.slice(0, 1500)}`)
      .join('\n\n---\n\n');
  };

  const submitQuestion = React.useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || isSendingRef.current) return;
      isSendingRef.current = true;

      const userMsg: Message = { role: 'user', text: q, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const context = buildContext();
        const answer = await chatWithNotes(q, context);
        const botMsg: Message = { role: 'assistant', text: answer, timestamp: new Date() };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        isSendingRef.current = false;
        setIsLoading(false);
      }
    },
    [notes]
  );

  const lastAutoKey = React.useRef(0);
  React.useEffect(() => {
    if (!seedQuestion?.trim() || !autoSubmitKey) return;
    if (lastAutoKey.current === autoSubmitKey) return;
    lastAutoKey.current = autoSubmitKey;
    void submitQuestion(seedQuestion);
  }, [seedQuestion, autoSubmitKey, submitQuestion]);

  const handleSend = async () => {
    await submitQuestion(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 4px;border-radius:3px;font-size:0.85em">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 380,
        height: 520,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <BotIcon fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          Chat with Notes
        </Typography>
        <Tooltip title="Clear chat">
          <IconButton
            size="small"
            onClick={() => setMessages([{ role: 'assistant', text: `Chat cleared. I still have ${notes.length} notes loaded.`, timestamp: new Date() }])}
            sx={{ color: 'inherit', opacity: 0.8 }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} sx={{ color: 'inherit', opacity: 0.8 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 1,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                backgroundColor: msg.role === 'user' ? 'secondary.main' : 'primary.main',
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 16 }} /> : <BotIcon sx={{ fontSize: 16 }} />}
            </Avatar>
            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                maxWidth: '78%',
                borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                backgroundColor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                border: msg.role === 'user' ? 'none' : undefined,
              }}
            >
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
            </Paper>
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Avatar sx={{ width: 28, height: 28, backgroundColor: 'primary.main' }}>
              <BotIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: '4px 12px 12px 12px' }}>
              <CircularProgress size={14} />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          size="small"
          placeholder="Ask about your notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          sx={{ flexShrink: 0 }}
        >
          {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
