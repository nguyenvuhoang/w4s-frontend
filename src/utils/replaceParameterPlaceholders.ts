import { Locale } from "@/configs/i18n";
import { getDictionary } from "./getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

export function replaceParameterPlaceholders(
  masterdata: Record<string, any>,
  id: string,
  dictionary: Dict,
  language: Locale | undefined = "en"
): Record<string, any> {
  if (!masterdata) {
    throw new Error(dictionary["common"].missingmasterdata);
  }

  const result = structuredClone(masterdata);
  const visit = (node: any) => {
    if (!node) return;

    // array
    if (Array.isArray(node)) {
      for (const x of node) visit(x);
      return;
    }

    // object
    if (typeof node === "object") {
      // Nếu node có parameters thì xử lý tại đây
      const params = node.parameters || node.fields || node.Fields;
      if (params && typeof params === "object" && !Array.isArray(params)) {
        for (const paramKey of Object.keys(params)) {
          const v = params[paramKey];
          if (typeof v === "string" && v.startsWith("@")) {
            const placeholder = v.slice(1).trim().toLowerCase();

            if (placeholder === "id") {
              params[paramKey] = id;
            }
          }
        }

        params["language"] = language ?? "en";
      }

      for (const k of Object.keys(node)) {
        visit(node[k]);
      }
    }
  };

  visit(result);
  return result;
}
