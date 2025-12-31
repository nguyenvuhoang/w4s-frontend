'use client'

// React Imports
import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// Third-party Imports
import { signOut, useSession } from 'next-auth/react'

// Type Imports
import type { Locale } from '@configs/i18n'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { getDictionary } from '@/utils/getDictionary'
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

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const { locale } = useParams()

  const handleDropdownOpen = () => {
    !open ? setOpen(true) : setOpen(false)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(getLocalizedUrl(url, locale as Locale))
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleUserLogout = async () => {
    try {
      await signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          ref={anchorRef}
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
        anchorEl={anchorRef.current}
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
