export const dynamic = "force-dynamic";
import fs from "fs";
import path from "path";
import { detectTemplateFormat, transformOldToNew, validateNewTemplate, type LessonTemplate, type LegacyLessonTemplate } from "@/lib/services/lesson-templates";

// New template structure with emoji keys or plain keys
type TemplateData = {
  // Emoji-based keys (current format)
  "👋 Введение"?: string;
  "🔑 Ключевые моменты"?: string[];
  "💡 Практические советы"?: string[];
  "⚠️ Важно"?: string[];
  "🧰 Инвентарь и подготовка"?: string;
  "📚 Домашнее задание"?: string;
  "_мотивационная строка_"?: string;
  // Plain keys (alternative format)
  introduction?: string;
  key_points?: string[];
  practical_tips?: string[];
  important_notes?: string[];
  equipment_preparation?: string;
  homework?: string;
  motivational_line?: string;
  // Legacy keys
  summary_short?: string;
  why_watch?: string;
  quick_action?: string;
  homework_20m?: string;
  [key: string]: any;
};

type NormalizedTemplate = {
  introduction: string;
  keyPoints: string[];
  practicalTips: string[];
  importantNotes?: string[];
  equipmentPreparation?: string;
  homework: string;
  motivationalLine: string;
};

function normalizeTemplate(raw: TemplateData): NormalizedTemplate | null {
  // Try emoji keys first
  const introduction = raw["👋 Введение"] || raw.introduction;
  const keyPoints = raw["🔑 Ключевые моменты"] || raw.key_points;
  const practicalTips = raw["💡 Практические советы"] || raw.practical_tips;
  const importantNotes = raw["⚠️ Важно"] || raw.important_notes;
  const equipmentPreparation = raw["🧰 Инвентарь и подготовка"] || raw.equipment_preparation;
  const homework = raw["📚 Домашнее задание"] || raw.homework;
  const motivationalLine = raw["_мотивационная строка_"] || raw.motivational_line;

  if (!introduction || !keyPoints || !practicalTips || !homework || !motivationalLine) {
    return null; // Invalid new format
  }

  return {
    introduction,
    keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
    practicalTips: Array.isArray(practicalTips) ? practicalTips : [],
    importantNotes: importantNotes && Array.isArray(importantNotes) ? importantNotes : undefined,
    equipmentPreparation,
    homework,
    motivationalLine,
  };
}

function readTemplates(): Array<{ 
  lessonNumber: number; 
  fileName: string; 
  template: NormalizedTemplate | null;
  format: 'old' | 'new' | 'unknown';
  errors: string[];
}> {
  const dir = path.join(process.cwd(), "store", "shvz");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith("-final.json"));

  const items: Array<{ lessonNumber: number; fileName: string; template: NormalizedTemplate | null; format: 'old' | 'new' | 'unknown'; errors: string[] }> = [];
  
  for (const file of files) {
    // File name format: "{n}-{...}-final.json" or "{n}-{n}-{id}-final.json"
    const match = file.match(/^([0-9]{1,2})-/);
    if (!match) continue;
    const lessonNumber = Number(match[1]);
    
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const json = JSON.parse(raw) as TemplateData;
      
      const format = detectTemplateFormat(json);
      const normalized = normalizeTemplate(json);
      
      let errors: string[] = [];
      if (normalized) {
        // Validate word count for key_points
        normalized.keyPoints.forEach((point, idx) => {
          const wordCount = point.split(/\s+/).length;
          if (wordCount > 18) {
            errors.push(`Ключевой момент ${idx + 1}: ${wordCount} слов (макс. 18)`);
          }
        });
        
        // Validate array lengths
        if (normalized.keyPoints.length < 4 || normalized.keyPoints.length > 6) {
          errors.push(`Ключевых моментов: ${normalized.keyPoints.length} (нужно 4-6)`);
        }
        if (normalized.practicalTips.length < 3 || normalized.practicalTips.length > 5) {
          errors.push(`Практических советов: ${normalized.practicalTips.length} (нужно 3-5)`);
        }
      } else if (format === 'old') {
        errors.push("Используется устаревший формат (5 полей)");
      }
      
      items.push({ lessonNumber, fileName: file, template: normalized, format, errors });
    } catch (err) {
      items.push({ 
        lessonNumber, 
        fileName: file, 
        template: null, 
        format: 'unknown',
        errors: ['Ошибка парсинга JSON'] 
      });
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
        {templates.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Файлы шаблонов не найдены. Сгенерируйте их командой <code>pnpm templates:regenerate</code>.
          </div>
        )}
        {templates.map(({ lessonNumber, fileName, template, format, errors }) => (
          <section key={fileName} className="rounded-lg border p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium">Урок {lessonNumber}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{fileName}</span>
                {format === 'new' && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Новый формат
                  </span>
                )}
                {format === 'old' && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                    Старый формат
                  </span>
                )}
              </div>
            </div>

            {errors.length > 0 && (
              <div className="mb-4 rounded-md bg-yellow-50 p-3 border border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Предупреждения:</h4>
                <ul className="list-disc list-inside text-xs text-yellow-700 space-y-0.5">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {template && (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>👋</span> Введение
                  </h3>
                  <p className="text-sm whitespace-pre-wrap mt-1">{template.introduction}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>🔑</span> Ключевые моменты 
                    <span className="text-xs text-muted-foreground">({template.keyPoints.length})</span>
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    {template.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm">{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>💡</span> Практические советы
                    <span className="text-xs text-muted-foreground">({template.practicalTips.length})</span>
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    {template.practicalTips.map((tip, idx) => (
                      <li key={idx} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>

                {template.importantNotes && template.importantNotes.length > 0 && (
                  <div className="mb-4 rounded-md bg-yellow-50 p-3 border border-yellow-200">
                    <h3 className="font-semibold flex items-center gap-2 text-yellow-800">
                      <span>⚠️</span> Важно
                    </h3>
                    <ul className="list-disc list-inside text-sm space-y-1 mt-1 text-yellow-700">
                      {template.importantNotes.map((note, idx) => (
                        <li key={idx} className="text-sm">{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {template.equipmentPreparation && (
                  <div className="mb-4 rounded-md bg-gray-50 p-3 border border-gray-200">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>🧰</span> Инвентарь и подготовка
                    </h3>
                    <p className="text-sm mt-1">{template.equipmentPreparation}</p>
                  </div>
                )}

                <div className="mb-4 rounded-md bg-blue-50 p-3 border border-blue-200">
                  <h3 className="font-semibold flex items-center gap-2 text-blue-800">
                    <span>📚</span> Домашнее задание
                  </h3>
                  <p className="text-sm mt-1 text-blue-700">{template.homework}</p>
                </div>

                <div className="rounded-md bg-gray-50 p-3 border-l-4 border-gray-400">
                  <p className="text-sm italic text-gray-700">{template.motivationalLine}</p>
                </div>
              </>
            )}

            {!template && (
              <div className="text-sm text-red-600">
                Не удалось загрузить шаблон
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}


