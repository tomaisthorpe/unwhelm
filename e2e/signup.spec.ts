import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { Pool } from "pg";

test("signup signs in immediately and keeps the session after a reload", async ({ page }) => {
  const email = `signup-${randomUUID()}@example.test`;
  const password = `E2e-${randomUUID()}!`;
  const database = new Pool({ connectionString: process.env.E2E_DATABASE_URL });

  try {
    await page.goto("/auth/signup");
    await page.getByLabel("Full Name", { exact: true }).fill("Signup Test");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL("/tasks");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();

    const session = await page.request.get("/api/auth/session");
    expect(session.ok()).toBeTruthy();
    expect(await session.json()).toMatchObject({
      user: { name: "Signup Test", email },
    });
  } finally {
    try {
      // User relations cascade, including the inbox created during signup.
      await database.query('DELETE FROM "users" WHERE email = $1', [email]);
    } finally {
      await database.end();
    }
  }
});
