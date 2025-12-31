'use client'

import JsonEditorComponent from "@/@core/components/jSONEditor";
import { getDictionary } from "@/utils/getDictionary";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";
import React from "react";

type PreviewContentProps = {
    content: any;
    onClose: () => void;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
};

const PreviewContent: React.FC<PreviewContentProps> = ({ content, onClose, dictionary }) => {

    const handleJsonChange = (updatedJson: object) => {
        console.log('Updated JSON:', updatedJson);
    };
    const isClient = () => typeof window !== 'undefined'
    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1440px",
                borderRadius: 2,
                boxShadow: 3,
                bgcolor: "background.paper",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Close Icon */}
            <IconButton
                onClick={onClose}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    color: "white",
                }}
            >
                <CloseIcon />
            </IconButton>

            <Box
                sx={{
                    bgcolor: "primary.main", // Màu xanh (nền chính)
                    color: "white", // Màu trắng cho chữ
                    p: 2, // Padding
                }}
            >
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        color: "white",
                    }}
                >
                    {dictionary['common'].edit}
                </Typography>
            </Box>
            <Box
                sx={{
                    maxHeight: "720px",
                    overflow: "auto",
                    p: 2,
                    mt: 2,
                    borderRadius: 2,
                }}
            >
                {isClient() &&
                    <JsonEditorComponent
                        initialJson={content}
                        onChange={handleJsonChange}
                    />
                }
            </Box>
        </Box>
    );
};

export default PreviewContent;
