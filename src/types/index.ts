import { Locale } from "@/configs/i18n"
import { getDictionary } from "@/utils/getDictionary"
import { Session } from "next-auth"
import { MenuItem } from "./systemTypes"

export interface ResponseDefaultData<T> extends ResponseError, ResponseSuccess<T> { }

export interface ResponseDefault<T> {
  data: T
  errors: ErrorInfo[]
}

export interface ResponseListDefault<T> {
  data: {
    data: T[]
  }
  errors: ErrorInfo[]
}

export interface ResponseArray<T> {
  fo: T[]
}
export interface ResponseObject<T> {
  fo: T
}

export interface ErrorInfo {
  key: string
  code: string
  type: string
  info: string
  type_error: string
  execute_id: string
}

export interface ResponseError {
  error: ErrorInfo[]
}

export interface ResponseSuccess<T> {
  fo: T[]
}

export interface ResponseMessage<T> {
  message: T
}

export interface ResponseStatus<T> {
  status: T
}

export interface ResponseCode<T> {
  code: T
}

export interface ResponseData<T> {
  [x: string]: any
  data: MenuItem[]
  txcode: string
  executeId: string
  input: T
  execute_id?: string
  info?: string
  key?: string
}

export interface FormResponseData<T> {
  data: T
  txcode: string
  executeId: string
  input: T
  execute_id?: string
  info?: string
  key?: string
  errors: ErrorInfo[]
}

export interface ResponseDefaultPortal<T> {
  data: T
}

export interface ResponseDataPortal<T> {
  [x: string]: any
  data: T
  function: string
  type: string
}


export interface ResponseArrayData<T> {
  txcode: string
  executeId: string
  input: T[]
}

export interface DeviceInfoObject {
  osVersion: string
  browser: string
  my_ip: string
}

export type FormValues = {
  sourceaccount: string
  receivername: string
  amountinfo: {
    amount: number
    currency: string
  }
  benificiarybank: {
    bankcode: string
    bankname: string
    banklogo: string
    bankshortname: string
  }
  accountcardreceived: string
  content: string
  authentype: string
  phoneotp?: string
  transferpurpose: string
  typeofidentitydocument?: string
  identitydocumentnumber?: string
  identitydocumentdate?: Date
  identitydocumentplace?: string
  receiveraddress?: string
  captcha?: string
}

export type DeviceView = 'desktop' | 'tablet' | 'mobile';

export type RequestDataDefault = {
  sessiontoken: string
  language: Locale
  [key: string]: any;
}

export type PageContentProps = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  session: Session | null;
  locale: Locale;
  id?: string | undefined;
  formdata?: FormInputData;
  [x: string]: any;
}

export interface FormInfo {
  title: string;
  des: Record<string, string>;
  data: string;
  learnapi: string;
  learnsql: string;
  last_update: string;
  bodata: string;
  url_input: string;
  lang_form: Record<string, string>;
  form_code: string;
  app: string;
  is_static: boolean;
}

export interface FormInputData {
  status: string;
  loadRoleTask: {
    [roleId: string]: {
      [code: string]: {
        form?: {
          accept: boolean;
          follow: boolean;
        };
        view?: {
          install: boolean;
        };
        layout?: {
          install: boolean;
        };
        component?: {
          install: boolean;
        };
      };
    };
  };
  form_design_detail: {
    id: number;
    info: FormInfo;
    list_layout: Array<{
      haveauthen: boolean;
      codeHidden: string;
      list_view: Array<{
        name: string;
        codeHidden: string;
        list_input: Array<{
          displaytext: string
          default: {
            code: string;
            codeHidden: string;
            name: string;
          };
          inputtype: string;
          value: string;
          iskey: boolean;
          isBanner: boolean;
          ishidden: boolean;
          isChangedField: boolean;
        }>;
      }>;
    }>;
    form_id: string;
    app: string;
    master_data: {
      [key: string]: Array<{
        use_microservice: boolean;
        input: {
          workflowid: string;
          learn_api: string;
          fields: {
            commandname: string;
            issearch: boolean;
            parameters: Record<string, any>;
          };
        };
      }>;
    };
  };
}
