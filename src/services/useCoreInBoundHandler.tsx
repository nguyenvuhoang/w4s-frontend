import { Locale } from "@/configs/i18n";
import { systemServiceApi } from "@/servers/system-service";
import { CoreInboundMessageType } from "@/types/bankType";
import { PageData } from "@/types/systemTypes";
import { isValidResponse } from "@/utils/isValidResponse";
import { SelectChangeEvent } from "@mui/material";
import { Session } from "next-auth";
import { useEffect, useMemo, useState } from "react";

export type SearchForm = {
  searchtext: string;
};

export const useCoreInboundHandler = (
  contractdata: PageData<CoreInboundMessageType>,
  session: Session | null,
  locale: Locale
) => {
  const [contracts, setCoreInbounds] =
    useState<PageData<CoreInboundMessageType>>(contractdata);
  const [page, setPage] = useState<number>(
    Math.max(contractdata?.page_index ?? 1, 1)
  );
  const [jumpPage, setJumpPage] = useState<number>(
    contractdata.page_index || 1
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    contractdata.page_size || 10
  );
  const [totalCount, setTotalCount] = useState<number>(
    contractdata.items[0]?.total_count || 0
  );
  const [loading, setLoading] = useState(false);
  const [searchPayload, setSearchPayload] = useState<SearchForm>();
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const currentPageIds = useMemo(
    () => (contracts?.items ?? []).map((x) => x.id),
    [contracts?.items]
  );

  const fetchData = async (
    payload: SearchForm = searchPayload!,
    pageOverride: number = page,
    sizeOverride: number = rowsPerPage
  ) => {
    setLoading(true);
    try {
      const dataSearch = {
        ...payload,
        // searchtext: "",
      };
      console.log("call api: ", pageOverride, sizeOverride);
      const contractdataApi = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "CBG_EXECUTE_SQL",
        input: {
          commandname: "SimpleSearchCoreInbound",
          issearch: true,
          pageindex: pageOverride,
          pagesize: sizeOverride,
          parameters: dataSearch,
        },
      });

      if (
        !isValidResponse(contractdataApi) ||
        (contractdataApi.payload.dataresponse.error &&
          contractdataApi.payload.dataresponse.error.length > 0)
      ) {
        console.log(
          "ExecutionID:",
          contractdataApi.payload.dataresponse.error[0].execute_id +
            " - " +
            contractdataApi.payload.dataresponse.error[0].info
        );
        return;
      }

      const datacontract = contractdataApi.payload.dataresponse.fo[0]
        .input as PageData<CoreInboundMessageType>;
      console.log("datacontract: ", datacontract);
      setCoreInbounds(datacontract);
      setTotalCount(datacontract.items[0]?.total_count || 0);
    } catch (err) {
      console.error("Error fetching contract data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const payload = searchPayload ?? defaultPayload;
    fetchData(payload, page, rowsPerPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchPayload]);

  const defaultPayload: SearchForm = {
    searchtext: "",
  };

  const handleSearch = (data: SearchForm) => {
    setPage(1);
    setJumpPage(1);
    setSearchPayload(data);
    fetchData(data, 1, rowsPerPage);
  };

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value > 0 && value <= Math.ceil(totalCount / rowsPerPage)) {
      setJumpPage(value);
      setPage(value);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    const payload = searchPayload ?? defaultPayload;
    setJumpPage(value);
    setPage(value);
    fetchData(payload, value, rowsPerPage);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newSize = Number(event.target.value);
    const payload = searchPayload ?? defaultPayload;
    setPage(1);
    setRowsPerPage(newSize);
    fetchData(payload, 1, newSize);
  };
  return {
    // data
    contracts,
    page,
    setPage,
    jumpPage,
    setJumpPage,
    rowsPerPage,
    setRowsPerPage,
    totalCount,
    loading,
    statusOptions,
    setLoading,

    // actions
    handleSearch,
    handleJumpPage,
    handlePageChange,
    handlePageSizeChange,
    currentPageIds,
  };
};
