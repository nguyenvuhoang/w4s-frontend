import { projectText, type ProjectDictionary } from '../projectListHelpers'

/** Display label of a channel; an unknown backend value is shown as returned. */
export const templateChannelLabel = (dictionary: ProjectDictionary, channel: string) =>
  channel ? projectText(dictionary, `notificationTemplateChannel_${channel}`, channel) : '-'

/** Display label of a status; an unknown backend value is shown as returned. */
export const templateStatusLabel = (dictionary: ProjectDictionary, status: string) =>
  status ? projectText(dictionary, `notificationTemplateStatus_${status}`, status) : '-'
