import type { ReactNode } from 'react'
import type { InferInput } from 'valibot'
import { createLoginSchema } from './schemas/auth'
import { Locale } from '@/configs/i18n'

export type ChildrenType = {
    children: ReactNode
}
export type Skin = 'default' | 'bordered'
export type Mode = 'system' | 'light' | 'dark'
export type SystemMode = 'light' | 'dark'
export type Layout = 'vertical' | 'collapsed' | 'horizontal'
export type LayoutComponentWidth = 'compact' | 'wide'
export type Direction = 'ltr' | 'rtl'


export type LayoutComponentPosition = 'fixed' | 'static'

export type ErrorType = {
    message: string[]
}
const exampleTranslator: any = {};
const loginSchemaInstance = createLoginSchema(exampleTranslator);

export type FormData = InferInput<typeof loginSchemaInstance>

export type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export type LanguageDataType = {
    langCode: Locale
    langName: string
}
