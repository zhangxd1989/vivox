import { STORAGE_KEYS } from "@/config";
import { TYPE_PROVIDER } from "@/types";

export function getCustomAiProviders(): TYPE_PROVIDER[] {
  try {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_AI_PROVIDERS);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p: any) => p.id && p.isCustom && typeof p.curl === "string"
    );
  } catch (error) {
    console.error("获取自定义 AI 提供商出错:", error);
    return [];
  }
}

export function setCustomAiProviders(providers: TYPE_PROVIDER[]): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_AI_PROVIDERS,
      JSON.stringify(providers)
    );
  } catch (error) {
    console.error("设置自定义 AI 提供商出错:", error);
  }
}

export function addCustomAiProvider(
  newProvider: Omit<TYPE_PROVIDER, "id" | "isCustom">
): TYPE_PROVIDER | null {
  try {
    const providers = getCustomAiProviders();
    const id = `custom-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const provider: TYPE_PROVIDER = {
      ...newProvider,
      id,
      isCustom: true,
    };
    providers.push(provider);
    setCustomAiProviders(providers);
    return provider;
  } catch (error) {
    console.error("添加自定义 AI 提供商出错:", error);
    return null;
  }
}

export function updateCustomAiProvider(
  id: string,
  updates: Partial<TYPE_PROVIDER>
): boolean {
  try {
    const providers = getCustomAiProviders();
    const index = providers.findIndex((p) => p.id === id && p.isCustom);
    if (index === -1) return false;
    providers[index] = { ...providers[index], ...updates };
    setCustomAiProviders(providers);
    return true;
  } catch (error) {
    console.error("更新自定义 AI 提供商出错:", error);
    return false;
  }
}

export function removeCustomAiProvider(id: string): boolean {
  try {
    const providers = getCustomAiProviders();
    const filtered = providers.filter((p) => p.id !== id);
    if (filtered.length === providers.length) return false; // No removal happened
    setCustomAiProviders(filtered);
    return true;
  } catch (error) {
    console.error("移除自定义 AI 提供商出错:", error);
    return false;
  }
}
