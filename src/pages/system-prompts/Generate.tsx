import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  GetLicense,
  Textarea,
} from "@/components";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "@/contexts";

interface GenerateSystemPromptProps {
  onGenerate: (prompt: string, promptName: string) => void;
}

interface SystemPromptResponse {
  prompt_name: string;
  system_prompt: string;
}

export const GenerateSystemPrompt = ({
  onGenerate,
}: GenerateSystemPromptProps) => {
  const { hasActiveLicense } = useApp();
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError("请描述您的需求");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await invoke<SystemPromptResponse>(
        "create_system_prompt",
        {
          userPrompt: userPrompt.trim(),
        }
      );

      if (response.system_prompt && response.prompt_name) {
        onGenerate(response.system_prompt, response.prompt_name);
        setIsOpen(false);
        setUserPrompt("");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "生成提示词失败";
      setError(errorMessage);
      console.error("生成系统提示词出错:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="使用 AI 生成"
          size="sm"
          variant="outline"
          className="w-fit"
        >
          <SparklesIcon className="h-4 w-4" /> 使用 AI 生成
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-96 p-4 border shadow-lg"
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">生成系统提示词</p>
            <p className="text-xs text-muted-foreground">
              描述您想要的 AI 行为，我们将为您生成提示词。
            </p>
          </div>

          <Textarea
            placeholder="例如: 我想要一个帮我做代码审查并关注最佳实践的 AI..."
            className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
            value={userPrompt}
            onChange={(e) => {
              setUserPrompt(e.target.value);
              setError(null);
            }}
            disabled={isGenerating}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          {hasActiveLicense ? (
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!userPrompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <SparklesIcon className="h-4 w-4 animate-pulse" />
                  生成中...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  生成
                </>
              )}
            </Button>
          ) : (
            <div className="w-full flex flex-col gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                您需要有效许可证才能使用此功能。点击下方按钮获取许可证。
              </p>
              <GetLicense
                buttonText="获取许可证"
                buttonClassName="w-full"
                setState={setIsOpen}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
