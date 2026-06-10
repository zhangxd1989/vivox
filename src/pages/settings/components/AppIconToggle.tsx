import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { customizable, toggleAppIconVisibility } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAppIconVisibility(checked);
  };

  return (
    <div id="app-icon" className={`space-y-2 ${className}`}>
      <Header
        title="应用图标隐身模式"
        description="窗口隐藏时控制程序坞/任务栏图标可见性，实现最大隐蔽性"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {!customizable.appIcon.isVisible
                ? "在程序坞/任务栏显示图标"
                : "从程序坞/任务栏隐藏图标"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {`切换以使应用图标${
                !customizable.appIcon.isVisible ? "可见" : "隐藏"
              }`}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.appIcon.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="切换应用图标可见性"
        />
      </div>
    </div>
  );
};
