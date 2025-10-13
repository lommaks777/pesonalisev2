import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PersonalizedLessonProps {
  lessonNumber: number;
  title?: string;
  data: Record<string, unknown>;
}

export function PersonalizedLesson({ lessonNumber, title, data }: PersonalizedLessonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Урок {lessonNumber}
          {title ? `: ${title}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

