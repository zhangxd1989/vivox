import { Button, Header, Input, Selection, TextInput } from "@/components";
import { STREAMING_STT_PROVIDERS } from "@/config";
import { invoke } from "@tauri-apps/api/core";
import { KeyIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StreamingProviderConfigProps {
  selectedSttProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  onSetSelectedSttProvider: (value: {
    provider: string;
    variables: Record<string, string>;
  }) => void;
}

export const Providers = ({
  selectedSttProvider,
  onSetSelectedSttProvider,
}: StreamingProviderConfigProps) => {
  const [savedStatus, setSavedStatus] = useState<string>("");

  // Find current provider config
  const currentProviderConfig = STREAMING_STT_PROVIDERS.find(
    (p) => p.id === selectedSttProvider?.provider
  );

  // Save provider config to Rust backend
  const saveConfig = async () => {
    if (!selectedSttProvider?.provider) return;
    try {
      await invoke("set_stt_provider_config", {
        providerId: selectedSttProvider.provider,
        variables: selectedSttProvider.variables || {},
      });
      setSavedStatus("已保存");
      setTimeout(() => setSavedStatus(""), 2000);
    } catch (e) {
      console.error("保存 STT 配置失败:", e);
      setSavedStatus("保存失败");
    }
  };

  // Load saved config when provider changes
  useEffect(() => {
    if (selectedSttProvider?.provider) {
      invoke<Record<string, string>>("get_stt_provider_config", {
        providerId: selectedSttProvider.provider,
      })
        .then((saved) => {
          if (saved && Object.keys(saved).length > 0) {
            onSetSelectedSttProvider({
              provider: selectedSttProvider.provider,
              variables: { ...selectedSttProvider.variables, ...saved },
            });
          }
        })
        .catch(() => {
          // Ignore - use current variables
        });
    }
  }, [selectedSttProvider?.provider]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Header
          title="选择流式 STT 提供商"
          description="选择实时语音识别服务提供商。音频将通过 WebSocket 流式发送，实时返回转录结果。"
        />
        <Selection
          selected={selectedSttProvider?.provider}
          options={STREAMING_STT_PROVIDERS.map((provider) => ({
            label: provider.name,
            value: provider.id,
            isCustom: false,
          }))}
          placeholder="选择流式 STT 提供商"
          onChange={(value) => {
            onSetSelectedSttProvider({
              provider: value,
              variables: selectedSttProvider?.variables || {},
            });
          }}
        />
      </div>

      {/* Dynamic variable inputs based on provider config */}
      {currentProviderConfig && (
        <div className="space-y-3">
          {currentProviderConfig.variables.map((variable) => {
            const getValue = () => {
              return selectedSttProvider?.variables?.[variable.key] || "";
            };

            const setValue = (val: string) => {
              onSetSelectedSttProvider({
                ...selectedSttProvider,
                variables: {
                  ...selectedSttProvider.variables,
                  [variable.key]: val,
                },
              });
            };

            return (
              <div className="space-y-1" key={variable.key}>
                <Header
                  title={variable.label}
                  description={
                    variable.is_secret
                      ? "您的密钥仅在本地存储，不会被共享。"
                      : `配置 ${variable.label}`
                  }
                />
                <div className="flex gap-2">
                  {variable.is_secret ? (
                    <Input
                      type="password"
                      placeholder="**********"
                      value={getValue()}
                      onChange={(val) => {
                        const v =
                          typeof val === "string" ? val : val.target.value;
                        setValue(v);
                      }}
                      className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
                    />
                  ) : (
                    <TextInput
                      placeholder={`输入 ${variable.label}`}
                      value={getValue()}
                      onChange={(val) => setValue(val)}
                    />
                  )}
                  {getValue() ? (
                    <Button
                      onClick={() => setValue("")}
                      size="icon"
                      variant="destructive"
                      className="shrink-0 h-11 w-11"
                      title="移除"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={saveConfig}
                      size="icon"
                      className="shrink-0 h-11 w-11"
                      title="保存"
                    >
                      <KeyIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Save button */}
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={saveConfig} size="sm" variant="outline">
              保存配置
            </Button>
            {savedStatus && (
              <span className="text-xs text-muted-foreground">
                {savedStatus}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
