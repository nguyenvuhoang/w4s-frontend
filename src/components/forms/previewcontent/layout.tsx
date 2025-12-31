'use client'

import { getDictionary } from '@/utils/getDictionary'
import DynamicPageGenericPreview from './dynamic-page-generic'

type Props = {
    data: any
    dictionary: Awaited<ReturnType<typeof getDictionary>>,
}

const PreviewLayout = ({ data, dictionary }: Props) => {
    return (
        data && <DynamicPageGenericPreview formlayout={data} language={'en'} dictionary={dictionary} />
    )
}

export default PreviewLayout
