'use client'

import PaginationPage from '@/@core/components/jTable/pagination'
import { Locale } from '@/configs/i18n'
import { languageData } from '@/data/meta'
import ChangePasswordForm from '@features/user/components/ChangePasswordForm'
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
    Avatar,
    Box,
    Divider,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    SelectChangeEvent,
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
import { AccountActivity, UserAccount } from '@shared/types/bankType'
import { PageData } from '@shared/types/systemTypes'
import { getDictionary } from '@utils/getDictionary'
import { Session } from 'next-auth'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

type PageProps = {
    userdata: UserAccount
    useractivity: PageData<AccountActivity>
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    locale: Locale
    session: Session | null
}

const AccountSettingContent = ({ userdata, useractivity, dictionary, locale, session }: PageProps) => {


    const [tab, setTab] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10);
    const [jumpPage, setJumpPage] = useState(1);

    const pagedItems = useractivity?.items?.slice((page - 1) * pageSize, page * pageSize)
    console.log('useractivity', useractivity);
    const personalFields = [
        {
            name: 'fullName',
            label: dictionary['contract'].fullname,
            icon: <Person />,
            defaultValue: [userdata.firstname, userdata.middlename, userdata.lastname].filter(Boolean).join(' '),
        },
        {
            name: 'phone',
            label: dictionary['contract'].phonenumber,
            icon: <Phone />,
            defaultValue: userdata.phone ?? '',
        },
        {
            name: 'email',
            label: 'Email',
            icon: <Email />,
            defaultValue: userdata.email ?? '',
        },

        {
            name: 'gender',
            label: dictionary['contract'].gender,
            icon: null,
            defaultValue: userdata.gender ?? '',
            type: 'select',
            options: [
                { label: dictionary['common'].male, value: 'M' },
                { label: dictionary['common'].female, value: 'F' },
            ]
        },
        {
            name: 'address',
            label: dictionary['contract'].address,
            icon: <Home />,
            defaultValue: userdata.address ?? '',
        }

    ]

    const { control, handleSubmit } = useForm({
        defaultValues: personalFields.reduce((acc, f) => {
            acc[f.name] = f.defaultValue
            return acc
        }, {} as Record<string, any>)
    })

    let totalResults = Math.ceil(useractivity.items.length / pageSize);

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (value > 0 && value <= totalResults) {
            setJumpPage(value);
            setPage(value);
        }
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        if (value !== page) {
            setPage(value);
        }
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const newSize = Number(event.target.value);
        if (newSize !== pageSize) {
            setPageSize(newSize);
        }
    };

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
                                {(userdata?.firstname?.[0] || 'U')}
                            </Avatar>
                        </Box>

                        {/* Full name */}
                        <Typography variant="h5" mt={2} fontWeight="bold" textAlign="center" color='primary.main'>
                            {[userdata?.firstname, userdata?.middlename, userdata?.lastname]
                                .filter(Boolean)
                                .join(' ')}
                        </Typography>

                        {/* Email */}
                        <Typography variant="body2" color="primary.main" textAlign="center" gutterBottom>
                            {userdata?.email}
                        </Typography>

                        <Divider sx={{ width: '100%', my: 1 }} />

                        {/* Roles */}
                        <Box className="w-full text-center">
                            <Typography variant="caption" className="text-green-700 font-semibold">
                                {dictionary['navigation'].roles}
                            </Typography>
                            {userdata.usergroup?.length > 0 ? (
                                <Box className="mt-1 flex flex-wrap justify-center gap-1">
                                    {userdata.usergroup.map((role: any, index: number) => (
                                        <Box
                                            key={index}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                        >
                                            {role.rolename}
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
                            {dictionary['common'].status}: {userdata.statuscaption}
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
                                        value={userdata.lastlogintime?.substring(0, 19) ?? ''}
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
                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{
                                        borderColor: 'primary.main',
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
                                            {pagedItems.map((session, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    sx={{
                                                        backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                                                        '& td': {
                                                            color: 'grey.600',
                                                            borderColor: 'primary.main'
                                                        }
                                                    }}
                                                >
                                                    <TableCell>{session.createdonutc?.replace('T', ' ').substring(0, 19) || ''}</TableCell>
                                                    <TableCell>{session.updatedonutc?.replace('T', ' ').substring(0, 19) || ''}</TableCell>
                                                    <TableCell>{session.ipaddress || '-'}</TableCell>
                                                    <TableCell>{session.device || '-'}</TableCell>
                                                    <TableCell>{session.token || '-'}</TableCell>
                                                    <TableCell>
                                                        {session.isrevoked ? (
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

                                <PaginationPage
                                    totalResults={Math.ceil(useractivity.items.length / pageSize)}
                                    pageSize={pageSize}
                                    page={page}
                                    jumpPage={jumpPage}
                                    handlePageChange={handlePageChange}
                                    handlePageSizeChange={handlePageSizeChange}
                                    handleJumpPage={handleJumpPage}
                                    dictionary={dictionary}
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Paper>


        </Box>
    )
}

export default AccountSettingContent

