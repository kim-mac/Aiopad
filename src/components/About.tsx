import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const StyledPaper = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '50px',
  transition: 'all 0.3s ease',
  boxShadow: '8px 8px 0px #000000',
  '&:hover': {
    transform: 'translate(-4px, -4px)',
    boxShadow: '12px 12px 0px #000000',
  },
});

const About: React.FC = () => {
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
            mb: 8,
            color: '#000000',
            letterSpacing: '-2px',
            textTransform: 'uppercase',
          }}
        >
          About Me
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <StyledPaper sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                color: '#000000',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: '3px solid #000000',
                display: 'inline-block',
                pb: 1,
              }}
            >
              Who I Am
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#333333',
                lineHeight: 2,
                fontSize: '1.1rem',
                mb: 3,
              }}
            >
              I'm a passionate Software Engineer with a strong foundation in Information Technology
              and a deep interest in bridging the gap between technology and business strategy.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#333333',
                lineHeight: 2,
                fontSize: '1.1rem',
              }}
            >
              Currently pursuing my Master's in Management Information Systems, I'm combining my
              technical expertise with business acumen to create solutions that drive real-world
              impact. I love building innovative applications and exploring new technologies.
            </Typography>
          </StyledPaper>
          <StyledPaper sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                color: '#000000',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: '3px solid #000000',
                display: 'inline-block',
                pb: 1,
              }}
            >
              What I Do
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                'Full-stack web development',
                'System design and architecture',
                'Business-technology integration',
                'Problem-solving and innovation',
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      background: '#000000',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#333333',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                    }}
                  >
                    {item.toUpperCase()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </StyledPaper>
        </Box>
      </Container>
    </StyledBox>
  );
};

export default About;
