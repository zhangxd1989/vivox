import { useState, useEffect } from "react";
import { getAppVersion } from "@/lib";

export const useVersion = () => {
  const [version, setVersion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setIsLoading(true);
        const appVersion = await getAppVersion();
        setVersion(appVersion);
        setError(null);
      } catch (err) {
        console.error("获取版本失败:", err);
        setError("加载版本失败");
        setVersion("未知");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { version, isLoading, error };
};
