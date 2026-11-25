import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { testDb } from "../integration/client";
import { createE2eOwner, signIn } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("complete account trading lifecycle", async ({ page }) => {
  const owner = await createE2eOwner();
  const accountName = `E2E Mythic ${randomUUID().slice(0, 8)}`;
  await signIn(page, owner);

  await page.goto("/stocks");
  await expect(page.getByText("Add your first account")).toBeVisible();
  await page.getByRole("button", { name: "Add Account", exact: true }).first().click();
  const accountDialog = page.getByRole("dialog", { name: "Add account" });
  await accountDialog.getByLabel("Game name").fill("wut");
  await page.getByRole("option", { name: "Wuthering Waves", exact: true }).click();
  await accountDialog.getByLabel("Account name").fill(accountName);
  await accountDialog.getByLabel("Purchase price").fill("500000");
  await accountDialog.getByLabel("Description").fill("E2E inventory account");
  const choosingFile = page.waitForEvent("filechooser");
  await accountDialog.getByRole("button", { name: "Choose picture" }).click();
  await (
    await choosingFile
  ).setFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9WlF8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(accountDialog.getByRole("button", { name: "Replace picture" })).toBeVisible();
  await accountDialog.getByRole("button", { name: "Add account", exact: true }).click();
  await expect(accountDialog).toBeHidden();
  const availableCard = page.getByTestId("account-card").filter({ hasText: accountName });
  await expect(availableCard).toContainText("AVAILABLE");
  await expect(availableCard).toContainText("WW1");
  const uploadedImage = availableCard.locator("img").first();
  await expect(uploadedImage).toBeVisible();
  const uploadedImageSrc = await uploadedImage.getAttribute("src");
  expect(uploadedImageSrc).toContain("/api/uploads/");
  expect((await page.request.get(uploadedImageSrc!)).status()).toBe(200);

  await page.getByRole("button", { name: "Account actions" }).click();
  await page.getByRole("menuitem", { name: "Create listing" }).click();
  const firstListingDialog = page.getByRole("dialog", { name: "Create new listing" });
  await firstListingDialog.getByLabel("Marketplace name").fill("Instagram");
  await firstListingDialog.getByLabel("Listing price").fill("800000");
  await firstListingDialog.getByRole("button", { name: "Create listing", exact: true }).click();
  await expect(firstListingDialog).toBeHidden();
  const singleListingCard = page.getByTestId("listing-card").filter({ hasText: "Instagram" });
  await expect(singleListingCard).toBeVisible();
  await expect(singleListingCard).not.toContainText("Show all listings");

  await page.getByRole("button", { name: "Create New Listing", exact: true }).click();
  const secondListingDialog = page.getByRole("dialog", { name: "Create new listing" });
  await secondListingDialog.getByLabel("Select account").click();
  await page.getByPlaceholder("Search name, game, or ID").fill(accountName);
  await page.getByRole("option").filter({ hasText: accountName }).click();
  await secondListingDialog.getByLabel("Marketplace name").fill("Facebook");
  await secondListingDialog.getByLabel("Listing price").fill("850000");
  await secondListingDialog.getByRole("button", { name: "Create listing", exact: true }).click();
  await expect(secondListingDialog).toBeHidden();
  const groupCard = page.getByTestId("listing-account-card");
  await expect(groupCard).toHaveCount(1);
  await expect(groupCard).toContainText("2 active");
  await groupCard.getByRole("button", { name: "Show all listings (2)" }).click();
  await expect(page.getByTestId("listing-group-expansion")).toBeVisible();
  await expect(page.getByTestId("listing-group-expansion")).toHaveClass(
    /listing-unstack-container/,
  );
  await expect(page.getByTestId("listings-grid").locator("> :first-child")).toHaveAttribute(
    "data-testid",
    "listing-group-expansion",
  );
  await expect(page.getByTestId("listing-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Close all" }).click();
  await expect(page.getByTestId("listing-group-expansion")).toHaveCount(0);
  await expect(page.getByTestId("listing-card")).toHaveCount(0);
  await page
    .getByTestId("listing-account-card")
    .getByRole("button", { name: "Show all listings (2)" })
    .click();

  const instagramCard = page.getByTestId("listing-card").filter({ hasText: "Instagram" });
  await expect(instagramCard).toContainText("WW1-1");
  await expect(page.getByTestId("listing-card").filter({ hasText: "Facebook" })).toContainText(
    "WW1-2",
  );
  await instagramCard.getByRole("button", { name: "Edit", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit listing" });
  await editDialog.getByLabel("Listing price").fill("825000");
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).toBeHidden();

  await page
    .getByTestId("listing-account-card")
    .getByRole("button", { name: "Show all listings (2)" })
    .click();
  const editedInstagramCard = page.getByTestId("listing-card").filter({ hasText: "Instagram" });
  await expect(editedInstagramCard).toContainText("Rp825.000");
  await editedInstagramCard.getByRole("button", { name: "Mark as Sold" }).click();
  const saleDialog = page.getByRole("dialog", { name: "Confirm account sale" });
  await saleDialog.getByLabel("Actual selling price").fill("800000");
  await saleDialog.getByRole("button", { name: "Add expense" }).click();
  await saleDialog.getByLabel("Expense 1 description").fill("Marketplace fee");
  await saleDialog.getByLabel("Expense 1 amount").fill("20000");
  await saleDialog.getByRole("button", { name: "Add expense" }).click();
  await saleDialog.getByLabel("Expense 2 description").fill("Middleman fee");
  await saleDialog.getByLabel("Expense 2 amount").fill("5000");
  await expect(saleDialog).toContainText("Rp275.000");
  await saleDialog.getByRole("button", { name: "Confirm sale" }).click();
  await expect(saleDialog).toBeHidden();
  await expect(page.getByText("No active listings", { exact: true })).toBeVisible();

  await page.goto("/stocks?category=sold");
  const soldCard = page.getByTestId("account-card").filter({ hasText: accountName });
  await expect(soldCard).toContainText("SOLD");
  await expect(soldCard.getByRole("button", { name: "Account actions" })).toHaveCount(0);
  await soldCard.getByRole("button", { name: "View", exact: true }).click();
  const detailSheet = page.getByRole("dialog", { name: "Account details" });
  await expect(detailSheet).toContainText("Rp275.000");
  await expect(detailSheet).toContainText("Marketplace fee");
  await expect(detailSheet).toContainText("Middleman fee");
  await expect(detailSheet).toContainText("Listing history (2)");
  await expect(detailSheet).toContainText("CLOSED");
  await detailSheet.getByRole("button", { name: "Close" }).click();

  await page.goto("/overview");
  await expect(page.getByText("Total Revenue", { exact: true })).toBeVisible();
  await expect(page.getByText("Rp800.000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Rp275.000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Owner Capital", { exact: true })).toBeVisible();
  await expect(page.getByText("Rp1.275.000", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: accountName })).toBeVisible();

  await page.getByRole("button", { name: /Search accounts/ }).click();
  const searchDialog = page.getByRole("dialog", { name: "Global account search" });
  await searchDialog.getByPlaceholder("Search account name, game, or ID…").fill(accountName);
  await searchDialog.getByRole("option").filter({ hasText: accountName }).click();
  await expect(page).toHaveURL(/\/stocks\?account=/);
  await expect(page.getByRole("dialog", { name: "Account details" })).toContainText(accountName);
  await page
    .getByRole("dialog", { name: "Account details" })
    .getByRole("button", { name: "Close" })
    .click();

  const exportResponse = await page.request.get("/api/export/sales");
  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()["content-type"]).toContain("text/csv");
  const csv = await exportResponse.text();
  expect(csv).toContain(accountName);
  expect(csv).toContain("275000");
});
