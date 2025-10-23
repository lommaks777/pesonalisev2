<?php
/**
 * Главный скрипт для обработки видео с Kinescope
 * Скачивает видео, извлекает аудио, транскрибирует и создает описания
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(0);

require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/kinescope_api.php';
require_once __DIR__ . '/whisper_api.php';
require_once __DIR__ . '/queue_system.php';

// Функция для очистки имени файла
function sanitizeFilename($filename) {
    return preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $filename);
}

echo "=== ОБРАБОТКА ВИДЕО С KINESCOPE ===\n\n";

// Параметры командной строки
$options = getopt('', ['url:', 'lesson:', 'course:', 'quality:', 'help']);

if (isset($options['help']) || !isset($options['url'])) {
    echo "Использование:\n";
    echo "php process_video.php --url=https://kinescope.io/VIDEO_ID --lesson=1 --course='Название курса' [--quality=360p]\n\n";
    echo "Параметры:\n";
    echo "  --url=URL        Ссылка на видео Kinescope\n";
    echo "  --lesson=N       Номер урока\n";
    echo "  --course=NAME    Название курса\n";
    echo "  --quality=QUAL   Качество видео (360p, 720p, 1080p) - по умолчанию 360p\n";
    echo "  --help           Показать эту справку\n\n";
    echo "Примеры:\n";
    echo "php process_video.php --url=https://kinescope.io/202339654 --lesson=1 --course='Массаж ШВЗ'\n";
    echo "php process_video.php --url=https://kinescope.io/5NRs6UHWgMX9RtHqxNGy8j --lesson=2 --course='Массаж ШВЗ' --quality=720p\n";
    exit(0);
}

$videoUrl = $options['url'];
$lessonNumber = $options['lesson'];
$courseName = $options['course'];
$quality = $options['quality'] ?? '360p';

echo "📹 URL видео: $videoUrl\n";
echo "📚 Номер урока: $lessonNumber\n";
echo "🎓 Курс: $courseName\n";
echo "📺 Качество: $quality\n\n";

try {
    // Инициализация API
    $config = cfg();
    $kinescope = new KinescopeAPI($config['apis']['kinescope']['api_key']);
    $whisper = new WhisperAPI($config['apis']['whisper']['api_key']);
    
    // Извлекаем ID видео из URL
    $videoId = $kinescope->extractVideoId($videoUrl);
    if (!$videoId) {
        throw new Exception("Не удалось извлечь ID видео из URL: $videoUrl");
    }
    
    echo "🆔 ID видео: $videoId\n";
    
    // Получаем информацию о видео
    echo "📊 Получаем информацию о видео...\n";
    $videoInfo = $kinescope->getVideoInfo($videoId);
    echo "📝 Название: " . $videoInfo['title'] . "\n";
    echo "⏱️  Длительность: " . round($videoInfo['duration'] / 60, 2) . " мин\n";
    
    // Создаем папку для курса
    $courseDir = __DIR__ . '/store/' . sanitizeFilename($courseName);
    if (!is_dir($courseDir)) {
        mkdir($courseDir, 0755, true);
        echo "📁 Создана папка курса: $courseDir\n";
    }
    
    // Скачиваем видео
    echo "⬇️  Скачиваем видео в качестве $quality...\n";
    $videoFile = $courseDir . '/' . $lessonNumber . '-' . $videoId . '.mp4';
    
    $downloadInfo = $kinescope->getVideoDownloadUrl($videoId, $quality);
    $downloadedSize = $kinescope->downloadVideoWithRetry($downloadInfo['url'], $videoFile);
    
    if (!$downloadedSize || $downloadedSize < 1024) {
        throw new Exception("Ошибка скачивания видео");
    }
    
    echo "✅ Видео скачано: " . round($downloadedSize / 1024 / 1024, 2) . " MB\n";
    
    // Извлекаем аудио
    echo "🎵 Извлекаем аудио...\n";
    $audioFile = $courseDir . '/' . $lessonNumber . '-' . $videoId . '.wav';
    
    $audioExtracted = $whisper->extractAudio($videoFile, $audioFile);
    if (!$audioExtracted) {
        throw new Exception("Ошибка извлечения аудио");
    }
    
    echo "✅ Аудио извлечено: " . round(filesize($audioFile) / 1024 / 1024, 2) . " MB\n";
    
    // Транскрибируем аудио
    echo "🎤 Транскрибируем аудио...\n";
    $transcript = $whisper->transcribe($audioFile);
    
    if (!$transcript) {
        throw new Exception("Ошибка транскрипции");
    }
    
    echo "✅ Транскрипция завершена: " . strlen($transcript) . " символов\n";
    
    // Сохраняем транскрипцию
    $transcriptFile = $courseDir . '/' . sprintf('%02d', $lessonNumber) . '-' . $videoId . '.txt';
    file_put_contents($transcriptFile, $transcript);
    echo "💾 Транскрипция сохранена: $transcriptFile\n";
    
    // Создаем описание урока
    echo "📝 Создаем описание урока...\n";
    $description = createLessonDescription($transcript, $lessonNumber, $courseName);
    
    if (!$description) {
        throw new Exception("Ошибка создания описания урока");
    }
    
    // Сохраняем описание
    $descriptionFile = $courseDir . '/' . $lessonNumber . '-' . $videoId . '-final.json';
    file_put_contents($descriptionFile, json_encode($description, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    echo "✅ Описание урока сохранено: $descriptionFile\n";
    
    // Очищаем временные файлы
    if (file_exists($videoFile)) {
        unlink($videoFile);
        echo "🗑️  Временное видео удалено\n";
    }
    
    if (file_exists($audioFile)) {
        unlink($audioFile);
        echo "🗑️  Временное аудио удалено\n";
    }
    
    echo "\n🎉 Обработка завершена успешно!\n";
    echo "📄 Транскрипция: $transcriptFile\n";
    echo "📋 Описание: $descriptionFile\n";
    
} catch (Exception $e) {
    echo "❌ Ошибка: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Создает описание урока на основе транскрипции
 */
