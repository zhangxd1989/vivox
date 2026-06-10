import React, { useState, useEffect, useRef } from "react";
import { KeyIcon, TrashIcon, LoaderIcon, ChevronDown } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "@/contexts";
import {
  Button,
  Header,
  Input,
  Switch,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";

interface ActivationResponse {
  activated: boolean;
  error?: string;
  license_key?: string;
  instance?: {
    id: string;
    name: string;
    created_at: string;
  };
  is_dev_license?: boolean;
}

interface StorageResult {
  license_key?: string;
  instance_id?: string;
  selected_pluely_model?: string;
}

interface Model {
  provider: string;
  name: string;
  id: string;
  model: string;
  description: string;
  modality: string;
  isAvailable: boolean;
}

const LICENSE_KEY_STORAGE_KEY = "pluely_license_key";
const INSTANCE_ID_STORAGE_KEY = "pluely_instance_id";
const SELECTED_PLUELY_MODEL_STORAGE_KEY = "selected_pluely_model";

export const PluelyApiSetup = () => {
  const {
    pluelyApiEnabled,
    setPluelyApiEnabled,
    hasActiveLicense,
    setHasActiveLicense,
    getActiveLicenseStatus,
    setSupportsImages,
  } = useApp();

  const [licenseKey, setLicenseKey] = useState("");
  const [storedLicenseKey, setStoredLicenseKey] = useState<string | null>(null);
  const [maskedLicenseKey, setMaskedLicenseKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const fetchInitiated = useRef(false);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Load license status on component mount
  useEffect(() => {
    loadLicenseStatus();
    if (!fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchModels();
    }
  }, []);

  // Scroll to top when search value changes
  useEffect(() => {
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0;
    }
  }, [searchValue]);

  const fetchModels = async () => {
    setIsModelsLoading(true);
    try {
      const fetchedModels = await invoke<Model[]>("fetch_models");
      setModels(fetchedModels);
    } catch (error) {
      console.error("获取模型失败:", error);
    } finally {
      setIsModelsLoading(false);
    }
  };

  const loadLicenseStatus = async () => {
    try {
      // Get all stored data in one call
      const storage = await invoke<StorageResult>("secure_storage_get");

      if (storage.license_key) {
        setStoredLicenseKey(storage.license_key);

        // Get masked version from Tauri command
        const masked = await invoke<string>("mask_license_key_cmd", {
          licenseKey: storage.license_key,
        });
        setMaskedLicenseKey(masked);
      } else {
        setStoredLicenseKey(null);
        setMaskedLicenseKey(null);
      }

      if (storage.selected_pluely_model) {
        try {
          const storedModel = JSON.parse(storage.selected_pluely_model);
          setSelectedModel(storedModel);
        } catch (e) {
          console.error("解析已存储模型失败:", e);
          setSelectedModel(null);
        }
      } else {
        setSelectedModel(null);
      }
    } catch (err) {
      console.error("加载许可证状态失败:", err);
      // If we can't read from storage, assume no license is stored
      setStoredLicenseKey(null);
      setMaskedLicenseKey(null);
      setSelectedModel(null);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setError("请输入许可证密钥");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response: ActivationResponse = await invoke(
        "activate_license_api",
        {
          licenseKey: licenseKey.trim(),
        }
      );

      if (response.activated && response.instance) {
        // Store the license data securely in one call
        await invoke("secure_storage_save", {
          items: [
            {
              key: LICENSE_KEY_STORAGE_KEY,
              value: licenseKey.trim(),
            },
            {
              key: INSTANCE_ID_STORAGE_KEY,
              value: response.instance.id,
            },
          ],
        });

        setSuccess("许可证激活成功!");
        setLicenseKey(""); // Clear the input

        // Auto-enable Pluely API when license is activated
        if (!response?.is_dev_license) {
          setPluelyApiEnabled(true);
        }

        await loadLicenseStatus(); // Reload status
        await fetchModels();
        await getActiveLicenseStatus();
      } else {
        setError(response.error || "许可证激活失败");
      }
    } catch (err) {
      console.error("许可证激活失败:", err);
      setError(typeof err === "string" ? err : "许可证激活失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLicense = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setHasActiveLicense(false);
    try {
      // Remove all license data from secure storage in one call
      await invoke("secure_storage_remove", {
        keys: [
          LICENSE_KEY_STORAGE_KEY,
          INSTANCE_ID_STORAGE_KEY,
          SELECTED_PLUELY_MODEL_STORAGE_KEY,
        ],
      });

      setSuccess("许可证移除成功!");

      // Disable Pluely API when license is removed
      setPluelyApiEnabled(false);

      await fetchModels();
      await loadLicenseStatus(); // Reload status
    } catch (err) {
      console.error("移除许可证失败:", err);
      setError("移除许可证失败");
    } finally {
      setIsLoading(false);
      await invoke("deactivate_license_api");
    }
  };

  const handleModelSelect = async (model: Model) => {
    setSelectedModel(model);
    setIsPopoverOpen(false); // Close popover when model is selected
    setSearchValue(""); // Reset search when model is selected

    // Update supportsImages based on the selected model
    if (pluelyApiEnabled) {
      const hasImageSupport = model.modality?.includes("image") ?? false;
      setSupportsImages(hasImageSupport);
    }

    try {
      await invoke("secure_storage_save", {
        items: [
          {
            key: SELECTED_PLUELY_MODEL_STORAGE_KEY,
            value: JSON.stringify(model),
          },
        ],
      });
    } catch (error) {
      console.error("保存模型选择失败:", error);
      setError("保存模型选择失败。");
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setSearchValue(""); // Reset search when popover opens
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !storedLicenseKey) {
      handleActivateLicense();
    }
  };

  const providers = [...new Set(models.map((model) => model.provider))];
  const capitalizedProviders = providers.map(
    (p) => p.charAt(0).toUpperCase() + p.slice(1)
  );

  let providerList;
  if (capitalizedProviders.length === 0) {
    providerList = null;
  } else if (capitalizedProviders.length === 1) {
    providerList = capitalizedProviders[0];
  } else if (capitalizedProviders.length === 2) {
    providerList = capitalizedProviders.join(" and ");
  } else {
    const lastProvider = capitalizedProviders.pop();
    providerList = `${capitalizedProviders.join(", ")}, and ${lastProvider}`;
  }

  const title = isModelsLoading
    ? "加载模型中..."
    : `Pluely 支持 ${models?.length} 个模型`;

  const description = isModelsLoading
    ? "正在获取支持的模型列表..."
    : providerList
    ? `访问来自 ${providerList} 等提供商的顶级模型，并选择较小的模型以获得更快的响应。`
    : "探索 Pluely 支持的所有模型。";

  return (
    <div id="pluely-api" className="space-y-3 -mt-2">
      <div className="space-y-2 pt-2">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-400">
              {success}
            </p>
          </div>
        )}
        <Header title={title} description={description} />
        <Popover
          modal={true}
          open={isPopoverOpen}
          onOpenChange={handlePopoverOpenChange}
        >
          <PopoverTrigger
            asChild
            disabled={isModelsLoading}
            className="cursor-pointer flex justify-start"
          >
            <Button
              variant="outline"
              className="h-11 text-start shadow-none w-full"
            >
              {selectedModel ? selectedModel.name : "选择专业模型"}{" "}
              <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="w-[calc(100vw-20rem)] p-0 rounded-xl overflow-hidden"
          >
            <Command shouldFilter={true}>
              <CommandInput
                placeholder="选择模型..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList
                ref={commandListRef}
                className="rounded-xl h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30"
              >
                <CommandEmpty>
                  未找到模型，请稍后重试。
                </CommandEmpty>
                <CommandGroup className="h-full rounded-xl">
                  {models.map((model, index) => (
                    <CommandItem
                      disabled={!model?.isAvailable}
                      key={`${model?.id}-${index}`}
                      className="cursor-pointer"
                      onSelect={() => handleModelSelect(model)}
                    >
                      <div className="flex flex-col">
                        <div className="flex flex-row items-center gap-2">
                          <p className="text-sm font-medium">{`${model?.name}`}</p>
                          <div className="text-xs border border-input/50 bg-muted/50 rounded-full px-2">
                            {model?.modality}
                          </div>
                          {model?.isAvailable ? (
                            <div className="text-xs text-orange-600 bg-white rounded-full px-2">
                              {model?.provider}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600 bg-white rounded-full px-2">
                              不可用
                            </div>
                          )}
                        </div>
                        <p
                          className="text-sm text-muted-foreground line-clamp-2"
                          title={model?.description}
                        >
                          {model?.description}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* this model only supports these modalities */}
        {selectedModel && (
          <div className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-md">
            {selectedModel.modality?.includes("image")
              ? "此模型接受文本和图片作为输入，并生成文本回复。"
              : "⚠️ 此模型仅接受文本输入。请勿上传图片 - 它们无法在此模型上使用。如需图片支持，请使用文本+图片→文本模型。"}
          </div>
        )}
        {/* License Key Input or Display */}
        <div className="space-y-2">
          {!storedLicenseKey ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">许可证密钥</label>
                <p className="text-sm font-medium text-muted-foreground">
                  完成购买后，您将通过电子邮件收到许可证密钥。
                  将其粘贴到下方以激活。
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="输入您的许可证密钥 (例如: 38b1460a-5104-4067-a91d-77b872934d51)"
                  value={licenseKey}
                  onChange={(value) => {
                    setLicenseKey(
                      typeof value === "string" ? value : value.target.value
                    );
                    setError(null); // Clear error when user types
                    setSuccess(null); // Clear success when user types
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
                />
                <Button
                  onClick={handleActivateLicense}
                  disabled={isLoading || !licenseKey.trim()}
                  size="icon"
                  className="shrink-0 h-11 w-11"
                  title="激活许可证"
                >
                  {isLoading ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <label className="text-xs lg:text-sm font-medium">
                当前许可证
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={maskedLicenseKey || ""}
                  disabled={true}
                  className="flex-1 h-11 border-1 border-input/50 bg-muted/50"
                />
                <Button
                  onClick={handleRemoveLicense}
                  disabled={isLoading}
                  size="icon"
                  variant="destructive"
                  className="shrink-0 h-11 w-11"
                  title="移除许可证"
                >
                  {isLoading ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {storedLicenseKey ? (
                <div className="-mt-1">
                  <p className="text-sm font-medium text-muted-foreground select-auto">
                    如需帮助或协助，请联系 support@pluely.com
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Header
          title={`${pluelyApiEnabled ? "禁用" : "启用"} Pluely API`}
          description={
            storedLicenseKey
              ? pluelyApiEnabled
                ? "使用所有 Pluely API 进行音频和聊天。"
                : "使用您自己的 AI 提供商进行音频和聊天。"
              : "需要有效许可证才能启用 Pluely API，或者您可以使用自己的 AI 提供商和 STT 提供商。"
          }
        />
        <Switch
          checked={pluelyApiEnabled}
          onCheckedChange={setPluelyApiEnabled}
          disabled={!storedLicenseKey || !hasActiveLicense} // Disable if no license is stored
        />
      </div>
    </div>
  );
};
