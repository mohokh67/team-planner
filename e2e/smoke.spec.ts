import { test, expect, type Page } from "@playwright/test";
import { installSupabaseMock } from "./mockSupabase";

// Backend-mocked UI/logic smoke suite. No real Supabase project is ever
// dialed (see mockSupabase.ts) - this proves the React app's own behavior
// (routing, the plan store, the components), not the Postgres RLS/RPC
// layer, which is covered separately by the SQL in supabase/schema.sql
// and its own review.
//
// Note: a Person/Ticket/Subtask's name lives in an <input value="...">,
// not in DOM text content, so assertions on it use toHaveValue(), not
// toContainText()/hasText - those only see literal text nodes (labels,
// computed spans like .row-net), not input values.

async function createAndOpenPlan(page: Page, name = "Test Plan") {
  await page.goto("/");
  await page.fill('input[placeholder="New plan name…"]', name);
  await page.click('button:has-text("New plan")');
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await installSupabaseMock(page);
});

test("home page renders the empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Team Planner" })).toBeVisible();
  await expect(page.getByText("No plans yet.")).toBeVisible();
});

test("creating a plan opens it and reflects the plan in the URL", async ({ page }) => {
  await createAndOpenPlan(page, "Q1 Planning");
  await expect(page).toHaveURL(/\?plan=.+&token=.+/);
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
});

test("add-person form is collapsed by default and collapses again after adding", async ({ page }) => {
  await createAndOpenPlan(page);

  const trigger = page.getByRole("button", { name: "+ Add person" });
  await expect(trigger).toBeVisible();
  await expect(page.getByPlaceholder("Add person…")).toHaveCount(0);

  await trigger.click();
  await page.getByPlaceholder("Add person…").fill("Alice");
  await page.locator('form.add-form input[type="number"]').fill("50");
  await page.locator('form.add-form button[type="submit"]').click();

  // Back to just the trigger button, no lingering inputs.
  await expect(trigger).toBeVisible();
  await expect(page.getByPlaceholder("Add person…")).toHaveCount(0);

  const row = page.locator(".person-row");
  await expect(row).toHaveCount(1);
  await expect(row.locator(".row-input-name")).toHaveValue("Alice");
});

test("net capacity is capacity minus unavailable, floored at 0", async ({ page }) => {
  await createAndOpenPlan(page);
  await page.getByRole("button", { name: "+ Add person" }).click();
  await page.getByPlaceholder("Add person…").fill("Bob");
  await page.locator('form.add-form input[type="number"]').fill("50");
  await page.locator('form.add-form button[type="submit"]').click();

  const row = page.locator(".person-row");
  await row.getByLabel("Unavailable").fill("10");
  await expect(row.locator(".row-net")).toHaveText("40");

  await row.getByLabel("Unavailable").fill("999");
  await expect(row.locator(".row-net")).toHaveText("0");
});

test("add-ticket form is collapsed by default, and a checked ticket counts toward Allocated", async ({ page }) => {
  await createAndOpenPlan(page);

  const trigger = page.getByRole("button", { name: "+ Add ticket" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByPlaceholder("Add ticket…").fill("Write docs");
  await page.locator('form.add-form input[type="number"]').fill("8");
  await page.locator('form.add-form button[type="submit"]').click();

  const ticket = page.locator(".ticket");
  await expect(ticket).toHaveCount(1);
  await expect(ticket.locator(".ticket-row .row-input-name")).toHaveValue("Write docs");

  await ticket.locator('.ticket-row input[type="checkbox"]').check();
  await expect(page.locator(".plan-summary-numbers")).toContainText("8");
});

test("a ticket stops showing its own estimate once it has a subtask", async ({ page }) => {
  await createAndOpenPlan(page);
  await page.getByRole("button", { name: "+ Add ticket" }).click();
  await page.getByPlaceholder("Add ticket…").fill("Epic");
  await page.locator('form.add-form input[type="number"]').fill("20");
  await page.locator('form.add-form button[type="submit"]').click();

  const ticket = page.locator(".ticket");
  await expect(ticket.locator('.ticket-row input[type="number"]')).toHaveCount(1);

  await ticket.getByRole("button", { name: "+ Add subtask" }).click();
  await ticket.getByPlaceholder("Add subtask…").fill("Part one");
  await ticket.locator('form.add-subtask-form input[type="number"]').fill("5");
  await ticket.locator('form.add-subtask-form button[type="submit"]').click();

  // Once it has a subtask, the ticket row's own estimate/color inputs go
  // away entirely (rollup rule) - only the subtask carries an estimate now.
  await expect(ticket.locator('.ticket-row input[type="number"]')).toHaveCount(0);
  await expect(ticket.locator(".subtask-row .row-input-name")).toHaveValue("Part one");
});
