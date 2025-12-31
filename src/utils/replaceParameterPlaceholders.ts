import { Locale } from "@/configs/i18n";
import { getDictionary } from "./getDictionary";

export function replaceParameterPlaceholders(
  masterdata: Record<string, any>,
  id: string,
  dictionary: Awaited<ReturnType<typeof getDictionary>>,
  language: Locale | undefined = 'en'
): Record<string, any> {
  if (!masterdata) {
    throw new Error(dictionary['common'].missingmasterdata);
  }

  const result = structuredClone(masterdata);

  for (const key in result) {
    const items = result[key];
    if (Array.isArray(items)) {
      for (const item of items) {
        const parameters = item?.input?.fields?.parameters;
        if (parameters && typeof parameters === 'object') {
          for (const paramKey in parameters) {
            const value = parameters[paramKey];
            if (typeof value === 'string' && value.startsWith('@')) {
              const placeholder = value.slice(1);
              if (placeholder === 'id') {
                parameters[paramKey] = id;
                parameters["language"] = language;
              }
            }
          }
        }
      }
    }
  }

  return result;
}
