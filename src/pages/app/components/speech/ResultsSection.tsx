import { ChatConversation } from "@/types";
import { Markdown, Switch, CopyButton, Badge } from "@/components";
import { BotIcon, Loader2, SparklesIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentenceResult {
  sentenceId: number;
  speakerId: number | null;
  text: string;
  aiResponse: string;
  isAiProcessing: boolean;
}

type Props = {
  lastTranscription: string;
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  conversationMode: boolean;
  setConversationMode: (mode: boolean) => void;
  sentenceResults?: SentenceResult[];
  segmentSummary?: string;
  isSegmentSummarizing?: boolean;
};

// Speaker color palette
const SPEAKER_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-300",
  "bg-green-100 text-green-700 border-green-300",
  "bg-purple-100 text-purple-700 border-purple-300",
  "bg-orange-100 text-orange-700 border-orange-300",
  "bg-pink-100 text-pink-700 border-pink-300",
  "bg-teal-100 text-teal-700 border-teal-300",
];

function getSpeakerColor(speakerId: number | null): string {
  if (speakerId == null) return "bg-gray-100 text-gray-600 border-gray-300";
  return SPEAKER_COLORS[speakerId % SPEAKER_COLORS.length];
}

function getSpeakerLabel(speakerId: number | null): string {
  if (speakerId == null) return "说话人";
  return `说话人${speakerId + 1}`;
}

export const ResultsSection = ({
  lastTranscription,
  lastAIResponse,
  isAIProcessing,
  conversation,
  conversationMode,
  setConversationMode,
  sentenceResults = [],
  segmentSummary = "",
  isSegmentSummarizing = false,
}: Props) => {
  const hasSentences = sentenceResults.length > 0;
  const hasResponse = lastAIResponse || isAIProcessing;
  const hasHistory = conversation.messages.length > 2;

  if (!hasSentences && !hasResponse && !lastTranscription && !segmentSummary) {
    return null;
  }

  const isMac = navigator.platform.toLowerCase().includes("mac");
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-xs font-medium">
            {conversationMode ? "对话" : "AI 回复"}
          </h4>
        </div>
        <div className="flex items-center gap-2 select-none">
          <span className="text-[9px] text-muted-foreground/50 bg-muted/50 px-1 rounded">
            {modKey}+K
          </span>
          <Switch
            checked={conversationMode}
            onCheckedChange={setConversationMode}
            className="scale-75"
          />
          {lastAIResponse && <CopyButton content={lastAIResponse} />}
        </div>
      </div>

      {/* Sentence list with speaker labels */}
      {hasSentences && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <UsersIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
              转录记录
            </span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {sentenceResults.map((sentence) => (
              <div
                key={sentence.sentenceId}
                className="rounded-md border border-border/30 bg-background/30 p-2"
              >
                {/* Speaker label + text */}
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[9px] px-1.5 py-0 font-medium",
                      getSpeakerColor(sentence.speakerId)
                    )}
                  >
                    {getSpeakerLabel(sentence.speakerId)}
                  </Badge>
                  <p className="text-[11px] leading-relaxed flex-1">
                    {sentence.text}
                  </p>
                </div>

                {/* Per-sentence AI response */}
                {sentence.aiResponse && (
                  <div className="mt-1.5 ml-12 prose prose-sm max-w-none dark:prose-invert">
                    {sentence.isAiProcessing ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {sentence.aiResponse || "处理中..."}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground border-l-2 border-primary/30 pl-2">
                        <Markdown>{sentence.aiResponse}</Markdown>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing indicator when no response yet */}
                {sentence.isAiProcessing && !sentence.aiResponse && (
                  <div className="mt-1.5 ml-12 flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground">
                      AI 处理中...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment comprehensive analysis */}
      {(segmentSummary || isSegmentSummarizing) && (
        <div className="border-t border-border/50 pt-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <BotIcon className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-medium text-primary uppercase tracking-wide">
              综合分析
            </span>
            {isSegmentSummarizing && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
          </div>
          {segmentSummary ? (
            <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5 prose prose-sm max-w-none dark:prose-invert">
              <Markdown>{segmentSummary}</Markdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                正在生成综合分析...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Legacy response (for backward compatibility / conversation mode) */}
      {!hasSentences && hasResponse && (
        <div className="space-y-2">
          {lastTranscription && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold">系统:</span> {lastTranscription}
            </p>
          )}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown>{lastAIResponse}</Markdown>
            {isAIProcessing && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
            )}
          </div>
        </div>
      )}

      {/* History messages (conversation mode) */}
      {conversationMode && hasHistory && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
            历史消息
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {conversation.messages
              .slice(2)
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((message, index) => (
                <div
                  key={message.id || index}
                  className={cn(
                    "p-2 rounded-md text-[11px]",
                    message.role === "user"
                      ? "bg-primary/5 border-l-2 border-primary/30"
                      : "bg-background/50"
                  )}
                >
                  <span className="text-[8px] font-medium text-muted-foreground uppercase">
                    {message.role === "user" ? "系统" : "AI"}
                  </span>
                  <div className="text-muted-foreground leading-relaxed mt-0.5">
                    <Markdown>{message.content}</Markdown>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
