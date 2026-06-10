import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
} from "@/components";
import { GenerateSystemPrompt } from "./Generate";
import { SparklesIcon } from "lucide-react";

interface CreateEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
  onSave: () => void;
  onGenerate: (prompt: string, promptName: string) => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export const CreateEditDialog = ({
  isOpen,
  onOpenChange,
  form,
  setForm,
  onSave,
  onGenerate,
  isEditing = false,
  isSaving = false,
}: CreateEditDialogProps) => {
  const isFormValid = form.name.trim() && form.prompt.trim();

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="mt-4 px-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? "编辑系统提示词" : "创建系统提示词"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditing
                  ? "在下方更新您的系统提示词详情。"
                  : "定义新的 AI 行为和个性。"}
              </DialogDescription>
            </div>
            <GenerateSystemPrompt onGenerate={onGenerate} />
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4 px-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              名称
            </label>
            <Input
              placeholder="例如: 代码审查专家、创意作家..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              系统提示词
            </label>
            <Textarea
              placeholder="你是一个乐于助人的 AI 助手。回答时请简洁、准确、友好..."
              className="min-h-[200px] max-h-[400px] resize-none overflow-y-auto"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground/70">
              💡 提示: 请具体说明语气、专业水平和回复格式
            </p>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? (
              <>
                <SparklesIcon className="h-4 w-4 animate-pulse" />
                {isEditing ? "更新中..." : "创建中..."}
              </>
            ) : isEditing ? (
              "更新"
            ) : (
              "创建"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
