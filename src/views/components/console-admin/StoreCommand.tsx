'use client'
import NoData from '@/components/layout/shared/card/nodata'
import { SERVICES } from '@/data/meta'
import { dataService } from '@/servers/system-service'
import { StoreCommandType } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import SwalAlert from '@/utils/SwalAlert'
import {
    Box,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
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

type SettingItem = {
    id: number
    name: string
    value: string
    organization_id: string
}

const StoreCommand = ({ session, dictionary }: {
    session: Session | null,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [selectedService, setSelectedService] = useState<string>('CMS')
    const [data, setData] = useState<StoreCommandType[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [page, setPage] = useState<number>(0)
    const [rowsPerPage, setRowsPerPage] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [updatedItemId, setUpdatedItemId] = useState<number | null>(null)
    const [openModal, setOpenModal] = useState(false)
    const [selectedQuery, setSelectedQuery] = useState<string>('')

    const fetchStoreCommand = useCallback(async (service: string, pageIndex = 1) => {
        setLoading(true)
        try {
            const dataSearchAPI = await dataService.searchSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `${service}_SEARCH_STORECOMMAND`,
                searchtext: '',
                pageSize: rowsPerPage,
                pageIndex: pageIndex
            })

            if (
                !isValidResponse(dataSearchAPI) ||
                (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
            ) {
                const execute_id = dataSearchAPI.payload.dataresponse.errors[0].execute_id
                const errorinfo = dataSearchAPI.payload.dataresponse.errors[0].info
                SwalAlert('error', `[${execute_id}] - ${errorinfo}`, 'center')
                setData([])
                return
            }

            const dataSystem = dataSearchAPI.payload.dataresponse.data.input
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

    const handleFieldChange = async (id: number, name: string, field: 'query' | 'description', newValue: string) => {
        const oldItem = data.find((item) => item.id === id)
        if (!oldItem || oldItem[field] === newValue) return

        try {
            const updateAPI = await dataService.updateSystemData({
                sessiontoken: session?.user?.token as string,
                workflowid: `${selectedService}_UPDATE_SETTING`,
                data: {
                    id: id,
                    name: name,
                    [field]: newValue
                }
            })

            if (!isValidResponse(updateAPI) ||
                (updateAPI.payload.dataresponse.errors && updateAPI.payload.dataresponse.errors.length > 0)) {
                const execute_id = updateAPI.payload.dataresponse.errors[0].execute_id
                const errorinfo = updateAPI.payload.dataresponse.errors[0].info
                SwalAlert('error', `[${execute_id}] - ${errorinfo}`, 'center');
                return
            }

            setData((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, [field]: newValue } : item
                )
            )
            setUpdatedItemId(id)
            toast.success('Update successful!')

            setTimeout(() => {
                setUpdatedItemId(null)
            }, 800)
        } catch (err) {
            console.error(`Failed to update ${field}`, err)
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
        fetchStoreCommand(selectedService, page)
    }, [fetchStoreCommand, selectedService, page])


    const handleOpenModal = (query: string) => {
        setSelectedQuery(query)
        setOpenModal(true)
    }
    const handleCloseModal = () => {
        setOpenModal(false)
        setSelectedQuery('')
    }


    return (
        <Box className="max-w mx-auto py-6 px-4 space-y-6">
            <Typography variant="h6" className="mb-4">{dictionary['common'].storedcommand}</Typography>

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
                        <Table sx={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '45%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                            </colgroup>

                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].name}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].query}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].type}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].description}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].createonutc}</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{dictionary['common'].updatedonutc}</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {data.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        hover
                                        sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
                                    >
                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="flex-start" gap={1}>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <TextField
                                                        variant="standard"
                                                        fullWidth
                                                        defaultValue={item.query}
                                                        onBlur={(e) => handleFieldChange(item.id, item.name, 'query', e.target.value)}
                                                        slotProps={{
                                                            input: {
                                                                onFocus: (e) => e.target.select(),
                                                                onKeyDown: (e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                },
                                                                sx: {
                                                                    padding: 0,
                                                                    cursor: 'text',
                                                                    backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                    fontSize: '0.875rem',
                                                                    fontFamily: 'Quicksand, sans-serif',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    '&:hover': {
                                                                        backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                    },
                                                                    '&.Mui-focused': {
                                                                        backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                        border: 'none',
                                                                        boxShadow: 'none',
                                                                    },
                                                                    '&:before': {
                                                                        borderBottom: 'none !important',
                                                                    },
                                                                    '&:hover:before': {
                                                                        borderBottom: 'none !important',
                                                                    },
                                                                },
                                                            }
                                                        }}
                                                        sx={{
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Quicksand, sans-serif'
                                                        }}
                                                    />
                                                </Box>
                                                <Box display="flex" gap={0.5} mt={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigator.clipboard.writeText(item.query)}
                                                        title="Copy query"
                                                    >
                                                        📋
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenModal(item.query)}
                                                        title="View full"
                                                    >
                                                        🔍
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.type}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                defaultValue={item.description}
                                                onBlur={(e) => handleFieldChange(item.id, item.name, 'description', e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        onFocus: (e) => e.target.select(),
                                                        onKeyDown: (e) => {
                                                            if (e.key === 'Enter') e.currentTarget.blur()
                                                        },
                                                        sx: {
                                                            padding: 0,
                                                            cursor: 'text',
                                                            backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'Quicksand, sans-serif',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            '&:hover': {
                                                                backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                            },
                                                            '&.Mui-focused': {
                                                                backgroundColor: updatedItemId === item.id ? '#e0f8e9' : 'transparent',
                                                                border: 'none',
                                                                boxShadow: 'none',
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
                                            />
                                        </TableCell>

                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.created_on_utc ? new Date(item.created_on_utc).toLocaleString() : '--'}
                                        </TableCell>

                                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.updated_on_utc ? new Date(item.updated_on_utc).toLocaleString() : '--'}
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


            <Modal
                open={openModal}
                onClose={handleCloseModal}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    width: '80%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    p: 4
                }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        SQL Query
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            backgroundColor: '#f6f6f6',
                            p: 2,
                            borderRadius: 1
                        }}
                    >
                        {selectedQuery}
                    </Box>
                </Box>
            </Modal>

        </Box>
    )
}

export default StoreCommand
