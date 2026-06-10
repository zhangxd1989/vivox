import { Button } from "@/components";

interface DeleteConfirmationDialogProps {
  deleteConfirm: string | null;
  cancelDelete: () => void;
  confirmDelete: () => void;
}

export const DeleteConfirmationDialog = ({
  deleteConfirm,
  cancelDelete,
  confirmDelete,
}: DeleteConfirmationDialogProps) => {
  if (!deleteConfirm) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-2">删除对话</h3>
        <p className="text-sm text-muted-foreground mb-4">
          确定要删除此对话吗? 此操作无法撤销。
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={cancelDelete}>
            取消
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            删除
          </Button>
        </div>
      </div>
    </div>
  );
};
