'use client';

import { Locale } from '@/configs/i18n';
import { PageContentProps } from '@shared/types';
import { AccountChartType } from '@shared/types/bankType';
import { PageData } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import { Session } from 'next-auth';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import PaginationPage from '@/@core/components/jTable/pagination';
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon';
import AdvancedSearchPanel from '@components/AdvancedSearchPanel';
import NoData from '@components/layout/shared/card/nodata';
import { useAccountChartHandler } from '@/services/useAccountChartHandler';
import SwalAlert from '@utils/SwalAlert';

// MUI
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Checkbox, Paper } from '@mui/material';
import { Column, DataTable } from '../components/form/DataTable';
import { SelectOption } from '../components/form/DynamicAdvancedFilters';
import { FormField } from '../components/form/FormField';
import { ListActionsBar } from '../components/form/ListActionsBar';
import { useRowSelection } from '../components/form/useRowSelection';
import { getLocalizedUrl } from '@utils/i18n';
import AccountAdvancedFilters from './component/AccountAdvancedFilters';

type SearchForm = {
    searchtext?: string;
    accountnumber?: string;
    accountname?: string;
    accountlevelfrom?: number | string;
    accountlevelto?: number | string;
    currency?: string;
    classification?: string;
    balanceside?: string;
    group?: string;
    status?: string;
    branchcode?: string;
};

type PageProps = PageContentProps & {
    accountingdata: PageData<AccountChartType>;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    session: Session | null;
    locale: Locale;
    accountClassificationOptions: SelectOption[];
};

type AccountChartRow = {
    accountlevel: number | string;
    accountnumber: string;
    currency: string;
    accountname: string;
    classification: string;
    balanceside: string;
    group: string;
};

