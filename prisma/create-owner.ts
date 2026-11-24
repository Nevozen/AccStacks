import "dotenv/config";
import { provisionOwner } from "../src/server/owner";
import { db } from "../src/server/db";

async function main() {
  const owner = await provisionOwner({
    name: process.env.OWNER_NAME ?? "AccStacks Owner",
    email: process.env.OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
  });
  console.log(`Owner ready: ${owner.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Unable to provision owner");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
