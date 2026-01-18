import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function useForgetPasswordForm(dictionary: any) {
  const router = useRouter();
  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: any) {
    const { handleResetPassword } = await import("../services/forgetPasswordService");
    await handleResetPassword({ data, setLoading, dictionary, router });
  }

  return { router, methods, loading, setLoading, onSubmit };
}
