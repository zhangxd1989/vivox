import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { useApp } from "@/contexts";

interface ChatAudioProps {
  micOpen: boolean;
  setMicOpen: (open: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  disabled: boolean;
}

export const ChatAudio = ({
  micOpen,
  setMicOpen,
  isRecording,
  setIsRecording,
  disabled,
}: ChatAudioProps) => {
  const { selectedSttProvider, pluelyApiEnabled } = useApp();
  const isProviderConfigured = pluelyApiEnabled || selectedSttProvider.provider;

  const handleMicClick = () => {
    if (!isProviderConfigured) {
      setMicOpen(!micOpen);
      return;
    }

    setIsRecording(!isRecording);
  };

  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          onClick={handleMicClick}
          className="size-7 lg:size-9 rounded-lg lg:rounded-xl"
          title={isRecording ? "录音中..." : "语音输入"}
          disabled={disabled}
        >
          <MicIcon
            className={`size-3 lg:size-4 ${
              isRecording ? "text-red-500 animate-pulse" : ""
            }`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        className={`w-80 p-3 ${isProviderConfigured ? "hidden" : ""}`}
        sideOffset={8}
      >
        <div className="text-sm">
          <div className="font-semibold text-orange-600 mb-1">
            需要语音提供商
          </div>
          <p className="text-muted-foreground">
            <div className="mt-2 flex items-center gap-1 text-orange-600">
              <InfoIcon size={16} />
              <span>提供商未配置</span>
            </div>
            <span className="block mt-2">
              在设置中配置语音提供商以启用语音输入。
            </span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
