import _ from "lodash";
import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";


export function NextIntlProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    <NextIntlClientProvider
      onError={() => { }}
      getMessageFallback={({ error, key, namespace }) => {
        const nestedMessages = _.get(messages, namespace ?? "");
        if (!nestedMessages) return key;
        if (error.code === "MISSING_MESSAGE") return nestedMessages["default"];
        return nestedMessages[key];
      }}
      now={new Date()}
      locale={locale}
      messages={messages}
      timeZone="Asia/Ho_Chi_Minh"
    >
      {children}
    </NextIntlClientProvider>
  );
}
