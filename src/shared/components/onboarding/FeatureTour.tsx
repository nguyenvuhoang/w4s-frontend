'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { usePathname } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { EVENTS, Joyride, STATUS, type EventHandler, type Locale as JoyrideLocale, type Step } from 'react-joyride'

import {
    buildFeatureTourStorageKey,
    readFeatureTourState,
    writeFeatureTourState
} from './featureTourStorage'

export type FeatureTourStep = Step

export type FeatureTourControls = {
    /** Restarts the tour from the first step, regardless of previous completion/skip state. */
    start: () => void
    /** Whether the user already finished or skipped this tour version before. */
    hasCompleted: boolean
}

export type FeatureTourProps = {
    /** Stable identifier for this tour, e.g. "resident-list-tour". */
    tourId: string
    /** Bump this when the steps change meaningfully so the tour is shown again. */
    version: number
    steps: FeatureTourStep[]
    /** Auto-run once per user/route/version the first time the condition becomes true. Default true. */
    autoStart?: boolean
    /** Used to scope the "seen it" state per user. Falls back to a shared "guest" bucket. */
    userCode?: string | null
    locale?: JoyrideLocale
    /** Render prop for the trigger UI (e.g. a "Hướng dẫn sử dụng" button) — kept out of the tour engine itself. */
    children?: (controls: FeatureTourControls) => ReactNode
}

/**
 * Shared onboarding tour engine built on react-joyride.
 * Keeps localStorage persistence, auto-start gating, and target-not-found handling in one place
 * so feature screens only need to supply `steps` (targeted via `data-tour="..."` attributes) and,
 * optionally, a trigger button via the render-prop `children`.
 */
const FeatureTour = ({
    tourId,
    version,
    steps,
    autoStart = true,
    userCode,
    locale,
    children
}: FeatureTourProps) => {
    const theme = useTheme()
    const pathname = usePathname()
    const [run, setRun] = useState(false)
    const [hasCompleted, setHasCompleted] = useState(false)

    const storageKey = useMemo(
        () => buildFeatureTourStorageKey({ userCode, route: pathname ?? '', tourId, version }),
        [userCode, pathname, tourId, version]
    )

    // Client-only: reading localStorage must not affect the server-rendered output, otherwise
    // it would cause a hydration mismatch.
    useEffect(() => {
        const savedState = readFeatureTourState(storageKey)

        setHasCompleted(savedState !== null)

        if (savedState === null && autoStart && steps.length > 0) {
            setRun(true)
        } else {
            setRun(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, autoStart])

    const handleEvent: EventHandler = data => {
        if (data.type !== EVENTS.TOUR_END) return

        if (data.status === STATUS.FINISHED) {
            writeFeatureTourState(storageKey, 'completed')
            setHasCompleted(true)
        } else if (data.status === STATUS.SKIPPED) {
            writeFeatureTourState(storageKey, 'skipped')
            setHasCompleted(true)
        }

        setRun(false)
    }

    const start = () => setRun(true)

    if (steps.length === 0) return children ? <>{children({ start, hasCompleted })}</> : null

    return (
        <>
            <Joyride
                continuous
                run={run}
                steps={steps}
                locale={locale}
                onEvent={handleEvent}
                scrollToFirstStep
                options={{
                    buttons: ['back', 'skip', 'primary'],
                    primaryColor: theme.palette.primary.main,
                    zIndex: theme.zIndex.modal + 10,
                    showProgress: true,
                    targetWaitTimeout: 4000,
                    spotlightPadding: 6
                }}
            />
            {children ? children({ start, hasCompleted }) : null}
        </>
    )
}

export default FeatureTour
