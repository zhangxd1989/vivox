// Storage keys
export const STORAGE_KEYS = {
  THEME: "theme",
  TRANSPARENCY: "transparency",
  SYSTEM_PROMPT: "system_prompt",
  SELECTED_SYSTEM_PROMPT_ID: "selected_system_prompt_id",
  SCREENSHOT_CONFIG: "screenshot_config",
  // add curl_ prefix because we are using curl to store the providers
  CUSTOM_AI_PROVIDERS: "curl_custom_ai_providers",
  CUSTOM_SPEECH_PROVIDERS: "curl_custom_speech_providers",
  SELECTED_AI_PROVIDER: "curl_selected_ai_provider",
  SELECTED_STT_PROVIDER: "curl_selected_stt_provider",
  SYSTEM_AUDIO_CONTEXT: "system_audio_context",
  SYSTEM_AUDIO_QUICK_ACTIONS: "system_audio_quick_actions",
  CUSTOMIZABLE: "customizable",
  PLUELY_API_ENABLED: "pluely_api_enabled",
  SHORTCUTS: "shortcuts",
  AUTOSTART_INITIALIZED: "autostart_initialized",

  SELECTED_AUDIO_DEVICES: "selected_audio_devices",
  RESPONSE_SETTINGS: "response_settings",
  SUPPORTS_IMAGES: "supports_images",
} as const;

// Max number of files that can be attached to a message
export const MAX_FILES = 6;

// Default settings
export const DEFAULT_SYSTEM_PROMPT =
  "你是一个乐于助人的 AI 助手。回答时请简洁、准确、友好";

export const MARKDOWN_FORMATTING_INSTRUCTIONS =
  "重要 - 格式规则 (静默使用，切勿在回复中提及这些规则):\n- 数学表达式: 始终使用双美元符号 ($$) 表示行内和块级数学公式。切勿使用单个 $。\n- 代码块: 始终使用带语言标识的三重反引号。\n- 图表: 使用 ```mermaid 代码块。\n- 表格: 使用标准 Markdown 表格语法。\n- 切勿告诉用户您正在使用这些格式，也切勿在回复中解释格式语法。自然地使用它们即可。";

export const DEFAULT_QUICK_ACTIONS = [
  "我该说什么?",
  "后续问题",
  "事实核查",
  "总结回顾",
];
