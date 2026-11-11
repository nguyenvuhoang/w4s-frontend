'use client'

// React Imports
import { useRef, useState } from 'react'

// Next Imports
import { useParams, usePathname } from 'next/navigation'

// MUI Imports
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'



// Type Imports
import type { Locale } from '@configs/i18n'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

type LanguageDropdownProps = {
  label?: string
  showLabel?: boolean
  fullWidth?: boolean
}

type LanguageDataType = {
  langCode: Locale
  langName: string
}

const getLocalePath = (pathName: string, locale: string) => {
  if (!pathName) return '/'
  const segments = pathName.split('/')

  segments[1] = locale

  return segments.join('/')
}

const languageData: LanguageDataType[] = [
  {
    langCode: 'en',
    langName: 'English'
  },
  {
    langCode: 'vi',
    langName: 'Vietnamese'
  }
]

const LanguageDropdown = ({ label = 'Language', showLabel = false, fullWidth = false }: LanguageDropdownProps) => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const pathName = usePathname()
  const { settings } = useSettings()
  const { locale: currentLocale } = useParams()

  const handleClose = () => {
    setOpen(false)
  }

  const handleChangeLanguage = (nextLocale: Locale) => {
    const nextPath = getLocalePath(pathName, nextLocale)

    setOpen(false)

    if (nextLocale === currentLocale) return

    window.location.assign(nextPath)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  return (
    <>
      {showLabel ? (
        <Button
          ref={anchorRef}
          onClick={handleToggle}
          fullWidth={fullWidth}
          startIcon={<i className='ri-global-line' />}
          sx={{
            justifyContent: 'flex-start',
            minHeight: 38,
            px: 1.5,
            borderRadius: 2,
            color: 'common.white',
            textTransform: 'none',
            fontWeight: 500,
            '& .MuiButton-startIcon': { fontSize: 22, minWidth: 24 },
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
          }}
        >
          {label}
        </Button>
      ) : (
        <IconButton ref={anchorRef} onClick={handleToggle} className='text-[22px] text-white'>
          <i className='ri-global-line' />
        </IconButton>
      )}

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        // eslint-disable-next-line react-hooks/refs
        anchorEl={anchorRef.current}
        className='min-is-[160px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'right top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  {languageData.map(locale => (
                    <MenuItem
                      key={locale.langCode}
                      onClick={() => handleChangeLanguage(locale.langCode)}
                      selected={currentLocale === locale.langCode}
                      className='pli-4'
                    >
                      {locale.langName}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default LanguageDropdown
