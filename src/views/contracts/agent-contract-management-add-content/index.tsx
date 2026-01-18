'use client';

import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { env } from '@/env.mjs';
import { systemServiceApi } from '@/servers/system-service';
import { PageContentProps } from '@/types';
import { fileToBase64 } from '@/utils/fileToBase64';
import SwalAlert from '@/utils/SwalAlert';
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import {
  Box,
  Button,
  Step,
  StepLabel,
  Stepper
} from '@mui/material';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import AccountStep from './AccountStep';
import ContractPreviewModal from './ContractPreviewModal';
import ContractStep from './ContractStep';
import CustomerStep from './CustomerStep';
import KYCStep from './KYCStep';


const AgentContractManagementAddContent = ({
  dictionary,
  session,
  locale,
  contractdata,
  branchOptions,
  countryOptions,
  cityOptions
}: PageContentProps) => {
  const steps = [
    dictionary['contract'].title,
    dictionary['contract'].customerInfo,
    dictionary['contract'].kycinformation,
    dictionary['contract'].userAccountInfo
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const methods = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      is_uploaded: false
    }
  });

  const { handleSubmit } = methods;

  const handleNext = async () => {
    const isValid = await methods.trigger();
    if (!isValid) return;

    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: any) => {
    setFormData(data);
    setShowPreview(true);
  };

  const [isAccountApplied, setIsAccountApplied] = useState(false);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <ContractStep dictionary={dictionary} session={session} locale={locale} />;
      case 1:
        return <CustomerStep
          dictionary={dictionary}
          session={session}
          locale={locale}
          branchOptions={branchOptions}
          countryOptions={countryOptions}
          cityOptions={cityOptions}
        />;
      case 2:
        return (
          <KYCStep dictionary={dictionary} session={session} locale={locale} />
        );
      case 3:
        return <AccountStep
          dictionary={dictionary}
          session={session}
          locale={locale}
          onAccountApplied={() => setIsAccountApplied(true)}
        />;
      default:
        return null;
    }
  };
  const handleConfirmPreview = async () => {
    const submitData = {
      is_digital: true,
      contractnumber: formData.contractNumber,
      contracttype: formData.contracttype,
      contractpurpose: formData.contractpurpose,
      account: formData.accountselected,
      fullname: formData.fullname,
      shortname: formData.shortname,
      birthday: formData.birthday,
      address: formData.residentaddress,
      gender: formData.gender,
      nation: formData.nation,
      phone: formData.phone,
      email: formData.email,
      repidtype: formData.repidtype,
      idcard: formData.repidtype && formData.repidtype === "I" ? formData.idcard : formData.fmbook,
      issuedate: formData.issuedate,
      issueplace: formData.issueplace,
      customertype: formData.customertype === 'S' ? 'C' : formData.customertype,
      branch: formData.branch,
      cifnumber: formData.cifnumber,
      fromdate: formData.fromdate,
      townshipname: "",
      expiredate: formData.todate,
      region: "",
      city: formData.city,
      district: formData.district,
      village: formData.village,
      applicationcode: env.NEXT_PUBLIC_APPLICATION_CODE,
      description: `CREATE AGENT CONTRACT - ${formData.contractNumber}`,
      nrc_front: formData.nrc_front,
      nrc_back: formData.nrc_back,
      selfie_nrc: formData.selfie_nrc,
      nrc_number: formData.nrc_number,
    }

    const response = await systemServiceApi.runBODynamic({
      sessiontoken: session?.user?.token as string,
      txFo: {
        bo: [
          {
            use_microservice: true,
            input: {
              workflowid: WORKFLOWCODE.BO_CREATE_CONTRACT_AGENT,
              learn_api: 'cbs_workflow_execute',
              fields: submitData
            },
          },
        ],
      },
    });
    setShowPreview(false);
    if (response.status === 200 && response.payload?.dataresponse?.fo) {
      SwalAlert('success', dictionary['contract'].contractsuccess, 'center', false, false, true);
    } else {
      SwalAlert('error', response.payload.error[0].info, 'center');
    }
  };

  return (
    <ContentWrapper
      title={`${dictionary['contract'].agentcontract} - ${dictionary['navigation'].add}`}
      description={dictionary['contract'].agentcontractdesc}
      icon={<AutoAwesomeMosaicIcon sx={{ fontSize: 40, color: '#225087' }} />}
      dataref={contractdata?.contractnumber}
      dictionary={dictionary}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
        >
          <Box sx={{ my: 2, width: '100%' }} className="mx-auto">
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ my: 5 }}>{renderStepContent()}</Box>

            <Box sx={{ mx: 5, display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                {dictionary['common'].back}
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext} >
                  {dictionary['common'].continue}
                </Button>
              ) : (
                <Button
                  disabled={!isAccountApplied}
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    const isValid = await methods.trigger();
                    if (!isValid) return;

                    if (activeStep === steps.length - 1) {
                      const data = methods.getValues();
                      onSubmit(data);
                    } else {
                      handleNext();
                    }
                  }}
                >
                  {dictionary['common'].confirm}
                </Button>

              )}
            </Box>
          </Box>
        </form>
      </FormProvider>

      <ContractPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmPreview}
        data={formData}
        dictionary={dictionary}
        locale={locale} session={null}
      />
    </ContentWrapper>
  );
};

export default AgentContractManagementAddContent;
