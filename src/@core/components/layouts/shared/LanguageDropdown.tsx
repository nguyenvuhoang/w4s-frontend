'use client'

// React Imports
import { useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// MUI Imports
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'

// Type Imports
import type { Locale } from '@configs/i18n'

// Hook Imports
import CircleFlagsLA from '@/assets/svg/front-pages/country/CircleFlagsLA'
import CircleFlagsUk from '@/assets/svg/front-pages/country/CircleFlagsUk'
import CircleFlagsVN from '@/assets/svg/front-pages/country/CircleFlagsVN'
import { useSettings } from '@core/hooks/useSettings'

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
  },
  {
    langCode: 'la',
    langName: 'Laos'
  }
]

const LanguageDropdown = ({ lang }: { lang: string }) => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const pathName = usePathname()
  const { settings } = useSettings()

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='flex gap-1 p-2 rounded-full cursor-pointer flag'>


        {lang === 'en' && <CircleFlagsUk />}
        {lang === 'vi' && <CircleFlagsVN />}
        {lang === 'la' && <CircleFlagsLA />}


        <div className="text-primary font-sans text-sm">
          {lang === 'en' ? 'ENG' : lang === 'vi' ? 'VIE' : lang === 'la' ? 'LAO' : ''}
        </div>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        className='min-is-[160px] !mbs-4 z-[1] '
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'right top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none bg-gradient-to-r from-[#AACBAC] to-[#D2EBCE]' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  {languageData.map(locale => (
                    <MenuItem
                      key={locale.langCode}
                      component={Link}
                      href={getLocalePath(pathName, locale.langCode)}
                      onClick={handleClose}
                      selected={lang === locale.langCode}
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
