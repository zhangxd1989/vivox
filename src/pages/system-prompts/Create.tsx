import { Button, Input, Textarea } from "@/components";
import { Trash2 } from "lucide-react";

interface CreateSystemPromptProps {
  form: {
    id?: number;
    name: string;
    prompt: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      id?: number;
      name: string;
      prompt: string;
    }>
  >;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export const CreateSystemPrompt = ({
  form,
  setForm,
  onClose,
  onSave,
  onDelete,
  isEditing = false,
  isSaving = false,
}: CreateSystemPromptProps) => {
  const isFormValid = form.name.trim() && form.prompt.trim();

  return (
    <div className="space-y-3">
      <Input
        className="h-11"
        placeholder="输入系统提示词名称"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        disabled={isSaving}
      />
      <Textarea
        placeholder="您是一位乐于助人的AI助手。在回复中保持简洁、准确和友好..."
        className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
        value={form.prompt}
        onChange={(e) => setForm({ ...form, prompt: e.target.value })}
        disabled={isSaving}
      />
      <div className="flex flex-row w-full gap-2">
        {isEditing && onDelete ? (
          <>
            <div className="flex-1 flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                关闭
              </Button>
              <Button
                className="w-1/3"
                variant="destructive"
                onClick={onDelete}
                disabled={isSaving}
                title="删除此提示词"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                className="flex-1"
                onClick={onSave}
                disabled={!isFormValid || isSaving}
              >
                {isSaving ? "更新中..." : "更新"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              className="w-1/2"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              className="w-1/2"
              onClick={onSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? "创建中..." : "创建"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
