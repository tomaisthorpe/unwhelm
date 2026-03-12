import { User as UserIcon } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";
import { AccountSettingsForm } from "@/components/account-settings-form";
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
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your profile information
                </p>
              </div>
            </div>
            <Link href="/tasks">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

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
