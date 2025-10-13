import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_REF = "guzeszmhrfalbvamzxgg";
const EXPECTED_URL = `https://${PROJECT_REF}.supabase.co`;

function decodeJwt(token: string) {
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new Error("Некорректный JWT – ожидалось 3 сегмента");
  }

  const payloadBase64 = segments[1];
  const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
  return JSON.parse(payloadJson) as Record<string, unknown>;
}

describe("Переменные окружения Supabase и OpenAI", () => {
  it("NEXT_PUBLIC_SUPABASE_URL совпадает с проектом", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(EXPECTED_URL);
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY валидный JWT", () => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY отсутствует").toBeDefined();
    const payload = decodeJwt(anonKey!);
    expect(payload["iss"]).toBe("supabase");
    expect(payload["ref"]).toBe(PROJECT_REF);
    expect(payload["role"]).toBe("anon");
  });

  it("SUPABASE_SERVICE_ROLE_KEY валидный JWT со служебной ролью (если задан)", () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return;
    }
    const payload = decodeJwt(serviceKey);
    expect(payload["iss"]).toBe("supabase");
    expect(payload["ref"]).toBe(PROJECT_REF);
    expect(payload["role"]).toBe("service_role");
  });

  it("SUPABASE_DB_URL указан и соответствует проекту", () => {
    const dbUrl = process.env.SUPABASE_DB_URL;
    expect(dbUrl, "SUPABASE_DB_URL отсутствует").toBeDefined();
    expect(dbUrl).toMatch(/^postgresql:\/\//);
    expect(dbUrl).toContain(`${PROJECT_REF}.supabase.co`);
  });

  it("OPENAI_API_KEY задан и выглядит как ключ OpenAI", () => {
    const openAiKey = process.env.OPENAI_API_KEY;
    expect(openAiKey, "OPENAI_API_KEY отсутствует").toBeDefined();
    expect(openAiKey).toMatch(/^sk-(proj-)?[A-Za-z0-9_-]{20,}$/);
  });

  it("COURSE_STORE_PATH указывает на существующую директорию", () => {
    const storePath = process.env.COURSE_STORE_PATH;
    expect(storePath, "COURSE_STORE_PATH отсутствует").toBeDefined();
    const resolved = path.resolve(process.cwd(), storePath!);
    const exists = fs.existsSync(resolved);
    expect(exists, `Каталог ${resolved} не найден`).toBe(true);
  });
});

