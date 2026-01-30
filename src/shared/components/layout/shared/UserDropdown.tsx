'use client'

// React Imports
import type { MouseEvent } from 'react'
import { useState } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Divider from '@mui/material/Divider'
import Fade from '@mui/material/Fade'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { signOut } from 'next-auth/react'

// Type Imports
import type { Locale } from '@configs/i18n'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import { Box } from '@mui/material'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = ({ avatar, name, dictionary }: {
  avatar: string,
  name: string,
  dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
  // States
  const [open, setOpen] = useState(false)

  // Anchor element for Popper
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const { locale } = useParams()

  const handleDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setOpen(true)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(getLocalizedUrl(url, locale as Locale))
    }
    // If click is inside the anchor element, do nothing
    if (anchorEl && event && anchorEl.contains(event.target as Node)) {
      return
    }
    setOpen(false)
    setAnchorEl(null)
  }

  const handleUserLogout = async () => {
    try {
      router.push(`${getLocalizedUrl('/logout', locale as Locale)}`)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Badge
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          alt={name || ''}
          src={avatar || ''}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px] bg-[white] hover:bg-transparent active:bg-transparent focus:bg-transparent'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorEl}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper
              elevation={settings.skin === 'bordered' ? 0 : 8}
              {...(settings.skin === 'bordered' && { className: 'border' })}
              sx={{
                bgcolor: 'white',
                backgroundImage: `repeating-linear-gradient(
                                  45deg,
                                  rgba(255, 255, 255, 0.02),
                                  rgba(0, 0, 0, 0.02) 1px,
                                  transparent 1px,
                                  transparent 2px
                                )`
              }}

            >
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <Box className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <Avatar
                      alt={avatar || ''}
                      src={avatar || ''}
                      sx={{
                        color: avatar ? undefined : 'primary.main',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'transparent',
                      }}
                    />

                    <Box className='flex items-start flex-col'>
                      <Typography variant='body2' className='font-medium' color='primary.main'>
                        {name || ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3 pli-4' onClick={e => handleDropdownClose(e, '/account-settings')}>
                    <i className='ri-user-3-line text-primary' />
                    <Typography color='primary.main'>{dictionary['common'].myprofile}</Typography>
                  </MenuItem>
                  {/* <MenuItem className='gap-3 pli-4' onClick={e => handleDropdownClose(e, '/console-admin')}>
                    <i className='ri-settings-4-line text-primary' />
                    <Typography color='primary.main'>{dictionary['common'].userconsoleadmin}</Typography>
                  </MenuItem> */}
                  <Box className='flex items-center plb-1.5 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleUserLogout}
                    >
                      {dictionary['common'].logout}
                    </Button>
                  </Box>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown

