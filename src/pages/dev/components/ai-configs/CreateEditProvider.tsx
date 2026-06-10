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
import { useCustomAiProviders } from "@/hooks";
import { useApp } from "@/contexts";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomAiProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  const { allAiProviders } = useApp();
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomAiProviders();

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
          添加自定义提供商
        </Button>
      ) : (
        <Card className="p-4 border !bg-transparent border-input/50 ">
          <div className="flex justify-between items-center">
            <Header
              title={editingProvider ? `编辑提供商` : "添加自定义提供商"}
              description="创建自定义AI提供商以用于您的AI驱动应用程序。"
            />

            <div className="w-[120px]">
              <Selection
                options={allAiProviders
                  ?.filter((provider) => !provider?.isCustom)
                  .map((provider) => {
                    return {
                      label: provider?.id || "AI提供商",
                      value: provider?.id || "AI提供商",
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
                description="与AI提供商一起使用的curl命令。"
              />
              <Textarea
                className={cn(
                  "h-74 font-mono text-sm",
                  errors.curl && "border-red-500"
                )}
                placeholder={`curl --location 'http://127.0.0.1:1337/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY or {{API_KEY}}' \
--data '{
        "model": "your-model-name or {{MODEL}}",
        "messages": [
            {
                "role": "system",
                "content": "{{SYSTEM_PROMPT}}"
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "{{TEXT}}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/jpeg;base64,{{IMAGE}}"
                        }
                    }
                ]
            }
        ]
    }'`}
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
                  ⚠️ AI提供商的必需变量：
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{TEXT}}"}
                    </code>
                    <span className="text-foreground font-medium">
                      → 必需：用户的文本输入
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{IMAGE}}"}
                    </code>
                    <span className="text-muted-foreground">
                      → Base64图像数据（不带data:image/jpeg;base64前缀）
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{SYSTEM_PROMPT}}"}
                    </code>
                    <span className="text-muted-foreground">
                      → 系统提示词/指令（可选）
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
                    💡 提示：使用必需变量（
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{TEXT}}"}
                    </code>
                    、{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{SYSTEM_PROMPT}}"}
                    </code>
                    ）实现基本功能。仅当您的提供商支持图像输入时才添加{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{IMAGE}}"}
                    </code>
                    。
                  </p>
                </div>
              </div>
            </div>
          </div>

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
            />
          </div>
          {/* Response Configuration */}
          <div className="space-y-2">
            <Header
              title="响应内容路径 *"
              description="从API响应中提取内容的路径。"
            />

            <TextInput
              placeholder="choices[0].message.content"
              value={formData.responseContentPath || ""}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  responseContentPath: value,
                }))
              }
              error={errors.responseContentPath}
              notes="从API响应中提取内容的路径。示例：choices[0].message.content、text、candidates[0].content.parts[0].text"
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
