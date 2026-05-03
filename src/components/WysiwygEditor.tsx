import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Box, useTheme } from '@mui/material';

interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  fontSize?: number;
  fontFamily?: string;
  placeholder?: string;
  autoFocus?: boolean;
  children?: React.ReactNode;
}

type MarkdownStorage = {
  markdown: {
    getMarkdown: () => string;
  };
};

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  content,
  onChange,
  children,
  fontSize = 15,
  fontFamily = 'inherit',
  placeholder = 'Start writing...',
  autoFocus = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: '',
    autofocus: autoFocus ? 'end' : false,
    onUpdate({ editor }) {
      const md = (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
      onChange(md);
    },
  });

  const getMarkdown = React.useCallback(() => {
    return (editor?.storage as unknown as MarkdownStorage | undefined)?.markdown?.getMarkdown() ?? '';
  }, [editor]);

  const prevContentRef = React.useRef<string>('');

  React.useEffect(() => {
    if (!editor) return;
    if (content === prevContentRef.current) return;
    prevContentRef.current = content;
    const currentMd = getMarkdown();
    if (currentMd === content) return;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, { emitUpdate: false });
    try {
      editor.commands.setTextSelection({ from, to });
    } catch {}
  }, [content, editor]);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        p: 2,
        fontSize: fontSize,
        lineHeight: 1.6,
        fontFamily: fontFamily,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderRadius: 2,
        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.1)',
        cursor: 'text',

        '& .tiptap': {
          outline: 'none',
          minHeight: '100%',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          lineHeight: 'inherit',
          color: 'inherit',
        },

        '& .tiptap p.is-editor-empty:first-of-type::before': {
          content: `"${placeholder}"`,
          color: theme.palette.text.disabled,
          fontStyle: 'italic',
          pointerEvents: 'none',
          float: 'left',
          height: 0,
        },

        '& h1,& h2,& h3,& h4,& h5,& h6': {
          color: 'text.primary',
          mt: 2,
          mb: 1,
          fontWeight: 600,
          lineHeight: 1.3,
        },
        '& h1': { fontSize: '1.8em' },
        '& h2': { fontSize: '1.4em' },
        '& h3': { fontSize: '1.2em' },
        '& h4,& h5,& h6': { fontSize: '1em' },
        '& p': { mt: 0, mb: 1 },
        '& strong': { fontWeight: 700 },
        '& em': { fontStyle: 'italic' },
        '& ul,& ol': { pl: 3, mb: 1 },
        '& li': { mb: 0.25 },
        '& code': {
          fontFamily: 'monospace',
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          px: '4px',
          py: '1px',
          borderRadius: '3px',
          fontSize: '0.9em',
        },
        '& pre': {
          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          p: 1.5,
          borderRadius: 1,
          overflow: 'auto',
          mb: 1,
          '& code': { bgcolor: 'transparent', p: 0 },
        },
        '& blockquote': {
          borderLeft: `3px solid ${theme.palette.primary.main}`,
          pl: 2,
          ml: 0,
          color: 'text.secondary',
          fontStyle: 'italic',
        },
        '& hr': {
          border: 'none',
          borderTop: `1px solid ${theme.palette.divider}`,
          my: 2,
        },
        '& a': { color: 'primary.main', textDecoration: 'underline' },
        '& table': { borderCollapse: 'collapse', width: '100%', mb: 1 },
        '& th,& td': {
          border: `1px solid ${theme.palette.divider}`,
          p: '6px',
          textAlign: 'left',
        },
        '& th': {
          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          fontWeight: 600,
        },
      }}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
      {children}
    </Box>
  );
};

export default WysiwygEditor;
