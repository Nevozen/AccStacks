import { expect, test } from "@playwright/test";
import { testDb } from "../integration/client";
import { createE2eOwner, signIn } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("records USD purchases, relistings, expenses, and losses to the cent", async ({ page }) => {
  const owner = await createE2eOwner({ currency: null, capital: null });
  await signIn(page, owner);
  const currency = page.getByRole("dialog", { name: "Choose your workspace currency" });
  await currency.getByRole("radio", { name: /US dollar/ }).check();
  await currency.getByRole("button", { name: "Continue" }).click();
  const capital = page.getByRole("dialog", { name: "Set your starting capital" });
  await capital.getByLabel("Starting capital (USD)").fill("100.25");
  await capital.getByRole("button", { name: "Save starting capital" }).click();
  await expect(capital).toBeHidden();
  await expect(
    page.getByRole("region", { name: "Financial overview" }).getByText("$100.25").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Add Account" }).click();
  const account = page.getByRole("dialog", { name: "Add account" });
  await account.getByLabel("Game name").fill("Wuthering Waves");
  await page.getByRole("option", { name: "Wuthering Waves", exact: true }).click();
  await account.getByLabel("Account name").fill("Dollar fixture");
  await account.getByLabel("Purchase price").fill("20.10");
  await account.getByRole("button", { name: "Add account", exact: true }).click();
  await expect(account).toBeHidden();
  await expect(page.getByTestId("account-card").getByText("$20.10")).toBeVisible();
  await page.getByRole("button", { name: "Account actions" }).click();
  await page.getByRole("menuitem", { name: "Create listing" }).click();

  const listing = page.getByRole("dialog", { name: "Create new listing" });
  await listing.getByLabel("Marketplace name").fill("Itemku");
  await listing.getByLabel("Listing price").fill("30.00");
  await expect(listing.getByText("$9.90")).toBeVisible();
  await listing.getByRole("button", { name: "Create listing", exact: true }).click();
  const card = page.getByTestId("listing-card");
  await expect(card).toContainText("WW1-1");
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete listing" }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Create New Listing", exact: true }).first().click();
  await listing.getByLabel("Select account").click();
  await page.getByRole("option", { name: /Dollar fixture/ }).click();
  await listing.getByLabel("Marketplace name").fill("Instagram");
  await listing.getByLabel("Listing price").fill("29.99");
  await listing.getByRole("button", { name: "Create listing", exact: true }).click();
  await expect(card).toContainText("WW1-1");
  await expect(card).not.toContainText("WW1-2");

  const inventoryCsv = await (await page.request.get("/api/export/accounts")).text();
  expect(inventoryCsv).toContain("Purchase Price (USD)");
  expect(inventoryCsv).toContain(",20.10,");
  const listingCsv = await (await page.request.get("/api/export/listings")).text();
  expect(listingCsv).toContain("Listing Price (USD)");
  expect(listingCsv).toContain(",20.10,29.99,9.89,");

  await card.getByRole("button", { name: "Mark as Sold" }).click();
  const sale = page.getByRole("dialog", { name: "Confirm account sale" });
  await expect(sale.getByLabel("Actual selling price")).toHaveValue("29.99");
  await sale.getByLabel("Actual selling price").fill("19.99");
  await sale.getByRole("button", { name: "Add expense" }).click();
  await sale.getByLabel("Expense 1 description").fill("Marketplace fee");
  await sale.getByLabel("Expense 1 amount").fill("0.25");
  await expect(sale.getByText("-$0.36", { exact: true })).toBeVisible();
  await sale.getByRole("checkbox").check();
  await sale.getByRole("button", { name: "Confirm sale" }).click();
  await expect(sale).toBeHidden();
  await page.goto("/overview");
  await expect(page.getByRole("region", { name: "Profit overview" })).toContainText("-$0.36");
  await expect(page.getByRole("region", { name: "Financial overview" })).toContainText("$99.89");
  await expect(page.getByRole("dialog", { name: "Choose your workspace currency" })).toHaveCount(0);

  const summary = await (await page.request.get("/api/export/financial-summary")).text();
  expect(summary).toContain("Estimated Equity (USD),99.89,");
  expect(summary).toContain("Net Profit (USD),-0.36,");
  const sales = await (await page.request.get("/api/export/sales")).text();
  expect(sales).toContain("Net Profit (USD)");
  expect(sales).toContain(",20.10,29.99,19.99,0.25,-0.36,");
});
