import Spinner from "@components/spinners";
import { Suspense } from "react";

// app/[page]/layout.tsx
export default async function PageLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}