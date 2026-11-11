'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'
import { useState, useSyncExternalStore } from 'react'

import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'

import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'

import type { Locale } from '@configs/i18n'
import { getLocalizedUrl } from '@utils/i18n'

import { appProfile } from '@configs/appProfile'
import { useUserName } from '@/@core/stores/useUserStore'
import WorkingProjectSelector from './WorkingProjectSelector'

let cachedClockSnapshot = typeof window === 'undefined' ? null : Date.now()

const subscribeToClock = (callback: () => void) => {
  const timer = setInterval(() => {
    cachedClockSnapshot = Date.now()
    callback()
  }, 60000)

  return () => clearInterval(timer)
}

// getSnapshot must return a value that stays referentially stable between
// renders unless the store actually changed, otherwise React detects a
// mismatch and re-renders forever ("Maximum update depth exceeded").
const getClockSnapshot = () => cachedClockSnapshot
const getServerClockSnapshot = () => null

const getGreetingKey = (hour: number) => {
  if (hour >= 5 && hour < 11) return 'greeting_morning'
  if (hour >= 11 && hour < 13) return 'greeting_noon'
  if (hour >= 13 && hour < 18) return 'greeting_afternoon'

  return 'greeting_evening'
}

const formatBusinessDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const HeaderUserInfo = ({ dictionary }: { dictionary?: any } = {}) => {
  const name = useUserName()
  const timestamp = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot)
  const { data: session } = useSession()
  const { locale } = useParams()
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  // Server has no clock snapshot, so skip rendering until the client mounts to avoid a hydration mismatch
  if (!timestamp) return null

  const now = new Date(timestamp)
  const headerText = (key: string) => dictionary?.header?.[key] ?? key
  const commonText = (key: string) => dictionary?.common?.[key] ?? key
  const greeting = headerText(getGreetingKey(now.getHours()))
  const displayName = name || commonText('user')

  // No business-date source and no role-name field exist in the current session/store yet,
  // so business datetime falls back to current time and role falls back to a generic label
  const businessDateTime = formatBusinessDateTime(now)
  const roleName = commonText('user')

  const handleTriggerClick = (event: ReactMouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setMenuOpen(prev => !prev)
  }

  const handleMenuClose = () => {
    setMenuOpen(false)
  }

  const handleMenuItemClick = (url: string) => {
    setMenuOpen(false)
    router.push(getLocalizedUrl(url, locale as Locale))
  }

  return (
    <div className='flex items-center gap-3 text-white text-sm shrink-0 pr-4 sm:pr-6 md:pr-8'>
      <div className='flex items-center gap-2'>
        <i className='ri-emotion-happy-line text-[18px] text-white' />
        <span className='whitespace-nowrap'>
          {greeting}, <strong className='font-medium'>{displayName}</strong>
        </span>
      </div>

      <span className='hidden md:inline opacity-40'>|</span>

      <div className='hidden md:flex items-center gap-2 opacity-90'>
        <i className='ri-calendar-2-line text-[18px] text-white' />
        <span className='whitespace-nowrap'>{headerText('business_datetime')}: {businessDateTime}</span>
      </div>

      {/* Project Context selector is profile-gated (hidden on W4S). The working-project store and
          its bootstrap keep running regardless — only this UI is skipped. */}
      {appProfile.features.showProjectContextSelector ? (
        <>
          <span className='hidden md:inline opacity-40'>|</span>

          <div className='hidden md:flex items-center gap-2 opacity-90' data-tour="current-project-info">
            <i className='ri-building-4-line text-[18px] text-white' />
            <WorkingProjectSelector
              dictionary={dictionary}
              sessiontoken={session?.user?.token as string | undefined}
              language={locale as string}
            />
          </div>
        </>
      ) : null}

      <span className='hidden md:inline opacity-40'>|</span>

      <ClickAwayListener onClickAway={handleMenuClose}>
        <div className='relative hidden md:flex items-center gap-2 opacity-90'>
          <div
            className='flex items-center gap-2 cursor-pointer select-none'
            onClick={handleTriggerClick}
          >
            <i className='ri-shield-user-line text-[18px] text-white' />
            <span className='whitespace-nowrap'>{roleName}</span>
            <i className={`ri-arrow-down-s-line text-[16px] text-white transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </div>

          <Popper
            open={menuOpen}
            transition
            disablePortal
            placement='bottom-end'
            anchorEl={anchorEl}
            className='min-is-[200px] !mbs-2 z-[1300]'
          >
            {({ TransitionProps, placement }) => (
              <Fade
                {...TransitionProps}
                style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}
              >
                <Paper elevation={8}>
                  <MenuList>
                    <MenuItem className='gap-3 pli-4' onClick={() => handleMenuItemClick('/account-settings')}>
                      <i className='ri-user-3-line' />
                      <Typography>{commonText('myprofile')}</Typography>
                    </MenuItem>
                    <MenuItem className='gap-3 pli-4' onClick={() => handleMenuItemClick('/change-password')}>
                      <i className='ri-lock-password-line' />
                      <Typography>{commonText('changepassword')}</Typography>
                    </MenuItem>
                  </MenuList>
                </Paper>
              </Fade>
            )}
          </Popper>
        </div>
      </ClickAwayListener>
    </div>
  )
}

export default HeaderUserInfo