function createLessonDescription($transcript, $lessonNumber, $courseName) {
    $config = cfg();
    
    $prompt = "Сформируй универсальную, краткую текстовую структуру («рыбу») урока по массажу на основе одной транскрибации, соблюдая следующие требования и формат:

- Основа ответа: исключительно исходная транскрибация, никаких личных обращений или выдуманных фактов.
- Используй только нейтральный, универсальный стиль без упоминаний личности преподавателя или ученика, без примеров из жизни, без фраз вроде «на этом уроке».
- В полях используй чёткие формулировки, конкретику и соблюдай указанный объем.
- Ответ должен быть строго в виде JSON как показано ниже, БЕЗ HTML, комментариев или маркировки кода.

Поля и их назначение:
- \"summary_short\": Одно предложение (12–18 слов) о сути навыка/знания из этого материала. Не используй вводные слова или словосочетания вроде «в этом уроке», только нейтральное описание.
- \"prev_lessons\": Оставь пустым (\"\"), если урок независимый или нет данных о связи с предыдущими.
- \"why_watch\": 400–600 знаков о срочной пользе и мотивации: какую проблему решает, как предотвращает ошибки, пользу сейчас и перспективы на будущее.
- \"quick_action\": Одна быстрая техника/действие или приём по теме, который можно выполнить за 1–2 минуты, четко, без лишних рассуждений.
- \"social_share\": Очень короткий, но вдохновляющий и лёгкий текст (без штампов и формализмов), передающий инсайт/главное знание, которым захочется поделиться в Instagram/Telegram.
- \"homework_20m\": Конкретное, реализуемое задание, разбитое на четкие пошаговые инструкции (до 20 минут по времени).

Порядок и метод:
1. Внимательно анализируй транскрибацию: выпиши основные темы, приёмы, важные ошибки или «боли» и основные рекомендации.
2. На основании анализа последовательно (шаг за шагом) выработай краткое описание каждого блока (summary_short, why_watch, quick_action, social_share, homework_20m), строго придерживаясь указанных требований к стилю и длине.
3. Перепроверь, что поля : 
   - Содержат только нейтральный, информативный и не персонализированный текст.
   - Соответствуют максимальному и минимальному объёму.
4. Сформируй итоговый JSON.

Структура вывода:
{
  \"summary_short\": \"[Одно чёткое предложение о главном навыке/знании]\",
  \"prev_lessons\": \"\",
  \"why_watch\": \"[400–600 знаков о пользе и мотивации]\",
  \"quick_action\": \"[Мини-действие на тему]\",
  \"social_share\": \"[Короткий тезис для соцсетей]\",
  \"homework_20m\": \"[Пошаговая инструкция для самостоятельной тренировки, ≤20 мин]\"
}

Дополнительные указания:
- Используй placeholders ([ТЕКСТ ТРАНСКРИБАЦИИ], [конкретная техника], [основная польза]) для сложных или переменных элементов, если приводишь пример.
- Удели особое внимание: краткости, нейтральности, точности терминов, структурности вывода.
- Если данные в транскрибации недостаточны, укажи только то, что достоверно присутствует.

Транскрибация:
$transcript";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $config['apis']['openai']['api_key']
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.3,
        'max_tokens' => 2000
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Ошибка API OpenAI: HTTP $httpCode - $response");
    }
    
    $data = json_decode($response, true);
    if (!isset($data['choices'][0]['message']['content'])) {
        throw new Exception("Неожиданный ответ от API OpenAI");
    }
    
    $content = $data['choices'][0]['message']['content'];
    
    // Пытаемся извлечь JSON из ответа
    if (preg_match('/\{.*\}/s', $content, $matches)) {
        $json = json_decode($matches[0], true);
        if ($json) {
            return $json;
        }
    }
    
    throw new Exception("Не удалось извлечь JSON из ответа API");
}
?>


