'use client'

import { arrayMoveImmutable } from "array-move";


type LangData = {
    [languageCode: string]: {
        [translationKey: string]: string;
    };
};

const cache = {
    app_config: {
        para: {
            language: 'en',
        },
        lang_data: {} as LangData
    },
    form: {
        auto_form: {} as { [key: string]: any },
        last_open_form: {},
        selected_form: {
            callSetHidden: (value: string) => { },
            getKeyFormAuto: () => "",
        },
        mapping_dom_react: {} as { [key: string]: any },
        list_auto_form: [] as string[],
        opening_forms: [] as { key: string }[],
        shared_form_data: {} as { [key: string]: any },
    },
    screens: [] as { callScreen?: () => void }[],
    statusDebug: false,
}

const Application = {
    getLangKey: () => cache.app_config.para.language,
    openForm: (form_key: string) => {
        // Ẩn hết (chú thích chỉ ra rằng đoạn này đang bị bỏ qua)
        // this.hiddenAllForm();
        // cache.form.selected_form = {};

        if (form_key !== "") {
            // Tìm form đã mở
            if (cache.form.auto_form[form_key] !== undefined) {
                const form = cache.form.auto_form[form_key];

                if (
                    form.hasOwnProperty("callSetHidden") &&
                    form.hasOwnProperty("getKeyFormAuto")
                ) {
                    if (form.getKeyFormAuto() === form_key) {
                        Application.setFormCurrent(form);
                        return true;
                    }
                }
            }
        }

        // Không có form đó
        return false;
    },
    setFormCurrent: (o: any, setLastForm: boolean = true) => {
        // Ensure all forms are hidden
        Application.hiddenAllForm();

        if (setLastForm) {
            cache.form.last_open_form = cache.form.selected_form;
        } else {
            cache.form.last_open_form = {};
        }

        if (o !== undefined) {
            cache.form.selected_form = o;
        } else {
            // Logic correction fallback: Find the nearest open form
            for (const x in cache.form.auto_form) {
                const formInfo = cache.form.auto_form[x].getInfoA();
                if (formInfo && formInfo["ofModal"] === false) {
                    // Select the first found form
                    cache.form.selected_form = cache.form.auto_form[x];
                    break;
                }
            }
        }

        // Open the currently selected form
        if (cache.form.selected_form?.hasOwnProperty("callSetHidden")) {
            cache.form.selected_form.callSetHidden("");
        }

        // Notify all screens that listen for updates
        Application.callAllScreenListen();
    },
    hiddenAllForm: () => {
        // Loop through all forms and hide those that are not modal
        for (const x in cache.form.auto_form) {
            const form = cache.form.auto_form[x];
            if (form !== undefined && form.hasOwnProperty("getInfoA")) {
                const formInfo = form.getInfoA();
                if (formInfo && formInfo["ofModal"] === false) {
                    if (form.hasOwnProperty("callSetHidden")) {
                        form.callSetHidden("none");
                    }
                }
            }
        }
    },
    callAllScreenListen: () => {
        // Notify all screens that have a `callScreen` method
        for (let i = 0; i < cache.screens.length; i++) {
            const screen: { callScreen?: () => void } = cache.screens[i];
            if (screen.hasOwnProperty("callScreen")) {
                if (screen.callScreen) {
                    screen.callScreen();
                }
            }
        }
    },
    addScreen: (o: any) => {
        // Add a screen object to the cache
        cache.screens[cache.screens.length] = o;
    },
    removeForm: (form_key: string) => {
        if (form_key !== "") {
            const formCurrent = Application.getFormCurrent();
            let stringKeyForm = "";

            if (formCurrent.getKeyFormAuto) {
                stringKeyForm = formCurrent.getKeyFormAuto();
            }

            for (const x in cache.form.auto_form) {
                const form = cache.form.auto_form[x];
                if (
                    form &&
                    form.getKeyFormAuto() === form_key &&
                    form.callSetHidden
                ) {
                    if (cache.form.mapping_dom_react[form_key] !== undefined) {
                        // Remove the form
                        delete cache.form.auto_form[x];
                        const listIndex = cache.form.list_auto_form.indexOf(x);
                        if (listIndex > -1) {
                            cache.form.list_auto_form.splice(listIndex, 1);
                        }

                        const keyOfDom = cache.form.mapping_dom_react[form_key];
                        const openingForms = cache.form.opening_forms;

                        for (let i = 0; i < openingForms.length; i++) {
                            if (openingForms[i].key === keyOfDom) {
                                openingForms.splice(i, 1);
                                break;
                            }
                        }

                        delete cache.form.mapping_dom_react[form_key];

                        // Handle case where the removed form is the current form
                        if (stringKeyForm === form_key) {
                            // Handle form fallback logic here
                        }
                    } else {
                        Application.AppException(
                            "#libSupport.removeForm",
                            "mapping_dom_react, form_key is undefined",
                            "system"
                        );
                    }
                    return;
                } else {
                    Application.AppException(
                        "#libSupport.removeForm",
                        "form is undefined",
                        "system"
                    );
                }
            }
        }
    },
    removeAllForm() {
        cache.form.auto_form = {};
        cache.form.list_auto_form = [];
        cache.form.opening_forms = []; //lưu dạng React HTML trước khi thành DOM
        cache.form.last_open_form = {};
        //các biến về dữ liệu form động mà có thể truy cập qua hàm
        //putDataFromInputToForm
        cache.form.shared_form_data = {};
        cache.form.mapping_dom_react = {};
    },
    getFormCurrent() {
        return cache.form.selected_form;
    },
    getFormLastOpen() {
        return cache.form.last_open_form;
    },
    isDebug() {
        return cache.statusDebug;
    },
    AppException(code_error?: string, info_exception?: string, type_error?: string) {
        if (Application.isDebug()) {
            console.log(code_error + "==" + type_error + "=>" + info_exception);
        }
    },
    arrayMoveImmutableListFormIsOpen({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) {
        cache.form.list_auto_form = arrayMoveImmutable(cache.form.list_auto_form, oldIndex, newIndex);
    },
    getLang: (n: string): string => {
        if (Application.isDebug() && !!n) return `(${n})`;

        if (cache.app_config != null) {
            const langData = cache.app_config.lang_data[cache.app_config.para.language];

            if (langData && langData[n] !== undefined) {
                return langData[n];
            }
        }

        if (n !== "") return "#" + n;

        return "";
    },
    getAllFormIsOpen() {
        return cache.form.auto_form;
    },
    getListFormIsOpen() {
        return cache.form.list_auto_form;
    }
};

export default Application;
