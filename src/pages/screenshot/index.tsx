import { ScreenshotConfigs } from "./components";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";

const Settings = () => {
  const settings = useSettings();
  return (
    <PageLayout
      title="截图"
      description="管理您的截图设置"
    >
      {/* Screenshot Configs */}
      <ScreenshotConfigs {...settings} />
    </PageLayout>
  );
};

export default Settings;
