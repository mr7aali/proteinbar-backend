"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const cloudinary_1 = require("./common/utils/cloudinary");
async function bootstrap() {
    (0, cloudinary_1.initializeCloudinary)();
    await (0, db_1.connectDb)();
    app_1.app.listen(env_1.env.PORT, () => {
        console.log(`Backend running on http://localhost:${env_1.env.PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start backend", error);
    process.exit(1);
});
