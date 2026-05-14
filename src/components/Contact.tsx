import React from 'react';
import { Box, Container, Typography, IconButton, Paper, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const ContactCard = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '60px',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  boxShadow: '8px 8px 0px #000000',
  maxWidth: '700px',
  mx: 'auto',
  '&:hover': {
    transform: 'translate(-4px, -4px)',
    boxShadow: '12px 12px 0px #000000',
  },
});

const SocialButton = styled(IconButton)({
  width: 70,
  height: 70,
  border: '3px solid #000000',
  color: '#000000',
  transition: 'all 0.3s ease',
  background: '#ffffff',
  '&:hover': {
    background: '#000000',
    color: '#ffffff',
    transform: 'translateY(-5px) scale(1.1)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
  },
});

const socialLinks = [
  { icon: <EmailIcon />, label: 'Email', href: 'mailto:your.email@example.com' },
  { icon: <LinkedInIcon />, label: 'LinkedIn', href: 'https://linkedin.com/in/yourprofile' },
  { icon: <GitHubIcon />, label: 'GitHub', href: 'https://github.com/yourusername' },
  { icon: <TwitterIcon />, label: 'Twitter', href: 'https://twitter.com/yourusername' },
];

const Contact: React.FC = () => {
  return (
    <StyledBox>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            textAlign: 'center',
            mb: 4,
            color: '#000000',
            letterSpacing: '-2px',
            textTransform: 'uppercase',
          }}
        >
          Get In Touch
        </Typography>
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            color: '#333333',
            mb: 8,
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.8,
          }}
        >
          I'm always open to discussing new projects, creative ideas, or opportunities to be part
          of your vision. Let's connect!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <ContactCard>
            <Typography
              variant="h4"
              sx={{
                color: '#000000',
                fontWeight: 700,
                mb: 4,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: '3px solid #000000',
                display: 'inline-block',
                pb: 2,
              }}
            >
              Let's Work Together
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#333333',
                mb: 6,
                lineHeight: 1.8,
                fontSize: '1.1rem',
              }}
            >
              Whether you have a project in mind or just want to chat about technology, feel free to
              reach out. I'm always excited to hear about new opportunities and collaborations.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  sx={{ display: 'inline-flex', textDecoration: 'none' }}
                >
                  <SocialButton>{social.icon}</SocialButton>
                </Link>
              ))}
            </Box>
          </ContactCard>
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            pt: 4,
            borderTop: '2px solid #000000',
            maxWidth: '700px',
            mx: 'auto',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#333333',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            © {new Date().getFullYear()} [Your Name]. Built with React, TypeScript, and Material-UI.
          </Typography>
        </Box>
      </Container>
    </StyledBox>
  );
};

export default Contact;
