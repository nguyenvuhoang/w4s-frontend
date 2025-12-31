"use client";

import FormField from "@/@core/components/form-field";
import LoadingSubmit from "@/components/LoadingSubmit";
import { selectOptionsGender } from "@/data/meta";
import { useCustomerContract } from "@/services/customer-contract";
import { PageContentProps } from "@/types";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Grid, IconButton, InputAdornment } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { buildFieldProps } from "../contract-management-add-content/buildFieldProps";
import { WORKFLOWCODE } from "@/data/WorkflowCode";
import { systemServiceApi } from "@/servers/system-service";
import { extractErrorMessage } from "@/utils/extractErrorMessage";

const CustomerStep = ({
  dictionary,
  session,
  branchOptions,
  countryOptions,
  cityOptions,
}: PageContentProps) => {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext();

  const selectOptionsCustomerType = [
    { value: "C", label: "Single Customer" },
    { value: "L", label: "Linkage Customer" },
    { value: "G", label: "Group Customer" },
  ];

  const checkPhoneNumber = async (
    phone: string
  ): Promise<{ isUsed: boolean; message?: string }> => {
    const response = await systemServiceApi.runBODynamic({
      sessiontoken: session?.user?.token,
      txFo: {
        bo: [
          {
            use_microservice: true,
            input: {
              workflowid: WORKFLOWCODE.BO_CTM_CHECK_PHONE_NUMBER,
              learn_api: "cbs_workflow_execute",
              fields: { phonenumber: phone },
            },
          },
        ],
      },
    });

    const input = response?.payload?.dataresponse?.fo?.[0]?.input;

    if (input?.error_code === "ERROR") {
      return {
        isUsed: true,
        message: extractErrorMessage(input.error_message),
      };
    }

    return { isUsed: false };
  };

  const {
    isLoading,
    districtOptionsLocal,
    villageOptionsLocal,
    handleSearchCif,
    handleChangeCountry,
    handleChangeCity,
    handleChangeDistrict,
  } = useCustomerContract({ session, dictionary });

  const repidtype = useWatch({ control, name: "repidtype" });

  return (
    <Box className="relative">
      {isLoading && (
        <LoadingSubmit loadingtext={dictionary["common"].loading} />
      )}

      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="cifnumber"
            label={dictionary["contract"].cifnumber}
            type="text"
            control={control}
            errors={errors}
            endAdornment={
              <InputAdornment position="end">
                <InputAdornment
                  position="end"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: errors["cifnumber"]
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                >
                  <AcUnitIcon sx={{ color: "red !important" }} />
                </InputAdornment>
                <IconButton>
                  <SearchIcon sx={{ color: "#0A914F" }} />
                </IconButton>
              </InputAdornment>
            }
            rules={{
              required: `${dictionary["common"].fieldrequired.replace(
                "{field}",
                dictionary["contract"].contractnumber
              )}`,
            }}
            required
            onBlur={() => {
              handleSearchCif(getValues("cifnumber"));
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="phone"
            label={dictionary["contract"].phonenumber}
            control={control}
            errors={errors}
            {...buildFieldProps("phone", dictionary, errors, {
              extraRules: {
                validate: {
                  checkPhoneNumber: async (value: string) => {
                    if (!value) return true;
                    const { isUsed, message } = await checkPhoneNumber(value);
                    return isUsed
                      ? message ??
                          `${dictionary["contract"].phonenumber} already exists`
                      : true;
                  },
                },
              },
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="fullname"
            label={dictionary["contract"].fullname}
            control={control}
            errors={errors}
            {...buildFieldProps("fullname", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="shortname"
            label={dictionary["contract"].shortname}
            control={control}
            errors={errors}
            {...buildFieldProps("shortname", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="email"
            label="Email"
            control={control}
            errors={errors}
            {...buildFieldProps("email", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="customertype"
            label={dictionary["contract"].customertype || "Customer Type"}
            type="select"
            options={selectOptionsCustomerType}
            control={control}
            errors={errors}
            {...buildFieldProps("customertype", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            disabled={repidtype && repidtype !== "I"}
            name="idcard"
            label={dictionary["contract"].idcard}
            control={control}
            errors={errors}
            rules={{
              required: !repidtype || repidtype === "I" ? "Required" : false,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="issuedate"
            label={dictionary["contract"].issuedate}
            type="date"
            control={control}
            errors={errors}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="issueplace"
            label={dictionary["contract"].issueplace}
            control={control}
            errors={errors}
            rules={{
              required: !repidtype || repidtype === "I" ? "Required" : false,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            disabled={repidtype && repidtype !== "F"}
            name="fmbook"
            label={dictionary["contract"].fmbook}
            control={control}
            errors={errors}
            rules={{
              required: repidtype && repidtype !== "I" ? "Required" : false,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="birthday"
            label={dictionary["contract"].birthday}
            type="date"
            control={control}
            errors={errors}
            {...buildFieldProps("birthday", dictionary, errors, {
              extraEnd: <CalendarTodayIcon sx={{ color: "green" }} />,
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="gender"
            label={dictionary["contract"].gender}
            type="select"
            options={selectOptionsGender}
            control={control}
            errors={errors}
            {...buildFieldProps("gender", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="residentaddress"
            label={dictionary["contract"].address}
            control={control}
            errors={errors}
            {...buildFieldProps("residentaddress", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="country"
            label={dictionary["contract"].country}
            type="select"
            options={countryOptions}
            control={control}
            errors={errors}
            {...buildFieldProps("country", dictionary, errors)}
            onChange={() => handleChangeCountry(getValues("country"))}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="branch"
            label={dictionary["contract"].branch}
            type="select"
            options={branchOptions}
            control={control}
            errors={errors}
            {...buildFieldProps("branch", dictionary, errors)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="city"
            label={dictionary["contract"].city}
            type="select"
            options={cityOptions}
            control={control}
            errors={errors}
            {...buildFieldProps("city", dictionary, errors)}
            onChange={() => handleChangeCity(getValues("city"))}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="district"
            label={dictionary["contract"].district}
            type="select"
            options={districtOptionsLocal}
            control={control}
            errors={errors}
            {...buildFieldProps("district", dictionary, errors)}
            onChange={() => handleChangeDistrict(getValues("district"))}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormField
            name="village"
            label={dictionary["contract"].village}
            type="select"
            options={villageOptionsLocal}
            control={control}
            errors={errors}
            {...buildFieldProps("village", dictionary, errors)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerStep;
