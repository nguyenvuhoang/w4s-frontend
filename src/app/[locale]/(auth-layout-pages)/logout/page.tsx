import { Suspense } from "react";

import { Locale } from "@/configs/i18n";
import { getDictionary } from "@/utils/getDictionary";
import LogoutLogic from "@/views/pages/auth/Logout";


const LogoutPage = async (props: { params: Promise<{ locale: Locale }> }) => {

  const params = await props.params;
  const dictionary = await getDictionary(params.locale);

  return (
    <Suspense>
      <LogoutLogic locale={params.locale} dictionary={dictionary} />
    </Suspense>
  )
}

export default LogoutPage
