import { useState, useEffect } from "react";
import { Button, Card, GetLicense, Switch } from "@/components";
import { RotateCcw, AlertCircle, Keyboard, Lock } from "lucide-react";
import {
  getAllShortcutActions,
  getShortcutsConfig,
  updateShortcutBinding,
  resetShortcutsToDefaults,
  checkShortcutConflicts,
  formatShortcutKeyForDisplay,
  getPlatformDefaultKey,
} from "@/lib";
import { ShortcutAction, ShortcutBinding } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "@/contexts";
import { ShortcutRecorder } from "./ShortcutRecorder";

export const ShortcutManager = () => {
  const { hasActiveLicense } = useApp();
  const [actions, setActions] = useState<ShortcutAction[]>([]);
  const [bindings, setBindings] = useState<Record<string, ShortcutBinding>>({});
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadShortcuts();
  }, [hasActiveLicense]);

  const loadShortcuts = () => {
    const config = getShortcutsConfig();
    const allActions = getAllShortcutActions(hasActiveLicense);
    setActions(allActions);
    setBindings(config.bindings);
  };

  const handleToggleEnabled = async (actionId: string, enabled: boolean) => {
    const binding = bindings[actionId];
    if (!binding) return;

    const newBinding = { ...binding, enabled };
    const updatedBindings = { ...bindings, [actionId]: newBinding };
    setBindings(updatedBindings);

    // Update storage
    updateShortcutBinding(actionId, binding.key, enabled);

    // Apply to backend
    await applyShortcuts(updatedBindings);
  };

  const handleSaveShortcut = async (actionId: string, key: string) => {
    // Check for conflicts
    const conflict = checkShortcutConflicts(key, actionId);
    if (conflict) {
      setConflicts([
        `Shortcut "${key}" is already used by: ${conflict.actions
          .map((id) => actions.find((a) => a.id === id)?.name)
          .join(", ")}`,
      ]);
      return;
    }

    const binding = bindings[actionId] || {
      action: actionId,
      key: "",
      enabled: true,
    };
    const newBinding = { ...binding, key };
    const updatedBindings = { ...bindings, [actionId]: newBinding };
    setBindings(updatedBindings);

    // Update storage
    updateShortcutBinding(actionId, key, binding.enabled);

    // Apply to backend
    await applyShortcuts(updatedBindings);

    // Close editor and clear conflicts
    setEditingAction(null);
    setConflicts([]);
  };

  const applyShortcuts = async (
    updatedBindings: Record<string, ShortcutBinding>
  ) => {
    setIsApplying(true);
    try {
      await invoke("update_shortcuts", {
        config: { bindings: updatedBindings },
      });
    } catch (error) {
      console.error("应用快捷键失败:", error);
      setConflicts([`应用快捷键失败: ${error}`]);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = async () => {
    setIsApplying(true);
    try {
      const defaultConfig = resetShortcutsToDefaults();

      await applyShortcuts(defaultConfig.bindings);

      setBindings(defaultConfig.bindings);
      setConflicts([]);
      setEditingAction(null);

      // Reload to ensure fresh state
      loadShortcuts();
    } catch (error) {
      console.error("重置快捷键失败:", error);
      setConflicts(["重置快捷键失败。请重试。"]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div id="shortcuts" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md lg:text-lg font-semibold flex items-center gap-2">
            <Keyboard className="size-5 lg:size-5" />
            键盘快捷键
          </h3>
          <p className="text-sm text-muted-foreground">
            {actions.length} 个快捷键已配置
            {!hasActiveLicense && " • 获取许可证以自定义快捷键"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* COMMENTED OUT: Custom shortcut creation */}
          {/* {hasActiveLicense && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              disabled={isApplying}
              title="创建自定义快捷键"
            >
              <Plus className="h-4 w-4" />
              新建
            </Button>
          )} */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isApplying}
            title="将所有快捷键重置为平台默认值"
          >
            <RotateCcw className="size-3 lg:size-4" />
            重置
          </Button>
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-3 lg:size-4 text-destructive mt-0.5" />
            <div className="flex-1">
              {conflicts.map((conflict, i) => (
                <p key={i} className="text-sm text-destructive">
                  {conflict}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* License Prompt for Non-Licensed Users */}
      {!hasActiveLicense && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Lock className="size-4 lg:size-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs lg:text-sm font-medium">
                解锁快捷键自定义
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                您可以启用/禁用快捷键，但需要激活许可证才能自定义按键绑定。
              </p>
              <GetLicense
                buttonText="获取许可证"
                buttonClassName="w-full mt-2"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Flat Shortcuts List */}
      <div className="space-y-3">
        {actions.map((action) => {
          const binding = bindings[action.id] || {
            action: action.id,
            key: getPlatformDefaultKey(action),
            enabled: true,
          };
          const isLocked = !hasActiveLicense;
          const isEditing = editingAction === action.id;

          return (
            <Card
              key={action.id}
              className={`shadow-none p-4 border border-border/70 rounded-xl ${
                !binding.enabled ? "opacity-50" : ""
              } ${isLocked ? "bg-muted/30" : ""}`}
            >
              {isEditing ? (
                // EDITING MODE - Show recorder immediately
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-xs lg:text-sm">
                      {action.name}
                    </p>
                    <p className="text-[10px] lg:text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ShortcutRecorder
                    actionId={action.id}
                    onSave={(key) => handleSaveShortcut(action.id, key)}
                    onCancel={() => {
                      setEditingAction(null);
                      setConflicts([]);
                    }}
                    disabled={isApplying}
                  />
                </div>
              ) : (
                // VIEW MODE - Show shortcut with controls
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Switch
                      checked={binding.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleEnabled(action.id, enabled)
                      }
                      disabled={isApplying}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-xs lg:text-sm">
                        {action.name}
                      </p>
                      {isLocked && (
                        <Lock className="size-3 lg:size-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-[10px] lg:text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 bg-muted rounded text-xs lg:text-sm font-mono">
                      {action.id === "move_window"
                        ? `${formatShortcutKeyForDisplay(
                            binding.key
                          )} + (← ↑ ↓ →)`
                        : formatShortcutKeyForDisplay(binding.key)}
                    </code>
                    <Button
                      size="sm"
                      variant={isLocked ? "outline" : "default"}
                      onClick={() => {
                        if (isLocked) return;
                        setEditingAction(action.id);
                        setConflicts([]);
                      }}
                      disabled={isLocked || isApplying}
                      className="min-w-[80px]"
                      title={
                        isLocked
                          ? "需要许可证才能自定义"
                          : "更改此快捷键"
                      }
                    >
                      更改
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        💡 快捷键全局生效，即使应用隐藏时也能使用
      </p>
    </div>
  );
};
