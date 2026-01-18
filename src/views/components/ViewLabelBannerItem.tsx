'use client'

import { getDataConfig } from '@/@core/components/jSelect/supFunc'
import CountryFlag from '@/@core/components/mui/CountryFlag'
import CustomModal from '@/@core/components/mui/CustomModal'
import { SexIcon } from '@/components/layout/shared/SexIcon'
import { StatusIcon } from '@/components/layout/shared/StatusIcon'
import { Locale } from '@/configs/i18n'
import { formatAmount } from '@/utils/formatAmount'
import { formatDateTime } from '@/utils/formatDateTime'
import { getDictionary } from '@/utils/getDictionary'
import { getInfoByToken } from '@/utils/getInfoByToken'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, Checkbox, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useState } from 'react'
import { Control, Controller, FieldValues, UseFormGetValues, useWatch } from 'react-hook-form'
import Swal from 'sweetalert2'
import CircularProgress from '@mui/material/CircularProgress'
import { useLoginHandler } from '@features/auth/hooks/useLoginHandler'
type Props = {
  input: any
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  session: Session | null
  locale: Locale
  isDirtyField?: boolean
  onChangeValue?: (code: string, value: string) => void
  control: Control<any>
  getValues: UseFormGetValues<FieldValues>
}

const ViewLabelBannerItem = ({
  input,
  dictionary,
  onChangeValue,
  session,
  locale,
  isDirtyField,
  control,
  getValues
}: Props) => {
  // State variables
  const [editing, setEditing] = useState(false)
  const [selectOptions, setSelectOptions] = useState<{ label: string; value: string }[]>([])
  const [showVerifyPassword, setShowVerifyPassword] = useState(false)
  const [verifyData, setVerifyData] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Hooks
  const { verifyPassword } = useLoginHandler({ locale, dictionary })

  // --- MOVE useWatch TO TOP-LEVEL (always called) ---
  const code = input.default?.code
  const watched = useWatch({ control, name: code as any, defaultValue: input.value })

  useEffect(() => {
    const loadOptions = async () => {
      if ((input.modifytype || input.inputtype) === 'cSelect' && input.config) {
        const result = await getDataConfig(input.config, session, locale)
        const options = result.map((item: any) => {
          const keySelected = input.config.key_selected
          const keyDisplay = input.config.key_display
          const value =
            keySelected ? item[keySelected] || item.c_cdlist?.cdid || item?.codeid || '' : item.c_cdlist?.cdid || item?.codeid || ''
          const label =
            keySelected && keyDisplay
              ? item[keySelected]
                ? item[keySelected] + '-' + (item[keyDisplay] || '')
                : item.c_cdlist?.caption || item?.caption || ''
              : item.c_cdlist?.caption || item?.caption || ''
          return { value, label }
        })
        setSelectOptions(options)
      }
    }
    loadOptions()
  }, [input.config, input.inputtype, input.modifytype, locale, session])


  const handleVerifySensitive = () => {
    const token = session?.user?.token

    const username = getInfoByToken(token ?? '', 'username')
    const usercode = getInfoByToken(token ?? '', 'usercode')
    if (!username) {
      Swal.fire('Invalid session', 'Token is invalid or expired', 'error')
      return
    }
    setVerifyData((prev) => ({
      ...prev,
      username,
      usercode
    }))

    setShowVerifyPassword(true)
  }


  const renderEditField = () => {
    // use `code` here (already defined)
    if (!code) return null

    return (
      <Controller
        name={code}
        control={control}
        defaultValue={input.value || ''}
        render={({ field }) => {
          let fieldElement = null

          switch (input.modifytype || input.inputtype) {
            case 'cSelect':
              fieldElement = (
                <TextField
                  {...field}
                  select
                  size="small"
                  fullWidth
                  onChange={(e) => {
                    field.onChange(e)
                    const selected = selectOptions.find(opt => opt.value === e.target.value)
                    input.displaytext = selected?.label ?? e.target.value
                    onChangeValue?.(code, e.target.value)
                  }}
                >
                  {selectOptions.map((opt, index) => (
                    <MenuItem key={index} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )
              break
            case 'cDate':
              fieldElement = (
                <TextField
                  {...field}
                  type="date"
                  size="small"
                  fullWidth
                  onChange={(e) => {
                    field.onChange(e)
                    onChangeValue?.(code, e.target.value)
                  }}
                />
              )
              break
            case 'cDecimal':
              fieldElement = (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                      field.onChange(val)
                      onChangeValue?.(code, val)
                    }
                  }}
                />
              )
              break
            case 'cCheckbox':
              fieldElement = (
                <Checkbox
                  checked={!!field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked)
                    onChangeValue?.(code, e.target.checked.toString())
                  }}
                />
              )
              break
            default:
              fieldElement = (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={6}
                  onChange={(e) => {
                    field.onChange(e)
                    onChangeValue?.(code, e.target.value)
                    input.displaytext = e.target.value
                  }}
                />
              )
              break
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              {fieldElement}
              <IconButton
                size="small"
                color="success"
                onClick={() => {
                  setEditing(false)
                }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        }}
      />
    );
  }

  const renderValue = () => {
    // use `watched` instead of calling useWatch here
    const currentValue = typeof watched === 'undefined' ? input.value : watched;
    if (input.issensitive && !editing) return '******';

    switch (input.tag) {
      case 'amount':
        return formatAmount(currentValue);
      case 'date':
        return formatDateTime(currentValue);
      case 'gender':
        return '';
      case 'status':
      case 'option':
        return input.displaytext ?? '';
      default:
        return currentValue?.toString() ?? '-';
    }
  };

  // useEffect(() => {
  //   // Sync local editing state with external changes to input.ismodify
  //     setEditing(false);
  // }, [watched]);

  const renderIcon = () => {
    switch (input.tag) {
      case 'status':
        return <StatusIcon status={input.value} />
      case 'gender':
        return <SexIcon sex={input.value} dictionary={dictionary} />
      case 'country':
        return <CountryFlag countryCode={input.value?.toString()} />
      default:
        return null
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderRadius: 1,
        bgcolor: input.isChangedField
          ? '#d1e7dd'
          : isDirtyField
            ? '#fff3cd'
            : '#f5f5f5',
        border: input.isChangedField
          ? '1px solid #badbcc'
          : isDirtyField
            ? '1px solid #ffeeba'
            : undefined,
        '&:hover': {
          bgcolor: input.isChangedField
            ? '#bcd0c7'
            : isDirtyField
              ? '#ffecb5'
              : '#e8f5e9',
          transition: 'background-color 0.2s'
        }
      }}
    >
      <Typography component="div" sx={{ fontWeight: 'medium', minWidth: '150px', color: 'primary.main' }}>
        {input.default?.name ?? input.default?.code}:
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
        {!editing && (
          <Typography
            component="div"
            className="font-medium text-primary"
            sx={{
              wordBreak: 'break-word',
              textAlign: 'right',
              flex: 1
            }}
          >
            {renderValue()}
          </Typography>
        )}
        {!editing && renderIcon()}
        {input.ismodify === true && !editing && (
          <IconButton
            size="small"
            onClick={() => {
              if (input.issensitive) {
                handleVerifySensitive()
              } else {
                setEditing(true)
              }
            }}
            sx={{ color: 'primary.main', p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {editing && renderEditField()}
      </Box>

      {showVerifyPassword && (
        <CustomModal
          open
          onClose={() => setShowVerifyPassword(false)}
          title={dictionary['common'].verifypassword || 'Verify Password'}
          position="center"
          maxWidth="400px"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <TextField
              label={dictionary['common'].username || 'Username'}
              fullWidth
              size="small"
              value={verifyData.username || ''}
              disabled
            />
            <TextField
              type={showPassword ? 'text' : 'password'}
              label={dictionary['auth'].password || 'Password'}
              fullWidth
              size="small"
              value={verifyData.password || ''}
              onChange={(e) => {
                setVerifyData((prev) => ({ ...prev, password: e.target.value }))
                setVerifyError(null)
              }}
              error={!!verifyError}
              helperText={verifyError}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />


            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  const verify = await verifyPassword(session?.user?.token!, verifyData.usercode, verifyData.password)
                  setLoading(false)
                  if (verify) {
                    setShowVerifyPassword(false)
                    setEditing(true)
                    setVerifyData({})
                  } else {
                    setVerifyError(dictionary['auth'].usernamepasswordincorrect)
                  }
                }}
              >
                {loading
                  ? <CircularProgress size={20} color="inherit" />
                  : dictionary['common'].confirm || 'Confirm'}
              </Button>
            </Box>
          </Box>
        </CustomModal>
      )}


    </Box>
  )
}

export default ViewLabelBannerItem
