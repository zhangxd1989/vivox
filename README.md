# Vivox 🚀

<a href="https://github.com/zhangxd1989/vivox">
  <img src="/images/app-image.png" alt="vivox banner" width="100%" />
</a>

---

[![开源](https://img.shields.io/badge/开源-❤️-blue)](https://github.com/zhangxd1989/vivox)
[![Tauri](https://img.shields.io/badge/构建于-Tauri-orange)](https://tauri.app/)
[![React](https://img.shields.io/badge/前端-React%20%2B%20TypeScript-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

> **轻量级、隐私优先的桌面 AI 助手** — 在会议、谈判和对话中高效协作，AI 智慧触手可及。

基于 [Pluely](https://github.com/iamsrikanthnani/pluely) 二次开发，体验强大的实时 AI 辅助能力，完全透明、隐私可控、自由定制。

## 📥 **下载 Vivox**

<div align="center">

### 🚀 **获取最新版本**

[![GitHub Release](https://img.shields.io/github/v/release/zhangxd1989/vivox?style=for-the-badge&logo=github&label=最新版本)](https://github.com/zhangxd1989/vivox/releases)

**可用格式:** `.dmg` (macOS) • `.msi` (Windows) • `.exe` (Windows) • `.deb` (Linux) • `.rpm` (Linux) • `.AppImage` (Linux)

</div>

---

## ⚡ **极致轻量的 AI 伙伴**

<div align="center">

### 🎯 **仅约 10MB • 始终可见 • 一键触达**

|       🪶 **超轻量**       |         📺 **始终可见**         |          ⚡ **即时访问**          |
| :----------------------------------: | :-----------------------------------: | :-------------------------------------: |
|    应用总大小**仅约 10MB**     | 任意窗口上的**半透明叠加层** | **一键**激活 AI 辅助 |
| 比同类应用**小数十倍** |    始终置顶，不干扰操作     | 无缝融入你的工作流  |
|   **CPU/内存占用低 50%**   |      透明度可调节       |       随时待命       |

</div>

---

# 功能特性

## 隐形模式

Vivox 在敏感场景中完全隐身运行。应用采用半透明叠加窗口，位于所有其他应用之上，在视频通话、屏幕共享和录屏中不可见。支持 Zoom、Google Meet、Microsoft Teams、Slack 等主流会议平台。

## 系统音频捕获

实时捕获和转录系统音频。可直接录制电脑输出的音频，适用于会议、演示等场景。捕获的音频通过选定的语音转文字服务处理，可自动发送给 AI 进行分析。

**快捷键:** `Cmd+Shift+M` (macOS) / `Ctrl+Shift+M` (Windows/Linux)

## 语音输入

录制语音并通过先进的 STT 服务转换为文字。支持 OpenAI Whisper、ElevenLabs、Groq Whisper 等多种语音转文字服务。VAD（语音活动检测）自动识别说话时段。

**快捷键:** `Cmd+Shift+A` (macOS) / `Ctrl+Shift+A` (Windows/Linux)

## 截屏捕获

支持两种截屏模式：

- **全屏模式:** 一键捕获整个屏幕
- **选区模式:** 拖拽选择特定区域进行捕获

**快捷键:** `Cmd+Shift+S` (macOS) / `Ctrl+Shift+S` (Windows/Linux)

**处理模式:**
- **手动模式:** 截图自动添加到附件，可稍后配合提示词一起提交
- **自动模式:** 截图自动使用预设提示词发送给 AI 分析

## 文件附件

支持拖拽或按钮添加多个文件附件，将文档、图片、代码等发送给 AI 分析。

# Vivox 控制台

通过 `Cmd+Shift+D` (macOS) / `Ctrl+Shift+D` (Windows/Linux) 打开控制台。

## 对话管理

查看和管理所有对话历史，按日期分组，支持搜索标题和消息。可继续对话、添加附件、导出为 Markdown、删除不需要的对话。

## 系统提示词

创建、管理和组织自定义系统提示词来控制 AI 行为。支持创建、编辑、删除、搜索提示词，以及 AI 辅助生成提示词。

## 应用设置

- **主题:** 明/暗/跟随系统
- **自启动:** 开机自动启动
- **图标可见性:** 控制 Dock/任务栏图标
- **置顶模式:** 控制窗口是否始终置顶

## 回复设置

- **回复长度:** 简短/中等/详细/自动
- **回复语言:** 50+ 种语言
- **自动滚动:** 控制是否自动滚动到最新消息

## 截图设置

配置截图模式（全屏/选区）、处理模式（手动/自动）和自动提示词。

## 音频设置

配置语音交互和系统音频捕获的输入/输出设备。

## 光标与快捷键

- **光标设置:** 隐形/默认/自动
- **快捷键自定义:** 所有全局快捷键均可自定义

## 开发者空间

支持通过 cURL 命令集成任意 AI 和 STT 服务。预配置的提供商包括 OpenAI、Anthropic Claude、Google Gemini、xAI Grok、Mistral、Cohere、Perplexity、Groq、Ollama、DeepSeek 等。

**动态变量:**

- `{{TEXT}}` - 用户文本输入
- `{{IMAGE}}` - Base64 编码的图片数据
- `{{SYSTEM_PROMPT}}` - 系统指令
- `{{MODEL}}` - AI 模型名称
- `{{API_KEY}}` - API 认证密钥
- `{{AUDIO}}` - 音频文件（STT 专用）

---

## 为什么选择 Vivox？

### 完全隐形
半透明叠加窗口，在视频通话、屏幕共享、录屏中不可见。

### 隐私优先
- 所有数据本地存储（SQLite）
- 设置存储在 localStorage
- API 密钥从不经过第三方服务器
- 零遥测、零分析、零数据收集
- 支持离线使用

### 极致性能
- 基于 Tauri + Rust 构建，原生桌面性能
- 应用大小约 10MB，启动时间 < 100ms
- 内存占用 < 50MB
- 跨平台：macOS / Windows / Linux

### 完全可控
- 支持任意 AI 提供商（cURL 模板）
- 支持任意 STT 提供商
- 自定义系统提示词
- 灵活的快捷键配置
- 开源 GPL v3

---

## 📋 前置要求

- **Node.js** (v18+)
- **Rust** (最新稳定版)
- **Xcode** (macOS，需完整安装)
- 详见 [Tauri 前置要求](https://v2.tauri.app/start/prerequisites/)

## 安装与开发

```bash
# 克隆仓库
git clone https://github.com/zhangxd1989/vivox.git
cd vivox

# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev

# 构建生产版本
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg`
- **Windows**: `.msi`, `.exe`
- **Linux**: `.deb`, `.rpm`, `.AppImage`

---

## 贡献

欢迎 Bug 修复和功能改进的 Pull Request。

1. **Fork** 仓库
2. **创建** 功能分支 (`git checkout -b feature/amazing-feature`)
3. **提交** 更改 (`git commit -m 'Add amazing feature'`)
4. **推送** 分支 (`git push origin feature/amazing-feature`)
5. **提交** Pull Request

---

## 📄 许可证

本项目基于 **GNU General Public License v3.0** 开源 - 详见 [LICENSE](LICENSE)。

---

## 🙏 致谢

- **[Pluely](https://github.com/iamsrikanthnani/pluely)** - 本项目的基础，优秀的开源 AI 助手
- **[Tauri](https://tauri.app/)** - 出色的桌面应用框架
- **[shadcn/ui](https://ui.shadcn.com/)** - 精美的 UI 组件
- **[@ricky0123/vad-react](https://github.com/ricky0123/vad)** - 语音活动检测
- **[OpenAI](https://openai.com/)** - GPT 模型和 Whisper API
- **[Anthropic](https://anthropic.com/)** - Claude AI 模型

---

**Made with ❤️**
