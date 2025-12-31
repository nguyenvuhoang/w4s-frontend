export const isValidResponse = (apiResponse: any) =>
    apiResponse.status === 200 &&
    apiResponse.payload?.dataresponse.data && apiResponse.payload?.dataresponse.success === true;