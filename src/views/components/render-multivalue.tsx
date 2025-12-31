'use client';

import { handleAdvanceSearchAPI } from '@/@core/components/cButton/handleAdvanceSearchAPI';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { FormInput, PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { Box, Button, Grid, Typography } from '@mui/material';
import { Session } from 'next-auth';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import RenderLayout from './layout';
import { useAdvanceSearchStore } from '@/@core/stores/advanceSearchStore';

type Props = {
  input: FormInput;
  gridProps: Record<string, number>;
  session: Session | null;
  form_id: string;
  language: Locale;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  renderviewdata?: any;
  ismodify?: boolean;
  searchtextdefault?: string;
  datasearchdefault: PageData<any> | undefined;
  advancedsearchdefault?: any;
  setAdvancedSearchDefault?: Dispatch<SetStateAction<any>>;
  setDatasearch: Dispatch<SetStateAction<PageData<any> | undefined>>;
  storeFormSearch: any[];
  setStoreFormSearch: Dispatch<SetStateAction<any[]>>;
  storeInfoSearch: any;
  setStoreInfoSearch: Dispatch<SetStateAction<any>>;
};

const RenderMultiValueDefault = ({
  input,
  gridProps,
  session,
  form_id,
  dictionary,
  language,
  datasearchdefault,
  renderviewdata,
  ismodify,
  searchtextdefault,
  advancedsearchdefault,
  setAdvancedSearchDefault,
  setDatasearch,
  storeFormSearch,
  setStoreFormSearch,
  storeInfoSearch,
  setStoreInfoSearch,
}: Props) => {
  const [list_layout, setListLayout] = useState<any[]>(storeFormSearch);
  const [info, setInfo] = useState<any>(storeInfoSearch);
  const [advancedsearch, setAdvancedSearch] = useState<any>(advancedsearchdefault);

  // Optimized: Only subscribes to this form's expansion state
  const isExpanded = useAdvanceSearchStore((state) => state.expandedMap[form_id] ?? false);
  const toggleExpand = useAdvanceSearchStore((state) => state.toggleExpand);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formcontentApi = await systemServiceApi.loadFormInfo({
          sessiontoken: session?.user?.token as string,
          language: 'en',
          formid: form_id + '_advanced_search',
        });

        const pagecontentdetail = formcontentApi.payload.dataresponse.data.input;

        if (pagecontentdetail?.form_design_detail) {
          const { list_layout: layout, info: form_info } = pagecontentdetail.form_design_detail;
          if (Array.isArray(layout)) setListLayout(layout);
          if (form_info && typeof form_info === 'object') setInfo(form_info);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    if (!list_layout || list_layout.length === 0) {
      fetchData();
    }
  }, [list_layout, form_id, session?.user?.token]);


  const handleSearch = async () => {
    const allFields = list_layout.flatMap((layout) =>
      layout.list_view.flatMap((view: { list_input: any[] }) =>
        view.list_input?.map((input) => input.default.code) || []
      )
    );

    const completeAdvancedSearch = allFields.reduce((acc, field) => {
      acc[field] = advancedsearch[field] || '';
      return acc;
    }, {} as Record<string, string>);

    setStoreFormSearch(list_layout);
    setStoreInfoSearch(info);
    setAdvancedSearchDefault?.(completeAdvancedSearch);
    const txFo_ = JSON.parse(input.config.txFo);
    const responseAdvanced = await handleAdvanceSearchAPI(session, txFo_, 1, 10, completeAdvancedSearch);
    setDatasearch(responseAdvanced);
  };

  return (
    <Grid size={gridProps}>
      <Box
        sx={{
          position: 'relative',
          marginBottom: '16px',
          padding: isExpanded ? '16px' : '0',
          border: isExpanded ? '1px solid #ddd' : 'none',
          borderRadius: '8px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-10px',
            left: '16px',
            backgroundColor: '#fff',
            padding: '0 8px',
            fontWeight: 'bold',
            zIndex: 1,
            cursor: 'pointer',
          }}
          onClick={() => toggleExpand(form_id)}
        >
          <Typography
            sx={{
              color: 'navy',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {isExpanded ? (
              <IndeterminateCheckBoxIcon color="primary" />
            ) : (
              <AddBoxIcon color="primary" />
            )}
            {dictionary['common'].advancesearch}
          </Typography>
        </Box>

        {isExpanded && (
          <>
            {list_layout && list_layout.length > 0 ? (
              <Box sx={{ marginTop: '16px' }}>
                <RenderLayout
                  datalayout={list_layout}
                  rules={info.ruleStrong}
                  session={session}
                  form_id={form_id}
                  setLoading={() => { }}
                  dictionary={dictionary}
                  language={language}
                  renderviewdata={renderviewdata}
                  ismodifydefault={ismodify}
                  searchtextdefault={searchtextdefault}
                  advancedsearch={advancedsearch}
                  setAdvancedSearch={setAdvancedSearch}
                  datasearchdefault={datasearchdefault}
                  isNested={true}
                />

                <Grid size={{ xs: 12 }} sx={{ marginBottom: '16px' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SavedSearchIcon />}
                    onClick={handleSearch}
                  >
                    {dictionary['common'].search}
                  </Button>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ marginTop: '16px', textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  {dictionary['common'].noadvancesearch}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Grid>
  );
};

export default RenderMultiValueDefault;
