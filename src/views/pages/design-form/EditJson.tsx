'use client'

import React, { useState } from 'react'
import DataObjectIcon from '@mui/icons-material/DataObject';
import { Modal } from '@mui/material';
import PreviewContent from './PreviewContent';
import { getDictionary } from '@/utils/getDictionary';

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const EditJson = ({ dictionary }: Props) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const handleCloseModal = () => {
        setModalOpen(false);
    };
    const contentJson = {}
    return (
        <>
            <button
                style={{
                    padding: '8px',
                    margin: '0 8px',
                    border: '1px solid #ddd',
                    background: '#e8f5e9',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '20px',
                    width: '40px',
                    height: '40px',
                }}
                title='Edit Json'
                onClick={() => setModalOpen(true)}
            >
                <DataObjectIcon sx={{ color: '#139556' }} />
            </button>
            {isModalOpen && (
                <Modal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: "100vh",
                        }}
                    >
                        <PreviewContent content={contentJson} onClose={handleCloseModal} dictionary={dictionary} />
                    </div>
                </Modal>
            )}

        </>
    )
}

export default EditJson
