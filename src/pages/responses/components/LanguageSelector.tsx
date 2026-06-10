import { Header, Selection } from "@/components";
import { LANGUAGES } from "@/lib";
import { useApp } from "@/contexts";
import { updateLanguage } from "@/lib/storage/response-settings.storage";
import { useState, useEffect, useMemo } from "react";
import { getResponseSettings } from "@/lib";

export const LanguageSelector = () => {
  const { hasActiveLicense } = useApp();
  // [二开] 默认语言改为中文，恢复时改回 "english"
  const [selectedLanguage, setSelectedLanguage] = useState<string>("chinese");

  useEffect(() => {
    const settings = getResponseSettings();
    setSelectedLanguage(settings.language);
  }, []);

  const handleLanguageChange = (languageId: string) => {
    if (!hasActiveLicense) {
      return;
    }
    setSelectedLanguage(languageId);
    updateLanguage(languageId);
  };

  const languageOptions = useMemo(() => {
    return LANGUAGES.map((lang) => ({
      label: `${lang.flag} ${lang.name}`,
      value: lang.id,
    }));
  }, []);

  return (
    <div className="space-y-4">
      <Header
        title="回复语言"
        description="选择 AI 回复的语言。此设置全局应用于所有提供商和对话。语言支持可能因您选择的 LLM 提供商而异"
        isMainTitle
      />

      <div className="max-w-md">
        <Selection
          selected={selectedLanguage}
          onChange={handleLanguageChange}
          options={languageOptions}
          placeholder="选择语言"
          disabled={!hasActiveLicense}
        />
      </div>
    </div>
  );
};
