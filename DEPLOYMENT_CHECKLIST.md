# 🚀 Deployment Checklist - CORS Fix

## Измененные файлы

### Основные исправления
- ✅ `lib/utils/http.ts` - обновлены CORS headers и исправлен createOptionsHandler
- ✅ `next.config.ts` - добавлены глобальные CORS headers
- ✅ `vercel.json` - добавлены CORS headers на уровне CDN

### API Endpoints (добавлены CORS headers)
- ✅ `app/api/persona/block/route.ts` - уже были CORS
- ✅ `app/api/persona/personalize-template/route.ts` - уже были CORS
- ✅ `app/api/survey/route.ts` - добавлены CORS headers и OPTIONS
- ✅ `app/api/lessons/route.ts` - добавлены CORS headers и OPTIONS

### Документация
- ✅ `CORS_FIX_REPORT.md` - полный отчет об исправлении
- ✅ `DEPLOYMENT_CHECKLIST.md` - этот файл

---

## Pre-Deploy Checklist

- [x] Все CORS headers обновлены
- [x] OPTIONS handlers работают корректно
- [x] Локальное тестирование пройдено
- [x] Документация создана
- [ ] Код закоммичен в Git
- [ ] Изменения отправлены на GitHub/Vercel

---

## Команды для деплоя

```bash
# 1. Проверить статус изменений
git status

# 2. Добавить все изменения
git add lib/utils/http.ts
git add next.config.ts
git add vercel.json
git add app/api/survey/route.ts
git add app/api/lessons/route.ts
git add CORS_FIX_REPORT.md
git add DEPLOYMENT_CHECKLIST.md

# 3. Закоммитить
git commit -m "fix: add CORS headers for cross-origin API requests

- Updated CORS headers to include all necessary methods and headers
- Fixed createOptionsHandler to return a function instead of object
- Added CORS to /api/survey and /api/lessons endpoints
- Configured global CORS in next.config.ts and vercel.json
- Fixes CORS blocking from shkolamasterov.online domain"

# 4. Отправить на remote (автодеплой на Vercel)
git push origin main
```

---

## Post-Deploy Verification

После успешного деплоя выполните:

### 1. Проверка OPTIONS (preflight)
```bash
curl -i -X OPTIONS https://pesonalisev2-zxby.vercel.app/api/persona/block
```

**Ожидаемый результат:**
- HTTP 200 OK
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With

### 2. Проверка POST запроса
```bash
curl -i -X POST https://pesonalisev2-zxby.vercel.app/api/persona/block \
  -H "Content-Type: application/json" \
  -H "Origin: https://shkolamasterov.online" \
  -d '{"user_id":"21179358","lesson":"1","title":"Урок 1"}'
```

**Ожидаемый результат:**
- HTTP 200 OK
- Access-Control-Allow-Origin: *
- JSON ответ с полем "ok": true

### 3. Проверка в браузере
1. Откройте https://shkolamasterov.online
2. Откройте DevTools → Console
3. Убедитесь что нет CORS ошибок
4. Проверьте Network tab → Headers → убедитесь что CORS headers присутствуют

---

## Rollback Plan

Если что-то пошло не так:

```bash
# Откатить последний коммит
git revert HEAD

# Отправить на remote
git push origin main
```

Или через Vercel Dashboard:
1. Перейти в Deployments
2. Найти предыдущий working deployment
3. Нажать "Promote to Production"

---

## Monitoring

После деплоя следите за:

1. **Vercel Logs**
   ```bash
   vercel logs --follow
   ```

2. **Error Rate** в Vercel Dashboard
   - Проверьте что нет всплеска 500 ошибок

3. **User Reports**
   - Убедитесь что пользователи могут загружать уроки

---

## Support Contacts

Если возникнут проблемы:
- Vercel Support: https://vercel.com/support
- Project Logs: https://vercel.com/[your-project]/logs

---

## Status

**Current:** ⏳ Awaiting deployment  
**Target:** 🎯 Fix CORS blocking from shkolamasterov.online  
**ETA:** ~5 минут после push

---

Обновите этот файл после успешного деплоя.
