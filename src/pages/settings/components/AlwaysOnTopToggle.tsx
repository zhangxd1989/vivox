import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AlwaysOnTopToggleProps {
  className?: string;
}

export const AlwaysOnTopToggle = ({ className }: AlwaysOnTopToggleProps) => {
  const { customizable, toggleAlwaysOnTop } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAlwaysOnTop(checked);
  };

  return (
    <div id="always-on-top" className={`space-y-2 ${className}`}>
      <Header
        title="置顶模式"
        description="控制窗口是否始终位于所有其他应用之上"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {customizable.alwaysOnTop.isEnabled
                ? "禁用置顶"
                : "启用置顶"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {customizable.alwaysOnTop.isEnabled
                ? "窗口始终位于所有其他应用之上 (默认)"
                : "窗口表现与普通应用相同"}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.alwaysOnTop.isEnabled}
          onCheckedChange={handleSwitchChange}
          title={`切换为${
            !customizable.alwaysOnTop.isEnabled ? "启用" : "禁用"
          }置顶`}
          aria-label={`切换为${
            customizable.alwaysOnTop.isEnabled ? "启用" : "禁用"
          }置顶`}
        />
      </div>
    </div>
  );
};
