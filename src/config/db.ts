import mongoose from "mongoose";
import { env } from "./env";
import dns from "dns";

dns.setServers(["4.4.4.4", "8.8.8.8"]);
export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
}
