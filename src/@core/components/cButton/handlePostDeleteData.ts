import Application from "@/@core/lib/libSupport";
import { workflowService } from "@/servers/system-service";
import { getDictionary } from "@utils/getDictionary";
import SwalAlert from "@utils/SwalAlert";
import { Session } from "next-auth";

export const handlePostDeleteData = async (
  session: Session | null,
  txFo_: any,
  selectedRowsTableSearchRef: any,
  dictionary: Awaited<ReturnType<typeof getDictionary>>
): Promise<boolean> => {
  const selectedRows =
    selectedRowsTableSearchRef?.current ??
    selectedRowsTableSearchRef ??
    [];

  console.log("handlePostDeleteData selectedRows:", selectedRows);

  if (!Array.isArray(selectedRows) || selectedRows.length === 0) {
    SwalAlert("warning", dictionary["common"].pleaseselectrow, "center");
    return false;
  }

  if (!txFo_?.[0]) {
    Application.AppException(
      "handlePostDeleteData",
      "Invalid txFo config.",
      "Error"
    );
    SwalAlert("error", dictionary["common"].servererror, "center");
    return false;
  }

  const buildRequestBody = (config: any, rowsToDeleteIds: any[]) => {
    const normalizeKey = (key: string) =>
      String(key).toLowerCase().replace(/_/g, "");

    const camelToSnake = (key: string) =>
      String(key).replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

    const findValueInRow = (row: any, key: string) => {
      if (!row || typeof row !== "object") return undefined;

      const equivalentKeys = [
        key,
        key.toLowerCase(),
        key.replace(/_/g, "").toLowerCase(),
        camelToSnake(key),
      ];

      const matchedKey = Object.keys(row).find((rowKey) =>
        equivalentKeys.some(
          (eqKey) => normalizeKey(rowKey) === normalizeKey(eqKey)
        )
      );

      return matchedKey !== undefined ? row[matchedKey] : undefined;
    };

    const collectValues = (paramName: string) => {
      const values = rowsToDeleteIds
        .map((row) => findValueInRow(row, paramName))
        .filter((val) => val !== undefined && val !== null && val !== "");

      if (values.length === 0) return undefined;

      return values.length > 1 ? values : values[0];
    };

    const processInput = (input: any): any => {
      if (Array.isArray(input)) {
        return input.map(processInput);
      }

      if (typeof input !== "object" || input === null) {
        return input;
      }

      return Object.entries(input).reduce<Record<string, any>>(
        (result, [key, value]) => {
          if (Array.isArray(value)) {
            result[key] = value.map(processInput);
            return result;
          }

          if (typeof value === "object" && value !== null) {
            result[key] = processInput(value);
            return result;
          }

          if (typeof value === "string" && value.startsWith("@")) {
            const paramName = value.substring(1);
            const collectedValue = collectValues(paramName);

            console.log(
              "placeholder:",
              value,
              "paramName:",
              paramName,
              "collectedValue:",
              collectedValue
            );

            result[key] =
              collectedValue !== undefined ? collectedValue : value;

            return result;
          }

          const collectedValue = collectValues(key);

          result[key] =
            collectedValue !== undefined ? collectedValue : value;

          return result;
        },
        {}
      );
    };

    const processBoArray = (boArray: any[]) => {
      return boArray.map((boItem, index) => {
        if (index !== 0) return boItem;

        return {
          ...boItem,

          input: boItem.input
            ? processInput(boItem.input)
            : boItem.input,

          fields: boItem.fields
            ? processInput(boItem.fields)
            : boItem.fields,
        };
      });
    };

    const body = {
      ...config,
    };

    if (config.input?.bo && Array.isArray(config.input.bo)) {
      body.input = {
        ...config.input,
        bo: processBoArray(config.input.bo),
      };
    } else if (config.bo && Array.isArray(config.bo)) {
      body.bo = processBoArray(config.bo);
    } else {
      return processInput(body);
    }

    return body;
  };

  return new Promise((resolve) => {
    SwalAlert(
      "warning",
      dictionary["common"].areyousuredelete,
      "center",
      false,
      true,
      true,
      async () => {
        try {
          let requestBody: any = {};

          if (selectedRows.length === 1) {
            if (!txFo_[0].input) {
              SwalAlert("error", dictionary["common"].servererror, "center");
              return resolve(false);
            }

            requestBody = buildRequestBody(txFo_[0].input, selectedRows);
          } else {
            if (!txFo_[0].inputmulti) {
              SwalAlert(
                "error",
                dictionary["common"].cannotdeletemulti,
                "center"
              );
              return resolve(false);
            }

            requestBody = buildRequestBody(txFo_[0].inputmulti, selectedRows);
          }

          console.log("Delete requestBody:", requestBody);

          const submitApi = await workflowService.runBODynamic({
            sessiontoken: session?.user?.token as string,
            txFo: requestBody,
          });

          if (submitApi.status !== 200) {
            SwalAlert("error", dictionary["common"].servererror, "center");
            return resolve(false);
          }

          const response = submitApi.payload?.dataresponse;
          const respAny: any = response ?? {};
          const errors = respAny.error ?? respAny.errors ?? [];

          if (Array.isArray(errors) && errors.length > 0) {
            SwalAlert(
              "error",
              errors[0]?.info || errors[0]?.message || "Unknown error",
              "center"
            );
            return resolve(false);
          }

          if (!Array.isArray(errors) && errors) {
            SwalAlert(
              "error",
              errors?.info || errors?.message || "Unknown error",
              "center"
            );
            return resolve(false);
          }

          SwalAlert(
            "success",
            dictionary["common"].datachange.replace("{0}", ""),
            "center",
            false,
            false,
            true
          );

          return resolve(true);
        } catch (error) {
          Application.AppException(
            "Catch.handlePostDeleteData",
            String(error),
            "Error"
          );

          SwalAlert("error", dictionary["common"].deleteerror, "center");
          return resolve(false);
        }
      }
    );
  });
};