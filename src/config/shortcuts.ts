import { ShortcutAction } from "@/types";

export const DEFAULT_SHORTCUT_ACTIONS: ShortcutAction[] = [
  {
    id: "toggle_dashboard",
    name: "切换仪表板",
    description: "打开/关闭仪表板窗口",
    defaultKey: {
      macos: "cmd+shift+d",
      windows: "ctrl+shift+d",
      linux: "ctrl+shift+d",
    },
  },
  {
    id: "toggle_window",
    name: "切换窗口",
    description: "显示/隐藏主窗口",
    defaultKey: {
      macos: "cmd+backslash",
      windows: "ctrl+backslash",
      linux: "ctrl+backslash",
    },
  },
  {
    id: "focus_input",
    name: "重新聚焦输入框",
    description: "将Pluely置于前台并将光标放在输入区域",
    defaultKey: {
      macos: "cmd+shift+i",
      windows: "ctrl+shift+i",
      linux: "ctrl+shift+i",
    },
  },
  {
    id: "move_window",
    name: "移动窗口",
    description: "使用箭头键移动悬浮窗（按住以连续移动）",
    defaultKey: {
      macos: "cmd",
      windows: "ctrl",
      linux: "ctrl",
    },
  },
  {
    id: "system_audio",
    name: "系统音频",
    description: "切换系统音频捕获",
    defaultKey: {
      macos: "cmd+shift+m",
      windows: "ctrl+shift+m",
      linux: "ctrl+shift+m",
    },
  },
  {
    id: "audio_recording",
    name: "语音输入",
    description: "开始语音录音",
    defaultKey: {
      macos: "cmd+shift+a",
      windows: "ctrl+shift+a",
      linux: "ctrl+shift+a",
    },
  },
  {
    id: "screenshot",
    name: "截图",
    description: "捕获截图",
    defaultKey: {
      macos: "cmd+shift+s",
      windows: "ctrl+shift+s",
      linux: "ctrl+shift+s",
    },
  },
];
