import type { SelectChangeEvent } from "@mui/material/Select";
import { usePathname } from "next/navigation";
import { useRouter } from "@shared/hooks/useRouter";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "@/configs/i18n";
import { useWorkingProject } from "@/@core/stores/useWorkingProjectStore";

import {
  emptyAnnouncementFilter,
  announcementText,
} from "../components/announcementListHelpers";
import { announcementService } from "../services/announcementService";
import type {
  AnnouncementDictionary,
  AnnouncementFilterModel,
  AnnouncementItem,
  AnnouncementSearchResponse,
} from "../types";
import { AnnouncementWorkflowError } from "../types";

type Params = {
  dictionary: AnnouncementDictionary;
  sessiontoken?: string;
  language: Locale;
  initialFilter: AnnouncementFilterModel;
  initialData: AnnouncementSearchResponse;
  initialError?: string | null;
};

export const useAnnouncementSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null,
}: Params) => {
  const router = useRouter();
  const pathname = usePathname();
  const workingProject = useWorkingProject();
  const [filter, setFilter] = useState(initialFilter);
  const [draftFilter, setDraftFilter] = useState(initialFilter);
  const [rows, setRows] = useState(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.total_count);
  const [totalPages, setTotalPages] = useState(initialData.total_pages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const hasNormalizedInitialUrl = useRef(false);

  const handleWorkflowError = useCallback(
    (caught: unknown, fallback: string) => {
      if (
        caught instanceof AnnouncementWorkflowError &&
        caught.next_action === "logout"
      ) {
        router.push(`/${language}/logout`);
      }

      return caught instanceof Error ? caught.message : fallback;
    },
    [language, router],
  );

  const syncUrl = useCallback(
    (nextFilter: AnnouncementFilterModel) => {
      const params = new URLSearchParams();

      if (nextFilter.project_id > 0)
        params.set("project_id", String(nextFilter.project_id));
      if (nextFilter.search_text.trim())
        params.set("search_text", nextFilter.search_text.trim());
      if (nextFilter.category) params.set("category", nextFilter.category);
      if (nextFilter.status) params.set("status", nextFilter.status);
      if (nextFilter.page_index > 0)
        params.set("page_index", String(nextFilter.page_index));
      if (nextFilter.page_size !== emptyAnnouncementFilter.page_size)
        params.set("page_size", String(nextFilter.page_size));

      const query = params.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const loadData = useCallback(
    async (nextFilter: AnnouncementFilterModel = filter) => {
      if (
        !Number.isInteger(nextFilter.project_id) ||
        nextFilter.project_id <= 0
      ) {
        setRows([]);
        setTotalCount(0);
        setTotalPages(0);
        setFilter(nextFilter);
        setDraftFilter(nextFilter);
        setError(null);
        syncUrl(nextFilter);

        return undefined;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await announcementService.simpleSearchAnnouncements({
          sessiontoken,
          language,
          filter: nextFilter,
        });
        const resolvedFilter = {
          ...nextFilter,
          page_index: response.page_index,
          page_size: response.page_size,
        };

        setRows(response.items);
        setTotalCount(response.total_count);
        setTotalPages(response.total_pages);
        setFilter(resolvedFilter);
        setDraftFilter(resolvedFilter);
        syncUrl(resolvedFilter);

        return response;
      } catch (caught) {
        setError(
          handleWorkflowError(
            caught,
            announcementText(
              dictionary,
              "load_failed",
              "Không thể tải danh sách thông báo.",
            ),
          ),
        );

        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [dictionary, filter, handleWorkflowError, language, sessiontoken, syncUrl],
  );

  useEffect(() => {
    if (!workingProject) return;
    if (filter.project_id === workingProject.id) return;

    void loadData({
      ...draftFilter,
      project_id: workingProject.id,
      page_index: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id]);

  // A legacy/export URL may contain a load-all page size. The server parser has
  // already used the safe default, so canonicalize the address without fetching
  // again or leaving the misleading value in browser history.
  useEffect(() => {
    if (hasNormalizedInitialUrl.current) return;
    hasNormalizedInitialUrl.current = true;
    syncUrl(filter);
  }, [filter, syncUrl]);

  const updateDraftFilter = <K extends keyof AnnouncementFilterModel>(
    key: K,
    value: AnnouncementFilterModel[K],
  ) => {
    setDraftFilter((current) => ({ ...current, [key]: value }));
  };

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 0 });
  const applyFilter = <K extends "category" | "status">(
    key: K,
    value: AnnouncementFilterModel[K],
  ) => {
    void loadData({ ...draftFilter, [key]: value, page_index: 0 });
  };
  const handleReset = () =>
    void loadData({
      ...emptyAnnouncementFilter,
      project_id: filter.project_id,
      page_size: draftFilter.page_size,
    });
  const handleRefresh = () => void loadData(filter);
  const handleCreate = () => router.push(`/${language}/announcement/create`);
  const handleView = (row: AnnouncementItem) =>
    router.push(`/${language}/announcement/${row.id}`);

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({
      ...filter,
      page_size: Number(event.target.value),
      page_index: 0,
    });
  };

  const handlePageChange = (
    _: React.ChangeEvent<unknown>,
    pageIndex: number,
  ) => {
    void loadData({ ...filter, page_index: pageIndex });
  };

  const handleJumpPage: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    const displayPage = Number(event.target.value);

    if (!Number.isInteger(displayPage) || displayPage < 1) return;

    handlePageChange(event, displayPage - 1);
  };

  return {
    filter,
    draftFilter,
    rows,
    totalCount,
    loading,
    error,
    selectedProject: workingProject,
    loadData,
    updateDraftFilter,
    applyFilter,
    handleSearch,
    handleReset,
    handleRefresh,
    handleCreate,
    handleView,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage,
  };
};
