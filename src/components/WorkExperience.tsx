import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import WorkIcon from '@mui/icons-material/Work';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const ExperienceCard = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '40px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '6px 6px 0px #000000',
  marginBottom: '30px',
  '&:hover': {
    transform: 'translate(-4px, -4px)',
    boxShadow: '10px 10px 0px #000000',
  },
});

const experience = [
  {
    title: 'Software Engineer',
    company: '[Company Name]',
    period: '2023 - Present',
    location: '[City, Country]',
    description: [
      'Developed and maintained full-stack web applications using React, Node.js, and TypeScript',
      'Collaborated with cross-functional teams to deliver high-quality software solutions',
      'Implemented RESTful APIs and integrated third-party services',
      'Optimized application performance and improved user experience',
    ],
  },
  {
    title: 'Junior Developer',
    company: '[Company Name]',
    period: '2022 - 2023',
    location: '[City, Country]',
    description: [
      'Built responsive web interfaces using modern JavaScript frameworks',
      'Participated in code reviews and followed best practices',
      'Fixed bugs and implemented new features based on requirements',
      'Worked with databases and API integrations',
    ],
  },
  {
    title: 'Software Development Intern',
    company: '[Company Name]',
    period: '2021 - 2022',
    location: '[City, Country]',
    description: [
      'Assisted in developing web applications and learning industry standards',
      'Contributed to team projects and gained hands-on experience',
      'Learned version control and collaborative development workflows',
    ],
  },
];

const WorkExperience: React.FC = () => {
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
          Work Experience
        </Typography>
        <Box>
          {experience.map((exp, index) => (
            <ExperienceCard key={index}>
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
                  <WorkIcon sx={{ fontSize: 40, color: '#000000' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#000000',
                      fontWeight: 700,
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {exp.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#333333',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {exp.company}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {exp.period}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {exp.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: '104px' } }}>
                <Box component="ul" sx={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {exp.description.map((item, itemIndex) => (
                    <Box
                      component="li"
                      key={itemIndex}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        mb: 2,
                        '&:last-child': {
                          mb: 0,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          background: '#000000',
                          flexShrink: 0,
                          mt: 1,
                        }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#333333',
                          lineHeight: 1.8,
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </ExperienceCard>
          ))}
        </Box>
      </Container>
    </StyledBox>
  );
};

export default WorkExperience;

