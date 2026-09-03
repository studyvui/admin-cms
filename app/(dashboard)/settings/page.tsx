"use client";

// CHỈ orchestration — gọi useSettings(), render Tabs + 2 panel qua props. KHÔNG logic nghiệp vụ.

import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "./use-settings";
import { AccountPanel } from "./account-panel";
import { SystemPanel } from "./system-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { hasRole, hydrated } = useAuth();
  const {
    settings,
    isLoadingSettings,
    settingsError,
    profile,
    isLoadingProfile,
    updateSettingMut,
    updateMeMut,
    changePasswordMut,
    logoutAllMut,
  } = useSettings();

  if (!hydrated) return null;
  if (!hasRole("admin")) {
    return (
      <div className="text-center text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản cá nhân và cấu hình hệ thống
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Tài khoản của tôi</TabsTrigger>
          <TabsTrigger value="system">Cấu hình hệ thống</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountPanel
            profile={profile}
            isLoadingProfile={isLoadingProfile}
            updateMeMut={updateMeMut}
            changePasswordMut={changePasswordMut}
            logoutAllMut={logoutAllMut}
          />
        </TabsContent>
        <TabsContent value="system">
          <SystemPanel
            settings={settings}
            isLoadingSettings={isLoadingSettings}
            settingsError={settingsError}
            updateSettingMut={updateSettingMut}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
