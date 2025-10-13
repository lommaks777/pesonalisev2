"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SurveyFormData {
  real_name: string;
  course: string;
  motivation: string[];
  target_clients: string;
  skills_wanted: string;
  fears: string[];
  wow_result: string;
  practice_model: string;
}

export default function SurveyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SurveyFormData>({
    real_name: "",
    course: "",
    motivation: [],
    target_clients: "",
    skills_wanted: "",
    fears: [],
    wow_result: "",
    practice_model: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCheckboxChange = (field: "motivation" | "fears", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обработке анкеты");
      }

      setResult({
        type: "success",
        message: "Персональный курс создан! Перенаправляем...",
      });

      // Перенаправляем на dashboard с выбранным профилем
      setTimeout(() => {
        router.push(`/dashboard?profileId=${data.profileId}`);
      }, 2000);
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Произошла ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            🎯 Персонализация курса
          </h1>
          <p className="text-gray-600 text-lg">
            Заполните анкету, чтобы получить персональные рекомендации
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="real_name" className="block font-semibold text-gray-700 mb-2">
              Ваше имя: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="real_name"
              required
              value={formData.real_name}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
              placeholder="Например: Мария Иванова"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="course" className="block font-semibold text-gray-700 mb-2">
              Выберите курс: <span className="text-red-500">*</span>
            </label>
            <select
              id="course"
              required
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition text-gray-900"
            >
              <option value="">Выберите курс</option>
              <option value="massazh-shvz">Массаж ШВЗ</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Что вас мотивирует изучать массаж?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: "help_others", label: "Помочь близким" },
                { value: "professional_development", label: "Профессиональное развитие" },
                { value: "health_improvement", label: "Улучшение здоровья" },
                { value: "additional_income", label: "Дополнительный доход" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.motivation.includes(value)}
                    onChange={() => handleCheckboxChange("motivation", value)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="target_clients" className="block font-semibold text-gray-700 mb-2">
              С кем планируете работать?
            </label>
            <textarea
              id="target_clients"
              value={formData.target_clients}
              onChange={(e) => setFormData({ ...formData, target_clients: e.target.value })}
              placeholder="Например: Буду работать с офисными работниками, у которых болит спина и шея от долгого сидения за компьютером"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition resize-y text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="skills_wanted" className="block font-semibold text-gray-700 mb-2">
              Какие навыки хотите освоить?
            </label>
            <textarea
              id="skills_wanted"
              value={formData.skills_wanted}
              onChange={(e) => setFormData({ ...formData, skills_wanted: e.target.value })}
              placeholder="Например: Хочу научиться снимать головные боли, работать с триггерными точками и делать расслабляющий массаж шеи"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition resize-y text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Какие у вас есть страхи или опасения?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: "harm_client", label: "Навредить клиенту" },
                { value: "wrong_technique", label: "Неправильная техника" },
                { value: "lack_confidence", label: "Недостаток уверенности" },
                { value: "not_enough_time", label: "Недостаточно времени" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fears.includes(value)}
                    onChange={() => handleCheckboxChange("fears", value)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="wow_result" className="block font-semibold text-gray-700 mb-2">
              Какой результат вас больше всего впечатлит?
            </label>
            <textarea
              id="wow_result"
              value={formData.wow_result}
              onChange={(e) => setFormData({ ...formData, wow_result: e.target.value })}
              placeholder="Например: Когда я смогу помочь маме избавиться от постоянных головных болей, от которых она страдает много лет"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition resize-y text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="practice_model" className="block font-semibold text-gray-700 mb-2">
              На ком планируете практиковаться?
            </label>
            <textarea
              id="practice_model"
              value={formData.practice_model}
              onChange={(e) => setFormData({ ...formData, practice_model: e.target.value })}
              placeholder="Например: На муже и подругах, иногда на себе"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition resize-y text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-full font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Создаем персональный курс..." : "🎯 Создать персональный курс"}
          </button>

          {result && (
            <div
              className={`p-4 rounded-lg text-center ${
                result.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

