import { expect, test } from "@playwright/test";
import { testDb } from "../integration/client";
import { createE2eOwner, signIn } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("filters, paginates, and edits stock without losing the current view", async ({ page }) => {
  const owner = await createE2eOwner();
  await testDb.account.createMany({
    data: Array.from({ length: 13 }, (_, index) => ({
      ownerId: owner.user.id,
      accountCode: `V-TEST-${index}`,
      accountName: `Reserve ${String(index).padStart(2, "0")}`,
      gameName: "Valorant",
      gameNameNormalized: "valorant",
      purchasePrice: 275_000n,
      purchaseDate: new Date("2025-08-01T00:00:00Z"),
    })),
  });
  await signIn(page, owner);
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Stocks" })
    .click();
  const pagination = page.getByRole("navigation", { name: "Pagination" });
  await pagination.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("account-card")).toHaveCount(1);
  await expect(page.getByTestId("account-card")).toContainText("Reserve 12");
  await page.getByRole("button", { name: "Table view" }).click();
  const table = page.getByRole("region", { name: "Stock accounts" });
  await expect(table.getByRole("row", { name: /Reserve 12/ })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search stocks" });
  await search.fill("Reserve 03");
  await page.getByRole("button", { name: "Apply search stocks" }).click();
  await expect(table.getByRole("row")).toHaveCount(2);
  await table.getByRole("button", { name: "Account actions" }).click();
  await page.getByRole("menuitem", { name: "Edit account" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit account" });
  await dialog.getByLabel("Account name").fill("Reserve 03 Premium");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(table.getByRole("row", { name: /Reserve 03 Premium/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Table view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("updates owner capital through the settings link and supports zero", async ({ page }) => {
  const owner = await createE2eOwner();
  await signIn(page, owner);
  await page.getByRole("link", { name: "Manage capital" }).click();
  await expect(page).toHaveURL(/\/settings#capital/);
  await page.getByLabel("Owner capital (IDR)").fill("0");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect
    .poll(
      async () =>
        (await testDb.userSettings.findUnique({ where: { userId: owner.user.id } }))?.capital,
    )
    .toBe(0n);
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Overview" })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Financial overview" })
      .getByText("Rp0", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Set your starting capital" })).toHaveCount(0);
});
