import { Locale } from "@/configs/i18n";
import { getDictionary } from "@/utils/getDictionary";
import Logout from "./Logout";

const LogoutPage = async (props: { params: Promise<{ locale: Locale }> }) => {
  const params = await props.params;
  const dictionary = await getDictionary(params.locale);

  return <Logout locale={params.locale} dictionary={dictionary} />;
}

export default LogoutPage;
