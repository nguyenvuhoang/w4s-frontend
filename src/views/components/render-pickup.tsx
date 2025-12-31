'use client'

import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { FormInput } from '@/types/systemTypes';
import { generateParams } from '@/utils/generateParams';
import { getDictionary } from '@/utils/getDictionary';
import { replaceAtFields } from '@/utils/replaceAtFields';
import SwalAlert from '@/utils/SwalAlert';
import { Button, FormControl, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

type Props = {
    input: FormInput;
    language: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    formData: any;
    onChange: (fieldCode: string, value: string | any) => void;
    session: Session | null;
};

const RenderPickup = ({ input, language, dictionary, formData, onChange, session }: Props) => {

    const columnKey = input.config.structable_read.split('.').pop();

    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
    const [data, setData] = useState<any[]>([]);
    const [rightItems, setRightItems] = useState<any[]>([]);
    useEffect(() => {
        const initialData = formData[columnKey] || [];
        setIsFormVisible(Boolean(initialData && initialData.length > 0));
        setRightItems(initialData);
    }, [formData, columnKey]);

    const handleOneClick = () => {
        setData((prevData) => {
            const [firstItem, ...remainingItems] = prevData;
            if (!firstItem) return prevData;
            setRightItems((prevRight) => {
                const updatedRight = new Set([...prevRight, firstItem]);
                return Array.from(updatedRight);
            });
            return remainingItems;
        });
    };

    const handleAllClick = () => {
        setData([]); // Xóa tất cả dữ liệu bên trái
        setRightItems((prevRight) => [...prevRight, ...data]); // Chuyển toàn bộ dữ liệu sang bên phải
    };

    const handleOneReturnClick = () => {
        if (rightItems.length === 0) return;

        const [firstItem, ...remainingItems] = rightItems;

        setRightItems(remainingItems);

        setData((prevData) => {
            if (prevData.includes(firstItem)) {
                return prevData;
            }
            return [...prevData, firstItem];
        });
    };

    const handleAllReturnClick = () => {
        setRightItems([]); // Xóa tất cả dữ liệu bên phải
        setData((prevData) => [...prevData, ...rightItems]); // Chuyển toàn bộ dữ liệu từ bên phải sang bên trái
    };

    const synchronizeInformation = async (inputsync: FormInput, formdata: any) => {
        try {
            const txFoArray = JSON.parse(inputsync.config.txFo);
            const parameter = generateParams(input.config.col_filter, formdata);

            const missingFields: string[] = [];
            const colFilter = inputsync.config.col_filter;
            Object.keys(colFilter).forEach((key) => {
                const formKey = colFilter[key];
                if (!formdata[formKey]) {
                    missingFields.push(key);
                }
            });
            if (missingFields.length > 0) {
                SwalAlert(
                    'warning',
                    `${dictionary['common'].fieldrequired.replace("{field}", missingFields.join(', '))}`,
                    'center'
                )
                return;
            }

            const updatedData = replaceAtFields(txFoArray, parameter);

            const getQueryDataApi = await systemServiceApi.runBODynamic({
                sessiontoken: session?.user?.token as string,
                txFo: updatedData
            });
            const data = getQueryDataApi.payload.dataresponse.fo[0].input.result || getQueryDataApi.payload.dataresponse.fo[0].input.items || [];
            setRightItems([]);
            setData(data);
            setIsFormVisible(true);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handlePrimarySelect = (id: number) => {
        setData((prevData) =>
            prevData.map((row) => ({
                ...row,
                isprimary: row.id === id,
            }))
        );
    };

    const handleApplyClick = () => {
        Swal.fire({
            position: 'center',
            color: 'black',
            allowOutsideClick: false,
            text: dictionary['common'].areyousuresubmit,
            showCancelButton: true,
            cancelButtonText: dictionary['common'].cancel,
            confirmButtonText: dictionary['common'].submit,
            iconHtml: '<img src="/images/icon/warning.svg" alt="custom-icon" style="width:64px; height:64px;">',
            customClass: {
                cancelButton: 'swal2-cancel',
                confirmButton: 'swal2-confirm',
                icon: 'no-border'
            },
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                const transformedData = rightItems.map((item) => ({
                    accountnumber: item.accountnumber,
                    isprimary: item.isprimary === 'false' ? "0" : "1",
                    currencycode: item.currency,
                    accounttype: item.accounttype,
                    status: item.status,
                    branchid: item.branchid,
                    bankaccounttype: item.bankaccounttype,
                    bankid: '',
                }));

                if (onChange) {
                    onChange(columnKey, transformedData);
                }
                setIsFormVisible(true);
                SwalAlert('success', dictionary['common'].datachange.replace("{0}", ""), 'center');
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                console.log('Hủy thao tác');
            }
        });
    };



    const columns = JSON.parse(input.config.table_format).map((column: any) => {
        if (column.field === 'isprimary') {
            column.renderCell = (params: any) => {
                return (
                    <input
                        type="radio"
                        name="isprimary"
                        checked={params.row.isprimary === 'true'}
                        onChange={() => handlePrimarySelect(params.row.id)}
                    />
                )
            }
                ;
        }
        return column;
    });

    return (
        <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => synchronizeInformation(input, formData)}
                sx={{ marginBottom: '16px' }}
            >
                {dictionary['common'].synchronizeinfomation || 'Đồng bộ thông tin'}
            </Button>
            {isFormVisible && (

                <Grid container spacing={2} alignItems="center">
                    {/* Cột bên trái */}
                    <Grid size={{ xs: 5 }}>
                        <FormControl fullWidth size="small">
                            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                                <h3 id={`${input.default.code}-label`} className="text-[#0B9150]">
                                    {`${input.lang.title[language]} - ${dictionary['common'].current}` || 'Chọn tính năng muốn hiển thị'}
                                </h3>
                                <div style={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        rows={data.map((row, index) => ({ id: index, ...row }))}
                                        columns={columns}
                                        checkboxSelection
                                        onCellClick={(params, event) => {
                                            if (params.field === 'isprimary') {
                                                event.stopPropagation();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </FormControl>
                    </Grid>

                    {/* Cột nút ở giữa */}
                    <Grid size={{ xs: 2 }} container justifyContent="center" alignItems="center" direction="column" gap={2}>
                        {/* Nút thêm từng dòng */}
                        <Button variant="outlined" onClick={handleOneClick}>
                            →
                        </Button>

                        {/* Nút thêm tất cả */}
                        <Button variant="outlined" onClick={handleAllClick}>
                            ⇒
                        </Button>
                        {/* Nút bỏ từng dòng */}
                        <Button variant="outlined" onClick={handleOneReturnClick}>
                            ←
                        </Button>

                        {/* Nút bỏ tất cả */}
                        <Button variant="outlined" onClick={handleAllReturnClick}>
                            ⇐
                        </Button>

                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#0D9252',
                                color: '#FFFFFF',
                                marginTop: '20px',
                                '&:hover': {
                                    backgroundColor: '#0B7E45',
                                },
                            }}
                            disabled={rightItems.length === 0}
                            onClick={handleApplyClick}
                        >
                            {dictionary['common'].apply || 'Apply'}
                        </Button>
                    </Grid>

                    {/* Cột bên phải */}
                    <Grid size={{ xs: 5 }}>
                        <FormControl fullWidth size="small">
                            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                                <h3 id={`${input.default.code}-label`} className="text-[#0B9150]">
                                    {`${input.lang.title[language]} - ${dictionary['common'].selected}` || 'Chọn tính năng muốn hiển thị'}
                                </h3>
                                <div style={{ height: 400, width: '100%' }}>
                                    <DataGrid
                                        rows={rightItems.map((row, index) => ({ id: index, ...row }))}
                                        columns={columns}
                                        checkboxSelection
                                    />
                                </div>
                            </div>
                        </FormControl>
                    </Grid>
                </Grid>

            )}
        </Grid>
    );
};

export default RenderPickup;
