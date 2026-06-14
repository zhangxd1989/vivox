import { Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { Providers } from "./Providers";

export const STTProviders = (settings: UseSettingsReturn) => {
  return (
    <div id="stt-providers" className="space-y-3">
      <Header
        title="流式 STT 提供商"
        description="配置实时语音识别服务提供商。音频通过 WebSocket 流式传输，说话时即可看到转录结果。"
        isMainTitle
      />

      {/* Streaming Provider Selection + Config */}
      <Providers
        selectedSttProvider={settings.selectedSttProvider}
        onSetSelectedSttProvider={settings.onSetSelectedSttProvider}
      />
    </div>
  );
};
