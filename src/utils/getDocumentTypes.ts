import { getDictionary } from "@/utils/getDictionary";

export const getDocumentTypes = (dictionary: Awaited<ReturnType<typeof getDictionary>>) => {
  return [
    { value: 'identitycard', label: dictionary['transfer'].identitycard },
    { value: 'passport', label: dictionary['transfer'].passport },
    { value: 'drivinglicense', label: dictionary['transfer'].drivinglicense },
    { value: 'militarycard', label: dictionary['transfer'].militarycard },
    { value: 'citizenshipcard', label: dictionary['transfer'].citizenshipcard }
  ];
};

