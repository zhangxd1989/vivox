import { useState, useEffect } from "react";
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Markdown,
} from "@/components";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useWindowResize } from "@/hooks";

type UpdateState =
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "ready"
  | "error"
  | "uptodate"
  | "failed";

interface DownloadProgress {
  downloaded: number;
  contentLength: number;
  percentage: number;
}

export const Updater = () => {
  const [updateState, setUpdateState] = useState<UpdateState>("uptodate");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    downloaded: 0,
    contentLength: 0,
    percentage: 0,
  });

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [manualClose, setManualClose] = useState(false);
  const { resizeWindow } = useWindowResize();

  const checkForUpdates = async () => {
    try {
      setUpdateState("checking");

      const foundUpdate = await check();
      if (foundUpdate) {
        setUpdate(foundUpdate);
        setUpdateState("available");
      } else {
        setUpdateState("uptodate");
      }
    } catch (err) {
      console.error("检查更新失败:", err);
      setUpdateState("error");
      setIsPopoverOpen(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!update) return;

    try {
      setUpdateState("downloading");
      setProgress({ downloaded: 0, contentLength: 0, percentage: 0 });

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setProgress((prev) => ({
              ...prev,
              contentLength: event.data.contentLength || 0,
            }));
            break;

          case "Progress":
            setProgress((prev) => {
              const downloaded = prev.downloaded + event.data.chunkLength;
              const percentage =
                prev.contentLength > 0
                  ? Math.round((downloaded / prev.contentLength) * 100)
                  : 0;

              return {
                downloaded,
                contentLength: prev.contentLength,
                percentage,
              };
            });
            break;

          case "Finished":
            setUpdateState("installing");
            break;
        }
      });

      setUpdateState("ready");

      // Auto-relaunch after a short delay to show success state
      setTimeout(async () => {
        await relaunch();
      }, 2000);
    } catch (err) {
      console.error("下载/安装更新失败:", err);
      setUpdateState("failed");
      // Keep the popover open so user can try again
      setIsPopoverOpen(true);
    }
  };

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Handle window resizing when popover opens/closes
  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  // Helper functions for button state
  const getButtonContent = () => {
    switch (updateState) {
      case "downloading":
        return (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            下载中... {progress.percentage}%
          </>
        );
      case "installing":
        return (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            安装中...
          </>
        );
      case "ready":
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            就绪 - 正在重启...
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            重试
          </>
        );
      default:
        return (
          <>
            <Download className="mr-2 h-4 w-4" />
            下载并安装更新
          </>
        );
    }
  };

  const getButtonDisabled = () => {
    return ["downloading", "installing", "ready"].includes(updateState);
  };

  const getButtonOnClick = () => {
    return updateState === "error" ? checkForUpdates : downloadAndInstall;
  };

  // Handle popover open/close with manual control
  const handlePopoverOpenChange = (open: boolean) => {
    // Prevent closing during active operations unless manually triggered
    const isActiveOperation = ["downloading", "installing", "ready"].includes(
      updateState
    );

    if (open) {
      setIsPopoverOpen(true);
      setManualClose(false);
    } else if (!isActiveOperation || manualClose) {
      setIsPopoverOpen(false);
      setManualClose(false);
    }
  };

  // Handle manual trigger click
  const handleTriggerClick = () => {
    setManualClose(!isPopoverOpen);
    setIsPopoverOpen(!isPopoverOpen);
  };

  // Only show updater when there's an update available or during active operations
  if (updateState === "uptodate" || updateState === "error") {
    return null;
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          onClick={handleTriggerClick}
          className="cursor-pointer"
          disabled={updateState === "checking"}
          title={`有可用更新: ${update?.version}`}
          aria-label={`有可用更新: ${update?.version}`}
        >
          {updateState === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={8}
      >
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-6 space-y-4">
            {/* Update Header */}
            <div className="border-b border-input/50 pb-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                有可用更新
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                新版本 ({update?.version}) 已可用。更新内容如下:
              </p>
            </div>

            {/* Release Notes */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {update?.body ? (
                <Markdown>{update.body}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  此版本暂无发布说明。
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Fixed Download Section */}
        <div className="border-t border-input/50 p-4 space-y-3">
          <Button
            onClick={getButtonOnClick()}
            disabled={getButtonDisabled()}
            className="w-full"
            variant={updateState === "failed" ? "destructive" : "default"}
          >
            {getButtonContent()}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              下载遇到问题?{" "}
              <a
                href={"https://github.com/zhangxd1989/vivox/releases"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
              >
                手动下载
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
