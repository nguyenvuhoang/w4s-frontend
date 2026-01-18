/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { Locale } from "@/configs/i18n";
import { workflowService } from "@/servers/system-service";
import { FormInput } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import SwalAlert from "@/utils/SwalAlert";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Session } from "next-auth";
import React, { useEffect, useState } from "react";

type PreviewContentProps = {
    input: FormInput;
    content: any;
    onClose: () => void;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    language: Locale;
    session: Session | null;
};

const PreviewInfo: React.FC<PreviewContentProps> = ({ input, content, onClose, dictionary, language, session }) => {
    const [isValid, setIsValid] = useState(false);

    const previewinfo = input.config.previewinfo || [];
    console.log(previewinfo)
    useEffect(() => {
        console.log("🚀 Checking validation...");

        let allValid = true;

        previewinfo.forEach((section: any) => {
            let sectionData = [];
            try {
                sectionData = section.data ? JSON.parse(section.data) : [];
            } catch (error) {
                console.error("❌ Invalid JSON format in previewinfo:", error);
                sectionData = [];
            }

            if (section.istable) {
                const parentArray = content[section.parentkey] || [];

                parentArray.forEach((rowData: any, rowIndex: number) => {
                    sectionData.forEach((row: any) => {
                        const value = rowData[row.value];
                        const isRequired = row.required;
                        const hasError = isRequired && (value === undefined || value === null || value === '');

                        console.log(`🧐 Row ${rowIndex} | Field: ${row.field} | Value: ${value} | Required: ${isRequired} | hasError: ${hasError}`);

                        if (hasError) {
                            allValid = false;
                        }
                    });
                });
            } else {
                sectionData.forEach((row: any) => {
                    const value = content[row.value];
                    const isRequired = row.required;
                    const hasError = isRequired && !value;

                    console.log(`🧐 Field: ${row.field} | Value: ${value} | Required: ${isRequired} | hasError: ${hasError}`);

                    if (hasError) {
                        allValid = false;
                    }
                });
            }
        });

        console.log("✅ Final validation state:", allValid);
        setIsValid(allValid);
    }, [content]);


    const handleConfirm = async () => {
        if (!isValid) {
            console.warn("⚠️ Please fill all required fields before confirming.");
            return;
        }

        const txFo_ = JSON.parse(input.config.txFo);
        const inputData = txFo_[0].input;

        const newFormData = inputData.bo.map((item: any) => ({
            ...item,
            input: {
                ...item.input,
                ...content,
            },
        }));



        const submitData = {
            bo: newFormData,
        }

        const submitApi = await workflowService.runBODynamic({
            sessiontoken: session?.user?.token as string,
            txFo: submitData,
        })

        if (submitApi.status !== 200) {
            SwalAlert('error', dictionary['common'].servererror, 'center');
        } else {
            const response = submitApi.payload.dataresponse;
            if (response.errors.length > 0) {
                SwalAlert('error', response.errors[0].info || 'Unknown error', 'center');
            } else {
                SwalAlert('success', dictionary['common'].datachange.replace("{0}", ""), 'center', false, true, true);
            }
        }

        console.log("✅ Submitting data to server:", content);
        // Call API to submit content
    };

    return (
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

            <Box sx={{ bgcolor: "primary.main", color: "white", p: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: "bold", textAlign: "center", color: "white" }}>
                    {dictionary['common'].previewinfo}
                </Typography>
            </Box>


            {previewinfo.length === 0 ? (
                <Box>
                    <Typography sx={{ textAlign: "center", color: "red", mt: 2, p: 5 }}>
                        ⚠️ {dictionary['common'].nopreviewinfoconfig}
                    </Typography>
                </Box>

            ) : (
                <>
                    <Box>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: "bold", textAlign: "center", mt: 2 }}>
                            {dictionary['common'].previewtitle}
                        </Typography>
                    </Box>


                    <Box sx={{ maxHeight: "720px", overflow: "auto", p: 2, mt: 2 }}>
                        {previewinfo.map((section: any, index: number) => {
                            let sectionData = [];

                            try {
                                sectionData = section.data ? JSON.parse(section.data) : [];
                            } catch (error) {
                                console.error("❌ Invalid JSON format in previewinfo:", error);
                                sectionData = [];
                            }

                            return (
                                <Box
                                    sx={{
                                        borderRadius: 2,
                                        border: "1px solid #ccc",
                                        backgroundColor: "#0B9150",
                                        overflow: "hidden",
                                        my: 4,
                                    }}
                                    key={index}
                                >
                                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold", p: 3 }}>
                                        {section.lang[language]}
                                    </Typography>

                                    <Box sx={{ backgroundColor: "#fff", p: 2 }}>
                                        {/* Nếu có bảng */}
                                        {section.istable ? (
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        {sectionData.map((column: { label: string }, index: number) => (
                                                            <TableCell key={index}>
                                                                <b>{column.label}</b>
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {content.depositaccount?.map((row: any, rowIndex: number) => (
                                                        <TableRow key={rowIndex}>
                                                            {sectionData.map((column: { value: string }, colIndex: number) => {
                                                                const cellValue = row[column.value] ?? 'N/A';
                                                                return <TableCell key={colIndex}>{cellValue}</TableCell>;
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <Table>
                                                <TableBody>
                                                    {sectionData.map((row: any, rowIndex: number) => {
                                                        const value = content[row.value];
                                                        const isRequired = row.required;
                                                        const displayValue = value || "N/A";
                                                        const hasError = isRequired && !value;

                                                        return (
                                                            <TableRow key={rowIndex}>
                                                                <TableCell>
                                                                    <b>{row.field}</b>
                                                                </TableCell>
                                                                <TableCell sx={{ color: hasError ? "red" : "#195f4a" }}>
                                                                    {hasError
                                                                        ? dictionary['common'].fieldrequired.replace("{field}", row.field)
                                                                        : displayValue}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {!isValid && (
                        <Typography sx={{ textAlign: "center", color: "red", mt: 2 }}>
                            ⚠️ {dictionary['common'].fillrequiredfields}
                        </Typography>
                    )}

                    {/* Button Confirm */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleConfirm} disabled={!isValid}>
                            {dictionary['common'].confirm}
                        </Button>
                    </Box>
                </>
            )}
        </Box>

    );
};

export default PreviewInfo;
