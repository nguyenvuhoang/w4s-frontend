'use client';

import { Locale } from '@/configs/i18n';
import { FormInput, FormView, PageData, RuleStrong } from '@shared/types/systemTypes';
import { getDictionary } from '@utils/getDictionary';
import { Box, Grid, Typography } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
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
  handleRowDoubleClick: (rowData: any, input: FormInput) => Promise<void>;
  view: FormView;
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
  viewdata?: any;
  roleTask?: any;
};

const RenderView: React.FC<Props> = ({
  formMethods,
  form_id,
  language,
  dictionary,
  hiddenFields,
  rules,
  session,
  setLoading,
  handleRowDoubleClick,
  view,
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
  viewdata,
  roleTask
}) => {
  if (view.isTab === 'true') return null;

  const inputList = view.list_input || [];
  const renderInputs = inputList.map((input, index) => (
    <RenderInput
      key={index}
      formMethods={formMethods}
      form_id={form_id}
      language={language}
      dictionary={dictionary}
      input={input}
      index={index}
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
      inputdata={viewdata}
      roleTask={roleTask}
    />
  ));

  return view.isBox === 'true' ? (
    <Box
      sx={{
        border: '1px solid #09633F',
        borderRadius: 2,
        mb: 5,
        boxShadow: 1,
        overflow: 'hidden'
      }}
      key={`${view.id}-${uuidv4()}`}
    >
      {view.lang?.title?.[language] && (
        <Box
          sx={{
            backgroundColor: '#09633F',
            color: 'white',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid #ffffff'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              '&.MuiTypography-root': {
                display: 'block',
                textAlign: 'left'
              }
            }}
          >
            {view.lang.title[language]}
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>{renderInputs}</Grid>
      </Box>
    </Box>
  ) : (
    <Grid container spacing={2}>{renderInputs}</Grid>
  );
};

export default RenderView;

