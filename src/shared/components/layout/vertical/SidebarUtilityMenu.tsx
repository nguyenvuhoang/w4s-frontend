'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { RouterLink as Link } from '@menu/components/RouterLink'
import { useParams } from 'next/navigation'

import ClickAwayListener from '@mui/material/ClickAwayListener'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

import type { Locale } from '@configs/i18n'

import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import LayoutToggle from '@components/layout/shared/LayoutToggle'
import { getLocalizedUrl } from '@utils/i18n'

export type SidebarUtilityLabels = {
  utilities: string
  systemSettings: string
  clearCache: string
  language: string
  layout: string
}

type Props = {
  isSuperAdmin: boolean
  labels: SidebarUtilityLabels
  showLabel: boolean
  onClearCache: () => void
  onOpenChange?: (open: boolean) => void
}

type Anchor = { cx: number; cy: number }

/**
 * Bubbles fan out on a quarter-circle arc (straight up to straight right) so they never
 * spread off-screen to the left, regardless of sidebar width. They're portaled to <body> with
 * fixed positioning computed from the trigger's live bounding rect — this escapes the sidebar's
 * `overflow-x/y` clipping and its local stacking context entirely, so nothing cuts the fan off.
 */
const FAN_RADIUS = 120
const FAN_START_DEG = 88
const FAN_END_DEG = 2
// 46px keeps the bubble a comfortable 44-48px tap target (bumped up slightly from the old 40px)
// without changing how the fan looks in any noticeable way.
const BUBBLE_SIZE = 46
const FAN_Z_INDEX = 1400
const VIEWPORT_MARGIN = 8
const TOP_SAFE_MARGIN = 72 // keeps bubbles clear of the top header/avatar area
// Nudges the whole fan right so the "straight up" bubble doesn't land directly on the
// main menu's icon/label column below it.
const FAN_X_SHIFT = 18

