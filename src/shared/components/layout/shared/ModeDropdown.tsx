'use client'

import { Mode } from '@/@core/types'
import { useSettings } from '@core/hooks/useSettings'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Tooltip from '@mui/material/Tooltip'
import Image from 'next/image'
import React, { useState } from 'react'

const ModeDropdown = () => {
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const { settings, updateSettings } = useSettings()

  const handleClose = () => {
    setOpen(false)
    setTooltipOpen(false)
  }

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setOpen((prevOpen) => !prevOpen)
  }

  const handleModeSwitch = (mode: Mode) => {
    handleClose()

    if (settings.mode !== mode) {
      updateSettings({ mode: mode })

      if (mode === 'dark') {
        document.body.classList.add('theme-young-pro');
      } else {
        document.body.classList.remove('theme-young-pro');
      }
    }

  }

  const getModeIcon = () => {
    if (settings.mode === 'system') {
      return <Image alt='system' src={`/images/icon/system.svg`} width={24} height={24} />
    } else if (settings.mode === 'dark') {
      return <Image alt='moon' src={`/images/icon/moon.svg`} width={24} height={24} />
    } else {
      return <Image alt='sun' src={`/images/icon/sun.svg`} width={24} height={24} />
    }
  }

  return (
    <>
      <Tooltip
        title={settings.mode + ' Mode'}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        open={tooltipOpen}
        slotProps={{ popper: { className: 'capitalize' } }}
      >
        <IconButton onClick={handleToggle} className='text-[22px] text-white'>
          <i className={settings.mode === 'dark' ? 'ri-moon-clear-line' : settings.mode === 'system' ? 'ri-computer-line' : 'ri-sun-line'} />
        </IconButton>
      </Tooltip>

      <Popper
        open={open && Boolean(anchorEl)}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorEl}
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
                  <MenuItem
                    className='gap-3 pli-4'
                    onClick={() => handleModeSwitch('light')}
                    selected={settings.mode === 'light'}
                  >
                    <i className='ri-sun-line' />
                    Light
                  </MenuItem>
                  <MenuItem
                    className='gap-3 pli-4'
                    onClick={() => handleModeSwitch('dark')}
                    selected={settings.mode === 'dark'}
                  >
                    <i className='ri-moon-clear-line' />
                    Dark
                  </MenuItem>
                  <MenuItem
                    className='gap-3 pli-4'
                    onClick={() => handleModeSwitch('system')}
                    selected={settings.mode === 'system'}
                  >
                    <i className='ri-computer-line' />
                    System
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default ModeDropdown
