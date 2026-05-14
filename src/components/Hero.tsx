import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledBox = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ffffff',
  padding: '40px 20px',
});

const AnimatedBox = styled(Box)({
  animation: `${fadeIn} 0.8s ease-out`,
});

const Hero: React.FC = () => {
  const [text, setText] = useState('');
  const fullText = 'Software Engineer';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <StyledBox>
      <Container maxWidth="lg">
        <AnimatedBox
          sx={{
            textAlign: 'center',
            color: '#000000',
            py: 8,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              fontWeight: 900,
              mb: 2,
              color: '#000000',
              letterSpacing: '-2px',
            }}
          >
            Hi, I'm{' '}
            <Box
              component="span"
              sx={{
                borderBottom: '4px solid #000000',
                display: 'inline-block',
                pb: 1,
              }}
            >
              [Your Name]
            </Box>
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 600,
              mb: 4,
              minHeight: '60px',
              color: '#000000',
              letterSpacing: '2px',
            }}
          >
            {text}
            <Box
              component="span"
              sx={{
                opacity: showCursor ? 1 : 0,
                transition: 'opacity 0.3s',
                color: '#000000',
              }}
            >
              |
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              mb: 6,
              color: '#333333',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.8,
              fontWeight: 400,
            }}
          >
            Building innovative solutions with code. Currently pursuing Master's in Management
            Information Systems.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                background: '#000000',
                color: '#ffffff',
                px: 5,
                py: 2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                borderRadius: 0,
                border: '2px solid #000000',
                '&:hover': {
                  background: '#ffffff',
                  color: '#000000',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              View My Work
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#000000',
                borderWidth: '2px',
                color: '#000000',
                px: 5,
                py: 2,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                borderRadius: 0,
                '&:hover': {
                  borderColor: '#000000',
                  background: '#000000',
                  color: '#ffffff',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Learn More
            </Button>
          </Box>
        </AnimatedBox>
      </Container>
    </StyledBox>
  );
};

export default Hero;
