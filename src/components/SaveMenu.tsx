import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  TextSnippet as TxtIcon,
} from '@mui/icons-material';
import { exportAsPDF, exportAsWord, exportAsTXT } from '../utils/fileExport';

interface SaveMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
}

const SaveMenu: React.FC<SaveMenuProps> = ({
  anchorEl,
  open,
  onClose,
  noteTitle,
  noteContent,
}) => {
  const handleExport = async (format: 'pdf' | 'word' | 'txt') => {
    try {
      switch (format) {
        case 'pdf':
          exportAsPDF(noteTitle, noteContent);
          break;
        case 'word':
          await exportAsWord(noteTitle, noteContent);
          break;
        case 'txt':
          exportAsTXT(noteTitle, noteContent);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Error exporting file:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => handleExport('pdf')}>
        <ListItemIcon>
          <PdfIcon />
        </ListItemIcon>
        <ListItemText primary="Save as PDF" />
      </MenuItem>
      <MenuItem onClick={() => handleExport('word')}>
        <ListItemIcon>
          <WordIcon />
        </ListItemIcon>
        <ListItemText primary="Save as Word" />
      </MenuItem>
      <MenuItem onClick={() => handleExport('txt')}>
        <ListItemIcon>
          <TxtIcon />
        </ListItemIcon>
        <ListItemText primary="Save as Text" />
      </MenuItem>
    </Menu>
  );
};

export default SaveMenu; 