const fanBubbleSx = {
  width: BUBBLE_SIZE,
  height: BUBBLE_SIZE,
  backgroundColor: 'rgba(30, 41, 59, 0.94)',
  border: '1px solid rgba(255, 255, 255, 0.28)',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)',
  '&:hover': { backgroundColor: 'rgba(51, 65, 85, 0.98)' }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const SidebarUtilityMenu = ({ isSuperAdmin, labels, showLabel, onClearCache, onOpenChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { locale } = useParams()
  const theme = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const measureAnchor = () => {
    const rect = triggerRef.current?.getBoundingClientRect()

    if (!rect) return
    setAnchor({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 })
  }

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', measureAnchor)
    return () => window.removeEventListener('resize', measureAnchor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggle = () => {
    const next = !open

    if (next) measureAnchor()
    setOpen(next)
    onOpenChange?.(next)
  }

  const close = () => {
    setOpen(false)
    onOpenChange?.(false)
  }

  // Esc closes the fan, matching the click-away/backdrop close behavior.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  type FanItem = { key: string; tooltip: string; closeOnClick: boolean; node: ReactNode }

  const fanItems: FanItem[] = []

  if (isSuperAdmin) {
    fanItems.push({
      key: 'system-settings',
      tooltip: labels.systemSettings,
      closeOnClick: true,
      node: (
        <Link href={getLocalizedUrl('/system-settings', locale as Locale)}>
          <IconButton size='small' className='text-white' sx={fanBubbleSx}>
            <i className='ri-settings-3-line' style={{ fontSize: 20 }} />
          </IconButton>
        </Link>
      )
    })
  }

  fanItems.push({
    key: 'clear-cache',
    tooltip: labels.clearCache,
    closeOnClick: true,
    node: (
      <IconButton size='small' className='text-white' sx={fanBubbleSx} onClick={onClearCache}>
        <i className='ri-refresh-line' style={{ fontSize: 20 }} />
      </IconButton>
    )
  })

  fanItems.push({
    key: 'language',
    tooltip: labels.language,
    // Opens its own language picker popover anchored to this bubble — collapsing the fan here
    // would move the anchor out from under an already-open popover. It's dismissed by its own
    // click-away handler, or by the outer fan's click-away / trigger toggle.
    closeOnClick: false,
    node: (
      <span className='inline-flex'>
        <LanguageDropdown showLabel={false} />
      </span>
    )
  })

  fanItems.push({
    key: 'layout',
    tooltip: labels.layout,
    closeOnClick: true,
    // LayoutToggle already renders its own tooltip with a more precise, state-aware label — don't double-wrap it.
    node: (
      <span className='inline-flex'>
        <LayoutToggle showLabel={false} />
      </span>
    )
  })

  const total = fanItems.length

  const fanOverlay =
    mounted && anchor
      ? createPortal(
          <ClickAwayListener
            onClickAway={event => {
              if (triggerRef.current && triggerRef.current.contains(event.target as Node)) return
              close()
            }}
          >
            <Box sx={{ position: 'fixed', inset: 0, zIndex: FAN_Z_INDEX, pointerEvents: 'none' }}>
              {fanItems.map((item, index) => {
                const angleRange = FAN_START_DEG - FAN_END_DEG
                const angleDeg = total > 1 ? FAN_START_DEG - (angleRange * index) / (total - 1) : FAN_START_DEG
                const angleRad = (angleDeg * Math.PI) / 180
                const offsetX = open ? Math.cos(angleRad) * FAN_RADIUS : 0
                const offsetY = open ? Math.sin(angleRad) * FAN_RADIUS : 0

                const targetLeft = clamp(
                  anchor.cx + FAN_X_SHIFT + offsetX,
                  VIEWPORT_MARGIN + BUBBLE_SIZE / 2,
                  window.innerWidth - VIEWPORT_MARGIN - BUBBLE_SIZE / 2
                )
                const targetTop = clamp(
                  anchor.cy - offsetY,
                  TOP_SAFE_MARGIN,
                  window.innerHeight - VIEWPORT_MARGIN - BUBBLE_SIZE / 2
                )

                const delay = open ? index * 40 : (total - index - 1) * 30

                return (
                  <Box
                    key={item.key}
                    onClick={item.closeOnClick ? close : undefined}
                    sx={{
                      position: 'fixed',
                      left: `${targetLeft}px`,
                      top: `${targetTop}px`,
                      transform: 'translate(-50%, -50%)',
                      opacity: open ? 1 : 0,
                      pointerEvents: open ? 'auto' : 'none',
                      transition: theme.transitions.create(['left', 'top', 'opacity'], {
                        duration: 260,
                        easing: theme.transitions.easing.easeOut
                      }),
                      transitionDelay: `${delay}ms`
                    }}
                  >
                    <Box
                      sx={{
                        transform: `scale(${open ? 1 : 0.3})`,
                        transformOrigin: 'center',
                        transition: theme.transitions.create('transform', {
                          duration: 260,
                          easing: theme.transitions.easing.easeOut
                        }),
                        transitionDelay: `${delay}ms`
                      }}
                    >
                      <Tooltip title={item.tooltip} placement='top' arrow>
                        {item.node as ReactElement}
                      </Tooltip>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </ClickAwayListener>,
          document.body
        )
      : null

  return (
    <>
      {/* position/zIndex/pointerEvents stay explicit here on purpose: Navigation lays a backdrop
          (zIndex 5) over the rest of the sidebar while the fan is open to block click/hover on
          the main menu behind it. This trigger doubles as the close/X button, so it opts back
          into interactivity by sitting above that backdrop instead of under it. */}
      <Box sx={{ width: showLabel ? '100%' : 'auto', position: 'relative', zIndex: 6, pointerEvents: 'auto' }}>
        {showLabel ? (
          <Button
            ref={triggerRef}
            fullWidth
            onClick={toggle}
            startIcon={<i className={open ? 'ri-close-line' : 'ri-apps-2-line'} />}
            sx={{
              justifyContent: 'flex-start',
              minHeight: 38,
              px: 1.5,
              borderRadius: 2,
              color: 'common.white',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: open ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              '& .MuiButton-startIcon': { fontSize: 22, minWidth: 24 },
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
            }}
          >
            {labels.utilities}
          </Button>
        ) : (
          <Tooltip title={labels.utilities} placement='right'>
            <IconButton
              ref={triggerRef}
              size='small'
              onClick={toggle}
              className='text-white'
              sx={{
                backgroundColor: open ? 'rgba(255, 255, 255, 0.16)' : 'transparent'
              }}
            >
              <i className={open ? 'ri-close-line' : 'ri-apps-2-line'} style={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {fanOverlay}
    </>
  )
}

export default SidebarUtilityMenu
