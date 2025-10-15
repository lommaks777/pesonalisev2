import fs from "fs";
import path from "path";

type Template = {
  summary_short?: string;
  why_watch?: string;
  quick_action?: string;
  social_share?: string;
  homework_20m?: string;
};

function readTemplates(): Array<{ lessonNumber: number; fileName: string; template: Template }> {
  const dir = path.join(process.cwd(), "store", "shvz");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith("-final.json"));

  const items: Array<{ lessonNumber: number; fileName: string; template: Template }> = [];
  for (const file of files) {
    // File name format: "{n}-{...}-final.json" or "{n}-{n}-{id}-final.json"
    const match = file.match(/^([0-9]{1,2})-/);
    if (!match) continue;
    const lessonNumber = Number(match[1]);
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const json = JSON.parse(raw) as Template;
      items.push({ lessonNumber, fileName: file, template: json });
    } catch {
      // skip invalid
    }
  }

  return items.sort((a, b) => a.lessonNumber - b.lessonNumber);
}

export default function TemplatesPage() {
  const templates = readTemplates();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Шаблоны уроков (рыбы)</h1>
      <p className="text-sm text-muted-foreground">
        Ниже показаны сгенерированные шаблоны описаний для всех уроков из файлов store/shvz/*-final.json
      </p>

      <div className="space-y-6">
        {templates.map(({ lessonNumber, fileName, template }) => (
          <section key={fileName} className="rounded-lg border p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium">Урок {lessonNumber}</h2>
              <span className="text-xs text-muted-foreground">{fileName}</span>
            </div>

            {template.summary_short && (
              <div className="mb-4">
                <h3 className="font-semibold">📝 Описание</h3>
                <p className="text-sm whitespace-pre-wrap">{template.summary_short}</p>
              </div>
            )}

            {template.why_watch && (
              <div className="mb-4">
                <h3 className="font-semibold">🎯 Зачем смотреть</h3>
                <p className="text-sm whitespace-pre-wrap">{template.why_watch}</p>
              </div>
            )}

            {template.quick_action && (
              <div className="mb-4">
                <h3 className="font-semibold">⚡ Быстрое действие</h3>
                <p className="text-sm whitespace-pre-wrap">{template.quick_action}</p>
              </div>
            )}

            {template.homework_20m && (
              <div className="mb-2">
                <h3 className="font-semibold">📚 Домашнее задание (20 мин)</h3>
                <p className="text-sm whitespace-pre-wrap">{template.homework_20m}</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}


