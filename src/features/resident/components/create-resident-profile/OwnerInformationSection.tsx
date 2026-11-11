import BadgeIcon from '@mui/icons-material/Badge'
import { Grid } from '@mui/material'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

import CountryLookup from '@/shared/components/country-lookup/CountryLookup'
import { countryLookupLabel, type CountryLookupOption } from '@/shared/services/countryLookupService'
import { ResidentProfileFormValues } from '../../types'
import { FormSelectField, FormTextField, ResidentDictionary, SectionCard, residentOptions, text } from './formControls'

type Props = {
    control: Control<ResidentProfileFormValues>
    dict: ResidentDictionary
    requiredMessage: string
    emptyLabel: string
    sessiontoken?: string
    locale: string
    setValue: UseFormSetValue<ResidentProfileFormValues>
}

export function OwnerInformationSection({ control, dict, requiredMessage, emptyLabel, sessiontoken, locale, setValue }: Props) {
    const options = residentOptions(dict)
    const phoneRequiredMessage = text(dict, 'create_phone_required', 'Please enter a phone number.')
    const emailRequiredMessage = text(dict, 'email_required', 'Please enter an email.')
    const invalidEmailMessage = text(dict, 'validation_email', 'Email format is invalid.')

    return (
        <SectionCard title={text(dict, 'section_owner_information', 'Thông tin cư dân')} icon={<BadgeIcon sx={{ fontSize: 24, color: 'white' }} />}>
            <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField control={control} name="fullName" label={text(dict, 'full_name', 'Họ tên')} required requiredMessage={requiredMessage} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                        control={control}
                        name="phoneNumber"
                        label={text(dict, 'phone_number', 'Số điện thoại')}
                        required
                        requiredMessage={phoneRequiredMessage}
                        rules={{
                            validate: value => String(value ?? '').trim() ? true : phoneRequiredMessage
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                        control={control}
                        name="email"
                        label={text(dict, 'email', 'Email')}
                        required
                        requiredMessage={requiredMessage}
                        rules={{
                            validate: value => {
                                const email = String(value ?? '').trim()

                                if (!email) return emailRequiredMessage

                                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || invalidEmailMessage
                            }
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormSelectField control={control} name="gender" label={text(dict, 'gender', 'Giới tính')} options={options.gender} required requiredMessage={requiredMessage} emptyLabel={emptyLabel} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField control={control} name="dateOfBirth" label={text(dict, 'date_of_birth', 'Ngày sinh')} type="date" requiredMessage={requiredMessage} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField control={control} name="identityNo" label={text(dict, 'identity_no', 'CCCD / Hộ chiếu')} requiredMessage={requiredMessage} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="nationalityCountryId"
                        control={control}
                        render={({ field, fieldState }) => (
                            <CountryLookup
                                sessiontoken={sessiontoken}
                                language={locale}
                                label={text(dict, 'nationality', 'Quốc gia')}
                                value={field.value}
                                error={Boolean(fieldState.error)}
                                helperText={fieldState.error?.message}
                                onChange={(country: CountryLookupOption | null) => {
                                    field.onChange(country?.country_id ?? '')
                                    setValue('nationality', country ? countryLookupLabel(country, locale) : '', { shouldDirty: true })
                                }}
                                messages={{
                                    searchTitle: text(dict, 'country_lookup_title', 'Tìm kiếm quốc gia'),
                                    searchLabel: text(dict, 'country_lookup_search_label', 'Tìm theo tên hoặc mã quốc gia'),
                                    countryCodeLabel: text(dict, 'country_code', 'Mã quốc gia'),
                                    searchButtonLabel: text(dict, 'search', 'Tìm kiếm'),
                                    selectLabel: text(dict, 'country_lookup_select', 'Chọn quốc gia'),
                                    emptyText: text(dict, 'country_lookup_empty', 'Không tìm thấy quốc gia phù hợp.'),
                                    errorReferenceLabel: text(dict, 'country_lookup_error_reference', 'Mã tra cứu lỗi'),
                                    clearLabel: text(dict, 'country_lookup_clear', 'Xóa quốc gia')
                                }}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <FormTextField control={control} name="description" label={text(dict, 'description', 'Mô tả')} requiredMessage={requiredMessage} multiline minRows={3} />
                </Grid>
            </Grid>
        </SectionCard>
    )
}
