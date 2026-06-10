import { Loader2, TrashIcon } from "lucide-react";
import { Button, Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { useState } from "react";

export const DeleteChats = ({
  handleDeleteAllChatsConfirm,
  showDeleteConfirmDialog,
  setShowDeleteConfirmDialog,
}: UseSettingsReturn) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllChats = () => {
    setIsDeleting(true);
    handleDeleteAllChatsConfirm();
    setTimeout(() => {
      setIsDeleting(false);
    }, 2000);
  };

  return (
    <div id="delete-chats" className="space-y-3">
      <Header
        title="删除聊天记录"
        description="永久删除您的所有聊天对话和历史记录。此操作无法撤销，并将从本地存储中移除所有已存储的对话。"
        isMainTitle
      />

      <div className="space-y-2">
        {isDeleting && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✅ 所有聊天记录已成功删除。
            </p>
          </div>
        )}

        <Button
          onClick={() => setShowDeleteConfirmDialog(true)}
          disabled={isDeleting}
          variant="destructive"
          className="w-full h-11"
          title="删除所有聊天记录"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              删除中...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              删除所有聊天
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              删除所有聊天记录
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              您确定要删除所有聊天记录吗？此操作无法撤销，并将永久移除所有已存储的对话。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmDialog(false)}
              >
                取消
              </Button>
              <Button variant="destructive" onClick={deleteAllChats}>
                全部删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
