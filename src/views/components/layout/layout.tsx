'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, FormLayout, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { Box } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import RenderTabs from './tab';
import RenderView from './view';

type Props = {
    formMethods: ReturnType<typeof useForm>;
    form_id: string;
    language: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    layout: FormLayout;
    hiddenFields: string[];
    rules: RuleStrong[];
    session: Session | null;
    setLoading: Dispatch<SetStateAction<boolean>>;
    activeTab: number;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    handleRowDoubleClick: (rowData: any, input: FormInput) => Promise<void>;
    datasearch: PageData<any> | undefined;
    setDatasearch: Dispatch<SetStateAction<PageData<any> | undefined>>;
    isFetching: boolean;
    setIsFetching: Dispatch<SetStateAction<boolean>>;
    txfoSearch: any;
    setTxFOSearch: Dispatch<SetStateAction<undefined>>;
    datasearchlookup: PageData<any> | undefined;
    ismodify: boolean;
    setIsModify: Dispatch<SetStateAction<boolean>>;
    searchtext: string;
    setSearchText: Dispatch<SetStateAction<string>>;
    advancedsearch: any;
    setAdvancedSearch: Dispatch<SetStateAction<any>>;
    globalAdvancedSearch: any;
    setGlobalAdvancedSearch: Dispatch<SetStateAction<any>>;
    storeFormSearch: any[];
    setStoreFormSearch: Dispatch<SetStateAction<any[]>>;
    storeInfoSearch: any;
    setStoreInfoSearch: Dispatch<SetStateAction<any>>;
    fetchControlDefaultValue?: boolean;
    setFetchControlDefaultValue?: Dispatch<SetStateAction<boolean>>;
    layoutviewdata?: any;
    roleTask?: any;
};

const RenderLayout: React.FC<Props> = ({
    formMethods,
    form_id,
    language,
    dictionary,
    layout,
    hiddenFields,
    rules,
    session,
    setLoading,
    activeTab,
    handleTabChange,
    handleRowDoubleClick,
    datasearch,
    setDatasearch,
    isFetching,
    setIsFetching,
    txfoSearch,
    setTxFOSearch,
    datasearchlookup,
    ismodify,
    setIsModify,
    searchtext,
    setSearchText,
    advancedsearch,
    setAdvancedSearch,
    globalAdvancedSearch,
    setGlobalAdvancedSearch,
    storeFormSearch,
    setStoreFormSearch,
    storeInfoSearch,
    setStoreInfoSearch,
    fetchControlDefaultValue,
    setFetchControlDefaultValue,
    layoutviewdata,
    roleTask
}) => {
    const tabViews = (layout.list_view || []).filter((view) => view.isTab === 'true');
    const nonTabViews = (layout.list_view || []).filter(
        (view) => view.isTab === 'false' || view.isTab == null
    );

    return (
        <Box key={`${layout.id}-${uuidv4()}`} style={{ marginBottom: '48px' }}>
            {nonTabViews.map((view, index) => (
                <RenderView
                    key={index}
                    formMethods={formMethods}
                    form_id={form_id}
                    language={language}
                    dictionary={dictionary}
                    hiddenFields={hiddenFields}
                    rules={rules}
                    session={session}
                    setLoading={setLoading}
                    handleRowDoubleClick={handleRowDoubleClick}
                    view={view}
                    datasearch={datasearch}
                    setDatasearch={setDatasearch}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    txfoSearch={txfoSearch}
                    setTxFOSearch={setTxFOSearch}
                    datasearchlookup={datasearchlookup}
                    ismodify={ismodify}
                    setIsModify={setIsModify}
                    searchtext={searchtext}
                    setSearchText={setSearchText}
                    advancedsearch={advancedsearch}
                    setAdvancedSearch={setAdvancedSearch}
                    globalAdvancedSearch={globalAdvancedSearch}
                    setGlobalAdvancedSearch={setGlobalAdvancedSearch}
                    storeFormSearch={storeFormSearch}
                    setStoreFormSearch={setStoreFormSearch}
                    storeInfoSearch={storeInfoSearch}
                    setStoreInfoSearch={setStoreInfoSearch}
                    fetchControlDefaultValue={fetchControlDefaultValue}
                    setFetchControlDefaultValue={setFetchControlDefaultValue}
                    viewdata={layoutviewdata} />
            ))}

            {tabViews.length > 0 && (
                <RenderTabs
                    formMethods={formMethods}
                    form_id={form_id}
                    language={language}
                    dictionary={dictionary}
                    hiddenFields={hiddenFields}
                    rules={rules}
                    session={session}
                    setLoading={setLoading}
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                    handleRowDoubleClick={handleRowDoubleClick}
                    tabViews={tabViews}
                    datasearch={datasearch}
                    setDatasearch={setDatasearch}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    txfoSearch={txfoSearch}
                    setTxFOSearch={setTxFOSearch}
                    datasearchlookup={datasearchlookup}
                    ismodify={ismodify}
                    setIsModify={setIsModify}
                    searchtext={searchtext}
                    setSearchText={setSearchText}
                    advancedsearch={advancedsearch}
                    setAdvancedSearch={setAdvancedSearch}
                    globalAdvancedSearch={globalAdvancedSearch}
                    setGlobalAdvancedSearch={setGlobalAdvancedSearch}
                    storeFormSearch={storeFormSearch}
                    setStoreFormSearch={setStoreFormSearch}
                    storeInfoSearch={storeInfoSearch}
                    setStoreInfoSearch={setStoreInfoSearch}
                    fetchControlDefaultValue={fetchControlDefaultValue}
                    setFetchControlDefaultValue={setFetchControlDefaultValue}
                    tabdata={layoutviewdata}
                />
            )}
        </Box>
    );
};

export default RenderLayout;
