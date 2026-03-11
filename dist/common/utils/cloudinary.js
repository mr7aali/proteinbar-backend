"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCloudinary = initializeCloudinary;
exports.normalizeImageInput = normalizeImageInput;
exports.uploadImageIfNeeded = uploadImageIfNeeded;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../../config/env");
let initialized = false;
let configured = false;
let warnedMissingConfig = false;
function normalizeDataImage(value) {
    const raw = value.trim();
    if (!raw)
        return "";
    // Backward-compatibility for malformed data URLs like "data:image/jpeg;base64AAAA..."
    if (raw.startsWith("data:image/") && raw.includes(";base64") && !raw.includes(";base64,")) {
        return raw.replace(/^([^,]*;base64)(.*)$/, "$1,$2");
    }
    return raw;
}
function isBase64DataImage(value) {
    return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}
function initializeCloudinary() {
    if (initialized)
        return;
    initialized = true;
    const hasConfig = Boolean(env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET);
    if (!hasConfig)
        return;
    cloudinary_1.v2.config({
        cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.env.CLOUDINARY_API_KEY,
        api_secret: env_1.env.CLOUDINARY_API_SECRET
    });
    configured = true;
}
function normalizeImageInput(value) {
    return normalizeDataImage(String(value ?? ""));
}
async function uploadImageIfNeeded(value, options = {}) {
    const normalized = normalizeImageInput(value);
    if (!normalized)
        return "";
    if (!isBase64DataImage(normalized))
        return normalized;
    if (!initialized)
        initializeCloudinary();
    if (!configured) {
        if (!warnedMissingConfig) {
            warnedMissingConfig = true;
            console.warn("Cloudinary is not configured. Storing image value as-is.");
        }
        return normalized;
    }
    try {
        const uploaded = await cloudinary_1.v2.uploader.upload(normalized, {
            folder: options.folder || env_1.env.CLOUDINARY_FOLDER || "proteinbar",
            resource_type: "image"
        });
        return String(uploaded.secure_url || uploaded.url || normalized);
    }
    catch (error) {
        console.error("Cloudinary image upload failed. Falling back to original image value.", error);
        return normalized;
    }
}
