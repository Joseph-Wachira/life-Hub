import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { getNotificationPreference, getUserProfile, getUserSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { WorkspacesPanel } from "@/components/settings/workspaces-panel";
import { AccountPanel } from "@/components/settings/account-panel";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { userId, workspaces } = await requireWorkspace();

  const [profile, settings, notificationPref] = await Promise.all([
    getUserProfile(userId),
    getUserSettings(userId),
    getNotificationPreference(userId),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" description="Manage your profile, preferences, and workspaces." />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="profile">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileForm profile={profile} />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesForm settings={settings} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsForm preference={notificationPref} />
          </TabsContent>
          <TabsContent value="workspaces">
            <WorkspacesPanel workspaces={workspaces} />
          </TabsContent>
          <TabsContent value="account">
            <AccountPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
