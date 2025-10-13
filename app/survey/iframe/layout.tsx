export default function SurveyIframeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Анкета персонализации курса</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

