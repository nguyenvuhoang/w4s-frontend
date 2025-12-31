/* eslint-disable react-hooks/exhaustive-deps */
'use client'
// Type Imports
import type { ChildrenType } from '@core/types'
import { useIdleTimer } from 'react-idle-timer'

// Component Imports
import { Locale } from '@/configs/i18n'
import { getLocalizedUrl } from '@/utils/i18n'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function IdleTimer({ children, locale }: ChildrenType & { locale: Locale }) {
  const [isIdle, setIsIdle] = useState(false)

  const router = useRouter()

  const onIdle = () => {
    setIsIdle(true)
  }

  const onActive = () => {
    setIsIdle(false)
  }

  const { reset } = useIdleTimer({
    onIdle,
    onActive,
    timeout: 60000_000, // Idle timeout set to 50 seconds
    throttle: 500,
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousedown',
      'touchstart',
      'touchmove',
    ],
  })

  useEffect(() => {
    if (isIdle) {
      let countdown = 5 // Countdown in seconds

      Swal.fire({
        position: 'top',
        color: 'black',
        html: `You will be logged out in <b>${countdown}</b> seconds due to inactivity. Do you want to stay logged in?`,
        allowOutsideClick: false,
        showCancelButton: true,
        iconHtml: '<img src="/images/icon/warning.svg" alt="warning-icon" style="width:64px; height:64px;">',
        customClass: {
          icon: 'no-border'
        },
        didOpen: () => {
          const timerDisplay = Swal.getHtmlContainer()?.querySelector('b')

          // Start countdown
          const countdownInterval = setInterval(() => {
            countdown -= 1
            if (timerDisplay) timerDisplay.textContent = countdown.toString()

            if (countdown <= 0) {
              clearInterval(countdownInterval)
              Swal.close()
              router.push(getLocalizedUrl(`/logout`, locale as Locale));
            }
          }, 1000) // Update countdown every second

          // Clear countdown if dialog is closed manually
          Swal.getCancelButton()?.addEventListener('click', () => clearInterval(countdownInterval))
          Swal.getConfirmButton()?.addEventListener('click', () => clearInterval(countdownInterval))
        }
      }).then((result) => {
        if (result.isConfirmed) {
          handleStayLoggedIn()
        }
      })
    }
  }, [isIdle])

  const handleStayLoggedIn = () => {
    reset() // Reset idle timer
  }

  return (
    <>
      {children}
    </>
  )
}
