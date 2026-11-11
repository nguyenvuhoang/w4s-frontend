'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import { Locale } from '@/configs/i18n'
import { languageData } from '@/data/meta'
import ChangePasswordForm from '@features/user/components/ChangePasswordForm'
import { useUserSessions } from '@features/user/hooks/useUserSessions'
import type { UserSessionFilterModel, UserSessionSearchResponse } from '@features/user/types'
import { getDetailFullName } from '@features/staffs/services/staffService'
import { getStaffStatusLabel } from '@features/staffs/components/staff-list/staffListHelpers'
import type { UserAccountDetail, UserRoleDetail } from '@features/staffs/types'
import {
    Check,
    Email,
    Home,
    Lock,
    Person,
    Phone,
    Translate
} from '@mui/icons-material'
import {
    Alert,
    Avatar,
    Box,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { getDictionary } from '@utils/getDictionary'
import { Session } from 'next-auth'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

type PageProps = {
    account: UserAccountDetail | null
    avatarUrl: string
    roles: UserRoleDetail[]
    sessions: UserSessionSearchResponse
    sessionsFilter: UserSessionFilterModel
    sessionsError?: string | null
    sessiontoken?: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    locale: Locale
    session: Session | null
    error?: string | null
}

const AccountSettingContent = ({ account, avatarUrl, roles, sessions, sessionsFilter, sessionsError, sessiontoken, dictionary, locale, session, error }: PageProps) => {

    const [tab, setTab] = useState(0)

    const userSessions = useUserSessions({
        sessiontoken,
        language: locale,
        initialFilter: sessionsFilter,
        initialData: sessions,
        initialError: sessionsError
    })

    if (error || !account) {
        return (
            <Box className="max-w mx-auto px-4 py-10">
                <Alert severity="error">
                    {error || dictionary['staffs']?.detail_empty || 'User detail not found.'}
                </Alert>
            </Box>
        )
    }

    const fullName = getDetailFullName(account)
    const personalFields = [
        {
            name: 'fullName',
            label: dictionary['contract'].fullname,
            icon: <Person />,
            defaultValue: fullName,
        },
        {
            name: 'phone',
            label: dictionary['contract'].phonenumber,
            icon: <Phone />,
            defaultValue: account.phone ?? '',
        },
        {
            name: 'email',
            label: 'Email',
            icon: <Email />,
            defaultValue: account.email ?? '',
        },

        {
            name: 'gender',
            label: dictionary['contract'].gender,
            icon: null,
            defaultValue: account.gender ?? 1,
            type: 'select',
            options: [
                { label: dictionary['common'].male, value: 1 },
                { label: dictionary['common'].female, value: 0 },
            ]
        },
        {
            name: 'address',
            label: dictionary['contract'].address,
            icon: <Home />,
            defaultValue: account.address ?? '',
        }

    ]

    const { control, handleSubmit } = useForm({
        defaultValues: personalFields.reduce((acc, f) => {
            acc[f.name] = f.defaultValue
            return acc
        }, {} as Record<string, any>)
    })

    return (
        <Box className="max-w mx-auto px-4 py-10 space-y-8">
            <Paper elevation={4} className="rounded-3xl overflow-hidden">
                <Grid container>
                    {/* Sidebar */}
                    <Grid
                        size={{ xs: 12, md: 3 }}
                        className="bg-gradient-to-b from-green-50 to-white p-6 flex flex-col items-center rounded-xl shadow-md"
                    >
                        {/* Avatar */}
                        <Box className="bg-green-200 p-[3px] rounded-full shadow-sm">
                            <Avatar
                                src={avatarUrl || undefined}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    fontSize: 36,
                                    textTransform: 'uppercase',
                                    bgcolor: '#F3FDF6',
                                    border: '2px solid',
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }}
                            >
                                {(account.first_name?.[0] || account.login_name?.[0] || 'U')}
                            </Avatar>
                        </Box>

                        {/* Full name */}
                        <Typography variant="h5" mt={2} fontWeight="bold" textAlign="center" color='primary.main'>
                            {fullName}
                        </Typography>

                        {/* Email */}
                        <Typography variant="body2" color="primary.main" textAlign="center" gutterBottom>
                            {account.email}
                        </Typography>

                        <Divider sx={{ width: '100%', my: 1 }} />

                        {/* Roles */}
                        <Box className="w-full text-center">
                            <Typography variant="caption" className="text-green-700 font-semibold">
                                {dictionary['navigation'].roles}
                            </Typography>
                            {roles?.length > 0 ? (
                                <Box className="mt-1 flex flex-wrap justify-center gap-1">
                                    {roles.map((role, index) => (
                                        <Box
                                            key={role.role_id ?? index}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                        >
                                            {role.role_name}
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" className="text-gray-500 mt-1">
                                    {dictionary['common'].noroleselect}
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ width: '100%', my: 1 }} />

                        {/* Status */}
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {dictionary['common'].status}: {getStaffStatusLabel(dictionary, account.status || '')}
                        </Typography>
                    </Grid>


                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 9 }} className="bg-white px-6 py-8">
                        <Tabs
                            value={tab}
                            onChange={(_, newValue) => setTab(newValue)}
                            textColor="primary"
                            indicatorColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {[dictionary['common'].personalinfo, dictionary['common'].Security, dictionary['common'].Preferences, dictionary['common'].activity].map((label) => (
                                <Tab
                                    key={label}
                                    label={label}
                                    sx={{
                                        textTransform: 'none',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                        mx: 0.5,
                                        borderRadius: '8px',
                                        minHeight: 36,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                        },
                                    }}
                                />
                            ))}
                        </Tabs>


                        <Divider className="my-4" />

                        {tab === 0 && (
                            <Grid container spacing={3}>
                                {personalFields.map((field) => (
                                    <Grid key={field.name} size={{ xs: 12, sm: field.name === 'address' ? 12 : 6 }}>
                                        <Controller
                                            name={field.name}
                                            control={control}
                                            render={({ field: controllerField }) => (
                                                field.type === 'select' ? (
                                                    <TextField
                                                        {...controllerField}
                                                        select
                                                        label={field.label}
                                                        fullWidth
                                                        size="small"
                                                        color="primary"
                                                        sx={{
                                                            '& .MuiInputBase-input': {
                                                                color: 'primary.main',
                                                            },
                                                            '& .MuiInputLabel-root': {
                                                                color: 'primary.main',
                                                            },
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': {
                                                                    borderColor: 'primary.main',
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: 'primary.dark',
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: 'primary.main',
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {field.options?.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                ) : (
                                                    <TextField
                                                        {...controllerField}
                                                        label={field.label}
                                                        fullWidth
                                                        size="small"
                                                        type="text"
                                                        slotProps={{
                                                            input: {
                                                                startAdornment: field.icon ? (
                                                                    <InputAdornment position="start">{field.icon}</InputAdornment>
                                                                ) : undefined
                                                            }
                                                        }}
                                                        sx={{
                                                            '& .MuiInputBase-input': {
                                                                color: 'primary.main',
                                                            },
                                                            '& .MuiInputLabel-root': {
                                                                color: 'primary.main',
                                                            },
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': {
                                                                    borderColor: 'primary.main',
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: 'primary.dark',
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: 'primary.main',
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )
                                            )}
                                        />
                                    </Grid>
                                ))}

                            </Grid>

                        )}

                        {tab === 1 && (< ChangePasswordForm locale={locale} dictionary={dictionary} session={session} />)}

                        {tab === 2 && (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label={dictionary['common'].language}
                                        defaultValue={locale}
                                        fullWidth
                                        size="small"
                                        select
                                        disabled
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Translate />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                        color="primary"
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                color: 'primary.main',
                                                '&.Mui-disabled': {
                                                    color: 'primary.light',
                                                    WebkitTextFillColor: 'primary.light',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'primary.main',
                                                '&.Mui-disabled': {
                                                    color: 'primary.light',
                                                },
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'primary.dark',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                '&.Mui-disabled fieldset': {
                                                    borderColor: 'primary.light',
                                                },
                                            }
                                        }}

                                    >
                                        {languageData.map((lang) => (
                                            <MenuItem key={lang.langCode} value={lang.langCode}>
                                                {lang.langName}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label={dictionary['common'].lastlogin}
                                        value={account.last_login_time?.substring(0, 19) ?? ''}
                                        fullWidth
                                        size="small"
                                        disabled
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Lock />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                color: 'primary.main',
                                                '&.Mui-disabled': {
                                                    color: 'primary.light',
                                                    WebkitTextFillColor: 'primary.light',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'primary.main',
                                                '&.Mui-disabled': {
                                                    color: 'primary.light',
                                                },
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'primary.dark',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                                '&.Mui-disabled fieldset': {
                                                    borderColor: 'primary.light',
                                                },
                                            }
                                        }}

                                    />

                                </Grid>
                            </Grid>
                        )}

                        {tab === 3 && (
                            <Box>
                                <Typography variant="h5" color='primary.main' gutterBottom>
                                    {dictionary['common'].activity}
                                </Typography>

                                {userSessions.error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>{userSessions.error}</Alert>
                                )}

                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{
                                        borderColor: 'primary.main',
                                        opacity: userSessions.loading ? 0.6 : 1,
                                        '& .MuiTable-root': {
                                            borderCollapse: 'collapse',
                                        },
                                        '& .MuiTableCell-root': {
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                            <TableRow>
                                                {[
                                                    dictionary['common'].createdat,
                                                    dictionary['common'].lastactive,
                                                    dictionary['common'].ipaddress,
                                                    dictionary['common'].device,
                                                    dictionary['common'].session,
                                                    dictionary['common'].isrevoked
                                                ].map((label, idx) => (
                                                    <TableCell
                                                        key={idx}
                                                        sx={{ color: 'white', fontSize: '0.95rem', borderColor: 'primary.main' }}
                                                    >
                                                        {label}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {userSessions.rows.length === 0 && !userSessions.loading && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ color: 'grey.600' }}>
                                                        {dictionary['common'].nodata ?? '-'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {userSessions.rows.map((item, idx) => (
                                                <TableRow
                                                    key={item.id || idx}
                                                    sx={{
                                                        backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                                                        '& td': {
                                                            color: 'grey.600',
                                                            borderColor: 'primary.main'
                                                        }
                                                    }}
                                                >
                                                    <TableCell>{item.created_on_utc?.replace('T', ' ').substring(0, 19) || ''}</TableCell>
                                                    <TableCell>{item.updated_on_utc?.replace('T', ' ').substring(0, 19) || ''}</TableCell>
                                                    <TableCell>{item.ip_address || '-'}</TableCell>
                                                    <TableCell>{item.device || '-'}</TableCell>
                                                    <TableCell>{item.id || '-'}</TableCell>
                                                    <TableCell>
                                                        {item.is_revoked ? (
                                                            <Check color="error" fontSize="small" />
                                                        ) : (
                                                            <Check color="success" fontSize="small" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {userSessions.totalCount > 0 && (
                                    <PaginationPage
                                        totalResults={userSessions.totalCount}
                                        pageSize={userSessions.filter.page_size}
                                        page={userSessions.filter.page_index}
                                        jumpPage={userSessions.filter.page_index}
                                        handlePageChange={userSessions.handlePageChange}
                                        handlePageSizeChange={userSessions.handlePageSizeChange}
                                        handleJumpPage={userSessions.handleJumpPage}
                                        dictionary={dictionary}
                                    />
                                )}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Paper>


        </Box>
    )
}

export default AccountSettingContent

