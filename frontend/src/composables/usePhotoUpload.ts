import { ref } from "vue";
import { accessToken } from "./useLiffAuth";
import { ALLOWED_QUANTITIES } from "./usePricing";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export type PaperSize = "4x6" | "polaroid_3x3";

export interface UploadItem {
  paperSize: PaperSize;
  quantity: number;
}

export function usePhotoUpload() {
  const isUploading = ref(false);
  const uploadError = ref<string | null>(null);

  async function uploadPhotos(files: File[], items: UploadItem[]) {
    // Checking Access Token before doing anything else
    if (!accessToken.value) {
      uploadError.value =
        "Access Token Error, Please check LIFF login state or Access Token isn't found";
      return null;
    }

    // Checking files selected by user
    if (files.length === 0) {
      uploadError.value = "File Error, Please select at least one photo";
      return null;
    }

    // Checking items selected by user
    if (items.length === 0) {
      uploadError.value = "Item Error, Please select at least one paper size and quantity";
      return null;
    }

    for (const item of items) {
      if (!ALLOWED_QUANTITIES.includes(item.quantity)) {
        uploadError.value = `Quantity Error, ${item.quantity} is not an allowed tier`;
        return null;
      }
    }

    isUploading.value = true;
    uploadError.value = null;

    const formData = new FormData();
    // Same field name "file" repeated once per photo, backend reads this as an array
    files.forEach((file) => formData.append("file", file));
    formData.append("items", JSON.stringify(items));

    try {
      const res = await fetch(`${API_BASE}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken.value}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Upload Error, Server responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      uploadError.value = err instanceof Error ? err.message : "Unknown upload error";
      return null;
    } finally {
      isUploading.value = false;
    }
  }

  return { isUploading, uploadError, uploadPhotos };
}