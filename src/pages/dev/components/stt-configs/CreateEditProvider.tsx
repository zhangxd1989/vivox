import {
  Card,
  Button,
  Header,
  TextInput,
  Switch,
  Textarea,
  Selection,
} from "@/components";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useCustomSttProviders } from "@/hooks";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomSttProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  const { allSttProviders } = useApp();
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomSttProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    formData,
    setFormData,
    errors,
    handleSave,
    setErrors,
    handleAutoFill,
  } = hookInstance;

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
          }}
          variant="outline"
          className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          添加自定义STT提供商
        </Button>
      ) : (
        <Card className="p-4 border border-input/50 bg-transparent">
          <div className="flex justify-between items-center">
            <Header
              title={
                editingProvider
                  ? `编辑STT提供商`
                  : "添加自定义STT提供商"
              }
              description="创建自定义STT提供商以用于您的STT驱动应用程序。"
            />
            <div className="w-[120px]">
              <Selection
                options={allSttProviders
                  ?.filter((provider) => !provider?.isCustom)
                  .map((provider) => {
                    return {
                      label: provider?.id || "STT提供商",
                      value: provider?.id || "STT提供商",
                    };
                  })}
                placeholder={"自动填充"}
                onChange={(value) => {
                  handleAutoFill(value);
                }}
              />
            </div>
          </div>

          <div className="">
            {/* Basic Configuration */}
            <div className="space-y-1">
              <Header
                title="Curl命令 *"
                description="与STT提供商一起使用的curl命令。"
              />
              <Textarea
                className={cn(
                  "h-74 font-mono text-sm",
                  errors.curl && "border-red-500"
                )}
                placeholder={`curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`}
                value={formData.curl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, curl: e.target.value }))
                }
              />
              {errors.curl && (
                <p className="text-xs text-red-500 mt-1">{errors.curl}</p>
              )}

              {/* Variable Instructions */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="bg-card border p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-2">
                    💡 重要提示：您可以添加自定义变量或直接将API密钥/值
                  </p>
                  <p className="text-xs text-muted-foreground">
                    选择提供商时无需单独输入变量——您可以直接将它们嵌入curl命令中
                    （例如，将YOUR_API_KEY替换为您的实际密钥，或使用{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{MODEL}}"}
                    </code>{" "}
                    作为模型名称）。
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-foreground">
                  ⚠️ STT提供商的必需变量：
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{AUDIO}}"}
                    </code>
                    <span className="text-foreground font-medium">
                      → 必需：如果您使用multipart/form-data（使用-F或--form），则需要Base64编码的音频数据或WAV格式的音频文件
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">快速设置：</strong>{" "}
                    直接在curl命令中将{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      YOUR_API_KEY
                    </code>{" "}
                    替换为您的实际API密钥。
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      自定义变量：
                    </strong>{" "}
                    您可以使用相同的{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{VARIABLE_NAME}}"}
                    </code>{" "}
                    格式添加自己的变量，选择此提供商时它们将可用于配置。
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    💡 提示：{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{AUDIO}}"}
                    </code>{" "}
                    变量对于STT功能至关重要——请确保它已正确包含在您的curl命令中。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between items-center space-x-2">
              <Header
                title="流式传输"
                description="流式传输用于从AI提供商流式传输响应。"
              />
              <Switch
                checked={formData.streaming}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    streaming: checked,
                  }))
                }
                disabled={true}
              />
            </div>
            <span className="text-xs italic text-red-500">
              STT提供商不支持流式传输。未来将会修复。
            </span>
          </div>
          {/* Response Configuration */}
          <div className="space-y-2">
            <Header
              title="响应内容路径 *"
              description="从API响应中提取内容的路径。"
            />

            <TextInput
              placeholder="text"
              value={formData.responseContentPath || ""}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  responseContentPath: value,
                }))
              }
              error={errors.responseContentPath}
              notes="从API响应中提取内容的路径。示例：text、transcript、results[0].alternatives[0].transcript"
            />
          </div>

          <div className="flex justify-end gap-2 -mt-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.curl.trim()}
              className={cn(
                "h-11 border-1 border-input/50 focus:border-primary/50 transition-colors",
                errors.curl && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {errors.curl ? (
                "cURL无效，请重试"
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {editingProvider ? "更新" : "保存"}提供商
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
