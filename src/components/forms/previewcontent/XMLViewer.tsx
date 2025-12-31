'use client';

import { getDictionary } from '@/utils/getDictionary';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

type XMLViewerProps = {
    xmlData: string | Document;
    dictionary: Awaited<ReturnType<typeof getDictionary>>
};

const XMLViewer: React.FC<XMLViewerProps> = ({ xmlData, dictionary }) => {
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [errorDesc, setErrorDesc] = useState<string | null>(null);

    useEffect(() => {
        const parseXmlToTree = (xml: string | Document): any[] => {
            if (typeof xml === 'string') {
                const parser = new DOMParser();
                xml = parser.parseFromString(xml, 'text/xml');
            }


            const errorCodeNode = xml.evaluate(
                '//*[local-name()="ERRORCODE"]',
                xml,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            const errorDescNode = xml.evaluate(
                '//*[local-name()="ERRORDESC"]',
                xml,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;


            setErrorCode(errorCodeNode?.textContent || null);
            setErrorDesc(errorDescNode?.textContent || null);

            return [xml.documentElement];
        };

        if (xmlData) {
            parseXmlToTree(xmlData);
        }
    }, [xmlData]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px',
                backgroundColor: '#f9f9f9',
            }}
        >
            {errorCode && errorDesc ? (
                <Box>
                    <Typography
                        variant="h6"
                        sx={{ marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}
                    >
                        {dictionary['common'].errorinfo}
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#0a6f47' }}>
                                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{dictionary['common'].errorcode}</TableCell>
                                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{dictionary['common'].errordescription}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>{errorCode}</TableCell>
                                <TableCell>{errorDesc}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
            ) : (
                <Typography>{dictionary['common'].noerror}</Typography>
            )}
        </Box>
    );
};

export default XMLViewer;
