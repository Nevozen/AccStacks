import { afterAll, describe, expect, it } from "vitest";
import { createAccount } from "@/services/accounts";
import { readAccountImage, uploadAccountImage } from "@/services/images";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9WlF8AAAAASUVORK5CYII=",
  "base64",
);

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("private account images", () => {
  it("stores and reads images only for their owner", async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const account = await createAccount(owner.id, {
      gameName: "Wuthering Waves",
      accountName: "Private Image Account",
      description: "",
      imageUrl: "",
      purchasePrice: "500000",
      purchaseDate: "2026-11-01",
      purchasedFrom: "",
      notes: "",
    });
    const imageUrl = await uploadAccountImage(
      owner.id,
      account.id,
      new File([png], "pixel.png", { type: "image/png" }),
    );

    expect(imageUrl).toMatch(/^\/api\/uploads\/.+\.png$/);
    const image = await readAccountImage(owner.id, imageUrl.slice("/api/uploads/".length));
    expect(image?.contentType).toBe("image/png");
    expect(image?.bytes.length).toBe(png.length);
    expect(await readAccountImage(otherUser.id, imageUrl.slice("/api/uploads/".length))).toBeNull();
  });

  it("rejects files with invalid content", async () => {
    const owner = await createTestUser();
    const account = await createAccount(owner.id, {
      gameName: "Wuthering Waves",
      accountName: "Invalid Image Account",
      description: "",
      imageUrl: "",
      purchasePrice: "500000",
      purchaseDate: "2026-11-01",
      purchasedFrom: "",
      notes: "",
    });
    await expect(
      uploadAccountImage(
        owner.id,
        account.id,
        new File(["not a real png"], "fake.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("Only valid");
  });
});
