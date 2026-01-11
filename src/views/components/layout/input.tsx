'use client'

import { Locale } from "@/configs/i18n";
import { FormInput, PageData, RuleStrong } from "@/types/systemTypes";
import { getDictionary } from "@/utils/getDictionary";
import { parseClassToGrid } from "@/utils/parseClassToGrid";
import { Session } from "next-auth";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
import RenderButtonDefault from "../render-button";
import RenderCheckBoxDefault from "../render-checkbox";
import RenderInputDefault from "../render-input";
import RenderInputCurrency from "../render-input-currency";
import RenderInputDateTime from "../render-input-datetime";
import RenderInputFunc from "../render-input-func";
import RenderInputSearch from "../render-input-search";
import RenderInputTimeSheet from "../render-input-timesheet";
import RenderSelectDefault from "../render-select";
import RenderTableSearchAdvance from "../render-table-search";
import RenderTableDynamicItem from "../render-table-dynamic-item";
import RenderImageUpload from "../render-input-image";

type RenderInputProps = {
  formMethods: ReturnType<typeof useForm>;
  form_id: string;
  language: Locale;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  input: FormInput;
  index: number;
  hiddenFields: string[];
  rules: RuleStrong[];
  session: Session | null;
  setLoading: Dispatch<SetStateAction<boolean>>;
  handleRowDoubleClick: (rowData: any, input: FormInput) => Promise<void>;
  datasearch?: PageData<any>;
  setDatasearch: Dispatch<SetStateAction<PageData<any> | undefined>>;
  isFetching: boolean;
  setIsFetching: Dispatch<SetStateAction<boolean>>;
  txfoSearch: any;
  setTxFOSearch: Dispatch<SetStateAction<undefined>>;
  datasearchlookup?: PageData<any>;
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
  inputdata?: any;
  roleTask?: any;
};

const RenderInput: React.FC<RenderInputProps> = ({
  formMethods,
  language,
  dictionary,
  input,
  index,
  hiddenFields,
  rules,
  session,
  setLoading,
  handleRowDoubleClick,
  datasearch,
  setDatasearch,
  setIsFetching,
  txfoSearch,
  setTxFOSearch,
  datasearchlookup,
  ismodify,
  setIsModify,
  searchtext,
  setSearchText,
  fetchControlDefaultValue,
  setFetchControlDefaultValue,
  inputdata,
  roleTask
}) => {
  const gridProps = parseClassToGrid(input.default?.class || '');
  const uniqueKey = `${input.default?.id || input.default?.code}-${index}-${uuidv4()}`;

  if (hiddenFields.includes(input.default?.code)) {
    return null;
  }

  switch (input.inputtype) {
    case 'cTextInput':
      return (
        <RenderInputDefault
          session={session}
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          dictionary={dictionary}
          language={language}
          rules={rules}
          renderviewdata={inputdata}
          ismodify={ismodify}
          fetchControlDefaultValue={fetchControlDefaultValue}
          setFetchControlDefaultValue={setFetchControlDefaultValue}
          formMethods={formMethods}
        />
      );
    case 'cTextInputFunc':
      return (
        <RenderInputFunc
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          language={language}
          rules={rules}
          ismodify={ismodify}
          session={session}
          setLoading={setLoading}
          formMethods={formMethods}
        />
      );
    case 'cTextInputSearch':
      return (
        <RenderInputSearch
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          language={language}
          rules={rules}
          ismodify={ismodify}
          searchtext={searchtext}
          setSearchText={setSearchText}
        />
      );
    case 'jInputDateTime':
      return (
        <RenderInputDateTime
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          language={language}
          rules={rules}
          ismodify={ismodify}
          formMethods={formMethods}
        />
      );
    case 'jInputTimeSheet':
      return (
        <RenderInputTimeSheet
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          language={language}
          rules={rules}
          renderviewdata={inputdata}
          ismodify={ismodify}
          formMethods={formMethods}
        />
      );
    case 'cImage':
      return (
        <RenderImageUpload
          session={session}
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          dictionary={dictionary}
          language={language}
          rules={rules}
          renderviewdata={inputdata}
          ismodify={ismodify}
          fetchControlDefaultValue={fetchControlDefaultValue}
          setFetchControlDefaultValue={setFetchControlDefaultValue}
          formMethods={formMethods}
        />
      );
    case 'jCurrency':
      return (
        <RenderInputCurrency
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          language={language}
          rules={rules}
          renderviewdata={inputdata}
          ismodify={ismodify}
          formMethods={formMethods}
        />
      );
    case 'jSelect':
      return (
        <RenderSelectDefault
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          session={session}
          dictionary={dictionary}
          language={language}
          rules={rules}
          renderviewdata={inputdata}
          ismodify={ismodify}
          formMethods={formMethods}
        />
      );
    case 'cCheckBox':
      return (
        <RenderCheckBoxDefault
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          session={session}
          dictionary={dictionary}
          language={language}
          rules={rules}
          ismodify={ismodify}
          formMethods={formMethods}
          renderviewdata={inputdata}
        />
      );
    case 'cButton':
      return (
        <RenderButtonDefault
          key={uniqueKey}
          session={session}
          input={input}
          gridProps={gridProps}
          rules={rules}
          formMethods={formMethods}
          dictionary={dictionary}
          language={language}
          setIsFetching={setIsFetching}
          setDatasearch={setDatasearch}
          setTxFOSearch={setTxFOSearch}
          ismodify={ismodify}
          setIsModify={setIsModify}
          searchtext={searchtext}
          roleTask={roleTask}
        />
      );
    case 'jTableSearch':
      return (
        <RenderTableSearchAdvance
          key={uniqueKey}
          input={input}
          gridProps={gridProps}
          rules={rules}
          session={session}
          onRowDoubleClick={(rowData) => handleRowDoubleClick(rowData, input)}
          datasearch={datasearch}
          txfoSearch={txfoSearch}
          setDatasearch={setDatasearch}
          setLoading={setLoading}
          datasearchlookup={datasearchlookup}
          dictionary={dictionary}
          roleTask={roleTask}
          language={language}
        />
      );
    case 'cTableDynamic': {
      return (
        <RenderTableDynamicItem
          gridProps={gridProps}
          input={input}
          dictionary={dictionary}
          formMethods={formMethods}
        />
      );
    }
    

    default:
      return <div key={uniqueKey}>Unsupported input type: {input.inputtype}</div>;
  }
};

export default RenderInput;
