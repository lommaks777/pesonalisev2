import { test, expect } from "@playwright/test";

test("dashboard loads lessons list", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page).toHaveTitle(/Persona Course Platform/);
  await expect(page.getByRole("heading", { name: /Уроки курса/i })).toBeVisible();
  await expect(page.getByText(/Анкеты пользователей/i)).toBeVisible();
});

