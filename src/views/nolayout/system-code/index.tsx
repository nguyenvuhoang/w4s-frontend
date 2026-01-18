'use client'

import { getDictionary } from '@/utils/getDictionary'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import TextsmsIcon from '@mui/icons-material/Textsms'
import {
    Box
} from '@mui/material'
import { Session } from 'next-auth'
import React, { useState } from 'react'

const maskText = (text: string) => '****'

const SystemCodeContent = ({
    session,
    dictionary,
}: {
    session: Session | null
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [visibleIds, setVisibleIds] = useState<number[]>([])
    const [modalContent, setModalContent] = useState<any>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [searchPhone, setSearchPhone] = useState('')

    const handleToggleView = (id: number) => {
        setVisibleIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        )
    }

    const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage)
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }


    const handlePreviewModal = (data: any, previewtype: string, datatype?: string) => {
        try {
            if (data === undefined || data === null) {
                console.warn('Data is undefined or null');
                return;
            }

            const preview = {
                previewtype: previewtype,
                previewdata: new DOMParser().parseFromString(data, 'text/xml'),
                datatype: datatype,
            };

            setModalContent(preview);
            setModalOpen(true);
        } catch (error) {
            console.error('Failed to parse data:', error);
        }
    };
    const handleCloseModal = () => {
        setModalOpen(false);
    };
    return (
        <ContentWrapper
            title={`${dictionary['sms'].title} - ${dictionary['common'].view}`}
            description={dictionary['sms'].description}
            icon={<TextsmsIcon sx={{ fontSize: 40, color: '#225087' }} />}
            dictionary={dictionary}
        >
            <Box sx={{ mt: 5, width: '100%' }}>
            </Box>
        </ContentWrapper>
    )
}

export default SystemCodeContent
