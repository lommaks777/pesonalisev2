#!/bin/bash

# Скрипт для получения транскрипций курса Кинезио 2

cd /Users/aleksejlomakin/Documents/persona

npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \
  --course-slug kinesio2 \
  --course-title "Kinesio 2" \
  --folder-id 65272142-15a1-47fa-903e-c779f101f149
