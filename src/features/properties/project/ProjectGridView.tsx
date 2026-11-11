'use client'

import DomainIcon from '@mui/icons-material/Domain'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Box, Card, CardActionArea, CardContent, Chip, Grid, Stack, Typography, useTheme } from '@mui/material'

import type { ProjectModel } from '../types'
import { displayProjectAddress, projectStatusColor, projectStatusLabel } from './projectListHelpers'
import type { ProjectDictionary } from './projectListHelpers'

type Props = {
  dictionary: ProjectDictionary
  projects: ProjectModel[]
  onOpenProject: (project: ProjectModel) => void
  onHoverStart: (event: React.MouseEvent<HTMLElement>, project: ProjectModel) => void
  onHoverEnd: () => void
}

// Card grid of the project list. A single click on a card opens the project detail
// (CardActionArea is a ButtonBase, so Enter/Space trigger the same click from the keyboard).
const ProjectGridView = ({ dictionary, projects, onOpenProject, onHoverStart, onHoverEnd }: Props) => {
  const theme = useTheme()

  return (
    <Grid container spacing={3}>
      {projects.map(project => {
        const project_image_url = project.logo_url?.trim() || project.image_url?.trim()
        const project_address = displayProjectAddress(dictionary, project.address)

        return (
          <Grid key={project.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
            <Card
              onMouseEnter={event => onHoverStart(event, project)}
              onMouseLeave={onHoverEnd}
              sx={{
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
                boxShadow: 'none',
                transition: theme.transitions.create(['transform', 'box-shadow', 'border-color'], { duration: 180 }),
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 6,
                  borderColor: 'primary.light'
                }
              }}
            >
              <CardActionArea
                component="div"
                onClick={() => onOpenProject(project)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    height: 168,
                    p: 1.5,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'common.white'
                  }}
                >
                  {project_image_url ? (
                    <Box
                      component="img"
                      src={project_image_url}
                      alt={project.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 2
                      }}
                    >
                      <DomainIcon sx={{ fontSize: 38 }} />
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      background: 'linear-gradient(180deg, rgba(34, 80, 135, 0.08), rgba(34, 80, 135, 0.2))'
                    }}
                  />
                </Box>
                <CardContent sx={{ width: '100%', flex: 1 }}>
                  <Stack spacing={1.4} sx={{ height: '100%' }}>
                    <Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 800 }}>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.project_code}
                        </Typography>
                      </Box>
                      <Stack direction="row" gap={0.75} alignItems="center" sx={{ mt: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {project_address}
                        </Typography>
                      </Stack>
                      {project.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {project.description}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      <Chip size="small" color={projectStatusColor(project.status)} label={projectStatusLabel(dictionary, project.status)} />
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProjectGridView
