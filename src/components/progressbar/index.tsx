'use client'

import { ProgressProvider } from '@bprogress/next/app';

const ProgressBarProgress = () => {
    return (
        <ProgressProvider
            height="4px"
            color="#002cf0ff"
            options={{ showSpinner: false }}
            shallowRouting
        >
        </ProgressProvider>
    )
}

export default ProgressBarProgress
