import { Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { Providers } from "./Providers";
import { CustomProviders } from "./CustomProvider";

export const STTProviders = (settings: UseSettingsReturn) => {
  return (
    <div id="stt-providers" className="space-y-3">
      <Header
        title="STT提供商"
        description="选择您偏好的STT服务提供商以开始使用。"
        isMainTitle
      />

      {/* Custom Provider */}
      <CustomProviders {...settings} />
      {/* Providers Selection */}
      <Providers {...settings} />
    </div>
  );
};
