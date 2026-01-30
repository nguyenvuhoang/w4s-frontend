import { FormInputData } from "@shared/types";

export function applyViewDataToForm(formdata: FormInputData, viewdata: Record<string, any>) {
  const layouts = formdata?.form_design_detail?.list_layout ?? [];

  if (!Array.isArray(viewdata.data) || viewdata.data.length === 0) return;

  const firstRow = viewdata.data[0];

  for (const layout of layouts) {
    const views = layout.list_view ?? [];
    for (const view of views) {
      const inputs = view.list_input ?? [];
      for (const input of inputs) {
        const valueKey = input?.value;

        if (typeof valueKey === 'string' && firstRow[valueKey] !== undefined) {
          // GÃ¡n raw value
          input.value = firstRow[valueKey];

          // GÃ¡n thÃªm displaytext náº¿u cÃ³ key dáº¡ng `${valueKey}caption`
          const captionKey = valueKey + "caption";
          if (firstRow[captionKey] !== undefined) {
            input.displaytext = firstRow[captionKey];
          }
        }
      }
    }
  }
}

