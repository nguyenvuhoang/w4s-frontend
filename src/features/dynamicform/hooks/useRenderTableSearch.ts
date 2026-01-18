'use client';

import { SelectChangeEvent } from '@mui/material';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { handleSearchAPI } from '@/@core/components/cButton/handleSearchAPI';
import Application from '@/@core/lib/libSupport';
import { useUserStore } from '@/@core/stores/useUserStore';
import { useRowSelection } from '@/contexts/RowSelectionContext';
import { FormInput, PageData, RuleStrong } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { getNestedValue } from '@/utils/getNestedValue';
import SwalAlert from '@/utils/SwalAlert';

// ============================================================================
// Types
// ============================================================================

export type Column = {
  code: string;
  title: string;
  inputtype: string;
  config: any;
  onClick?: any;
};

export interface PreviewModalContent {
  previewtype: string;
  previewdata: any;
  datatype?: string;
}

export interface UseRenderTableSearchParams {
  input: FormInput;
  rules: RuleStrong[];
  session: Session | null;
  onRowDoubleClick: (rowData: any, input: FormInput) => void;
  datasearch: PageData<any> | undefined;
  txfoSearch: any;
  setDatasearch: React.Dispatch<React.SetStateAction<PageData<any> | undefined>>;
  setLoading: (loading: boolean) => void;
  datasearchlookup: PageData<any> | undefined;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  roleTask?: any;
}

export interface UseRenderTableSearchReturn {
  // States
  filteredData: any[];
  page: number;
  pageSize: number;
  totalResults: number;
  jumpPage: number;
  modalContent: PreviewModalContent | null;
  isModalOpen: boolean;

  // Computed values
  columns: Column[];
  disableOnTableAction: boolean;

  // Row selection
  isRowSelected: (row: any) => boolean;

