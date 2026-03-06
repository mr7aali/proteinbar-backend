import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function bootstrap() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
