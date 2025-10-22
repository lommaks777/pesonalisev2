"use client";

import { useState } from "react";

interface PersonalizationEditorProps {
  profileId: string;
  lessonId: string;
  lessonTitle: string;
  initialContent?: Record<string, unknown>;
  onSave?: () => void;
}

export function PersonalizationEditor({
  profileId,
  lessonId,
  lessonTitle,
  initialContent,
  onSave,
}: PersonalizationEditorProps) {
  const [content, setContent] = useState(
    initialContent ? JSON.stringify(initialContent, null, 2) : "{}"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Валидация JSON
      const parsedContent = JSON.parse(content);

      const response = await fetch("/api/personalizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          lessonId,
          content: parsedContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save");
      }

      setMessage({ type: "success", text: result.message });
      onSave?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ошибка сохранения",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить персонализацию этого урока?")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/personalizations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          lessonId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete");
      }

      setMessage({ type: "success", text: result.message });
      setContent("{}");
      onSave?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ошибка удаления",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-lg font-semibold">Редактировать персонализацию</h3>
        <p className="text-sm text-muted-foreground">{lessonTitle}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          Персонализированное содержимое (JSON):
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
          placeholder='{\n  "introduction": "Добро пожаловать...",\n  "key_points": ["Пункт 1", "Пункт 2"]\n}'
        />
      </div>

      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
        {initialContent && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}



