import { Button } from "@/components";
import { MicIcon, StopCircleIcon, XIcon, Loader2 } from "lucide-react";

interface RecordingPanelProps {
  isVadMode: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isAIProcessing: boolean;
  recordingProgress: number;
  maxDuration: number;
  onStartRecording: () => void;
  onStopAndSend: () => void;
  onIgnore: () => void;
}

export const RecordingPanel = ({
  isVadMode,
  isRecording,
  isProcessing,
  isAIProcessing,
  recordingProgress,
  maxDuration,
  onStartRecording,
  onStopAndSend,
  onIgnore,
}: RecordingPanelProps) => {
  const isWorking = isProcessing || isAIProcessing;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      {/* Manual Mode */}
      {!isVadMode && (
        <div className="p-3 space-y-2">
          {/* Status when working */}
          {isWorking && (
            <div className="flex items-center justify-end gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {isProcessing ? "转录中..." : "生成中..."}
              </span>
            </div>
          )}

          {/* Buttons - Always at top when not working */}
          {!isWorking && (
            <>
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button
                    onClick={onStartRecording}
                    className="flex-1 gap-1.5"
                    size="sm"
                  >
                    <MicIcon className="w-3.5 h-3.5" />
                    开始录音
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={onIgnore}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                    >
                      <XIcon className="w-3 h-3" />
                      丢弃
                    </Button>
                    <Button
                      onClick={onStopAndSend}
                      size="sm"
                      className="flex-1 gap-1"
                    >
                      <StopCircleIcon className="w-3 h-3" />
                      停止并发送
                    </Button>
                  </>
                )}
              </div>

              {/* Progress bar when recording */}
              {isRecording && (
                <div className="space-y-1">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-red-500 h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${(recordingProgress / maxDuration) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      录音中 {recordingProgress}秒
                    </span>
                    <span>最长 {maxDuration}秒</span>
                  </div>
                </div>
              )}

              {/* Keyboard hints - bottom right */}
              <div className="flex justify-end gap-3 text-[8px] text-muted-foreground/60">
                {!isRecording ? (
                  <span>
                    <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                      空格
                    </kbd>{" "}
                    /{" "}
                    <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                      回车
                    </kbd>{" "}
                    开始
                  </span>
                ) : (
                  <>
                    <span>
                      <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                        回车
                      </kbd>{" "}
                      发送
                    </span>
                    <span>
                      <kbd className="px-1 py-0.5 rounded bg-muted font-mono">
                        Esc
                      </kbd>{" "}
                      丢弃
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
