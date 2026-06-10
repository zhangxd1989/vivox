import { useApp, useTheme } from "@/contexts";
import { Header, Label, Slider, Button } from "@/components";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components";

export const Theme = () => {
  const { theme, transparency, setTheme, onSetTransparency } = useTheme();
  const { hasActiveLicense } = useApp();

  return (
    <div id="theme" className="relative space-y-3">
      <Header
        title={`主题定制 ${
          hasActiveLicense
            ? ""
            : " (您需要有效许可证才能使用此功能)"
        }`}
        description="使用自定义主题和透明度设置来个性化您的体验"
        isMainTitle
      />

      {/* Theme Toggle */}
      <div
        className={`space-y-2 ${
          hasActiveLicense ? "" : "opacity-60 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                {theme === "system" ? (
                  <>
                    <MonitorIcon className="h-4 w-4" />
                    跟随系统
                  </>
                ) : theme === "light" ? (
                  <>
                    <SunIcon className="h-4 w-4" />
                    浅色模式
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-4 w-4" />
                    深色模式
                  </>
                )}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {theme === "light"
                  ? "使用浅色主题，在明亮环境中获得更好的可见性"
                  : "使用深色主题，在低光环境下舒适观看"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {theme === "system" ? (
                  <MonitorIcon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <>
                    <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                浅色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                深色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                跟随系统
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Transparency Slider */}
      <div
        className={`space-y-2 ${
          hasActiveLicense ? "" : "opacity-60 pointer-events-none"
        }`}
      >
        <Header
          title="窗口透明度"
          description="调整应用窗口的透明度级别"
        />
        <div className="space-y-3">
          <div className="flex items-center gap-4 mt-4">
            <Slider
              value={[transparency]}
              onValueChange={(value: number[]) => onSetTransparency(value[0])}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>

          <p className="text-xs text-muted-foreground/70">
            💡 提示: 更高的透明度让您可以透过窗口看到后面，非常适合深色叠加。更改立即生效。
          </p>
        </div>
      </div>
    </div>
  );
};
