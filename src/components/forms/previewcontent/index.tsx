'use client'

import JsonEditorComponent from "@/@core/components/jSONEditor";
import XMLEditorComponent from "@/@core/components/xmlEditor";
import { getDictionary } from "@/utils/getDictionary";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, NoSsr, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { renderInterface } from "./renderInterface";

type PreviewContentProps = {
    content: any;
    onClose: () => void;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
};

const PreviewContent: React.FC<PreviewContentProps> = ({ content, onClose, dictionary }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };
    const handleJsonChange = (updatedJson: object) => {
        console.log('Updated JSON:', updatedJson);
    };

    const handleXmlChange = (updatedXml: string) => {
        console.log('Updated XML:', updatedXml);
    };


    return (
        <NoSsr>
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "1280px",
                    borderRadius: 2,
                    boxShadow: 3,
                    bgcolor: "background.paper",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
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
                        bgcolor: "primary.main",
                        color: "white",
                        p: 2,
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
                        {dictionary['common'].previewinfo} - {content.previewtype}
                    </Typography>
                </Box>
                <Tabs value={activeTab} onChange={handleTabChange} centered>
                    <Tab label={`${content.datatype} data`} />
                    <Tab label="Interface View" />
                </Tabs>
                <Box
                    sx={{
                        maxHeight: "720px",
                        overflow: "auto",
                        p: 2,
                        mt: 2,
                        borderRadius: 2,
                    }}
                >
                    {activeTab === 0 && (
                        <>
                            {content.datatype === 'XML' ? (
                                <XMLEditorComponent
                                    initialXml={content.previewdata}
                                    onChange={handleXmlChange}
                                />
                            ) : (
                                <JsonEditorComponent
                                    initialJson={content.previewdata}
                                    onChange={handleJsonChange}
                                />
                            )}
                        </>
                    )}
                    {activeTab === 1 && (
                        <>
                            {content.datatype === "XML" ? (
                                renderInterface(content.previewdata, content.previewtype, content.app, dictionary, 'XML')
                            ) : (
                                renderInterface(content.previewdata, content.previewtype, content.app, dictionary)
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </NoSsr>
    );
};

export default PreviewContent;
