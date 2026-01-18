'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, FormView, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import RenderInput from './input';

type Props = {
  formMethods: ReturnType<typeof useForm>;
  form_id: string;
  language: Locale;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  hiddenFields: string[];
  rules: RuleStrong[];
  session: Session | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  handleRowDoubleClick: (rowData: any, input: FormInput) => Promise<void>;
  tabViews: FormView[];
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
  isPreview?: boolean;
  setIsPreview?: Dispatch<SetStateAction<boolean>>;
  tabdata?: any;
};

const RenderTabs: React.FC<Props> = ({
  formMethods,
  form_id,
  language,
  dictionary,
  hiddenFields,
  rules,
  session,
  setLoading,
  activeTab,
  handleTabChange,
  handleRowDoubleClick,
  tabViews,
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
  tabdata
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        marginTop: 10,
        border: '1px solid #048D49',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff'
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Dynamic Tabs"
        sx={{ marginBottom: '16px' }}
      >
        {tabViews.map((tabView, index) => (
          <Tab
            label={tabView.name || `Tab ${index + 1}`}
            key={tabView.id || `tab-${index}`}
            sx={{ textTransform: 'none', fontWeight: '500', minWidth: '120px' }}
          />
        ))}
      </Tabs>

      {tabViews.map((tabView, index) => (
        <Box
          key={tabView.id || `tabpanel-${index}`}
          role="tabpanel"
          hidden={activeTab !== index}
          id={`tabpanel-${index}`}
          aria-labelledby={`tab-${index}`}
          sx={{
            marginTop: 2,
            border: tabView.isBorder === 'true' ? '1px solid #ddd' : 'none',
            borderRadius: '8px',
            padding: tabView.isBorder === 'true' ? '16px' : '0'
          }}
        >
          {activeTab === index && (
            <Grid container spacing={2}>
              {(tabView.list_input || []).map((input, idx) => (
                <RenderInput
                  key={idx}
                  formMethods={formMethods}
                  form_id={form_id}
                  language={language}
                  dictionary={dictionary}
                  input={input}
                  index={idx}
                  hiddenFields={hiddenFields}
                  rules={rules}
                  session={session}
                  setLoading={setLoading}
                  handleRowDoubleClick={handleRowDoubleClick}
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
                  inputdata={tabdata}
                />
              ))}
            </Grid>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default RenderTabs;
