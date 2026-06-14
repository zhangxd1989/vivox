import { AlertCircleIcon, LoaderIcon } from "lucide-react";

type Props = {
  setupRequired: boolean;
  error: string;
  isProcessing: boolean;
  isAIProcessing: boolean;
  capturing: boolean;
  partialTranscription?: string;
  isWsConnected?: boolean;
};

export const StatusIndicator = ({
  setupRequired,
  error,
  isProcessing,
  isAIProcessing,
  capturing,
  partialTranscription,
  isWsConnected,
}: Props) => {
  // Don't show anything if not capturing and no error
  if (!capturing && !error && !isProcessing && !isAIProcessing) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2 justify-end flex-1">
      {/* Error display */}
      {error && !setupRequired ? (
        <div className="flex items-center gap-2 text-red-600 justify-end">
          <AlertCircleIcon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      ) : isAIProcessing ? (
        <div className="flex items-center gap-2 animate-pulse justify-end">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">AI 响应中...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center gap-2 animate-pulse justify-end">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">转录中...</span>
        </div>
      ) : capturing ? (
        <div className="flex items-center gap-2 justify-end">
          {isWsConnected && (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px]">已连接</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-green-600 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">监听中...</span>
          </div>
        </div>
      ) : null}

      {/* Partial transcription display */}
      {partialTranscription && (
        <div className="text-[11px] text-muted-foreground italic truncate">
          {partialTranscription}
        </div>
      )}
    </div>
  );
};