  // Handlers
  handlePageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  handlePageSizeChange: (event: SelectChangeEvent<number>) => void;
  handleJumpPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCloseModal: () => void;
  handlePreviewModal: (data: any, previewtype: string, datatype?: string, app?: string) => void;
  handleCheckboxChange: (row: any) => void;
  handleRowDoubleClick: (row: any) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useRenderTableSearch = ({
  input,
  rules,
  session,
  onRowDoubleClick,
  txfoSearch,
  datasearch,
  setDatasearch,
  setLoading,
  datasearchlookup,
  dictionary,
  roleTask,
}: UseRenderTableSearchParams): UseRenderTableSearchReturn => {
  // Local states
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [jumpPage, setJumpPage] = useState(1);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [modalContent, setModalContent] = useState<PreviewModalContent | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Row selection context
  const { addRow, removeRow, isRowSelected } = useRowSelection();

  // Memoized values
  const columns = useMemo<Column[]>(
    () => JSON.parse(input.config.columns || '[]'),
    [input.config.columns]
  );

  const disableOnTableAction = useMemo(
    () => rules.some((rule) => rule.code === 'managerComponent' && rule.config.disableontableaction === 'true'),
    [rules]
  );

  // Filter data helper
  const filterData = useCallback(
    (data: PageData<any> | undefined) => {
      if (!data?.items) return [];

      return data.items.filter(
        (row) =>
          Object.keys(row).length > 0 &&
          columns.every((column) => {
            const searchTerm = searchTerms[column.code];
            if (!searchTerm) return true;
            const cellValue = getNestedValue(row, column.code)?.toString().toLowerCase() || '';
            return cellValue.includes(searchTerm.toLowerCase());
          })
      );
    },
    [columns, searchTerms]
  );

  // Update filtered data when datasearch changes
  useEffect(() => {
    if (!datasearch) return;

    const filtered = filterData(datasearch);
    setFilteredData(filtered);
    setTotalResults(datasearch.total_count || 0);
    setPage(datasearch.pageindex || 1);
    setPageSize(datasearch.pagesize || 10);
  }, [datasearch, filterData]);

  // Update filtered data when datasearchlookup changes
  useEffect(() => {
    if (!datasearchlookup) return;

    const filtered = filterData(datasearch);
    setFilteredData(filtered);
    setTotalResults(datasearch?.total_count || 0);
    setPage(datasearch?.pageindex || 1);
    setPageSize(datasearch?.pagesize || 10);
  }, [datasearchlookup, datasearch, filterData]);

  // Execute search API
  const executeSearchAPI = useCallback(
    async (pageindex: number, pagesize: number) => {
      setLoading(true);
      try {
        if (txfoSearch === undefined) {
          Application.AppException('#CBUTTON.onClick', 'Error Json is undefined', 'Error');
          return;
        }

        const response = await handleSearchAPI(session, txfoSearch, pageindex, pagesize);

        const updatedResponse: PageData<any> = {
          total_count: response?.total_count ?? 0,
          total_pages: response?.total_pages ?? 0,
          has_previous_page: response?.has_previous_page ?? false,
          has_next_page: response?.has_next_page ?? false,
          items: response?.items ?? [],
          pageindex,
          pagesize,
        };

        setDatasearch(updatedResponse);
      } catch (error) {
        Application.AppException('#CBUTTON.onClick', String(error), 'Error');
      } finally {
        setLoading(false);
      }
    },
    [session, txfoSearch, setDatasearch, setLoading]
  );

  // Trigger search effect
  useEffect(() => {
    if (triggerSearch) {
      executeSearchAPI(page, pageSize).then(() => setTriggerSearch(false));
    }
  }, [triggerSearch, page, pageSize, executeSearchAPI]);

  // Handlers
  const handlePageChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      if (value !== page) {
        setPage(value);
        setTriggerSearch(true);
      }
    },
    [page]
  );

  const handlePageSizeChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const newSize = Number(event.target.value);
      if (newSize !== pageSize) {
        setPageSize(newSize);
        setTriggerSearch(true);
      }
    },
    [pageSize]
  );

  const handleJumpPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (value > 0 && value <= Math.ceil(totalResults / pageSize)) {
        setJumpPage(value);
        setPage(value);
      }
    },
    [totalResults, pageSize]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handlePreviewModal = useCallback(
    (data: any, previewtype: string, datatype?: string, _app?: string) => {
      try {
        if (data === undefined || data === null) {
          console.warn('Data is undefined or null');
          return;
        }

        let previewdata: any;
        if (datatype === 'JSON') {
          previewdata = JSON.parse(data);
        } else if (datatype === 'XML') {
          previewdata = new DOMParser().parseFromString(data, 'text/xml');
        } else {
          previewdata = data;
        }

        setModalContent({
          previewtype,
          previewdata,
          datatype,
        });
        setModalOpen(true);
      } catch (error) {
        console.error('Failed to parse data:', error);
      }
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (row: any) => {
      if (isRowSelected(row)) {
        removeRow(row);
      } else {
        addRow(row);
      }
    },
    [isRowSelected, removeRow, addRow]
  );

  const handleRowDoubleClick = useCallback(
    (row: any) => {
      const action = input?.config?.actionFo_RowSelect?.useAction;

      if (action === 'viewdetail') {
        const codeHidden = input?.default?.codeHidden;
        const { role } = useUserStore.getState();

        const isNotAllowed = role.some((r) => {
          const roleId = r.role_id?.toString();
          return roleTask?.[roleId]?.[codeHidden]?.component?.install === false;
        });

        if (isNotAllowed) {
          SwalAlert('warning', `${dictionary['common'].nopermissionview}`, 'center');
          return;
        }
      }

      onRowDoubleClick(row, input);
    },
    [input, roleTask, dictionary, onRowDoubleClick]
  );

  return {
    // States
    filteredData,
    page,
    pageSize,
    totalResults,
    jumpPage,
    modalContent,
    isModalOpen,

    // Computed values
    columns,
    disableOnTableAction,

    // Row selection
    isRowSelected,

    // Handlers
    handlePageChange,
    handlePageSizeChange,
    handleJumpPage,
    handleCloseModal,
    handlePreviewModal,
    handleCheckboxChange,
    handleRowDoubleClick,
  };
};
