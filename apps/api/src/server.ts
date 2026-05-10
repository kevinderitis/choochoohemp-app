import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { app } from "./app.js";

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
