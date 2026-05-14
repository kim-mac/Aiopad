import React from 'react';
import { Box, List, ListItem, ListItemButton, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledNavbar = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  top: 0,
  width: '250px',
  height: '100vh',
  background: '#000000',
  borderRight: '2px solid #000000',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('md')]: {
    width: '200px',
  },
  [theme.breakpoints.down('sm')]: {
    width: '180px',
  },
}));

const StyledListItemButton = styled(ListItemButton)<{ active?: boolean }>(({ active }) => ({
  color: active ? '#000000' : '#ffffff',
  background: active ? '#ffffff' : 'transparent',
  padding: '16px 24px',
  margin: '4px 16px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  border: active ? '2px solid #000000' : '2px solid transparent',
  '&:hover': {
    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transform: 'translateX(5px)',
  },
}));

const NavTitle = styled(Typography)({
  color: '#ffffff',
  fontSize: '1.5rem',
  fontWeight: 700,
  padding: '32px 24px',
  borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '16px',
  letterSpacing: '2px',
});

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { label: 'Home', id: 'hero' },
    { label: 'About', id: 'about' },
    { label: 'Skills', id: 'skills' },
    { label: 'Experience', id: 'experience' },
    { label: 'Projects', id: 'projects' },
    { label: 'Education', id: 'education' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <StyledNavbar>
      <NavTitle>PORTFOLIO</NavTitle>
      <List sx={{ flex: 1, padding: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <StyledListItemButton
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            >
              <Typography
                sx={{
                  fontWeight: activeSection === item.id ? 700 : 500,
                  fontSize: '1rem',
                  letterSpacing: '1px',
                }}
              >
                {item.label.toUpperCase()}
              </Typography>
            </StyledListItemButton>
          </ListItem>
        ))}
      </List>
      <Box
        sx={{
          padding: '24px',
          borderTop: '2px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
            textAlign: 'center',
            letterSpacing: '1px',
          }}
        >
          © {new Date().getFullYear()}
        </Typography>
      </Box>
    </StyledNavbar>
  );
};

export default Navbar;
