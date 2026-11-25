import { expect, test } from "@playwright/test";
import packageJson from "../../package.json" with { type: "json" };
import { testDb } from "../integration/client";
import { createAccountAndListingFixture, createE2eOwner, signIn } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("requires starting capital once and displays the capital position", async ({ page }) => {
  const owner = await createE2eOwner({ capital: null });
  await signIn(page, owner);
  const dialog = page.getByRole("dialog", { name: "Set your starting capital" });
  await expect(dialog.getByText("Set your starting capital")).toBeVisible();
  await dialog.getByLabel("Starting capital (IDR)").fill("1000000");
  await dialog.getByRole("button", { name: "Save starting capital" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Owner Capital", { exact: true })).toBeVisible();
  await expect(page.getByText("Estimated Equity", { exact: true })).toBeVisible();
  await expect(page.getByText("Rp1.000.000", { exact: true }).first()).toBeVisible();
});

test("redirects unauthenticated users and protects private APIs", async ({ page, request }) => {
  await page.goto("/stocks");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in to AccStacks" })).toBeVisible();
  await page.goto("/analytics");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fanalytics/);
  expect((await request.get("/api/export/accounts")).status()).toBe(401);
  expect((await request.get("/api/accounts/eligible")).status()).toBe(401);
  expect((await request.get("/api/search/accounts?q=test")).status()).toBe(401);
});

test("shows validation errors, stays light, and puts the version only in Settings", async ({
  page,
}) => {
  const owner = await createE2eOwner();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("accstacks-theme", "dark"));
  await signIn(page, owner);
  await page.goto("/stocks?add=1");
  const dialog = page.getByRole("dialog", { name: "Add account" });
  await dialog.getByRole("button", { name: "Add account", exact: true }).click();
  await expect(dialog.getByText("Game name is required")).toBeVisible();
  await expect(dialog.getByText("Account name is required")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.getByRole("button", { name: "Theme", exact: true })).toHaveCount(0);
  const version = page.getByText(`v${packageJson.version}`, { exact: true });
  await expect(version).toHaveCount(0);
  await page.goto("/settings");
  await expect(version).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Theme" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog").getByRole("link", { name: "Stocks" })).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Stocks" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});

test("allows a loss sale with explicit confirmation and prevents duplicate submission", async ({
  page,
}) => {
  const owner = await createE2eOwner();
  await createAccountAndListingFixture(owner.user.id);
  await signIn(page, owner);
  await page.goto("/listings");
  await expect(page.getByRole("button", { name: "Show all listings (1)" })).toHaveCount(0);
  await page.getByTestId("listing-card").getByRole("button", { name: "Mark as Sold" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm account sale" });
  await dialog.getByLabel("Actual selling price").fill("400000");
  await dialog.getByRole("button", { name: "Add expense" }).click();
  await dialog.getByLabel("Expense 1 description").fill("Marketplace fee");
  await dialog.getByLabel("Expense 1 amount").fill("25000");
  await expect(dialog.getByText(/This transaction results in a loss/)).toBeVisible();
  await dialog.getByRole("checkbox").check();
  const confirmButton = dialog.getByRole("button", { name: "Confirm sale" });
  await confirmButton.click();
  await expect(confirmButton).toBeDisabled();
  await expect(dialog).toBeHidden();
  await page.goto("/stocks?category=sold");
  await expect(page.getByTestId("account-card")).toHaveCount(1);
  await expect(page.getByTestId("account-card")).toContainText("SOLD");
});
