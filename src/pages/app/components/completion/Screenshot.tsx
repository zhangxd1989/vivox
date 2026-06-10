import { Button } from "@/components";
import { LaptopMinimalIcon, Loader2, MousePointer2Icon } from "lucide-react";
import { UseCompletionReturn } from "@/types";
import { MAX_FILES } from "@/config";
import { useApp } from "@/contexts";

export const Screenshot = ({
  screenshotConfiguration,
  attachedFiles,
  isLoading,
  captureScreenshot,
  isScreenshotLoading,
}: UseCompletionReturn) => {
  const { supportsImages } = useApp();
  const captureMode = screenshotConfiguration.enabled
    ? "截图"
    : "选择";
  const processingMode = screenshotConfiguration.mode;

  const isDisabled =
    attachedFiles.length >= MAX_FILES ||
    isLoading ||
    isScreenshotLoading ||
    !supportsImages;

  return (
    <Button
      size="icon"
      className="cursor-pointer"
      title={
        !supportsImages
          ? "当前AI提供商不支持截图"
          : `${captureMode}模式 (${processingMode}) - ${attachedFiles.length}/${MAX_FILES} 个文件`
      }
      onClick={captureScreenshot}
      disabled={isDisabled}
    >
      {isScreenshotLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : screenshotConfiguration.enabled ? (
        <LaptopMinimalIcon className="h-4 w-4" />
      ) : (
        <MousePointer2Icon className="h-4 w-4" />
      )}
    </Button>
  );
};
