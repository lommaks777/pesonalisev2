import { Suspense } from "react";

export default function SurveyIframeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div>Загрузка...</div>}>{children}</Suspense>;
}



