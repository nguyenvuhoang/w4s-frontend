'use client'

import { useState } from 'react'

import ApartmentIcon from '@mui/icons-material/Apartment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Button, Chip, List, ListItemButton, ListItemText, Popover, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import type { Locale } from '@/configs/i18n'

import type { ResidentApartmentItem } from '../../types'
import { getResidentRoleLabel, residentText, type ResidentDictionary } from './residentListHelpers'

type Props = {
    dictionary: ResidentDictionary
    locale?: Locale
    apartments: ResidentApartmentItem[]
}

const VISIBLE_LIMIT = 3

const apartmentKey = (apartment: ResidentApartmentItem) => `${apartment.resident_apartment_id ?? ''}-${apartment.apartment_id}`

const ApartmentChip = ({ apartment }: { apartment: ResidentApartmentItem }) => (
    <Chip
        size="small"
        variant="outlined"
        icon={apartment.is_representative ? <CheckCircleIcon fontSize="small" color="primary" /> : undefined}
        label={apartment.apartment_code || '-'}
        sx={{ fontWeight: 700, maxWidth: 160 }}
    />
)

const ResidentApartmentChips = ({ dictionary, locale, apartments }: Props) => {
    const [anchor_el, setAnchorEl] = useState<HTMLElement | null>(null)
    const visible = apartments.slice(0, VISIBLE_LIMIT)
    const remaining = apartments.length - visible.length
    const has_more = remaining > 0

    const handle_open = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handle_close = () => setAnchorEl(null)

    if (apartments.length === 0) {
        return <Typography variant="body2" color="text.secondary">-</Typography>
    }

    return (
        <>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                {visible.map(apartment => <ApartmentChip key={apartmentKey(apartment)} apartment={apartment} />)}
                {has_more && (
                    <Chip
                        size="small"
                        color="primary"
                        label={`+${remaining}`}
                        onMouseEnter={handle_open}
                        onClick={handle_open}
                        sx={{ fontWeight: 800, cursor: 'pointer' }}
                    />
                )}
            </Stack>

            <Button
                size="small"
                variant="outlined"
                startIcon={<ApartmentIcon fontSize="small" />}
                onClick={handle_open}
                sx={{ display: { xs: 'inline-flex', md: 'none' }, whiteSpace: 'nowrap' }}
            >
                {residentText(dictionary, 'apartments_button_view', 'Xem căn hộ')} ({apartments.length})
            </Button>

            <Popover
                open={Boolean(anchor_el)}
                anchorEl={anchor_el}
                onClose={handle_close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { p: 1.5, minWidth: 260, maxWidth: 340 }, onMouseLeave: handle_close } }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, px: 1, mb: 0.5 }}>
                    {residentText(dictionary, 'apartments_popover_title', 'Danh sách căn hộ')} ({apartments.length})
                </Typography>
                <List dense disablePadding>
                    {apartments.map(apartment => (
                        <ListItemButton
                            key={apartmentKey(apartment)}
                            component={Link}
                            href={`/${locale ?? 'vi'}/properties/unit/${apartment.apartment_id}`}
                            sx={{ borderRadius: 1, px: 1 }}
                        >
                            <ListItemText
                                primary={
                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                        <Typography sx={{ fontWeight: 800 }}>{apartment.apartment_code || '-'}</Typography>
                                        {apartment.is_representative && <CheckCircleIcon fontSize="small" color="primary" />}
                                    </Stack>
                                }
                                secondary={getResidentRoleLabel(dictionary, apartment.role)}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Popover>
        </>
    )
}

export default ResidentApartmentChips
