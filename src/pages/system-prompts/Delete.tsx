import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteSystemPromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: number | undefined;
  promptName: string;
  onDelete: (id: number) => Promise<void>;
}

export const DeleteSystemPrompt = ({
  isOpen,
  onOpenChange,
  promptId,
  promptName,
  onDelete,
}: DeleteSystemPromptProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!promptId) return;

    try {
      setIsDeleting(true);
      await onDelete(promptId);
      onOpenChange(false);
    } catch (error) {
      console.error("删除系统提示词失败:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle>删除系统提示词</DialogTitle>
              <DialogDescription className="mt-1">
                确定要删除 "{promptName}" 吗?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-muted-foreground">
            此操作无法撤销。这将永久从数据库中删除该系统提示词。
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "删除中..." : "删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
