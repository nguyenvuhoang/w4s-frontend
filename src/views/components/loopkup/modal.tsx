'use client'

import WrapperContentPage from '@/@layouts/styles/shared/WrapperContentPage'
import NoData from '@components/layout/shared/card/nodata'
import LoadingSubmit from '@components/LoadingSubmit'
import { Locale } from '@/configs/i18n'
import { FormInput, PageData } from '@shared/types/systemTypes'
import { getDictionary } from '@utils/getDictionary'
import { Box, Button, Modal } from '@mui/material'
import { Session } from 'next-auth'
import { Dispatch, SetStateAction, useState } from 'react'
import Layout from '../../../features/dynamicform/components/layout'

type Props = {
    isModalOpen: boolean
    setIsModalOpen: Dispatch<SetStateAction<boolean>>
    input: FormInput
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    pageContent: any
    session: Session | null
    language: Locale
    renderviewdata: any
    loading: boolean
    setLoading: Dispatch<SetStateAction<boolean>>
    lookupData?: any
    datasearch?: PageData<any> | undefined
}

const LookupModal = ({
    isModalOpen,
    setIsModalOpen,
    input,
    dictionary,
    pageContent,
    session,
    language,
    renderviewdata,
    loading,
    setLoading,
    datasearch
}: Props) => {

    // Close Modal Unconditionally
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const [advancedsearch, setAdvancedSearch] = useState<any>();


    return (
        <Modal
            open={isModalOpen}
            onClose={handleModalClose}
            aria-labelledby="lookup-modal-title"
            aria-describedby="lookup-modal-description"
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 1080,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    borderRadius: 2,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: '#1a5f4b',
                        padding: '16px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        textAlign: 'center',
                    }}
                >
                    {input.default.name}
                </Box>

                {/* Modal Content */}
                <Box sx={{ padding: 4 }}>
                    {loading ? (
                        <LoadingSubmit loadingtext={dictionary['common'].loading} />
                    ) : pageContent ? (
                        <WrapperContentPage>
                            <Box sx={{ padding: 2 }}>
                                <Layout
                                    datalayout={pageContent.list_layout}
                                    rules={pageContent.info.ruleStrong}
                                    session={session}
                                    form_id={pageContent.form_id}
                                    setLoading={setLoading}
                                    dictionary={dictionary}
                                    language={language}
                                    renderviewdata={renderviewdata}
                                    datasearchlookup={datasearch}
                                    advancedsearch={advancedsearch}
                                    setAdvancedSearch={setAdvancedSearch}
                                />
                            </Box>
                        </WrapperContentPage>
                    ) : (
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="300px"
                            sx={{ flexDirection: 'column' }}
                        >
                            <NoData text={dictionary['common'].nodataform} width={100} height={100} />
                        </Box>
                    )}
                </Box>

                {/* Footer with Close Button */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '16px',
                        borderTop: '1px solid #ddd',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    <Button variant="outlined" onClick={handleModalClose}>
                        {dictionary['common'].close}
                    </Button>
                </Box>
            </Box>
        </Modal>
    )
}

export default LookupModal

