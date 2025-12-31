'use client';

import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { coreGetWayServiceApi } from '@/servers/coregateway-service';
import { PageData } from '@/types/systemTypes';
import { formatDateTime } from '@/utils/formatDateTime';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
    Box,
    Button,
    Divider,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';

type Token = {
    id: number;
    token: string;
    expireat: string;
    identifier: string;
    isrevoked: boolean;
    revokereason: string | null;
    createdonutc: string;
    totalcount: number;
};

type Props = {
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
    tokendata: PageData<Token>;
};

const TokenInformation = ({ dictionary, session, locale, tokendata: initialTokendata }: Props) => {
    const [newToken, setNewToken] = useState({
        secretkey: '',
        value: '',
    });
    const [secretKeyError, setSecretKeyError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(initialTokendata.page_index);
    const [tokenData, setTokenData] = useState<PageData<Token>>(initialTokendata);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (countdown !== null && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (countdown === 0) {
            window.location.reload();
        }
        return () => clearInterval(interval);
    }, [countdown]);

    const handleGenerateToken = async () => {
        if (!newToken.secretkey.trim()) {
            setSecretKeyError(dictionary['common'].required || 'Secret key is required');
            return;
        }

        setSecretKeyError(null);
        setIsLoading(true);
        try {
            const tokenApi = await coreGetWayServiceApi.GenerateToken({
                secretkey: newToken.secretkey,
                sessiontoken: session?.user?.token as string,
                language: locale
            });

            if (
                !isValidResponse(tokenApi) ||
                (tokenApi.payload.dataresponse.error && tokenApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    tokenApi.payload.dataresponse.error[0].execute_id +
                    ' - ' +
                    tokenApi.payload.dataresponse.error[0].info
                );
                setNewToken({ ...newToken, value: 'Error generating token' });
                setIsLoading(false);
                return;
            }

            const tokenvalue = tokenApi.payload.dataresponse.fo[0].input.data as string;
            
            setNewToken({
                ...newToken,
                value: tokenvalue,
            });
            setCountdown(30); // Bắt đầu đếm ngược khi token hợp lệ
        } catch (error) {
            console.error('Error generating token:', error);
            setNewToken({ ...newToken, value: 'Error generating token' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToken = (value: string) => {
        navigator.clipboard.writeText(value);
    };

    const handlePageChange = async (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        setIsLoading(true);

        try {
            const coregatewayApi = await coreGetWayServiceApi.coreGatewaySearchInfo({
                sessiontoken: session?.user?.token as string,
                language: locale,
                commandname: 'SimpleSearchToken',
                pageIndex: page,
                pageSize: 10
            });

            if (
                !isValidResponse(coregatewayApi) ||
                (coregatewayApi.payload.dataresponse.error && coregatewayApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    coregatewayApi.payload.dataresponse.error[0].execute_id +
                    ' - ' +
                    coregatewayApi.payload.dataresponse.error[0].info
                );
                setIsLoading(false);
                return;
            }

            const newTokendata = coregatewayApi.payload.dataresponse.fo[0].input as PageData<Token>;
            setTokenData(newTokendata);
        } catch (error) {
            console.error('Error fetching token data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className="mx-auto p-6">
            <Box
                sx={{
                    padding: 5,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 40, color: "#225087" }} />
                    <Typography variant="h4" sx={{ fontWeight: "bold", color: "#225087" }}>
                        {dictionary['common'].generatetoken}
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: "#089a60", whiteSpace: "pre-line" }}>
                    {dictionary['common'].generatetokendescription}
                </Typography>
                <Divider sx={{ mt: 2 }} />
            </Box>

            <Box className="my-8 bg-white p-6 rounded-lg shadow-md">
                <Typography variant="h5" className="mb-4">
                    {dictionary['common'].generatetoken}
                </Typography>
                <Box className="grid grid-cols-12 gap-4">
                    <TextField
                        label="Secret key"
                        value={newToken.secretkey}
                        onChange={(e) => {
                            setNewToken({ ...newToken, secretkey: e.target.value });
                            if (e.target.value.trim()) setSecretKeyError(null);
                        }}
                        variant="outlined"
                        className="col-span-12"
                        fullWidth
                        required
                        error={!!secretKeyError}
                        helperText={secretKeyError}
                    />
                    <Box className="col-span-12 flex gap-2">
                        <TextField
                            label="Token Value"
                            value={newToken.value}
                            disabled
                            multiline
                            rows={4}
                            variant="outlined"
                            fullWidth
                        />
                        <Button
                            variant="outlined"
                            onClick={() => handleCopyToken(newToken.value)}
                            disabled={!newToken.value}
                            sx={{ minWidth: 'auto', p: 1 }}
                        >
                            <ContentCopyIcon />
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerateToken}
                        disabled={isLoading || !newToken.secretkey}
                    >
                        {isLoading ? 'Generating...' : 'Generate Token'}
                    </Button>
                    {newToken.value && newToken.value !== 'Error generating token' && (
                        <Typography variant="body2" sx={{ color: '#089a60' }}>
                            {`${dictionary['token'].refreshnotice} ${countdown}s`}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box className="bg-white p-6 rounded-lg shadow-md">
                <Typography variant="h6" className="mb-4">
                    {dictionary['common'].existingTokens || 'Existing Tokens'} ({tokenData.total_count})
                </Typography>
                {isLoading ? (
                    <Spinner />
                ) : (
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#089a60' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].id}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].token}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].expired}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].expired}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].status}</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{dictionary['token'].action}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tokenData.items.map((token) => (
                                        <TableRow key={token.id}>
                                            <TableCell>{token.id}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" className="truncate max-w-xs">
                                                    {token.token}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{formatDateTime(token.expireat)}</TableCell>
                                            <TableCell>{formatDateTime(token.createdonutc)}</TableCell>
                                            <TableCell>
                                                {token.isrevoked ? 'Revoked' : 'Active'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleCopyToken(token.token)}
                                                >
                                                    {dictionary['common'].copy}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination
                                count={tokenData.total_pages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default TokenInformation;
