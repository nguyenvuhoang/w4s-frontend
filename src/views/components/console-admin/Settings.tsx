'use client'
import NoData from '@components/layout/shared/card/nodata'
import { SERVICES } from '@/data/meta'
import { dataService } from '@/servers/system-service'
import { SettingItem } from '@shared/types/bankType'
import { getDictionary } from '@utils/getDictionary'
import { isValidResponse } from '@utils/isValidResponse'
import SwalAlert from '@utils/SwalAlert'
import {
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { Session } from 'next-auth'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'


const Settings = ({ session, dictionary }: {
    session: Session | null,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [selectedService, setSelectedService] = useState<string>('CMS')
    const [data, setData] = useState<SettingItem[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [page, setPage] = useState<number>(0)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [updatedItemId, setUpdatedItemId] = useState<number | null>(null)

    const fetchSettings = useCallback(async (service: string, pageIndex = 1) => {
        setLoading(true)
        try {
            const dataSearchAPI = await dataService.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `${service}_SEARCH_SETTING`,
                searchtext: '',
                pageSize: rowsPerPage,
                pageIndex: pageIndex
            })

            if (
                !isValidResponse(dataSearchAPI) ||
                (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
            ) {
                console.log(dataSearchAPI.payload.dataresponse.errors);
                const execute_id = dataSearchAPI.payload.dataresponse.errors[0].execute_id
                const errorinfo = dataSearchAPI.payload.dataresponse.errors[0].info
                SwalAlert('error', `[${execute_id}] - ${errorinfo}`, 'center');
                setData([])
            }

            const dataSystem = dataSearchAPI.payload.dataresponse.data
            setData(dataSystem.items || [])
            setTotalCount(dataSystem.total_count || 0)
        } catch (err) {
            console.error('Error fetching settings:', err)
            setData([])
        } finally {
            setLoading(false)
        }
    }, [rowsPerPage, session?.user?.token])

    const handleChangeService = (event: SelectChangeEvent) => {
        setSelectedService(event.target.value)
        setPage(0)
    }

    const handleValueChange = async (id: number, name: string, newValue: string) => {
        const oldItem = data.find((item) => item.id === id)
        if (!oldItem || oldItem.value === newValue) return

        try {
            const updateAPI = await dataService.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `${selectedService}_UPDATE_SETTING`,
                data: {
                    id: id,
                    name: name,
                    value: newValue
                }
            })

            if (
                !isValidResponse(updateAPI) ||
                (updateAPI.payload.dataresponse.errors && updateAPI.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = updateAPI.payload.dataresponse.errors[0].execute_id
                const errorinfo = updateAPI.payload.dataresponse.errors[0].info
                SwalAlert('error', `[${execute_id}] - ${errorinfo}`, 'center');
                return
            }

            setData((prev) =>
                prev.map((item) => (item.id === id ? { ...item, value: newValue } : item))
            )
            setUpdatedItemId(id)
            toast.success('Update successful!')

            setTimeout(() => {
                setUpdatedItemId(null)
            }, 800)
        } catch (err) {
            console.error('Failed to update value', err)
        }
    }

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    useEffect(() => {
        fetchSettings(selectedService, page)
    }, [fetchSettings, selectedService, page])

    return (

        <Box sx={{ position: 'relative', mx: 'auto', mt: 6 }}>
            <Typography
                variant="h5"
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 32, // align vá»›i padding cá»§a Paper (p: 4 = 32px)
                    transform: 'translateY(-50%)',
                    backgroundColor: '#fcfcfc', // khá»›p mÃ u Paper
                    px: 1.5,
                    fontSize: '1rem',
                    color: 'primary.main',
                    zIndex: 1,
                }}
            >
                {dictionary['setting'].systemparameters}
            </Typography>
            <Paper
                elevation={3}
                sx={{
                    borderRadius: 3,
                    p: 10,
                    backgroundColor: '#fcfcfc',
                    maxWidth: '100%',
                    border: '1px solid #e0e0e0',
                }}
            >
                <FormControl fullWidth className="mb-6" variant="outlined" sx={{ minWidth: 240 }}>
                    <InputLabel id="service-select-label">{dictionary['common'].selectservice}</InputLabel>
                    <Select
                        labelId="service-select-label"
                        value={selectedService}
                        label={dictionary['common'].selectservice}
                        onChange={handleChangeService}
                        sx={{
                            backgroundColor: '#fff',
                            borderRadius: 2,
                        }}
                    >
                        {SERVICES.map((service) => (
                            <MenuItem key={service} value={service}>
                                {service}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : data.length === 0 ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="50vh"
                    >
                        <NoData text={dictionary['common'].nodata} width={100} height={100} />
                    </Box>
                ) : (
                    <>
                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: '30%' }}>Name</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: '60%' }}>Value</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            hover
                                            sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
                                        >
                                            <TableCell
                                                sx={{
                                                    width: '30%',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {item.name}
                                            </TableCell>
                                            <TableCell sx={{ width: '60%' }}>
                                                <TextField
                                                    variant="standard"
                                                    fullWidth

                                                    defaultValue={item.value}
                                                    onBlur={(e) => handleValueChange(item.id, item.name, e.target.value)}
                                                    slotProps={{
                                                        input: {
                                                            onFocus: (e) => e.target.select(),
                                                            onKeyDown: (e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur()
                                                                }
                                                            },
                                                            disableUnderline: false,
                                                            sx: {
                                                                padding: 0,
                                                                cursor: 'text',
                                                                backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                fontSize: '0.875rem',
                                                                fontFamily: 'Quicksand, sans-serif',
                                                                '&:hover': {
                                                                    backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent'
                                                                },
                                                                '&.Mui-focused': {
                                                                    backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                    border: 'none',
                                                                    boxShadow: 'none'
                                                                },
                                                                '&:before': {
                                                                    borderBottom: 'none !important',
                                                                },
                                                                '&:hover:before': {
                                                                    borderBottom: 'none !important',
                                                                },
                                                            }
                                                        }
                                                    }}
                                                    sx={{
                                                        fontSize: '0.875rem',
                                                        fontFamily: 'Quicksand, sans-serif'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>

                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 20]}
                            sx={{
                                borderTop: '1px solid #eee',
                                mt: 2
                            }}
                        />
                    </>
                )}
            </Paper>
        </Box>
    )
}

export default Settings

