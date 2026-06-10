import { Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { Providers } from "./Providers";
import { CustomProviders } from "./CustomProvider";

export const AIProviders = (settings: UseSettingsReturn) => {
  return (
    <div id="ai-providers" className="space-y-3">
      <Header
        title="AI提供商"
        description="选择您偏好的AI服务提供商以开始使用。"
        isMainTitle
      />

      {/* Custom Provider */}
      <CustomProviders {...settings} />
      {/* Providers Selection */}
      <Providers {...settings} />
    </div>
  );
};
