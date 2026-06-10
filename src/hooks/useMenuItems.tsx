import {
  Settings,
  Code,
  MessagesSquare,
  WandSparkles,
  AudioLinesIcon,
  SquareSlashIcon,
  MonitorIcon,
  HomeIcon,
  PowerIcon,
  MailIcon,
  CoffeeIcon,
  GlobeIcon,
  BugIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "@/contexts";
import { XIcon, GithubIcon } from "@/components";

export const useMenuItems = () => {
  const { hasActiveLicense } = useApp();

  const menu: {
    icon: React.ElementType;
    label: string;
    href: string;
    count?: number;
  }[] = [
    // [二开] 隐藏仪表板菜单，恢复时取消注释
    // {
    //   icon: HomeIcon,
    //   label: "仪表板",
    //   href: "/dashboard",
    // },
    {
      icon: MessagesSquare,
      label: "对话",
      href: "/chats",
    },
    {
      icon: WandSparkles,
      label: "系统提示词",
      href: "/system-prompts",
    },
    {
      icon: Settings,
      label: "应用设置",
      href: "/settings",
    },
    {
      icon: MessageSquareTextIcon,
      label: "回复设置",
      href: "/responses",
    },
    {
      icon: MonitorIcon,
      label: "截图",
      href: "/screenshot",
    },
    {
      icon: AudioLinesIcon,
      label: "音频",
      href: "/audio",
    },
    {
      icon: SquareSlashIcon,
      label: "光标与快捷键",
      href: "/shortcuts",
    },

    {
      icon: Code,
      label: "开发者空间",
      href: "/dev-space",
    },
  ];

  const footerItems = [
    // [二开] 隐藏联系支持，恢复时取消注释
    // ...(hasActiveLicense
    //   ? [
    //       {
    //         icon: MailIcon,
    //         label: "联系支持",
    //         href: "mailto:support@pluely.com",
    //       },
    //     ]
    //   : []),
    {
      icon: BugIcon,
      label: "报告问题",
      href: "https://github.com/zhangxd1989/vivox/issues/new",  // [二开] 改为自有仓库地址
    },
    {
      icon: PowerIcon,
      label: "退出 Vivox",
      action: async () => {
        await invoke("exit_app");
      },
    },
  ];

  // [二开] 隐藏左下角四个小图标，恢复时取消注释
  const footerLinks: {
    title: string;
    icon: React.ElementType;
    link: string;
  }[] = [
    // {
    //   title: "官网",
    //   icon: GlobeIcon,
    //   link: "https://pluely.com",
    // },
    // {
    //   title: "GitHub",
    //   icon: GithubIcon,
    //   link: "https://github.com/iamsrikanthnani/pluely",
    // },
    // {
    //   title: "请我喝杯咖啡",
    //   icon: CoffeeIcon,
    //   link: "https://buymeacoffee.com/srikanthnani",
    // },
    // {
    //   title: "关注 X",
    //   icon: XIcon,
    //   link: "https://x.com/srikanthnani",
    // },
  ];

  return {
    menu,
    footerItems,
    footerLinks,
  };
};
