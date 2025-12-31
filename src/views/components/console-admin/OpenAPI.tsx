'use client'

import {
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    SelectChangeEvent
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { systemServiceApi } from '@/servers/system-service'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import NoData from '@/components/layout/shared/card/nodata'
import { Session } from 'next-auth'
import { getDictionary } from '@/utils/getDictionary'
import { SERVICES } from '@/data/meta'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type OpenAPIStep = {
    id: number
    step_code: string
    full_class_name: string
    method_name: string | null
    should_await: boolean
    is_inquiry: boolean
}

const OpenAPI = ({ session, dictionary }: {
    session: Session | null,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [data, setData] = useState<OpenAPIStep[]>([])
    const [loading, setLoading] = useState(false)
    const [updatedItemId, setUpdatedItemId] = useState<number | null>(null)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [selectedService, setSelectedService] = useState<string>('CMS')
    const [totalCount, setTotalCount] = useState<number>(0)


    const fetchOpenAPI = useCallback(async (service: string, pageIndex = 0) => {
        setLoading(true)
        try {
            const dataSearchAPI = await systemServiceApi.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `${service}_SEARCH_O24SERVICE`,
                searchtext: '',
                pageSize: rowsPerPage,
                pageIndex: pageIndex
            })

            if (
                !isValidResponse(dataSearchAPI) ||
                (dataSearchAPI.payload.dataresponse.error && dataSearchAPI.payload.dataresponse.error.length > 0)
            ) {
                const execute_id = dataSearchAPI.payload.dataresponse.error[0].execute_id
                const errorinfo = dataSearchAPI.payload.dataresponse.error[0].info
                SwalAlert('error', `[${execute_id}] - ${errorinfo}`, 'center');
                setData([])
                return
            }

            const steps = dataSearchAPI.payload.dataresponse.fo[0].input
            setData(steps.items || [])
            setTotalCount(steps.total_count || 0)
        } catch (error) {
            console.error('Failed to fetch OpenAPI data:', error)
        } finally {
            setLoading(false)
        }
    }, [rowsPerPage, session?.user?.token])

    const handleChangeService = (event: SelectChangeEvent) => {
        setSelectedService(event.target.value)
        setPage(0)
    }

    const handleValueChange = async (id: number, newValue: string) => {
        const old = data.find(d => d.id === id)
        if (!old || old.method_name === newValue) return

        try {
            const response = await systemServiceApi.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: 'O24OPENAPI_UPDATE_QUEUE_STEP',
                data: {
                    id,
                    method_name: newValue
                }
            })

            if (
                !isValidResponse(response) ||
                response.payload.dataresponse.error?.length > 0
            ) {
                const error = response.payload.dataresponse.error[0]
                SwalAlert('error', `[${error.execute_id}] - ${error.info}`, 'center')
                return
            }

            setData(prev => prev.map(item => item.id === id ? { ...item, method_name: newValue } : item))
            setUpdatedItemId(id)
            toast.success('Update successful!')
            setTimeout(() => setUpdatedItemId(null), 800)
        } catch (err) {
            console.error('Update error:', err)
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
        fetchOpenAPI(selectedService, page)
    }, [fetchOpenAPI, selectedService, page])

    return (
        <Box className="max-w mx-auto py-6 px-4 space-y-6">
            <Typography variant="h6" className="mb-4">{dictionary['common'].openapistep}</Typography>
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
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <NoData text={dictionary['common'].nodata} width={100} height={100} />
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].stepcode}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].classname}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].methodname}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].await}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].inquiry}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((item, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{item.step_code}</TableCell>
                                        <TableCell>{item.full_class_name}</TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                defaultValue={item.method_name ?? ''}
                                                onBlur={(e) => handleValueChange(item.id, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') e.currentTarget.blur()
                                                }}
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
                                        <TableCell>
                                            {item.should_await && <CheckCircleIcon color="success" fontSize="small" />}
                                        </TableCell>
                                        <TableCell>
                                            {item.is_inquiry && <CheckCircleIcon color="success" fontSize="small" />}
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
        </Box>
    )
}

export default OpenAPI
