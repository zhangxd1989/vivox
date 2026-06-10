import { useState } from "react";
import { TYPE_PROVIDER } from "@/types";
import { AI_PROVIDERS } from "@/config";
import { useApp } from "@/contexts";
import {
  getCustomAiProviders,
  addCustomAiProvider,
  updateCustomAiProvider,
  removeCustomAiProvider,
  validateCurl,
} from "@/lib";

export function useCustomAiProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<TYPE_PROVIDER>({
    id: "",
    streaming: false,
    responseContentPath: "",
    isCustom: true,
    curl: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (providerId: string) => {
    const customProviders = getCustomAiProviders();
    const provider = customProviders.find((p) => p.id === providerId);
    if (!provider) return;

    setFormData({
      ...provider,
    });
    setEditingProvider(providerId);
    setShowForm(!showForm);
    setErrors({});
  };

  const handleAutoFill = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    setFormData({
      ...provider,
      curl: provider.curl,
    });

    setErrors({});
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const success = removeCustomAiProvider(deleteConfirm);
      if (success) {
        setDeleteConfirm(null);
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error("删除自定义提供商出错:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    // Validate form
    const newErrors: { [key: string]: string } = {};

    if (!formData.curl.trim()) {
      newErrors.curl = "需要 cURL 命令";
    } else {
      const validation = validateCurl(formData.curl, ["TEXT"]);
      if (!validation.isValid) {
        newErrors.curl = validation.message || "";
      }
    }

    if (!formData.responseContentPath?.trim()) {
      newErrors.responseContentPath = "需要响应内容路径";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      if (editingProvider) {
        // Update existing provider
        const success = updateCustomAiProvider(editingProvider, {
          curl: formData.curl,
          streaming: formData.streaming,
          responseContentPath: formData.responseContentPath,
        });

        if (success) {
          setEditingProvider(null);
          setShowForm(false);
          setFormData({
            id: "",
            streaming: false,
            responseContentPath: "",
            isCustom: true,
            curl: "",
          });
          loadData(); // Refresh data
        }
      } else {
        // Create new provider
        const newProvider = {
          curl: formData.curl,
          streaming: formData.streaming,
          responseContentPath: formData.responseContentPath,
        };

        const saved = addCustomAiProvider(newProvider);
        if (saved) {
          setShowForm(false);
          setFormData({
            id: "",
            streaming: false,
            responseContentPath: "",
            isCustom: true,
            curl: "",
          });
          loadData(); // Refresh data
        }
      }
    } catch (error) {
      console.error("保存自定义提供商出错:", error);
    }
  };

  return {
    errors,
    setErrors,
    showForm,
    setShowForm,
    editingProvider,
    setEditingProvider,
    deleteConfirm,
    formData,
    setFormData,
    handleSave,
    handleAutoFill,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
