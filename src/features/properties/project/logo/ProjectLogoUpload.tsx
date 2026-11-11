'use client'

import DomainIcon from '@mui/icons-material/Domain'
import { Box, Button, Stack, Typography } from '@mui/material'

import type { ProjectDictionary } from '../projectListHelpers'
import { PROJECT_LOGO_ACCEPT } from './projectLogoRules'
import { projectLogoText } from './useProjectLogoFile'

type Props = {
  dictionary: ProjectDictionary
  /** Preview of the newly selected file, otherwise the current logo (Edit), otherwise none. */
  imageUrl: string | null
  /** True when a new file is selected and not submitted yet (it can then be removed). */
  hasSelectedFile: boolean
  error: string | null
  disabled?: boolean
  onSelect: (file: File | null) => void
  onRemove: () => void
}

const ProjectLogoUpload = ({ dictionary, imageUrl, hasSelectedFile, error, disabled = false, onSelect, onRemove }: Props) => (
  <Stack spacing={1}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {projectLogoText(dictionary, 'projectLogo', 'Project logo')}
    </Typography>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {imageUrl ? (
          <Box component="img" src={imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <DomainIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        )}
      </Box>
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button component="label" size="small" variant="outlined" disabled={disabled}>
            {imageUrl
              ? projectLogoText(dictionary, 'logoChangeImage', 'Change image')
              : projectLogoText(dictionary, 'logoChooseImage', 'Choose image')}
            <input
              type="file"
              accept={PROJECT_LOGO_ACCEPT}
              hidden
              onChange={event => {
                onSelect(event.target.files?.[0] ?? null)
                // Allow picking the same file again after removing it.
                event.target.value = ''
              }}
            />
          </Button>
          {hasSelectedFile && (
            <Button size="small" color="error" disabled={disabled} onClick={onRemove}>
              {projectLogoText(dictionary, 'logoRemoveImage', 'Remove image')}
            </Button>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {projectLogoText(dictionary, 'logoUploadHint', 'Supported formats: {formats}. Maximum size: {maxSize} MB.')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {projectLogoText(dictionary, 'logoDimensionHint', 'Recommended: square image, 1:1 ratio, 512 × 512 px (minimum 256 × 256 px).')}
        </Typography>
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Stack>
    </Stack>
  </Stack>
)

export default ProjectLogoUpload
