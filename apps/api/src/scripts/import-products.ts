import { connectDb } from "../config/db.js";
import { importProducts } from "../services/importer.js";

async function main() {
  await connectDb();
  const result = await importProducts();
  console.log(`Created: ${result.created}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Skipped: ${result.skipped}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