const BankAccountDefinitionContent = ({
    dictionary,
    accountingdata,
    session,
    locale,
    accountClassificationOptions,
    accountLevelOptions
}: PageProps) => {

    const {
        page,
        jumpPage,
        accountChart,
        rowsPerPage,
        totalCount,
        loading,
        handleSearch,
        handleJumpPage,
        handlePageChange,
        handlePageSizeChange,
        deleteAccountchart,
    } = useAccountChartHandler(accountingdata, session, locale);


    const { selected, hasSelection, selectedId, toggleOne } = useRowSelection<string>(() => '');

    const columns: Column<AccountChartRow>[] = useMemo(
        () => [
            { key: 'accountlevel', header: 'Account level', width: 120, accessor: (r: AccountChartRow) => r.accountlevel },
            { key: 'accountnumber', header: 'Account number', width: 260, accessor: (r: AccountChartRow) => r.accountnumber },
            { key: 'currency', header: 'Currency', width: 110, accessor: (r: AccountChartRow) => r.currency },
            { key: 'accountname', header: 'Account name', accessor: (r: AccountChartRow) => r.accountname },
            { key: 'classification', header: 'Classification', width: 220, accessor: (r: AccountChartRow) => r.classification },
            { key: 'balanceside', header: 'Balance side', width: 130, accessor: (r: AccountChartRow) => r.balanceside },
            { key: 'group', header: 'Group', width: 110, accessor: (r: AccountChartRow) => r.group }
        ],
        []
    );

    const mapRow = (r: any): AccountChartRow => ({
        accountlevel: r.accountlevel ?? 1,
        accountnumber: r.accountnumber ?? '-',
        currency: r.currency ?? 'LAK',
        accountname: r.accountname ?? '-',
        classification: r.classification ?? (r.status_caption ?? '-'),
        balanceside: r.balanceside ?? (r.status === 'A' ? 'Both' : '-'),
        group: r.group ?? 'Normal'
    });

    const { control, handleSubmit } = useForm<SearchForm>({
        defaultValues: {
            searchtext: '',
            accountnumber: '',
            accountname: '',
            accountlevelfrom: '',
            accountlevelto: '',
            currency: 'ALL',
            classification: 'ALL',
            balanceside: 'ALL',
            group: 'ALL',
            status: 'ALL',
            branchcode: '',
        },
    });


    const onSubmit = (data: SearchForm) => {
        handleSearch(data);
    };

    const handleRowDblClick = (id: string) => {
        if (hasSelection) return;
        window.open(`/accounting/view/accountchartmanagementview/${id}`, '_blank');
    };

    const handleModifyClick = () => {
        if (selected.length !== 1) return;
        const id = selected[0];
        const row = accountChart?.items.find(x => x.accountnumber === id);
        if (!row) return;
        window.open(`/contract-management/modify/contractmanagementview/${id}`, '_blank');
    };

    const handleDeleteClick = async () => {
        if (selected.length !== 1) return;
        const id = selected[0];
        const row = accountChart?.items.find(x => x.accountnumber === id);
        if (!row) return;

        SwalAlert(
            'question',
            dictionary['accountchart'].doyouwanttodelete.replace('{0}', String(row.accountlevel)),
            'center',
            false,
            true,
            true,
            async () => {
                const apideleteAccountchart = await deleteAccountchart(id);
                if (apideleteAccountchart.ok) {
                    SwalAlert('success', dictionary['accountchart'].delete_success_text.replace('{0}', id), 'center');
                } else {
                    SwalAlert('error', apideleteAccountchart.message, 'center');
                }
            }
        );
    };

    const rows = (accountChart?.items ?? []).map(mapRow);

    return (
        <ContentWrapper
            title={dictionary['accountchart']?.title}
            description={dictionary['accountchart']?.description}
            icon={<></>}
            dictionary={dictionary}
            issearch={false}
        >
            <Box sx={{ my: 5, width: '100%' }}>
                <ListActionsBar
                    onAdd={() => {
                        const url = getLocalizedUrl('/accounting/account-chart-add/', locale as Locale)
                        window.open(url, '_blank');
                    }}
                    onView={() => {
                        if (selected.length !== 1) return;
                        const id = selected[0];
                        window.open(`/accounting/view/accountchartmanagementview/${id}`, '_blank');
                    }}
                    onModify={handleModifyClick}
                    onDelete={handleDeleteClick}
                    onSearch={handleSubmit(onSubmit)}
                    loading={loading}
                    canView={selected.length === 1}
                    canModify={selected.length === 1}
                    canDelete={selected.length === 1}
                    searchLabel={dictionary['common']?.search ?? 'Search'}
                    addLabel={dictionary['common']?.add ?? 'Add'}
                    viewLabel={dictionary['common']?.view ?? 'View'}
                    modifyLabel={dictionary['common']?.modify ?? 'Modify'}
                    deleteLabel={dictionary['common']?.delete ?? 'Delete'}
                />

                {/* Quick search */}
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ my: 5 }}>
                    <FormField<SearchForm>
                        control={control}
                        name="searchtext"
                        placeholder={dictionary['common']?.search ?? 'Search text'}
                        size="small"
                        sx={{ maxWidth: 760 }}
                    />
                </Box>

                <AdvancedSearchPanel
                    title={dictionary['common']?.advancedsearch ?? 'Advanced Search'}
                    defaultOpen={false}
                    onSubmit={handleSubmit(onSubmit)}
                    searchLabel={dictionary['common']?.search ?? 'Search'}
                >
                    <AccountAdvancedFilters<SearchForm> control={control} dictionary={dictionary}
                        accountClassificationOptions={accountClassificationOptions}
                        accountLevelOptions={accountLevelOptions} />
                </AdvancedSearchPanel>

                {/* Table (generic) */}
                <Paper sx={{ borderRadius: 2, boxShadow: 3, mt: 3 }}>
                    <DataTable
                        columns={columns}
                        rows={rows}
                        loading={loading}
                        rowsPerPage={rowsPerPage || 5}
                        rowKey={(r: AccountChartRow, i: number) => `${r.accountnumber}-${i}`}
                        onRowDoubleClick={(r: AccountChartRow) => handleRowDblClick(r.accountnumber)}
                        empty={<NoData text={dictionary['common'].nodata} width={100} height={100} />}
                        selectionCell={(row: AccountChartRow) => {
                            const id = row.accountnumber;
                            const checked = selected.includes(id);
                            const isDisabledRow = hasSelection && id !== selectedId;
                            return (
                                <Checkbox
                                    icon={
                                        isDisabledRow
                                            ? <LockOutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                                            : <CustomCheckboxIcon checked={false} />
                                    }
                                    checkedIcon={<CustomCheckboxIcon checked={true} />}
                                    size="small"
                                    checked={checked}
                                    onChange={() => {
                                        if (checked) {
                                            toggleOne(id);
                                        } else {
                                            toggleOne(id);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    slotProps={{ input: { 'aria-label': `select row ${id}` } }}
                                />
                            );
                        }}
                    />
                </Paper>

                {totalCount > 0 && (
                    <Box mt={5}>
                        <PaginationPage
                            page={page}
                            pageSize={rowsPerPage}
                            totalResults={totalCount}
                            jumpPage={jumpPage}
                            handlePageChange={handlePageChange}
                            handlePageSizeChange={handlePageSizeChange}
                            handleJumpPage={handleJumpPage}
                        />
                    </Box>
                )}
            </Box>
        </ContentWrapper>
    );
};

export default BankAccountDefinitionContent;


