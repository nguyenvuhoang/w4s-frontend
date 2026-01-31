import { env } from '@/env.mjs';
import { MenuDataResponse, SubmitDataFormRequest, SystemSearchDataRequest } from "@shared/types/systemTypes";
import http from "../../lib/http";

/**
 * Menu Service
 * Handles all menu-related operations (load, create, update, delete)
 */
export const menuService = {
    /**
     * Load menu with pagination and search
     */
    loadMenu: ({ sessiontoken, language, pageindex, pagesize, searchtext }: SystemSearchDataRequest) =>
        http.post<MenuDataResponse>('/system-service',
            {
                learn_api: "CTH_LOAD_MENU",
                fields: {
                    pageindex: pageindex,
                    pagesize: pagesize,
                    searchtext: searchtext
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

    /**
     * Create a new menu
     */
    createMenu: ({ sessiontoken, language, fields }: SubmitDataFormRequest) =>
        http.post<MenuDataResponse>('/system-service',
            {
                learn_api: "CTH_CREATE_MENU",
                fields: {
                    ...fields
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

    /**
     * Update an existing menu
     */
    updateMenu: ({ sessiontoken, language, fields }: SubmitDataFormRequest) =>
        http.post<MenuDataResponse>('/system-service',
            {
                learn_api: "CTH_MODIFY_MENU",
                fields: {
                    ...fields
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),

    /**
     * Delete a menu
     */
    deleteMenu: ({ sessiontoken, language, fields }: SubmitDataFormRequest) =>
        http.post<MenuDataResponse>('/system-service',
            {
                learn_api: "CTH_DELETE_MENU",
                fields: {
                    ...fields
                }
            },
            {
                baseUrl: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    uid: `${sessiontoken}`,
                    lang: language,
                    app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
                }
            }),
}

