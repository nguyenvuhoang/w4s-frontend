// components/ResolvedProps.tsx
'use server';

import { JSXElementConstructor } from 'react';

type AnyRecord = Record<string, any>;

export default async function ResolvedProps<TProps extends AnyRecord>({
  Component,
  props,
}: {
  Component: JSXElementConstructor<TProps>;
  props: TProps;
}) {
  // Await mọi thuộc tính promise-like
  const entries = await Promise.all(
    Object.entries(props).map(async ([k, v]) => {
      if (v && typeof v === 'object' && typeof (v as any).then === 'function') {
        return [k, await (v as Promise<any>)];
      }
      return [k, v];
    })
  );

  const resolved = Object.fromEntries(entries) as TProps;

  // Bây giờ spread là an toàn theo codemod
  return <Component {...resolved} />;
}
