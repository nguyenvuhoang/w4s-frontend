'use client'

import React, { useState, useEffect } from "react";
import { arrayMoveImmutable } from 'array-move';
import Application from "@/@core/lib/libSupport";
import { managerTemplate_getComponent } from "@/@core/lib/libManagerTemplate";

interface FormData {
  form_key: string;
  title: string;
  image_form?: string;
  lang_form?: { [key: string]: string };
  classActive?: string;
}

interface Props {
  abs_CallBackHideForm?: () => void;
  tabVisible?: boolean;
}

const CPageBar = ({ abs_CallBackHideForm, tabVisible }: Props) => {
  const [data, setData] = useState<FormData[]>([]);
  const [keyLang, setKeyLang] = useState(Application.getLangKey());
  const [searchInputValue, setSearchInputValue] = useState("");

  const typeScreen = "pagebar";

  const callScreen = () => {
    const formAuto = Application.getAllFormIsOpen();
    const listForm = Application.getListFormIsOpen();
    const formCurrent = Application.getFormCurrent();
    let list_: FormData[] = [];

    if (formCurrent.hasOwnProperty("getKeyFormAuto")) {
      const stringKeyForm = formCurrent.getKeyFormAuto();

      listForm.forEach((x: string) => {
        if (formAuto[x].hasOwnProperty("getKeyFormAuto")) {
          let ob_: FormData = { form_key: x, title: "" };

          if (formAuto[x].hasOwnProperty("getInfoA")) {
            const obInfo = formAuto[x].getInfoA();
            if (obInfo && obInfo["ofModal"] === false) {
              ob_.title = obInfo["title"];
              ob_.lang_form = obInfo.lang_form;
              ob_.classActive = stringKeyForm === x ? "active" : "";
              ob_.image_form = obInfo.image_form;
              list_.push(ob_);
            }
          }
        }
      });
    }

    setData(list_);
    setKeyLang(Application.getLangKey());
  };

  const callOpenFormIndex = (index: number) => {
    if (index <= data.length) {
      Application.openForm(data[index].form_key);
    }
  };

  useEffect(() => {
    Application.addScreen({ callScreen });
  }, []);

  const getConfigTemplate = () => {
    return data.map(form => ({
      tabInfo: {
        img: form.image_form || "/fwcss/template/perseus/img/image_form_default.png",
        icon: "account_balance",
        title: form.lang_form?.[keyLang] || form.title,
        id: form.form_key,
      },
      sysStyle: { show: form.classActive === "active" ? "show" : "" },
    }));
  };

  const getConfigSearchTemplate = () => {
    return data.filter(form => {
      const stringItem = (form.title + form.form_key).toLowerCase();
      return searchInputValue.toLowerCase().split(" ").every(word => stringItem.includes(word));
    }).map(form => ({
      tabInfo: {
        img: form.image_form || "/fwcss/template/perseus/img/image_form_default.png",
        icon: "account_balance",
        title: form.title,
        id: form.form_key,
      },
      sysStyle: { show: form.classActive === "active" ? "show" : "" },
    }));
  };

  const closeTab = (id: string) => {
    Application.removeForm(id);
    callScreen();
  };

  const clearSearch = () => setSearchInputValue("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInputValue(e.target.value);

  const closeAllTab = () => {
    Application.removeAllForm();
    callScreen();
  };

  const handleMoreOption = (dataItem: { value: string }) => {
    if (dataItem.value === "CLOSE_ALL") closeAllTab();
  };

  const UTab = managerTemplate_getComponent("uTab");

  return (
    <>
      <UTab
        dataFull={{
          data: getConfigTemplate(),
          abs_select: (_item: any, id: string) => Application.openForm(id),
          onSortEnd: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
            setData(arrayMoveImmutable(data, oldIndex, newIndex));
            Application.arrayMoveImmutableListFormIsOpen({ oldIndex, newIndex });
          },
          data_search: getConfigSearchTemplate(),
          abs_close: closeTab,
          abs_ClickMoreOption: handleMoreOption,
          abs_CallBackHideForm,
          cmd: {
            visibility: tabVisible,
          },
          search_tab: {
            config: {
              search_voice_open: false,
              search_voice_lang: "EN",
            },
            title: {
              search_input: Application.getLang("tab_search_placeholder"),
            },
            search_input_value: searchInputValue,
            abs_ClearValue: clearSearch,
            abs_Change: handleChange,
            abs_Search: callScreen,
          },
          config: {
            number_tab: data.length,
            title: Application.getLang("tab_title"),
            title_search: Application.getLang("GlobalSearchResult"),
            title_no_item: Application.getLang("tab_title_no_item"),
            no_data_title: Application.getLang("header_no_data_title").replace("@{param1}", searchInputValue),
          },
          more_option: [
            {
              icon: "highlight_off",
              title: Application.getLang("tab_title_close_all"),
              dataItem: { value: "CLOSE_ALL" },
            },
          ],
        }}
      />
    </>
  );
};

export default CPageBar;
