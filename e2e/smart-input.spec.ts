import { test, expect } from "./fixtures";
import type { Task, Context } from "../lib/data";

test.use({ timezoneId: "UTC" });

test("smart input parses task details and saves the task", async ({ page, account }) => {
  const now = new Date();
  await page.clock.setFixedTime(now);
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  await page.goto("/auth/signin");
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/tasks");
  await expect(page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();

  const input = page.getByPlaceholder("Type your task naturally...", { exact: false });
  const form = page.locator("form").filter({ has: input });
  const title = "Buy ingredients";
  await input.fill(`${title} !Inbox #groceries p1 tomorrow`);

  await expect(form.getByText("Task Preview", { exact: true })).toBeVisible();
  // The preview follows the input's decorative text overlay.
  await expect(form.getByText(title, { exact: true }).last()).toBeVisible();
  await expect(form.getByText("HIGH", { exact: true })).toBeVisible();
  await expect(form.getByText("Inbox", { exact: true })).toBeVisible();
  await expect(form.getByText("groceries", { exact: true })).toBeVisible();
  await expect(form.getByText("Tomorrow", { exact: true })).toBeVisible();

  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(form.getByText("Task Preview", { exact: true })).toBeHidden();
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();

  const response = await page.request.get("/api/dashboard");
  expect(response.ok()).toBeTruthy();
  const dashboard: { tasks: Task[]; contexts: Context[] } = await response.json();
  const inbox = dashboard.contexts.find((context) => context.isInbox);
  expect(inbox).toBeDefined();
  expect(dashboard.tasks).toHaveLength(1);
  expect(dashboard.tasks[0]).toMatchObject({
    title,
    contextId: inbox!.id,
    tags: ["groceries"],
    priority: "HIGH",
    type: "TASK",
    completed: false,
  });
  expect(new Date(dashboard.tasks[0].dueDate!).toISOString().slice(0, 10))
    .toBe(tomorrow.toISOString().slice(0, 10));
});
