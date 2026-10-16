import { useLanguage } from "../../i18n/useLanguage";

/* Mirrors the API's limits so most mistakes are caught before uploading. */
const MB = 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/aac", "audio/x-aac", "video/webm"];
const LIMIT = { image: 5 * MB, audio: 10 * MB };

export const baseType = (type) => String(type || "").split(";")[0].trim().toLowerCase();

/** Translated reason a file cannot be attached, or "" when it can. */
export function useFileCheck() {
  const { t } = useLanguage();
  return (file, kind) => {
    const allowed = kind === "image" ? IMAGE_TYPES : AUDIO_TYPES;
    if (!allowed.includes(baseType(file.type))) return t("attach.wrongType", { name: file.name });
    if (file.size > LIMIT[kind]) return t("attach.tooLarge", { name: file.name });
    return "";
  };
}

/**
 * Picked attachments: `images` is a list and `audio` one entry or null, each
 * `{ file, url }` where `url` is a local preview made when the file was picked.
 */
export const EMPTY_ATTACHMENTS = { images: [], audio: null };

export const withPreview = (file) => ({ file, url: URL.createObjectURL(file) });

/** Frees the local previews once the attachments are sent or discarded. */
export function releaseAttachments(attachments) {
  [...attachments.images, attachments.audio].forEach((entry) => entry && URL.revokeObjectURL(entry.url));
}

/** Adds picked attachments to a FormData under the field names the API expects. */
export function appendAttachments(data, attachments) {
  attachments.images.forEach((entry) => data.append("images", entry.file));
  if (attachments.audio) data.append("audio", attachments.audio.file);
  return data;
}
