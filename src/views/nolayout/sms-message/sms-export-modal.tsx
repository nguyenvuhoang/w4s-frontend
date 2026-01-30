'use client'

import { getDictionary } from '@utils/getDictionary'
import * as Icons from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import Modal from '@mui/material/Modal'
import { FC, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface SMSExportModalProps {
  open: boolean
  onClose: () => void
  onExport: (exportType: 'PDF' | 'EXCEL') => void
  dictionary: Awaited<ReturnType<typeof getDictionary>>

}

const SMSExportModal: FC<SMSExportModalProps> = ({ open, onClose, onExport, dictionary }) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<{ exportType: 'PDF' | 'EXCEL' }>({
    defaultValues: { exportType: 'PDF' }
  })

  const handleExportClick = ({ exportType }: { exportType: 'PDF' | 'EXCEL' }) => {
    onExport(exportType)
    onClose()
  }

  useEffect(() => {
    if (open) {
      reset({ exportType: 'PDF' })
    }
  }, [open, reset])

  return (
    <Modal open={open} onClose={onClose} disableEscapeKeyDown>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" color="white">{dictionary['sms'].exportSMSMessages}</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Icons.Close />
          </IconButton>
        </Box>
        <form onSubmit={handleSubmit(handleExportClick)}>

          {/* Content */}
          <Box
            sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}
            onSubmit={handleSubmit(handleExportClick)}
          >
            <Controller
              name="exportType"
              control={control}
              rules={{ required: `${dictionary['common'].required}` }}
              render={({ field }) => (
                <TextField
                  fullWidth
                  select
                  size="small"
                  label={dictionary['sms'].exportType}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.exportType}
                  helperText={errors.exportType?.message}
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="EXCEL">EXCEL</MenuItem>
                </TextField>
              )}
            />

            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onClose}
                startIcon={<Icons.Close />}
              >
                {dictionary['common'].cancel}
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<Icons.Download />}
              >
                {dictionary['common'].export}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Modal>
  )
}

export default SMSExportModal

