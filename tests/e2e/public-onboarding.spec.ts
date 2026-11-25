import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { testDb } from "../integration/client";
import { createAccountAndListingFixture, createE2eOwner } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("shows the public landing page and account links on mobile in light mode by default", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Stack accounts. Know your profit." }),
  ).toBeVisible();
  await expect(page.getByText("Sample transaction")).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.getByRole("link", { name: "See how it works" }).click();
  await expect(page).toHaveURL("/#workflow");
  await expect(
    page.getByRole("heading", { name: "One account. One clear trail." }),
  ).toBeInViewport();

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("link", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to AccStacks" })).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create your AccStacks account" })).toBeVisible();
});

test("registers, signs in, and opens an isolated workspace with starting capital setup", async ({
  page,
}) => {
  const owner = await createE2eOwner();
  const otherAccount = await createAccountAndListingFixture(owner.user.id);
  const email = `signup-${randomUUID()}@example.invalid`;
  const password = `local-test-password-${randomUUID()}`;

  await page.goto("/");
  await page
    .getByRole("region", { name: "Stack accounts. Know your profit." })
    .getByRole("link", { name: "Create account" })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("New Reseller");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill("a-different-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);

  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/overview");
  const capital = page.getByRole("dialog", { name: "Set your starting capital" });
  await capital.getByLabel("Starting capital (IDR)").fill("0");
  await capital.getByRole("button", { name: "Save starting capital" }).click();
  await expect(capital).toBeHidden();

  const exportResponse = await page.request.get("/api/export/accounts");
  expect(exportResponse.ok()).toBe(true);
  expect(await exportResponse.text()).not.toContain(otherAccount.accountCode);
  await page.goto("/register");
  await expect(page).toHaveURL("/overview");
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Open workspace" }).click();
  await expect(page).toHaveURL("/overview");

  await page.getByRole("button", { name: /New Reseller/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/stocks?category=sold");
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/stocks?category=sold");
});
