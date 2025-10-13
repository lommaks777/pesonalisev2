import "dotenv/config";
import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("❌ SUPABASE_DB_URL не задан. Получите строку подключения в Supabase → Project Settings → Database → Connection string.");
  process.exit(1);
}

async function runSQLFile(filePath: string, client: Client) {
  const sql = await fs.readFile(filePath, "utf-8");
  if (!sql.trim()) {
    return;
  }
  await client.query(sql);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const migrationsDir = path.resolve("./migrations");
    const files = await fs.readdir(migrationsDir);
    const sorted = files.filter((file) => file.endsWith(".sql")).sort();

    for (const file of sorted) {
      const fullPath = path.join(migrationsDir, file);
      console.log("▶️ Выполняю", file);
      await runSQLFile(fullPath, client);
    }

    console.log("✅ Миграции выполнены");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("❌ Ошибка миграции:", error);
  process.exit(1);
});



