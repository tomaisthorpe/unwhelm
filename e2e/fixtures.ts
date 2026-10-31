import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { Pool } from "pg";

export { expect } from "@playwright/test";

export const test = base.extend<{
  account: { name: string; email: string; password: string };
  authenticatedPage: Page;
}>({
  account: async ({ request }, provideAccount) => {
    const account = {
      name: "E2E Test",
      email: `e2e-${randomUUID()}@example.test`,
      password: `E2e-${randomUUID()}!`,
    };
    const database = new Pool({ connectionString: process.env.E2E_DATABASE_URL });

    try {
      // Create an existing account without signing the browser in.
      const response = await request.post("/api/auth/signup", { data: account });
      expect(response.status()).toBe(201);
      await provideAccount(account);
    } finally {
      try {
        // Cascades to the account's tasks, contexts, and tags.
        await database.query('DELETE FROM "users" WHERE email = $1', [account.email]);
      } finally {
        await database.end();
      }
    }
  },
  authenticatedPage: async ({ page, account }, providePage) => {
    // page.request shares cookies with this test's browser context.
    const csrfResponse = await page.request.get("/api/auth/csrf");
    expect(csrfResponse.ok()).toBeTruthy();
    const { csrfToken } = await csrfResponse.json();
    expect(csrfToken).toEqual(expect.any(String));

    const response = await page.request.post("/api/auth/callback/credentials", {
      form: {
        email: account.email,
        password: account.password,
        csrfToken,
        json: "true",
      },
    });
    expect(response.ok()).toBeTruthy();

    const session = await page.request.get("/api/auth/session");
    expect(session.ok()).toBeTruthy();
    expect(await session.json()).toMatchObject({
      user: { name: account.name, email: account.email },
    });

    await providePage(page);
  },
});
