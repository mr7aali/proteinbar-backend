import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { initializeCloudinary } from "./common/utils/cloudinary";

async function bootstrap() {
  initializeCloudinary();
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
