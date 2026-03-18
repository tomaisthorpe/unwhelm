import { User as UserIcon } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { getUserUsageCounts, getUserApiKey } from "@/lib/data";
import { FEATURE_LIMITS } from "@/lib/feature-limits";

export const metadata: Metadata = {
  title: "unwhelm / Account Settings",
};

export default async function AccountSettingsPage() {
  // Get session for user data (guaranteed to exist due to layout auth check)
  const session = (await getServerSession(authOptions)) as Session;

  // Get user's current usage counts and API key
  const [usageCounts, apiKey] = await Promise.all([
    getUserUsageCounts(),
    getUserApiKey(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader
          icon={<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><UserIcon className="w-5 h-5 text-blue-600" /></div>}
          title="Account Settings"
          subtitle="Manage your profile information"
          backHref="/tasks"
        />

        {/* Account Settings Form */}
        <AccountSettingsForm
          user={session.user}
          usageCounts={usageCounts}
          limits={{
            maxTasks: FEATURE_LIMITS.MAX_TASKS,
            maxContexts: FEATURE_LIMITS.MAX_CONTEXTS,
          }}
          apiKey={apiKey}
        />
    </div>
  );
}
