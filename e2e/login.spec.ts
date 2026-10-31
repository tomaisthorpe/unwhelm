import { test, expect } from "./fixtures";

test("login opens tasks and keeps the session after a reload", async ({ page, account }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL("/tasks");
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL("/tasks");
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();

  const session = await page.request.get("/api/auth/session");
  expect(session.ok()).toBeTruthy();
  expect(await session.json()).toMatchObject({
    user: { name: account.name, email: account.email },
  });
});

test("login rejects an incorrect password without creating a session", async ({ page, account }) => {
  await page.goto("/auth/signin");
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill("Incorrect-password1!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByText("Invalid email or password", { exact: true })).toBeVisible();
  await expect(page).toHaveURL("/auth/signin");

  const session = await page.request.get("/api/auth/session");
  expect(session.ok()).toBeTruthy();
  expect(await session.json()).toEqual({});

  await page.goto("/tasks");
  await expect(page).toHaveURL("/auth/signin");
});
