import Application from "@/@core/lib/libSupport";
import { workflowService } from "@/servers/system-service";
import { getDictionary } from "@/utils/getDictionary";
import SwalAlert from "@/utils/SwalAlert";
import { Session } from "next-auth";

export const handlePostDeleteData = async (
    session: Session | null,
    txFo_: any,
    selectedRowsTableSearchRef: any,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
): Promise<boolean> => {
    if (!selectedRowsTableSearchRef || selectedRowsTableSearchRef.length === 0) {
        SwalAlert('warning', dictionary['common'].pleaseselectrow, 'center');
        return false;
    }

    return new Promise((resolve) => {
        SwalAlert(
            'warning',
            dictionary['common'].areyousuredelete,
            'center',
            false,
            true,
            true,
            async () => {
                try {
                    const rowsToDeleteIds = selectedRowsTableSearchRef ?? [];
                    let requestBody = {};
                    const buildRequestBody = (config: any, rowsToDeleteIds: any[]) => {
                        const processInput = (input: any): any => {
                            if (typeof input !== "object" || input === null) return input;

                            return Object.entries(input).reduce<Record<string, any>>((result, [key, value]) => {
                                if (typeof value === "object" && value !== null) {
                                    // Nếu là object thì đệ quy tiếp
                                    result[key] = processInput(value);
                                } else if (typeof value === "string" && value.startsWith("@")) {
                                    // Nếu value là placeholder dạng @id, @productcode,...
                                    const paramName = value.substring(1);
                                    const collectedValues = rowsToDeleteIds
                                        .map(row => row[paramName])
                                        .filter(val => val !== undefined);

                                    result[key] =
                                        collectedValues.length > 1
                                            ? collectedValues
                                            : collectedValues[0] ?? value;
                                } else {
                                    // Nếu không phải object hoặc placeholder, thì giữ nguyên
                                    const equivalentKeys = [
                                        key,
                                        key.toLowerCase().replace(/_/g, ""),
                                        key.toLowerCase().replace(/([a-z])([A-Z])/g, "$1_$2"),
                                    ];

                                    const collectedValues = rowsToDeleteIds
                                        .map(row => {
                                            const matchedKey = equivalentKeys.find(eqKey => row?.hasOwnProperty(eqKey));
                                            return matchedKey ? row[matchedKey] : undefined;
                                        })
                                        .filter(val => val !== undefined);

                                    result[key] = collectedValues.length > 1
                                        ? collectedValues
                                        : collectedValues[0] ?? value;
                                }
                                return result;
                            }, {});
                        };


                        const processBoArray = (boArray: any[]) => {
                            return boArray.map((boItem, index) => {
                                if (!boItem.input) return boItem;
                                return {
                                    ...boItem,
                                    input: index === 0 ? processInput(boItem.input) : boItem.input
                                };
                            });
                        };

                        const body = {
                            ...config,
                        };

                        if (config.input?.bo) {
                            body.input = {
                                ...config.input,
                                bo: processBoArray(config.input.bo),
                            };
                        } else if (config.bo) {
                            body.bo = processBoArray(config.bo);
                        }

                        return body;
                    };

                    if (rowsToDeleteIds.length === 1) {
                        requestBody = buildRequestBody(txFo_[0].input, rowsToDeleteIds);
                    } else if (rowsToDeleteIds.length > 1) {
                        if (!txFo_[0].inputmulti) {
                            SwalAlert('error', dictionary['common'].cannotdeletemulti, 'center');
                            return resolve(false);
                        }
                        requestBody = buildRequestBody(txFo_[0].inputmulti, rowsToDeleteIds);
                    } else {
                        Application.AppException("handlePostDeleteData", "No rows selected for deletion.", "Error");
                        return resolve(false);
                    }

                    const submitApi = await workflowService.runBODynamic({
                        sessiontoken: session?.user?.token as string,
                        txFo: requestBody
                    });

                    if (submitApi.status !== 200) {
                        SwalAlert('error', dictionary['common'].servererror, 'center');
                        return resolve(false);
                    }

                    const response = submitApi.payload.dataresponse;
                    const respAny: any = response;
                    const errors = respAny.error ?? respAny.errors ?? [];
                    if (Array.isArray(errors) && errors.length > 0) {
                        SwalAlert('error', errors[0].info || 'Unknown error', 'center');
                        return resolve(false);
                    }

                    SwalAlert('success', dictionary['common'].datachange.replace("{0}", ""), 'center', false, false, true);
                    return resolve(true);

                } catch (error) {
                    Application.AppException("Catch.handlePostDeleteData", String(error), "Error");
                    SwalAlert('error', dictionary['common'].deleteerror, 'center');
                    return resolve(false);
                }
            }
        );
    });
};
