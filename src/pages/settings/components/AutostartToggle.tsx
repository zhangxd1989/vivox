import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AutostartToggleProps {
  className?: string;
}

export const AutostartToggle = ({ className }: AutostartToggleProps) => {
  const { customizable, toggleAutostart } = useApp();

  const isEnabled = customizable?.autostart?.isEnabled ?? true;

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAutostart(checked);
  };

  return (
    <div id="autostart" className={`space-y-2 ${className}`}>
      <Header
        title="开机启动"
        description="系统启动时自动打开 Pluely"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">开机时启动</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled
                ? "Pluely 将在系统启动时自动启动"
                : "Pluely 不会自动启动"}
            </p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleSwitchChange}
          aria-label="切换开机启动"
        />
      </div>
    </div>
  );
};
