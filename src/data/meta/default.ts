import { LanguageDataType } from "@/@core/types";
import { env } from "@/env.mjs";



/**
 * Build a URL for the given path.
 * @returns the URL for the given path.
 */
export function fullURL(path = "", host = appHost()): URL {
  return new URL(path, host);
}


/**
 * Helper function to determine the hostname for the given environment,
 * with a focus on working with Vercel deployments. Set by Vercel automatically.
 * @returns the hostname for the given environment.
 */
export function appHost(includeProtocol = true): string {
  const host = process.env.NEXT_PUBLIC_APP_URL ?? "https://Enterprise Console.com"

  return includeProtocol ? host : (
    host.replace("https://", "").replace("http://", "")
  );
}



export const REPOSITORY_OWNER = "nguyenvuhoang";

const links = {
  twitter: "https://x.com/",
  github: "https://github.com/",
  githubAccount: "https://github.com/",
  discord: "https://discord.gg/",
  facebook: "https://facebook.com/groups/",
};

export const siteConfig = {
  name: "Enterprise Console",
  shortName: "Enterprise Console",
  author: "JITS",
  description: "Enterprise Console",
  company: {
    name: "EMI",
    link: "https://github.com/",
    email: "nguyenvuhoangz@gmail.com",
    twitter: "@nguyenvuhoangz",
  },
  handles: {
    twitter: "@nguyenvuhoangz",
  },
  keywords: [
    "Enterprise Console"
  ],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: REPOSITORY_OWNER,
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/img/logo-seo.png`,
  links,
  title: 'Enterprise Console',
  companyname: 'EKPHATTHANA MICROFINANCE INSTITUTION (“EMI”)',
  companyadress: "Saphanthong nuear Village, Sisattanak District, Vientiane Capital, Lao PDR",
  companyphone: "Tel: +856 21 520 520",
  companywebsite: "https://emimfi.com"
};


export const DEFAULT_REQUEST = {
  slug: "",
  user_id: 0,
  status: "OPEN",
  error_name: "",
  error_description: "",
}

export const ACCOUNT_TABLE_FORMAT = [
  {
    "field": "accountnumber",
    "headerName": "Account No.",
    "width": 150
  },
  {
    "field": "accounttype",
    "headerName": "Account type",
    "width": 100
  },
  {
    "field": "currency",
    "headerName": "Currency",
    "width": 100
  },
  {
    "field": "status",
    "headerName": "Status",
    "width": 100
  },
  {
    "field": "branchid",
    "headerName": "Branch ID",
    "width": 100
  },
  {
    "field": "bankaccounttype",
    "headerName": "Bank account type",
    "width": 100
  },
  {
    "field": "isprimary",
    "headerName": "Is Primary",
    "width": 100
  }
]

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  S: 'Saving',
  T: 'Term',
  C: 'Current',
  L: 'Loan',
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  N: 'Normal',
  C: 'Closed',
  P: 'Pending',
  D: 'Dormant',
  W: 'New'
};

export const selectOptionsPurpose = [
  { value: 'WL', label: 'Wallet Only' },
  { value: 'DTS', label: 'Digital Banking Account' },
  { value: 'AM', label: 'Agent Account' }
];

export const selectOptionsGender = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
];

export const languageData: LanguageDataType[] = [
  {
    langCode: 'en',
    langName: 'English'
  },
  {
    langCode: 'vi',
    langName: 'Vietnamese'
  },
  {
    langCode: 'la',
    langName: 'Laos'
  }
]


export const SERVICES = [
  'CMS',
  'CBG',
  'DWH',
  'DTS',
  'CTH',
  'WFO',
  'NCH',
  'STL'
]

export enum LogType {
  request = 'HTTP_LOG',
  access = 'SERVICE_LOG',
  workflow = 'WORKFLOW_LOG',
  sqlaudit = 'SQL_AUDIT_LOG',
  unknown = 'unknown'
}
