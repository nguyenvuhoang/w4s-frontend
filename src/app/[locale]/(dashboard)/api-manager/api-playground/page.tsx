


// import { Suspense } from 'react';
// import 'server-only';


// interface O24OpenApiPlaygroundPageProps {
//   params: Promise<{ locale: string }>;
// }


// function PlaygroundContentServer({ locale }: { locale: string }) {
  
//   return (
//     <Suspense fallback={<div>Loading playground...</div>}>
//       <PlaygroundContent locale={locale} />
//     </Suspense>
//   );
// }

// async function PlaygroundContent({ locale }: { locale: string }) {
//   const openapi = await openAPIServiceApi.getSpec("wfo");
//   if (!openapi) {
//     throw new Error('Failed to fetch OpenAPI specification');
//   }
//   if (openapi.status !== 200) {
//     throw new Error(`Error fetching OpenAPI specification: ${openapi.payload?.message || 'Unknown error'}`);
//   }
//   const dataOpenaAPI = openapi.payload;
//   return <OpenApiPlaygroundContent openapi={dataOpenaAPI} />;
// }

// export default async function O24OpenApiPlaygroundPage({ params }: O24OpenApiPlaygroundPageProps) {
//   const { locale } = await params;
//   return <PlaygroundContentServer locale={locale} />;
// }
