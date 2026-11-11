'use client'

import { useMemo } from 'react'
import { useRouter as useNextRouter } from 'next/navigation'
import { useNavigationTransition } from '@/shared/components/progressbar/NavigationLifecycleProvider'

type NavigationOptions = NonNullable<Parameters<ReturnType<typeof useNextRouter>['push']>[1]> & { showProgress?: boolean }
type ActionOptions = { showProgress?: boolean }

// The root provider owns transitions, so unmounting a calling page cannot orphan loading.
export function useRouter() {
  const router = useNextRouter()
  const navigate = useNavigationTransition()

  return useMemo(() => {
    const change = (method: 'push' | 'replace', href: string, options?: NavigationOptions) => {
      const { showProgress, ...routerOptions } = options ?? {}

      navigate(href, () => router[method](href, routerOptions), {
        showProgress: showProgress ?? options?.scroll !== false
      })
    }

    return {
      ...router,
      push: (href: string, options?: NavigationOptions) => change('push', href, options),
      replace: (href: string, options?: NavigationOptions) => change('replace', href, options),
      refresh: (options?: ActionOptions) => navigate(window.location.href, () => router.refresh(), { force: true, ...options }),
      // popstate starts history loading only when the browser actually has an entry.
      back: () => router.back(),
      forward: () => router.forward()
    }
  }, [router, navigate])
}
