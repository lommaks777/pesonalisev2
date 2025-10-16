# CORS Fix Report

**Дата:** 16 октября 2025  
**Проблема:** CORS блокировка при обращении к API с домена `shkolamasterov.online`

---

## 🔴 Исходная проблема

```
Access to fetch at 'https://pesonalisev2-zxby.vercel.app/api/persona/block' 
from origin 'https://shkolamasterov.online' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Причины:
1. Недостаточные CORS headers в ответах API
2. Неправильная реализация OPTIONS handler (возвращал объект вместо функции)
3. Отсутствие глобальных CORS настроек в Next.js/Vercel конфигурации

---

## ✅ Внесенные исправления

### 1. Обновлены CORS Headers ([`lib/utils/http.ts`](file://lib/utils/http.ts))

**Было:**
```typescript
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

**Стало:**
```typescript
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400", // 24 hours
};
```

**Изменения:**
- ✅ Добавлены методы GET, PUT, DELETE
- ✅ Добавлены headers Authorization, X-Requested-With
- ✅ Добавлен Max-Age для кеширования preflight запросов на 24 часа

---

### 2. Исправлен OPTIONS Handler ([`lib/utils/http.ts`](file://lib/utils/http.ts))

**Было:**
```typescript
export function createOptionsHandler(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
```

**Стало:**
```typescript
export function createOptionsHandler() {
  return function OPTIONS() {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  };
}
```

**Проблема:** Next.js ожидает, что OPTIONS будет функцией, а не объектом.  
**Решение:** Возвращаем функцию-обертку, которая создает NextResponse.

---

### 3. Добавлены CORS Headers в API endpoint'ы

**Обновленные файлы:**
- ✅ [`app/api/survey/route.ts`](file://app/api/survey/route.ts) - добавлены CORS headers и OPTIONS handler
- ✅ [`app/api/persona/block/route.ts`](file://app/api/persona/block/route.ts) - уже были CORS headers
- ✅ [`app/api/persona/personalize-template/route.ts`](file://app/api/persona/personalize-template/route.ts) - уже были CORS headers

**Паттерн использования:**
```typescript
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  // ... код обработки
  return NextResponse.json(response, { headers: CORS_HEADERS });
}

export const OPTIONS = createOptionsHandler();
```

---

### 4. Глобальные CORS настройки ([`next.config.ts`](file://next.config.ts))

Добавлена конфигурация headers для всех API routes:

```typescript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PUT, DELETE, OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization, X-Requested-With",
        },
        {
          key: "Access-Control-Max-Age",
          value: "86400",
        },
      ],
    },
  ];
}
```

---

### 5. Vercel конфигурация ([`vercel.json`](file://vercel.json))

Добавлены CORS headers на уровне CDN:

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ]
}
```

---

## 🧪 Тестирование

### Локальное тестирование

**OPTIONS (preflight) запрос:**
```bash
curl -i -X OPTIONS http://localhost:3000/api/persona/block
```

**Результат:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400
```

**POST запрос с Origin:**
```bash
curl -i -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -H "Origin: https://shkolamasterov.online" \
  -d '{"user_id":"test_user","lesson":"1","title":"Урок 1"}'
```

**Результат:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
{"ok":true,"html":"..."}
```

---

## 📋 Чеклист для деплоя

### Перед деплоем:
- [x] Обновлены CORS headers в `lib/utils/http.ts`
- [x] Исправлен `createOptionsHandler()`
- [x] Добавлены CORS headers в `/api/survey`
- [x] Обновлен `next.config.ts`
- [x] Обновлен `vercel.json`
- [x] Локальное тестирование пройдено

### После деплоя на Vercel:
- [ ] Проверить OPTIONS запрос к production API
- [ ] Проверить POST запрос с реального домена
- [ ] Проверить работу на странице GetCourse
- [ ] Убедиться что нет CORS ошибок в консоли браузера

---

## 🚀 Деплой на Vercel

```bash
# Закоммитить изменения
git add .
git commit -m "fix: CORS headers for cross-origin requests from shkolamasterov.online"

# Отправить на Vercel (автодеплой через Git)
git push origin main
```

Или через Vercel CLI:
```bash
vercel --prod
```

---

## 🔍 Проверка на production

После деплоя протестируйте:

```bash
# OPTIONS запрос
curl -i -X OPTIONS https://pesonalisev2-zxby.vercel.app/api/persona/block

# POST запрос
curl -i -X POST https://pesonalisev2-zxby.vercel.app/api/persona/block \
  -H "Content-Type: application/json" \
  -H "Origin: https://shkolamasterov.online" \
  -d '{"user_id":"21179358","lesson":"1","title":"Урок 1"}'
```

Ожидаемые headers в ответе:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400
```

---

## 📝 Дополнительные заметки

### Безопасность
Текущая настройка `Access-Control-Allow-Origin: *` разрешает запросы с любого домена. Это подходит для публичного API.

Если потребуется ограничить доступ только к определенным доменам:

```typescript
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://shkolamasterov.online",
  // ... остальные headers
};
```

### Производительность
`Access-Control-Max-Age: 86400` кеширует preflight запросы на 24 часа, снижая нагрузку на сервер.

### Мониторинг
После деплоя следите за логами Vercel на наличие CORS-related ошибок:
```bash
vercel logs --follow
```

---

## ✅ Статус

**Локально:** ✅ Протестировано, работает  
**Production:** ⏳ Ожидает деплоя  

После деплоя обновите этот статус.
