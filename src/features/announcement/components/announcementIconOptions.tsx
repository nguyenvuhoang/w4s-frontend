'use client'

import type { SvgIconComponent } from '@mui/icons-material'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import ApartmentIcon from '@mui/icons-material/Apartment'
import BuildIcon from '@mui/icons-material/Build'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CampaignIcon from '@mui/icons-material/Campaign'
import ChatIcon from '@mui/icons-material/Chat'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DescriptionIcon from '@mui/icons-material/Description'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import EventIcon from '@mui/icons-material/Event'
import HomeIcon from '@mui/icons-material/Home'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PaymentIcon from '@mui/icons-material/Payment'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import SecurityIcon from '@mui/icons-material/Security'
import SettingsIcon from '@mui/icons-material/Settings'
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

import type { AnnouncementDictionary } from '../types'

export type AnnouncementIconOption = {
    key: string
    label: string
    icon: SvgIconComponent
    aliases?: string[]
}

export const announcementIconOptions: AnnouncementIconOption[] = [
    { key: 'notifications', label: 'Notifications', icon: NotificationsOutlinedIcon, aliases: ['default', 'notification'] },
    { key: 'campaign', label: 'Campaign', icon: CampaignIcon },
    { key: 'info', label: 'Info', icon: InfoOutlinedIcon },
    { key: 'warning', label: 'Warning', icon: WarningAmberOutlinedIcon, aliases: ['alert'] },
    { key: 'error', label: 'Error', icon: ErrorOutlineIcon },
    { key: 'check_circle', label: 'Check Circle', icon: CheckCircleIcon, aliases: ['success'] },
    { key: 'mail', label: 'Mail', icon: MailOutlineIcon, aliases: ['email'] },
    { key: 'sms', label: 'SMS', icon: SmsOutlinedIcon, aliases: ['message'] },
    { key: 'chat', label: 'Chat', icon: ChatIcon },
    { key: 'event', label: 'Event', icon: EventIcon },
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'apartment', label: 'Apartment', icon: ApartmentIcon, aliases: ['building'] },
    { key: 'build', label: 'Build', icon: BuildIcon, aliases: ['tools', 'maintenance'] },
    { key: 'payment', label: 'Payment', icon: PaymentIcon },
    { key: 'receipt', label: 'Receipt', icon: ReceiptLongIcon, aliases: ['invoice'] },
    { key: 'description', label: 'Description', icon: DescriptionIcon, aliases: ['document'] },
    { key: 'security', label: 'Security', icon: SecurityIcon },
    { key: 'report_problem', label: 'Report Problem', icon: ReportProblemOutlinedIcon },
    { key: 'support_agent', label: 'Support Agent', icon: SupportAgentIcon, aliases: ['support'] },
    { key: 'local_offer', label: 'Local Offer', icon: LocalOfferIcon, aliases: ['tag'] },
    { key: 'inventory', label: 'Inventory', icon: InventoryIcon, aliases: ['storage'] },
    { key: 'calendar_month', label: 'Calendar Month', icon: CalendarMonthIcon, aliases: ['calendar', 'date'] },
    { key: 'people', label: 'People', icon: PeopleIcon, aliases: ['group'] },
    { key: 'person', label: 'Person', icon: PersonIcon, aliases: ['user'] },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
    { key: 'announcement', label: 'Announcement', icon: AnnouncementIcon, aliases: ['notice'] }
]

const LEGACY_ICON_KEY_MAP: Record<string, string> = {
    DEFAULT: 'notifications',
    EMAIL: 'mail',
    SMS: 'sms',
    WARNING: 'warning',
    INFO: 'info'
}

export const getAnnouncementIconOption = (iconKey?: string, notificationType?: string) => {
    const resolvedKey = resolveAnnouncementIconKey(iconKey, notificationType)

    return announcementIconOptions.find(item => item.key === resolvedKey) ?? announcementIconOptions[0]
}

export const resolveAnnouncementIconKey = (iconKey?: string, notificationType?: string) => {
    if (!iconKey || iconKey === 'DEFAULT') {
        if (notificationType === 'EMAIL') return 'mail'
        if (notificationType === 'SMS') return 'sms'

        return 'notifications'
    }

    const normalizedKey = LEGACY_ICON_KEY_MAP[iconKey] ?? iconKey.toLowerCase()
    const hasOption = announcementIconOptions.some(item => item.key === normalizedKey)

    return hasOption ? normalizedKey : 'notifications'
}

export const getAnnouncementIconLabel = (
    dictionary: AnnouncementDictionary,
    key: string,
    fallbackLabel: string
) => {
    if (key === 'notifications') {
        return dictionary?.announcement?.default_notification_icon ?? fallbackLabel
    }

    return fallbackLabel
}
