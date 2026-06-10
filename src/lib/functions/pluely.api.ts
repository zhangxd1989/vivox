import { invoke } from "@tauri-apps/api/core";
import { safeLocalStorage } from "../storage";
import { STORAGE_KEYS } from "@/config";

// Helper function to check if Vivox API should be used
export async function shouldUsePluelyAPI(): Promise<boolean> {
  try {
    // Check if Vivox API is enabled in localStorage
    const pluelyApiEnabled =
      safeLocalStorage.getItem(STORAGE_KEYS.PLUELY_API_ENABLED) === "true";
    if (!pluelyApiEnabled) return false;

    // Check if license is available
    const hasLicense = await invoke<boolean>("check_license_status");
    return hasLicense;
  } catch (error) {
    console.warn("检查 Vivox API 可用性失败:", error);
    return false;
  }
}
