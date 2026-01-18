'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { workflowService } from '@/servers/system-service';
import { PageContentProps } from '@/types';
import SwalAlert from '@/utils/SwalAlert';
import { RHFSelect } from '@/views/accounting/component/RHFSelect';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { FormValues } from '../component/FormValues';
import { RHFText } from '../component/RHFText';


const yesNoOptions = [
  { value: 'N', label: 'No' },
  { value: 'Y', label: 'Yes' }
];

const sideOptions = [
  { value: 'D', label: 'Debit' },
  { value: 'C', label: 'Credit' },
  { value: 'B', label: 'Both' }
];

const postingSideOptions = [
  { value: 'A', label: 'Allow Debit and Credit' },
  { value: 'D', label: 'Not Allow Credit' },
  { value: 'C', label: 'Not Allow Debit' }
];


const currencyOptions = [
  { value: 'LAK', label: 'LAK - Lao Kip' },
]

const processOptions = [
  { value: 'N', label: 'None' },
  { value: 'C', label: 'Unrealize Gain/Loss revaluation' },
]

const AccountChartAddContent = ({
  dictionary,
  session,
  locale,
  accountlevelOptions,
  accountClassificationOptions,
  accountCategoriesOptions,
  accountGroupOptions,
  branchOptions
}: PageContentProps) => {

  const methods = useForm<FormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      account_level: '1',
      currency_code: 'LAK',
      account_classification: 'ASSETS',
      balance_side: 'Both',
      account_group: 'Normal',
      direct_posting: 'No',
      job_process_option: 'None',
      reverse_balance: 'No',
      posting_side: 'Allow',
      account_categories: 'Normal',
      is_visible: 'No',
      branch_code: '001',
      laos_name: ''
    }
  });

  const { control, setValue, getValues, handleSubmit } = methods;
  const [showOtherName, setShowOtherName] = useState(false);

  const onSubmit = async (data: FormValues) => {

    const response = await workflowService.runBODynamic({
      sessiontoken: session?.user?.token as string,
      txFo: {
        bo: [
          {
            use_microservice: true,
            input: {
              workflowid: WORKFLOWCODE.BO_CREATE_ACCOUNTCHART,
              learn_api: 'cbs_workflow_execute',
              fields: {
                ...data
              }
            },
          },
        ],
      },
    });

    if (response.status === 200 && response.payload?.dataresponse) {

      const foArray = response.payload.dataresponse.data;
      const hasErrorFo = foArray.find((item: any) => item.input?.error_code === 'ERROR');

      if (hasErrorFo) {
        let errorMsg = hasErrorFo.input?.error_message ?? 'Unknown error';
        try {
          const jsonMatch = errorMsg.match(/{.*}/);
          if (jsonMatch) {
            const jsonError = JSON.parse(jsonMatch[0]);
            errorMsg = jsonError.error_message || errorMsg;
          }
        } catch (_) {
        }

        SwalAlert('error', errorMsg, 'center');
        return;
      }

      SwalAlert('success', dictionary['accountchart'].accountchartsuccess, 'center', false, false, true);

    } else {
      SwalAlert('error', response.payload.error[0].info, 'center');
    }
  };

  const onSearch = () => {
    // optional: route to list/search page
    console.log('search clicked');
  };

  const accountLevel = useWatch({ control, name: 'account_level' });
  const showCurrency = accountLevel === '8' || accountLevel === '9';

  useEffect(() => {
    if (!showCurrency) {
      setValue('currency_code', '');
    } else if (!getValues('currency_code')) {
      setValue('currency_code', 'LAK');
    }
  }, [showCurrency, setValue, getValues]);
  return (
    <ContentWrapper
      title={`${dictionary['accountchart'].title} - ${dictionary['navigation'].add}`}
      description={dictionary['accountchart'].description}
      icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
      dictionary={dictionary}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Action bar */}
          <Box sx={{ display: 'flex', gap: 5, m: 5 }}>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<SearchIcon />}
              onClick={onSearch}
            >
              {dictionary['common']?.search ?? 'Search'}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              {dictionary['common']?.save ?? 'Save'}
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="account_level" label="Account level" options={accountlevelOptions} required />
              </Grid>

              {showCurrency && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <RHFSelect
                    name="currency_code"
                    label="Currency"
                    options={currencyOptions}
                    rules={{
                      required: showCurrency ? 'Currency is required' : false
                    }}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFText name="account_number" label="Account number" required placeholder="Account number" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFText name="account_name" label="Account name" required placeholder="Account name" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFText
                  name="short_account_name"
                  label="Short account name"
                  required
                  placeholder="Short account name"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                {showOtherName ? (
                  <Box
                    component="fieldset"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      pt: 2,
                      '& legend': {
                        px: 1,
                        ml: 2,
                        bgcolor: 'background.paper',
                        typography: 'body2',
                        fontWeight: 600,
                        color: 'primary.main',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }
                    }}
                  >
                    <legend onClick={() => setShowOtherName(false)}>
                      [-] Other Name
                    </legend>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <RHFText name="laos_name" label="Lao name" placeholder="Lao name" />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box
                    onClick={() => setShowOtherName(true)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: 'primary.main',
                      fontWeight: 600
                    }}
                  >
                    <Typography variant="body2">[+] Other Name</Typography>
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="account_classification"
                  label="Account classification"
                  options={accountClassificationOptions}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="reverse_balance" label="Reverse balance" options={yesNoOptions} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="balance_side" label="Balance side" options={sideOptions} />
              </Grid>


              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="posting_side" label="Posting side" options={postingSideOptions} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="account_group" label="Account group" options={accountGroupOptions} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="account_categories" label="Account categories" options={accountCategoriesOptions} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="direct_posting" label="Direct posting" options={yesNoOptions} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="is_visible" label="Is Visible" options={yesNoOptions} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="job_process_option"
                  label="Job process option"
                  options={processOptions}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect name="branch_code" label="Branch Code" options={branchOptions} />
              </Grid>
            </Grid>
          </Paper>

        </form>
      </FormProvider>
    </ContentWrapper>
  );
};

export default AccountChartAddContent;
