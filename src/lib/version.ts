import { invoke } from "@tauri-apps/api/core";

/**
 * Get the current application version from Tauri
 */
export const getAppVersion = async (): Promise<string> => {
  try {
    const version = await invoke<string>("get_app_version");
    return version;
  } catch (error) {
    console.error("获取应用版本失败:", error);
    return "未知";
  }
};
