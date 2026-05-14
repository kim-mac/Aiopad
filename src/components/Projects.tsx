import React from 'react';
import { Box, Container, Typography, Paper, Button, Chip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub';
import LaunchIcon from '@mui/icons-material/Launch';

const StyledBox = styled(Box)({
  minHeight: '100vh',
  padding: '80px 40px',
  background: '#ffffff',
});

const ProjectItem = styled(Paper)({
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: 0,
  padding: '30px 40px',
  transition: 'all 0.3s ease',
  marginBottom: '20px',
  boxShadow: '4px 4px 0px #000000',
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '6px 6px 0px #000000',
  },
});

const projects = [
  {
    title: 'E-Commerce Platform',
    description: 'A full-stack e-commerce solution with React, Node.js, and MongoDB. Features include user authentication, payment integration, and admin dashboard.',
    technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
    github: '#',
    demo: '#',
  },
  {
    title: 'Task Management App',
    description: 'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
    technologies: ['React', 'TypeScript', 'Firebase', 'Material-UI'],
    github: '#',
    demo: '#',
  },
  {
    title: 'Data Analytics Dashboard',
    description: 'An interactive dashboard for visualizing business metrics and KPIs with real-time data updates and customizable charts.',
    technologies: ['React', 'Python', 'D3.js', 'FastAPI'],
    github: '#',
    demo: '#',
  },
  {
    title: 'AI-Powered Chat Application',
    description: 'A modern chat application with AI integration, message encryption, and multi-platform support.',
    technologies: ['React', 'TypeScript', 'OpenAI API', 'WebSocket'],
    github: '#',
    demo: '#',
  },
];

const Projects: React.FC = () => {
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
          Featured Projects
        </Typography>
        <Box>
          {projects.map((project, index) => (
            <React.Fragment key={index}>
              <ProjectItem>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#000000',
                        fontWeight: 700,
                        mb: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {project.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#333333',
                        mb: 3,
                        lineHeight: 1.8,
                      }}
                    >
                      {project.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {project.technologies.map((tech, techIndex) => (
                        <Chip
                          key={techIndex}
                          label={tech}
                          size="small"
                          sx={{
                            background: '#000000',
                            color: '#ffffff',
                            border: '2px solid #000000',
                            fontWeight: 600,
                            borderRadius: 0,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <Button
                      startIcon={<GitHubIcon />}
                      variant="outlined"
                      href={project.github}
                      target="_blank"
                      sx={{
                        borderColor: '#000000',
                        borderWidth: '2px',
                        color: '#000000',
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        '&:hover': {
                          borderColor: '#000000',
                          background: '#000000',
                          color: '#ffffff',
                        },
                      }}
                    >
                      Code
                    </Button>
                    <Button
                      startIcon={<LaunchIcon />}
                      variant="contained"
                      href={project.demo}
                      target="_blank"
                      sx={{
                        background: '#000000',
                        color: '#ffffff',
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        border: '2px solid #000000',
                        '&:hover': {
                          background: '#ffffff',
                          color: '#000000',
                        },
                      }}
                    >
                      Demo
                    </Button>
                  </Box>
                </Box>
              </ProjectItem>
              {index < projects.length - 1 && (
                <Box sx={{ mb: 2 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Container>
    </StyledBox>
  );
};

export default Projects;
