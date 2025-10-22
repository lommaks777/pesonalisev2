"use client";

interface ProfileSurveyProps {
  survey: Record<string, unknown> | null;
  profileName: string | null;
}

export function ProfileSurvey({ survey, profileName }: ProfileSurveyProps) {
  if (!survey) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Анкета не заполнена
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">
          Анкета: {profileName || "Без имени"}
        </h3>
        <div className="space-y-3">
          {Object.entries(survey).map(([key, value]) => (
            <div key={key} className="grid gap-1">
              <dt className="text-sm font-medium text-muted-foreground">
                {formatFieldName(key)}
              </dt>
              <dd className="text-sm">
                {formatFieldValue(value)}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatFieldName(key: string): string {
  // Преобразуем snake_case в читаемый формат
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  
  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }
  
  return String(value);
}



