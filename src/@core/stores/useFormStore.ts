// stores/useFormStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { produce } from 'immer';
import type { PageData } from '@shared/types/systemTypes';

type FormState = {
  // Form-specific state indexed by form_id
  forms: Record<string, {
    datasearch?: PageData<any>;
    isFetching: boolean;
    txfoSearch?: any;
    ismodify: boolean;
    searchtext: string;
    advancedsearch?: any;
    globalAdvancedSearch?: any;
    storeFormSearch: any[];
    storeInfoSearch: any;
    fetchControlDefaultValue: boolean;
  }>;
  
  // Actions
  initForm: (formId: string, initialData?: Partial<FormState['forms'][string]>) => void;
  updateForm: (formId: string, updates: Partial<FormState['forms'][string]>) => void;
  setDatasearch: (formId: string, data: PageData<any> | undefined) => void;
  setIsFetching: (formId: string, isFetching: boolean) => void;
  setSearchText: (formId: string, text: string) => void;
  setIsModify: (formId: string, isModify: boolean) => void;
  setAdvancedSearch: (formId: string, search: any) => void;
  setGlobalAdvancedSearch: (formId: string, search: any) => void;
  clearForm: (formId: string) => void;
};

const defaultFormState = {
  datasearch: undefined,
  isFetching: false,
  txfoSearch: undefined,
  ismodify: false,
  searchtext: '',
  advancedsearch: undefined,
  globalAdvancedSearch: {},
  storeFormSearch: [],
  storeInfoSearch: {},
  fetchControlDefaultValue: false,
};

export const useFormStore = create<FormState>()(
  devtools(
    subscribeWithSelector((set) => ({
      forms: {},
      
      initForm: (formId: string, initialData?: Partial<FormState['forms'][string]>) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) {
              state.forms[formId] = { ...defaultFormState, ...initialData };
            }
          }),
          false,
          'initForm'
        ),
      
      updateForm: (formId: string, updates: Partial<FormState['forms'][string]>) =>
        set(
          produce((state: FormState) => {
            if (state.forms[formId]) {
              Object.assign(state.forms[formId], updates);
            } else {
              state.forms[formId] = { ...defaultFormState, ...updates };
            }
          }),
          false,
          'updateForm'
        ),
      
      setDatasearch: (formId: string, data: PageData<any> | undefined) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].datasearch = data;
          }),
          false,
          'setDatasearch'
        ),
      
      setIsFetching: (formId: string, isFetching: boolean) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].isFetching = isFetching;
          }),
          false,
          'setIsFetching'
        ),
      
      setSearchText: (formId: string, text: string) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].searchtext = text;
          }),
          false,
          'setSearchText'
        ),
      
      setIsModify: (formId: string, isModify: boolean) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].ismodify = isModify;
          }),
          false,
          'setIsModify'
        ),
      
      setAdvancedSearch: (formId: string, search: any) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].advancedsearch = search;
          }),
          false,
          'setAdvancedSearch'
        ),
      
      setGlobalAdvancedSearch: (formId: string, search: any) =>
        set(
          produce((state: FormState) => {
            if (!state.forms[formId]) state.forms[formId] = { ...defaultFormState };
            state.forms[formId].globalAdvancedSearch = search;
          }),
          false,
          'setGlobalAdvancedSearch'
        ),
      
      clearForm: (formId: string) =>
        set(
          produce((state: FormState) => {
            delete state.forms[formId];
          }),
          false,
          'clearForm'
        ),
    })),
    { name: 'FormStore' }
  )
);

// Optimized selectors for specific form fields
export const useFormData = (formId: string) =>
  useFormStore((state) => state.forms[formId] || defaultFormState);

export const useFormDatasearch = (formId: string) =>
  useFormStore((state) => state.forms[formId]?.datasearch);

export const useFormIsFetching = (formId: string) =>
  useFormStore((state) => state.forms[formId]?.isFetching ?? false);

export const useFormSearchText = (formId: string) =>
  useFormStore((state) => state.forms[formId]?.searchtext ?? '');

export const useFormIsModify = (formId: string) =>
  useFormStore((state) => state.forms[formId]?.ismodify ?? false);

