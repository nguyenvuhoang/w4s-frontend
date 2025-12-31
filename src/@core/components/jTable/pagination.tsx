'use client'

import { getDictionary } from '@/utils/getDictionary'
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select, SelectChangeEvent, TextField, Typography } from '@mui/material'
import React from 'react'

type Props = {
    totalResults: number
    pageSize: number
    page: number
    jumpPage: number
    handlePageChange: ((event: React.ChangeEvent<unknown>, page: number) => void) | undefined
    handlePageSizeChange: (event: SelectChangeEvent<number>, child?: React.ReactNode) => void | Promise<void>
    handleJumpPage: (React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined)
    dictionary?: Awaited<ReturnType<typeof getDictionary>>;
}

const PaginationPage = ({
    totalResults,
    pageSize,
    page,
    jumpPage,
    handlePageChange,
    handlePageSizeChange,
    handleJumpPage,
    dictionary
}: Props) => {


    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={2}
            flexWrap="wrap"
        >
            {/* Left: Show dropdown */}
            <Box display="flex" alignItems="center" mb={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="select-page" shrink>
                        {dictionary?.common.show || 'Show'}
                    </InputLabel>
                    <Select
                        labelId="select-page"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        label="Show"
                        sx={{
                            '&.MuiOutlinedInput-root': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#048d48a1 !important',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#8e8e8e !important',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#03492a !important',
                                },
                                '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#d32f2f !important',
                                },
                            },
                        }}
                    >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </FormControl>

                <Typography ml={2} fontSize={14} color="#225087">
                    in {totalResults} {dictionary?.common.resulttransaction || 'results'}
                </Typography>
            </Box>

            {/* Center: Pagination */}
            <Pagination
                count={Math.ceil(totalResults / pageSize)}
                page={page}
                onChange={handlePageChange}
                sx={{
                    '.MuiPaginationItem-root': {
                        color: '#225087',
                    },
                    '.MuiPaginationItem-root.Mui-selected': {
                        backgroundColor: '#225087 !important',
                        color: 'white !important',
                        fontWeight: 'bold !important',
                    },
                    '.MuiPaginationItem-root.Mui-selected:hover': {
                        backgroundColor: '#1780AC !important',
                    },
                }}
            />

            {/* Right: Jump to page */}
            <Box display="flex" alignItems="center" mb={2}>
                <Typography mr={2} fontSize={14} color="#225087">
                    {dictionary?.common.jumptopage || 'Jump to page'}
                </Typography>
                <TextField
                    size="small"
                    type="number"
                    value={jumpPage}
                    onChange={handleJumpPage}
                    sx={{
                        width: '100px',
                        input: {
                            color: '#225087',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#225087',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#225087',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#225087',
                        },
                    }}
                />
            </Box>
        </Box>

    )
}

export default PaginationPage