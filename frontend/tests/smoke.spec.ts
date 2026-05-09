import { test, expect } from "@playwright/test";

test("smoke: unauthenticated redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("smoke: dashboard renders after login", async ({ page }) => {
  await page.goto("/login");

  // NOTE: requires backend running and seed user or registration enabled.
  // We use register flow to avoid hardcoding credentials.
  await page.getByRole("link", { name: /注册/i }).click();
  await expect(page).toHaveURL(/\/register$/);

  const username = `u${Date.now()}`;
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("邮箱").fill(`${username}@test.local`);
  await page.getByLabel("密码").fill("password");
  await page.getByRole("button", { name: /注册/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/学科进度/)).toBeVisible();
});

