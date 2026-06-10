import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GetLicense } from "@/components";
import { PluelyApiSetup, Usage } from "./components";
import { PageLayout } from "@/layouts";
import { useApp } from "@/contexts";

const Dashboard = () => {
  const { hasActiveLicense } = useApp();
  const [activity, setActivity] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!hasActiveLicense) {
      setActivity({ data: [], total_tokens_used: 0 });
      return;
    }
    setLoadingActivity(true);
    try {
      const response = await invoke("get_activity");
      const responseData: any = response;
      if (responseData && responseData.success) {
        setActivity(responseData);
      } else {
        setActivity({ data: [], total_tokens_used: 0 });
      }
    } catch (error) {
      setActivity({ data: [], total_tokens_used: 0 });
    } finally {
      setLoadingActivity(false);
    }
  }, [hasActiveLicense]);

  useEffect(() => {
    if (hasActiveLicense) {
      fetchActivity();
    } else {
      setActivity(null);
    }
  }, [fetchActivity, hasActiveLicense]);

  const activityData =
    activity && Array.isArray(activity.data) ? activity.data : [];
  const totalTokens =
    activity && typeof activity.total_tokens_used === "number"
      ? activity.total_tokens_used
      : 0;

  return (
    <PageLayout
      title="仪表板"
      description="激活 Pluely 许可证以解锁更快的响应、更快捷的支持和高级功能。"
      rightSlot={!hasActiveLicense ? <GetLicense /> : null}
    >
      {/* Pluely API Setup */}
      <PluelyApiSetup />

      <Usage
        loading={loadingActivity}
        onRefresh={fetchActivity}
        data={activityData}
        totalTokens={totalTokens}
      />
    </PageLayout>
  );
};

export default Dashboard;
