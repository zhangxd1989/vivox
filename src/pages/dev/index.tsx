import { AIProviders, STTProviders } from "./components";
import Contribute from "@/components/Contribute";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";

const DevSpace = () => {
  const settings = useSettings();

  return (
    <PageLayout title="开发者空间" description="管理您的开发者空间">
      {/* [二开] 隐藏贡献/终身访问区域，恢复时取消注释 */}
      {/* <Contribute /> */}
      {/* Provider Selection */}
      <AIProviders {...settings} />

      {/* STT Providers */}
      <STTProviders {...settings} />
    </PageLayout>
  );
};

export default DevSpace;
