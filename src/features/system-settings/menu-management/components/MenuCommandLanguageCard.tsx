import LanguageRounded from '@mui/icons-material/LanguageRounded'
import { Divider, Stack, TextField, Typography } from '@mui/material'

import type { MenuCommandNameLanguage, MenuManagementDictionary } from '../types'
import MenuCommandDetailSection from './MenuCommandDetailSection'
import { menuManagementText } from './menuCommandHelpers'

type LanguageKey = 'vi' | 'en' | 'la'

type Props = {
  dictionary: MenuManagementDictionary
  names: MenuCommandNameLanguage
  editing?: boolean
  onChange?: (lang: LanguageKey, value: string) => void
  /** Which language rows to render. Defaults to all three (edit/detail keep showing Lao). */
  languages?: LanguageKey[]
}

const LANGUAGES: { key: LanguageKey; flag: string; labelKey: string; fallback: string }[] = [
  { key: 'vi', flag: '🇻🇳', labelKey: 'lang_vi', fallback: 'Tiếng Việt' },
  { key: 'en', flag: '🇺🇸', labelKey: 'lang_en', fallback: 'English' },
  { key: 'la', flag: '🇱🇦', labelKey: 'lang_la', fallback: 'Lào' }
]

// command_name_language is parsed upstream (menuCommandHelpers.parseCommandNameLanguage) — this
// component only ever renders the already-parsed { vi, en, la } object, never the raw JSON
// string, so a malformed value just falls through as empty flags/dashes instead of surfacing
// broken text. In edit mode each row's value becomes a text input instead — the caller
// (useMenuCommandEdit.save) re-serializes { vi, en, la } back into command_name_language with
// JSON.stringify, never manual string concatenation.
const MenuCommandLanguageCard = ({ dictionary, names, editing = false, onChange, languages }: Props) => (
  <MenuCommandDetailSection
    icon={<LanguageRounded color="primary" fontSize="small" />}
    title={menuManagementText(dictionary, 'section_multilingual', 'Tên đa ngôn ngữ')}
  >
    <Stack divider={<Divider sx={{ opacity: 0.5 }} />} spacing={editing ? 2 : 1.5}>
      {LANGUAGES.filter(lang => !languages || languages.includes(lang.key)).map(lang => {
        const value = names[lang.key] ?? ''
        const langLabel = menuManagementText(dictionary, lang.labelKey, lang.fallback)

        return (
          <Stack
            key={lang.key}
            direction={editing ? { xs: 'column', sm: 'row' } : 'row'}
            spacing={1.5}
            alignItems={editing ? { xs: 'flex-start', sm: 'center' } : 'center'}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: { sm: 160 } }}>
              <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }} aria-hidden>
                {lang.flag}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {langLabel}
              </Typography>
            </Stack>

            {editing ? (
              <TextField
                fullWidth
                size="small"
                placeholder={langLabel}
                value={value}
                onChange={event => onChange?.(lang.key, event.target.value)}
              />
            ) : (
              <Typography
                sx={{
                  fontWeight: value ? 600 : 400,
                  color: value ? 'text.primary' : 'text.disabled',
                  wordBreak: 'break-word'
                }}
              >
                {value || '—'}
              </Typography>
            )}
          </Stack>
        )
      })}
    </Stack>
  </MenuCommandDetailSection>
)

export default MenuCommandLanguageCard
