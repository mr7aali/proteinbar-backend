import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";

type UploadImageOptions = {
  folder?: string;
};

let initialized = false;
let configured = false;
let warnedMissingConfig = false;

function normalizeDataImage(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  // Backward-compatibility for malformed data URLs like "data:image/jpeg;base64AAAA..."
  if (raw.startsWith("data:image/") && raw.includes(";base64") && !raw.includes(";base64,")) {
    return raw.replace(/^([^,]*;base64)(.*)$/, "$1,$2");
  }

  return raw;
}

function isBase64DataImage(value: string) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

export function initializeCloudinary() {
  if (initialized) return;

  initialized = true;
  const hasConfig = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
  if (!hasConfig) return;

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
  configured = true;
}

export function normalizeImageInput(value: unknown) {
  return normalizeDataImage(String(value ?? ""));
}

export async function uploadImageIfNeeded(value: unknown, options: UploadImageOptions = {}) {
  const normalized = normalizeImageInput(value);
  if (!normalized) return "";
  if (!isBase64DataImage(normalized)) return normalized;

  if (!initialized) initializeCloudinary();
  if (!configured) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn("Cloudinary is not configured. Storing image value as-is.");
    }
    return normalized;
  }

  try {
    const uploaded = await cloudinary.uploader.upload(normalized, {
      folder: options.folder || env.CLOUDINARY_FOLDER || "proteinbar",
      resource_type: "image"
    });

    return String(uploaded.secure_url || uploaded.url || normalized);
  } catch (error) {
    console.error("Cloudinary image upload failed. Falling back to original image value.", error);
    return normalized;
  }
}
