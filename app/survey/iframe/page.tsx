"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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

export default function SurveyIframePage() {
  const searchParams = useSearchParams();
  const uidParam = searchParams.get("uid");
  const nameParam = searchParams.get("name");
  const courseParam = searchParams.get("course") || "shvz"; // По умолчанию shvz для обратной совместимости

  const [formData, setFormData] = useState<SurveyFormData>({
    real_name: nameParam || "",
    course: courseParam,
    motivation: [],
    target_clients: "",
    skills_wanted: "",
    fears: [],
    wow_result: "",
    practice_model: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    type: "success" | "error"; 
    message: string;
    lessonLink?: string;
  } | null>(null);

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
        body: JSON.stringify({
          ...formData,
          uid: uidParam, // Передаем uid из GetCourse
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обработке анкеты");
      }

      const dashboardUrl = `${window.location.origin}/dashboard?profileId=${data.profileId}`;
      
      setResult({
        type: "success",
        message: "Персональный курс создан!",
        lessonLink: dashboardUrl,
      });

      // Отправляем сообщение родительскому окну (для GetCourse)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: "SURVEY_COMPLETED",
          profileId: data.profileId,
          userIdentifier: data.userIdentifier,
          dashboardUrl: dashboardUrl,
        }, "*");
      }

    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Произошла ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  if (result?.type === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              🎉 Персональный курс создан!
            </h2>
            <p className="text-gray-600 mb-6">
              Ваш курс адаптирован под ваши цели и потребности.<br/>
              Можете перейти к следующему уроку
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 p-4">
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
            <p className="text-sm text-gray-500 mt-1">
              💡 Проверьте имя — иногда здесь может быть указан email
            </p>
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
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Создаем персональный курс...
              </span>
            ) : (
              "🎯 Создать персональный курс"
            )}
          </button>

          {result && result.type === "error" && (
            <div className="p-4 rounded-lg text-center bg-red-50 text-red-800 border border-red-200">
              {result.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

