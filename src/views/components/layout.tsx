'use client';

import { Locale } from '@/configs/i18n';
import { portalServiceApi } from '@/servers/portal-service';
import { FormInput, FormLayout, PageData, RuleStrong } from '@/types/systemTypes';
import { generatePathName } from '@/utils/generatePathName';
import { getDictionary } from '@/utils/getDictionary';
import { Session } from 'next-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import RenderLayout from './layout/layout';
import { getHiddenFields } from './rule/getHiddenFields';
import { generatePathNameView } from '@/utils/generatePathNameView';
import { useUserStore } from '@/@core/stores/useUserStore';
import { getLocalizedUrl } from '@/utils/i18n';

type Props = {
    datalayout: FormLayout[];
    rules: RuleStrong[];
    session: Session | null;
    form_id: string;
    setLoading: Dispatch<SetStateAction<boolean>>;
    language: Locale;
    dictionary: Awaited<ReturnType<typeof getDictionary>>;
    renderviewdata?: any;
    datasearchlookup?: PageData<any>;
    ismodifydefault?: boolean;
    searchtextdefault?: string;
    advancedsearch: any;
    setAdvancedSearch: Dispatch<SetStateAction<any>>;
    datasearchdefault?: any;
    isNested?: boolean;
    roleTask?: any;
};


const isComponentHidden = (codeHidden: string, roleTask: any) => {
    if (!roleTask || !roleTask['1']) return false;
    const entry = roleTask['1'][codeHidden];
    if (!entry) return false;

    return (
        entry?.component?.install === false ||
        entry?.layout?.install === false ||
        entry?.view?.install === false
    );
};


const Layout = ({
    datalayout,
    rules,
    session,
    form_id,
    setLoading,
    dictionary,
    language,
    renderviewdata,
    datasearchlookup,
    ismodifydefault,
    searchtextdefault,
    advancedsearch,
    setAdvancedSearch,
    datasearchdefault,
    isNested,
    roleTask
}: Props) => {
    const [activeTab, setActiveTab] = useState(0);
    const [datasearch, setDatasearch] = useState<PageData<any> | undefined>(datasearchdefault);
    const [isFetching, setIsFetching] = useState(false);
    const [txfoSearch, setTxFOSearch] = useState();
    const [ismodify, setIsModify] = useState(ismodifydefault || false);
    const [searchtext, setSearchText] = useState(searchtextdefault || '');
    const [globalAdvancedSearch, setGlobalAdvancedSearch] = useState<any>({});
    const [storeFormSearch, setStoreFormSearch] = useState<any[]>([]);
    const [storeInfoSearch, setStoreInfoSearch] = useState<any>({});
    const [fetchControlDefaultValue, setFetchControlDefaultValue] = useState<boolean>(false);

    const router = useRouter();
    const pathname = usePathname();
    const formMethods = useForm();
    const hiddenFields = getHiddenFields(rules);

    // Optimized: Only re-renders when role changes, not when name/avatar change
    const role = useUserStore((state) => state.role)

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleRowDoubleClick = async (rowData: any, input: FormInput) => {
        try {
            const id = rowData.id;
            if (!id) return;
            const viewType = input.config.view_type || '';
            const actionRowSelect = input.config.actionFo_RowSelect || {};

            if (viewType === 'TAB') {
                const currentPath = pathname;
                const newPath = generatePathName(id, currentPath, actionRowSelect.txFo);
                router.push(newPath);
                return;
            }

            switch (actionRowSelect.useAction) {
                case 'viewttablerecord': {
                    const structablePrefix = input.config.structable + '.';
                    const formattedData = Object.entries(rowData).reduce((acc, [key, value]) => {
                        if (key.startsWith(structablePrefix)) {
                            const newKey = key.replace(structablePrefix, '');
                            acc[newKey] = value;
                        }
                        return acc;
                    }, {} as Record<string, any>);

                    Object.entries(formattedData).forEach(([key, value]) => {
                        formMethods.setValue(key, value);
                    });
                    break;
                }

                case 'viewdetail': {
                    const currentPath = getLocalizedUrl(`/form-view`, language);
                    const _txFo = JSON.parse(actionRowSelect.txFo);
                    const pathname = actionRowSelect.pathname;
                    const parameters = _txFo[0].parameters;
                    const viewid = rowData[parameters];
                    const newPath = generatePathNameView(viewid, currentPath, _txFo, pathname);
                    window.open(newPath, '_blank');
                    break;
                }

                case 'designform': {
                    const currentPath = pathname;
                    const formInfo = rowData['form.info'];
                    if (formInfo) {
                        const parsedFormInfo = JSON.parse(formInfo);
                        const formid = parsedFormInfo.form_code;
                        const newPath = generatePathName(formid, currentPath, actionRowSelect.txFo);
                        router.push(newPath);
                    }
                    break;
                }

                default: {
                    const response = await portalServiceApi.getDetailById({
                        sessiontoken: session?.user?.token as string,
                        id: id
                    });
                    const detailData = response.payload.dataresponse.data.data;
                    Object.entries(detailData).forEach(([key, value]) => {
                        formMethods.setValue(key, value);
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        }
    };

    const renderLayouts = datalayout
        .filter((layout) => !isComponentHidden(layout.codeHidden, roleTask))
        .map((layout) => {
            const filteredViews = layout.list_view?.filter(view => !isComponentHidden(view.codeHidden, roleTask)) || [];

            const isHidden = role.some(r => {
                const roleId = r.role_id?.toString()
                return roleTask?.[roleId]?.[layout.codeHidden]?.component?.install === false
            })

            if (isHidden) return null;
            return (
                <RenderLayout
                    key={`${layout.id}-${uuidv4()}`}
                    formMethods={formMethods}
                    form_id={form_id}
                    language={language}
                    dictionary={dictionary}
                    layout={{ ...layout, list_view: filteredViews }}
                    hiddenFields={hiddenFields}
                    rules={rules}
                    session={session}
                    setLoading={setLoading}
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                    handleRowDoubleClick={handleRowDoubleClick}
                    datasearch={datasearch}
                    setDatasearch={setDatasearch}
                    isFetching={isFetching}
                    setIsFetching={setIsFetching}
                    txfoSearch={txfoSearch}
                    setTxFOSearch={setTxFOSearch}
                    datasearchlookup={datasearchlookup}
                    ismodify={ismodify}
                    setIsModify={setIsModify}
                    searchtext={searchtext}
                    setSearchText={setSearchText}
                    advancedsearch={advancedsearch}
                    setAdvancedSearch={setAdvancedSearch}
                    globalAdvancedSearch={globalAdvancedSearch}
                    setGlobalAdvancedSearch={setGlobalAdvancedSearch}
                    storeFormSearch={storeFormSearch}
                    setStoreFormSearch={setStoreFormSearch}
                    storeInfoSearch={storeInfoSearch}
                    setStoreInfoSearch={setStoreInfoSearch}
                    fetchControlDefaultValue={fetchControlDefaultValue}
                    setFetchControlDefaultValue={setFetchControlDefaultValue}
                    layoutviewdata={renderviewdata}
                    roleTask={roleTask}
                />
            );
        });


    return !isNested ? (
        <form
            id={`${form_id}-${uuidv4()}`}
            onSubmit={formMethods.handleSubmit((data) => console.log('Form Submitted:', data))}
        >
            {renderLayouts}
        </form>
    ) : (
        <>{renderLayouts}</>
    );
};

export default Layout;