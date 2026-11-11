const STORAGE_PREFIX = 'feature_tour'

export type FeatureTourCompletionState = 'completed' | 'skipped'

type BuildStorageKeyParams = {
    userCode?: string | null
    route: string
    tourId: string
    version: number
}

/**
 * Key includes userCode + route + tourId/version so re-running the tour for a different user,
 * a different screen, or a bumped `version` (breaking change to the steps) shows it again.
 */
export const buildFeatureTourStorageKey = ({ userCode, route, tourId, version }: BuildStorageKeyParams) => {
    const userSegment = userCode?.trim() || 'guest'

    return `${STORAGE_PREFIX}:${userSegment}:${route}:${tourId}-v${version}`
}

export const readFeatureTourState = (storageKey: string): FeatureTourCompletionState | null => {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(storageKey)

        return raw === 'completed' || raw === 'skipped' ? raw : null
    } catch {
        return null
    }
}

export const writeFeatureTourState = (storageKey: string, state: FeatureTourCompletionState) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(storageKey, state)
    } catch {
        // Ignore storage errors (private browsing, quota exceeded, etc.) - the tour just replays next time.
    }
}
