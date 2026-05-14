import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const SkillCard = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '30px',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  boxShadow: '4px 4px 0px #000000',
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '6px 6px 0px #000000',
  },
});

const skills = [
  { name: 'React', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'Node.js', level: 80 },
  { name: 'Python', level: 85 },
  { name: 'JavaScript', level: 90 },
  { name: 'SQL', level: 80 },
  { name: 'MongoDB', level: 75 },
  { name: 'Git', level: 85 },
  { name: 'Docker', level: 70 },
  { name: 'AWS', level: 75 },
  { name: 'Material-UI', level: 85 },
  { name: 'Vite', level: 80 },
];

const Skills: React.FC = () => {
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
          Skills & Technologies
        </Typography>
        <Grid container spacing={3}>
          {skills.map((skill, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <SkillCard>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#000000',
                    fontWeight: 700,
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {skill.name}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 12,
                    background: '#f0f0f0',
                    borderRadius: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '2px solid #000000',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: `${skill.level}%`,
                      height: '100%',
                      background: '#000000',
                      transition: 'width 1s ease',
                      animation: 'slideIn 1s ease',
                      '@keyframes slideIn': {
                        from: { width: 0 },
                        to: { width: `${skill.level}%` },
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#333333',
                    mt: 1,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {skill.level}%
                </Typography>
              </SkillCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </StyledBox>
  );
};

export default Skills;
