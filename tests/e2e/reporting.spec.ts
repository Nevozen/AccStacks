import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createAccount } from "@/services/accounts";
import { createListing } from "@/services/listings";
import { confirmSale } from "@/services/sales";
import { db } from "@/server/db";
import { testDb } from "../integration/client";
import { createE2eOwner, signIn } from "./helpers";

test.afterAll(() => Promise.all([db.$disconnect(), testDb.$disconnect()]));

test("keeps an empty workspace compact with no fabricated comparisons", async ({ page }) => {
  await signIn(page, await createE2eOwner());
  await expect(page.getByRole("region", { name: "Financial overview" })).toContainText(
    "Rp1.000.000",
  );
  await expect(page.getByRole("region", { name: "Profit overview" })).toContainText(
    "No prior-period baseline",
  );
  await expect(page.getByRole("region", { name: "Sales performance" })).toContainText(
    "No completed sales",
  );
  await expect(page.locator(".recharts-surface")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Add Account" })).toBeVisible();

  await page.getByRole("button", { name: /Reporting period:/ }).click();
  const picker = page.getByRole("dialog", { name: "Reporting period" });
  await picker.getByRole("button", { name: "Custom range" }).click();
  await picker.getByLabel("Start date").fill("2025-06-02");
  await picker.getByLabel("End date").fill("2025-06-01");
  await picker.getByRole("button", { name: "Apply dates" }).click();
  await expect(picker.getByRole("alert")).toContainText("End date must be on or after");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Reporting period:/ })).toBeFocused();
});

test("separates realized results from current inventory across reports", async ({ page }) => {
  const owner = await createE2eOwner();

  async function stock(accountName: string, gameName: string, purchasePrice: string) {
    return createAccount(owner.user.id, {
      accountName,
      gameName,
      purchasePrice,
      purchaseDate: "2025-04-15",
    });
  }

  async function list(accountId: string, marketplace: string, listingPrice: string) {
    return createListing(owner.user.id, {
      accountId,
      marketplace,
      listingPrice,
      listedAt: "2025-04-20",
    });
  }

  async function sell(
    name: string,
    game: string,
    cost: string,
    price: string,
    fee: string,
    soldAt: string,
  ) {
    const account = await stock(name, game, cost);
    const listing = await list(account.id, "Itemku", price);
    return confirmSale(owner.user.id, {
      listingId: listing.id,
      sellingPrice: price,
      soldAt,
      expenses: fee === "0" ? [] : [{ name: "Marketplace fee", amount: fee }],
    });
  }

  await stock("Available fixture", "Apex Legends", "200000");
  const listed = await stock("Two-venue fixture", "Genshin Impact", "400000");
  await list(listed.id, "Instagram", "450000");
  await list(listed.id, "Facebook", "550000");
  await sell("Previous sale", "Genshin Impact", "400000", "600000", "0", "2025-05-20");
  await sell("Profitable sale", "Genshin Impact", "650000", "1000000", "50000", "2025-06-10");
  await sell("Loss sale", "Valorant", "250000", "100000", "20000", "2025-06-21");

  await signIn(page, owner);
  await page.getByRole("button", { name: /Reporting period:/ }).click();
  const picker = page.getByRole("dialog", { name: "Reporting period" });
  await picker.getByRole("button", { name: "Custom range" }).click();
  await picker.getByLabel("Start date").fill("2025-06-01");
  await picker.getByLabel("End date").fill("2025-06-30");
  await picker.getByRole("button", { name: "Apply dates" }).click();
  await expect(page).toHaveURL(/range=custom&from=2025-06-01&to=2025-06-30/);

  const equity = page.getByRole("region", { name: "Financial overview" });
  for (const value of ["Rp1.330.000", "Rp730.000", "Rp600.000", "Rp330.000"]) {
    await expect(equity.getByText(value, { exact: true })).toBeVisible();
  }
  const profit = page.getByRole("region", { name: "Profit overview" });
  for (const value of ["Rp1.100.000", "Rp130.000", "11.82%", "-35.00%"]) {
    await expect(profit.getByText(value, { exact: true })).toBeVisible();
  }
  const inventory = page.getByRole("region", { name: "Inventory overview" });
  await expect(inventory.getByRole("link", { name: "Listed Accounts 1" })).toBeVisible();
  await expect(inventory.getByText(/2 Active Listings/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Recent sales", exact: true }).getByRole("row"),
  ).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Previous sale" })).toHaveCount(0);
  await expect(page.locator(".recharts-surface")).toBeVisible();

  await page.getByRole("link", { name: "Game breakdown" }).click();
  await expect(page).toHaveURL(/\/analytics\?range=custom&from=2025-06-01&to=2025-06-30/);
  const pnl = page.getByRole("region", { name: "Profit and loss" });
  for (const value of ["Rp900.000", "Rp70.000", "Rp130.000", "14.44%"]) {
    await expect(pnl.getByText(value, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Inventory outlook" })).toContainText("Rp150.000");
  await expect(
    page.getByRole("region", { name: "Game profitability" }).getByRole("row", { name: /Valorant/ }),
  ).toContainText("-Rp170.000");
  await page.getByText("Monthly sales breakdown", { exact: true }).click();
  await expect(page.getByRole("row", { name: /Jun 2025/ })).toContainText("Rp1.100.000");

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Financial summary (selected period)" }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  expect(csv).toContain("Total Revenue (IDR),1100000,2025-06-01 to 2025-06-30");
  expect(csv).toContain("Estimated Unrealized Profit (IDR),150000,Current estimate");

  await page.goto("/overview?range=custom&from=2025-06-01&to=2025-06-30");
  await page.getByRole("link", { name: "View all sales" }).click();
  await expect(page.getByRole("heading", { name: "Sold Accounts" })).toBeVisible();
  const history = page.getByRole("region", { name: "Sold accounts and transaction details" });
  await expect(history.getByRole("row", { name: /Previous sale/ })).toBeVisible();
  const loss = history.getByRole("row", { name: /Loss sale/ });
  await expect(loss).toContainText("Rp250.000");
  await expect(loss).toContainText("Rp20.000");
  await expect(loss).toContainText("-Rp170.000");
  await expect(loss.getByRole("button", { name: "Account actions" })).toHaveCount(0);
});
