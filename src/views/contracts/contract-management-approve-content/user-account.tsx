'use client'

import { OptionIcon } from '@/components/layout/shared/OptionIcon';
import { StatusIcon } from '@/components/layout/shared/StatusIcon';
import LoadingSubmit from '@/components/LoadingSubmit';
import Spinner from '@/components/spinners';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { UserAccount } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import {
    Box,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { Session } from 'next-auth';
import { useEffect, useState } from 'react';



const UserAccountInfo = ({ session, contractdata, dictionary }: { contractdata: any; dictionary: Awaited<ReturnType<typeof getDictionary>>; session: Session | null }) => {
    const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserAccounts = async (contractNumber: string) => {
        setLoading(true);
        setError(null);
        try {
            const userAccountApi = await systemServiceApi.viewData({
                sessiontoken: session?.user?.token as string,
                learnapi: 'cbs_workflow_execute',
                workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
                commandname: 'getuserbycontractnumber',
                issearch: false,
                parameters: {
                    id: contractNumber
                }
            })

            if (
                !isValidResponse(userAccountApi) ||
                (userAccountApi.payload.dataresponse.error && userAccountApi.payload.dataresponse.error.length > 0)
            ) {
                console.log(
                    'ExecutionID:',
                    userAccountApi.payload.dataresponse.error[0].execute_id +
                    ' - ' +
                    userAccountApi.payload.dataresponse.error[0].info
                );
                return <Spinner />;
            }

            const useraccount = userAccountApi.payload.dataresponse.fo[0].input.data;
            setUserAccounts(useraccount || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contractdata?.contractnumber) {
            fetchUserAccounts(contractdata.contractnumber);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractdata?.contractnumber]);

    const userAccountFields = [
        { key: 'loginname', label: 'Login Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'statuscaption', label: 'Status' },
        { key: 'islogin', label: 'Is Login' },
        { key: 'lastlogintime', label: 'Last Login Time' },
        { key: 'failnumber', label: 'Fail Number' }
    ];

    console.log(userAccounts)

    return (
        <Card className="shadow-md">
            <CardContent>
                {loading ? (
                    <LoadingSubmit loadingtext={dictionary['common'].loading} />
                ) : error ? (
                    <Typography className="text-center text-red-500">{error}</Typography>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-gray-100">
                                    {userAccountFields.map((field) => (
                                        <TableCell key={field.key}>
                                            <Typography className="font-semibold text-gray-700">
                                                {field.label}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {userAccounts.length > 0 && Object.keys(userAccounts[0]).length > 0 ? (
                                    userAccounts.map((account, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            {userAccountFields.map((field) => (
                                                <TableCell key={field.key}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {field.key !== 'islogin' && (
                                                            <Typography className="font-medium text-primary">
                                                                {account[field.key as keyof UserAccount]?.toString() || '-'}
                                                            </Typography>
                                                        )}
                                                        {field.key === 'statuscaption' && <StatusIcon status={account.status} />}
                                                        {field.key === 'islogin' && <OptionIcon isOption={account.islogin} />}
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={userAccountFields.length} className="text-center">
                                            <Typography className="text-gray-500">
                                                No user accounts available
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default UserAccountInfo;
