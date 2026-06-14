// Streaming STT providers (used by system audio capture via Rust WebSocket)
// Each provider requires only configuration variables (API keys etc.)
// The WebSocket protocol is handled entirely in the Rust backend
export const STREAMING_STT_PROVIDERS = [
  {
    id: "dashscope",
    name: "阿里云百炼 Fun-ASR",
    variables: [
      { key: "api_key", label: "DashScope API Key", is_secret: true },
    ],
  },
  // Future providers can be added here:
  // { id: "iflytek-ws", name: "讯飞实时识别", variables: [...] },
  // { id: "deepgram", name: "Deepgram", variables: [...] },
];

// HTTP STT providers (used by microphone VAD via browser-side fetchSTT)
export const SPEECH_TO_TEXT_PROVIDERS = [
  // ========== 国内 STT 服务 ==========
  {
    id: "baidu-stt",
    name: "百度语音识别",
    curl: `curl -X POST "https://vop.baidu.com/server_api" \\
      -H "Content-Type: application/json" \\
      -d '{
        "format": "wav",
        "rate": 16000,
        "channel": 1,
        "cuid": "vivox",
        "token": "{{API_KEY}}",
        "dev_pid": 1537,
        "speech": "{{AUDIO}}",
        "len": 0
      }'`,
    responseContentPath: "result[0]",
    streaming: false,
  },
  {
    id: "iflytek-stt",
    name: "讯飞语音识别",
    curl: `curl -X POST "https://api.xfyun.cn/v1/aiui/iat" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -H "Content-Type: audio/wav" \\
      -F "file={{AUDIO}}" \\
      -F "language=zh_cn"`,
    responseContentPath: "data.result",
    streaming: false,
  },
  {
    id: "tencent-stt",
    name: "腾讯云 ASR",
    curl: `curl -X POST "https://asr.tencentcloudapi.com/" \\
      -H "Authorization: TC3-HMAC-SHA256 {{API_KEY}}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "EngineModelType": "{{MODEL}}",
        "ChannelNum": 1,
        "ResTextFormat": 0,
        "SourceType": 1,
        "Data": "{{AUDIO}}"
      }'`,
    responseContentPath: "Response.Result",
    streaming: false,
  },
  {
    id: "volcengine-stt",
    name: "火山引擎 ASR",
    curl: `curl -X POST "https://openspeech.bytedance.com/api/v1/sauc/bigmodel" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "model": "{{MODEL}}",
        "audio": "{{AUDIO}}",
        "format": "wav",
        "language": "zh"
      }'`,
    responseContentPath: "result.text",
    streaming: false,
  },
  {
    id: "aliyun-stt",
    name: "阿里云语音识别",
    curl: `curl -X POST "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?appkey={{APP_KEY}}&format=pcm&sample_rate=16000&enable_punctuation_prediction=true&enable_inverse_text_normalization=true" \\
      -H "X-NLS-Token: {{API_KEY}}" \\
      -H "Content-Type: application/octet-stream" \\
      --data-binary "{{AUDIO}}"`,
    responseContentPath: "result",
    streaming: false,
  },
  {
    id: "siliconflow-stt",
    name: "SiliconFlow 语音识别",
    curl: `curl -X POST "https://api.siliconflow.cn/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`,
    responseContentPath: "text",
    streaming: false,
  },
  // ========== 国际 STT 服务 ==========
  {
    id: "openai-whisper",
    name: "OpenAI Whisper",
    curl: `curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "groq",
    name: "Groq Whisper",
    curl: `curl -X POST https://api.groq.com/openai/v1/audio/transcriptions \\
      -H "Authorization: bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F model={{MODEL}} \\
      -F temperature=0 \\
      -F response_format=text \\
      -F language=en`,
    responseContentPath: "text",
    streaming: false,
  },
];
