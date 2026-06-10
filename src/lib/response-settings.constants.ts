export interface ResponseLengthOption {
  id: "short" | "medium" | "auto";
  title: string;
  description: string;
  prompt: string;
}

export interface LanguageOption {
  id: string;
  name: string;
  flag: string;
  prompt: string;
}

export const RESPONSE_LENGTHS: ResponseLengthOption[] = [
  {
    id: "short",
    title: "简短",
    description:
      "适合快速回答、摘要和需要节省时间的情况",
    prompt:
      "重要: 您必须保持回复极其简短和简洁。将您的回答限制在最多 2-4 句话。仅提供最基本的信息。除非明确要求，否则不要包含解释、示例或额外上下文。直截了当。这是严格要求。",
  },
  {
    id: "medium",
    title: "中等",
    description: "为大多数任务提供平衡的回复和充分的解释",
    prompt:
      "重要: 提供中等长度的回复——不要太简短，也不要太冗长。将您的回答限制在1-2段（大约4-8句话）。包含关键解释和相关细节，但避免过于冗长或添加不必要的阐述。保持专注和条理清晰。这是严格要求。",
  },
  {
    id: "auto",
    title: "自动",
    description:
      "AI根据您问题的复杂度确定最佳长度",
    prompt:
      "重要: 仔细评估问题的复杂度和范围，然后相应地调整回复长度。对于简单问题，保持简短（2-4句话）。对于中等问题，提供平衡的细节（1-2段）。对于复杂问题，给出具有适当深度的全面回答。始终使回复长度与实际需要的问题相匹配——不多也不少。",
  },
];

export const LANGUAGES: LanguageOption[] = [
  {
    id: "english",
    name: "英语",
    flag: "🇺🇸",
    prompt: "用英语回复。",
  },
  {
    id: "spanish",
    name: "西班牙语",
    flag: "🇪🇸",
    prompt: "用西班牙语回复 (Español)。",
  },
  {
    id: "french",
    name: "法语",
    flag: "🇫🇷",
    prompt: "用法语回复 (Français)。",
  },
  {
    id: "german",
    name: "德语",
    flag: "🇩🇪",
    prompt: "用德语回复 (Deutsch)。",
  },
  {
    id: "italian",
    name: "意大利语",
    flag: "🇮🇹",
    prompt: "用意大利语回复 (Italiano)。",
  },
  {
    id: "portuguese",
    name: "葡萄牙语",
    flag: "🇵🇹",
    prompt: "用葡萄牙语回复 (Português)。",
  },
  {
    id: "dutch",
    name: "荷兰语",
    flag: "🇳🇱",
    prompt: "用荷兰语回复 (Nederlands)。",
  },
  {
    id: "russian",
    name: "俄语",
    flag: "🇷🇺",
    prompt: "用俄语回复 (Русский)。",
  },
  {
    id: "chinese",
    name: "中文",
    flag: "🇨🇳",
    prompt: "用简体中文回复 (简体中文)。",
  },
  {
    id: "japanese",
    name: "日语",
    flag: "🇯🇵",
    prompt: "用日语回复 (日本語)。",
  },
  {
    id: "korean",
    name: "韩语",
    flag: "🇰🇷",
    prompt: "用韩语回复 (한국어)。",
  },
  {
    id: "arabic",
    name: "阿拉伯语",
    flag: "🇸🇦",
    prompt: "用阿拉伯语回复 (العربية)。",
  },
  {
    id: "turkish",
    name: "土耳其语",
    flag: "🇹🇷",
    prompt: "用土耳其语回复 (Türkçe)。",
  },
  {
    id: "polish",
    name: "波兰语",
    flag: "🇵🇱",
    prompt: "用波兰语回复 (Polski)。",
  },
  {
    id: "swedish",
    name: "瑞典语",
    flag: "🇸🇪",
    prompt: "用瑞典语回复 (Svenska)。",
  },
  {
    id: "norwegian",
    name: "挪威语",
    flag: "🇳🇴",
    prompt: "用挪威语回复 (Norsk)。",
  },
  {
    id: "danish",
    name: "丹麦语",
    flag: "🇩🇰",
    prompt: "用丹麦语回复 (Dansk)。",
  },
  {
    id: "finnish",
    name: "芬兰语",
    flag: "🇫🇮",
    prompt: "用芬兰语回复 (Suomi)。",
  },
  {
    id: "greek",
    name: "希腊语",
    flag: "🇬🇷",
    prompt: "用希腊语回复 (Ελληνικά)。",
  },
  {
    id: "czech",
    name: "捷克语",
    flag: "🇨🇿",
    prompt: "用捷克语回复 (Čeština)。",
  },
  {
    id: "hungarian",
    name: "匈牙利语",
    flag: "🇭🇺",
    prompt: "用匈牙利语回复 (Magyar)。",
  },
  {
    id: "romanian",
    name: "罗马尼亚语",
    flag: "🇷🇴",
    prompt: "用罗马尼亚语回复 (Română)。",
  },
  {
    id: "ukrainian",
    name: "乌克兰语",
    flag: "🇺🇦",
    prompt: "用乌克兰语回复 (Українська)。",
  },
  {
    id: "vietnamese",
    name: "越南语",
    flag: "🇻🇳",
    prompt: "用越南语回复 (Tiếng Việt)。",
  },
  {
    id: "thai",
    name: "泰语",
    flag: "🇹🇭",
    prompt: "用泰语回复 (ไทย)。",
  },
  {
    id: "indonesian",
    name: "印尼语",
    flag: "🇮🇩",
    prompt: "用印尼语回复 (Bahasa Indonesia)。",
  },
  {
    id: "malay",
    name: "马来语",
    flag: "🇲🇾",
    prompt: "用马来语回复 (Bahasa Melayu)。",
  },
  {
    id: "hebrew",
    name: "希伯来语",
    flag: "🇮🇱",
    prompt: "用希伯来语回复 (עברית)。",
  },
  {
    id: "filipino",
    name: "菲律宾语",
    flag: "🇵🇭",
    prompt: "用菲律宾语回复 (Tagalog)。",
  },
];

export const DEFAULT_RESPONSE_LENGTH = "auto";
// [二开] 默认语言改为中文，恢复时改回 "english"
export const DEFAULT_LANGUAGE = "chinese";
export const DEFAULT_AUTO_SCROLL = true;
