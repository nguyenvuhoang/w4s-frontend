import { useRouter } from "@shared/hooks/useRouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Locale } from "@/configs/i18n";

export function useForgetPasswordForm(dictionary: any, locale: Locale) {
  const router = useRouter();
  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: any) {
    const { handleResetPassword } = await import("../services/forgetPasswordService");
    await handleResetPassword({ data, setLoading, dictionary, router, locale });
  }

  return { router, methods, loading, setLoading, onSubmit };
}
