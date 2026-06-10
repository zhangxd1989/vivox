import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";
import { useState, useEffect } from "react";
import { getResponseSettings, updateAutoScroll } from "@/lib";

export const AutoScrollToggle = () => {
  const { hasActiveLicense } = useApp();
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    const settings = getResponseSettings();
    setAutoScroll(settings.autoScroll);
  }, []);

  const handleSwitchChange = (checked: boolean) => {
    if (!hasActiveLicense) {
      return;
    }
    setAutoScroll(checked);
    updateAutoScroll(checked);
  };

  return (
    <div className="space-y-4">
      <Header
        title="自动滚动行为"
        description="控制回复是否自动滚动到底部。此设置立即生效，控制回复是否在流式传输时自动滚动到最新内容"
        isMainTitle
      />

      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {autoScroll ? "自动滚动已启用" : "自动滚动已禁用"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {autoScroll
                ? "回复到达时将自动滚动到底部"
                : "回复将保持在您当前的滚动位置"}
            </p>
          </div>
        </div>
        <Switch
          checked={autoScroll}
          onCheckedChange={handleSwitchChange}
          disabled={!hasActiveLicense}
          title={`切换为${!autoScroll ? "启用" : "禁用"}自动滚动`}
          aria-label={`切换为${
            autoScroll ? "禁用" : "启用"
          }自动滚动`}
        />
      </div>
    </div>
  );
};
