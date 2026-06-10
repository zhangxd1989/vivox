import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Header,
} from "@/components";
import { UseSettingsReturn } from "@/types";
import { LaptopMinimalIcon, MousePointer2Icon } from "lucide-react";

export const ScreenshotConfigs = ({
  screenshotConfiguration,
  handleScreenshotModeChange,
  handleScreenshotPromptChange,
  handleScreenshotEnabledChange,
  hasActiveLicense,
}: UseSettingsReturn) => {
  return (
    <div id="screenshot" className="space-y-3">
      <div className="space-y-3">
        {/* Screenshot Capture Mode: Selection and Screenshot */}
        <div className="space-y-2">
          <div className="flex flex-col">
            <Header
              title="捕获方式"
              description={
                screenshotConfiguration.enabled
                  ? "截图模式: 一键快速捕获整个屏幕。"
                  : "选区模式: 点击并拖动以选择特定区域进行捕获。"
              }
            />
          </div>
          <Select
            value={screenshotConfiguration.enabled ? "screenshot" : "selection"}
            onValueChange={(value) =>
              handleScreenshotEnabledChange(value === "screenshot")
            }
          >
            <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
              <div className="flex items-center gap-2">
                {screenshotConfiguration.enabled ? (
                  <LaptopMinimalIcon className="size-4" />
                ) : (
                  <MousePointer2Icon className="size-4" />
                )}
                <div className="text-sm font-medium">
                  {screenshotConfiguration.enabled
                    ? "截图模式"
                    : "选区模式"}
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selection" disabled={!hasActiveLicense}>
                <div className="flex items-center gap-2">
                  <MousePointer2Icon className="size-4" />
                  <div className="font-medium">选区模式</div>
                  {!hasActiveLicense && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      您需要有效许可证才能使用选区模式。
                    </span>
                  )}
                </div>
              </SelectItem>
              <SelectItem value="screenshot" className="flex flex-row gap-2">
                <LaptopMinimalIcon className="size-4" />
                <div className="font-medium">截图模式</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mode Selection: Auto and Manual */}
        <div className="space-y-2">
          <div className="flex flex-col">
            <Header
              title="处理模式"
              description={
                screenshotConfiguration.mode === "manual"
                  ? "截图将被捕获并自动添加到您的附件中。然后您可以使用自己的提示词提交它们。您可以捕获多张截图并稍后提交。"
                  : "截图将使用您的自定义提示词自动提交给 AI。无需手动干预。一次只能提交一张截图。"
              }
            />
          </div>
          <Select
            value={screenshotConfiguration.mode}
            onValueChange={handleScreenshotModeChange}
          >
            <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">
                  {screenshotConfiguration.mode === "auto" ? "自动" : "手动"}{" "}
                  模式
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                <div className="font-medium">手动模式</div>
              </SelectItem>
              <SelectItem value="auto">
                <div className="font-medium">自动模式</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Prompt Input - Only show when auto mode is selected */}
        {screenshotConfiguration.mode === "auto" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">自动提示词</Label>
            <Input
              placeholder="输入用于自动截图分析的提示词..."
              value={screenshotConfiguration.autoPrompt}
              onChange={(e) => handleScreenshotPromptChange(e.target.value)}
              className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              截图时将自动使用此提示词
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground/70">
        <p>
          💡 <strong>提示:</strong>{" "}
          {screenshotConfiguration.enabled
            ? "截图模式可一键捕获全屏。"
            : "选区模式可让您选择特定区域进行捕获。"}{" "}
          自动模式适合快速分析，手动模式给您更多控制权。
        </p>
      </div>
    </div>
  );
};
