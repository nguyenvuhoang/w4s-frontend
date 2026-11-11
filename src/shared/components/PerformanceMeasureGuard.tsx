'use client'

import { useLayoutEffect } from 'react'

type GuardedPerformance = Performance & {
  __ipsMeasureGuardInstalled?: boolean
}

const PerformanceMeasureGuard = () => {
  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const performanceApi = window.performance as GuardedPerformance

    if (performanceApi.__ipsMeasureGuardInstalled) return

    const originalMeasure = performanceApi.measure.bind(performanceApi)

    performanceApi.measure = ((
      name: string,
      startOrOptions?: string | PerformanceMeasureOptions,
      endMark?: string
    ) => {
      try {
        if (typeof startOrOptions === 'object') {
          return originalMeasure(name, startOrOptions)
        }

        return originalMeasure(name, startOrOptions, endMark)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        const options =
          startOrOptions &&
          typeof startOrOptions === 'object' &&
          !Array.isArray(startOrOptions)
            ? startOrOptions
            : null

        if (!options || !message.includes('negative time stamp')) {
          throw error
        }

        const safeOptions = { ...options }

        if (typeof safeOptions.start === 'number') {
          safeOptions.start = Math.max(0, safeOptions.start)
        }

        if (typeof safeOptions.end === 'number') {
          safeOptions.end = Math.max(0, safeOptions.end)

          if (
            typeof safeOptions.start === 'number' &&
            safeOptions.end < safeOptions.start
          ) {
            safeOptions.end = safeOptions.start
          }
        }

        return originalMeasure(name, safeOptions)
      }
    }) as Performance['measure']

    Object.defineProperty(performanceApi, '__ipsMeasureGuardInstalled', {
      value: true,
      configurable: false
    })
  }, [])

  return null
}

export default PerformanceMeasureGuard
