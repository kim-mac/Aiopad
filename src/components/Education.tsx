import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const EducationCard = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '50px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '6px 6px 0px #000000',
  '&:hover': {
    transform: 'translate(-4px, -4px)',
    boxShadow: '10px 10px 0px #000000',
  },
});

const education = [
  {
    degree: "Master's in Management Information Systems",
    institution: '[Your University Name]',
    period: '2024 - Present',
    status: 'In Progress',
    description: 'Combining technical expertise with business strategy to bridge the gap between technology and organizational goals.',
    icon: <SchoolIcon sx={{ fontSize: 40, color: '#000000' }} />,
  },
  {
    degree: "Bachelor's in Information Technology",
    institution: '[Your University Name]',
    period: '2020 - 2024',
    status: 'Completed',
    description: 'Comprehensive foundation in software development, system design, database management, and network technologies.',
    icon: <CheckCircleIcon sx={{ fontSize: 40, color: '#000000' }} />,
  },
];

const Education: React.FC = () => {
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
          Education
        </Typography>
        <Grid container spacing={4}>
          {education.map((edu, index) => (
            <Grid item xs={12} md={6} key={index}>
              <EducationCard>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      border: '3px solid #000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#ffffff',
                    }}
                  >
                    {edu.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#000000',
                        fontWeight: 700,
                        mb: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {edu.degree}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#333333',
                        fontWeight: 500,
                        mb: 2,
                      }}
                    >
                      {edu.institution}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        border: '2px solid #000000',
                        background: edu.status === 'Completed' ? '#000000' : '#ffffff',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: edu.status === 'Completed' ? '#ffffff' : '#000000',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}
                      >
                        {edu.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666666',
                    mb: 3,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {edu.period}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#333333',
                    lineHeight: 1.8,
                  }}
                >
                  {edu.description}
                </Typography>
              </EducationCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </StyledBox>
  );
};

export default Education;
