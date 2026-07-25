"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateUserNameAction,
  changePasswordAction,
  generateApiKeyAction,
  revokeApiKeyAction,
  updateTaskReminderPreferencesAction,
  sendTestTaskReminderAction,
} from "@/lib/server-actions";
import { Eye, EyeOff, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { SectionPanel } from "@/components/ui/section-panel";

interface AccountSettingsFormProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  usageCounts: {
    tasksCount: number;
    contextsCount: number;
  };
  limits: {
    maxTasks: number;
    maxContexts: number;
  };
  apiKey: string | null;
  taskReminderPreferences: {
    enabled: boolean;
    pushoverUserKey: string;
    timeZone: string;
    hour: number;
  };
}

export function AccountSettingsForm({
  user,
  usageCounts,
  limits,
  apiKey: initialApiKey,
  taskReminderPreferences,
}: AccountSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // API key state
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(initialApiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isApiKeyPending, startApiKeyTransition] = useTransition();
  const [apiKeyMessage, setApiKeyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(taskReminderPreferences.enabled);
  const [pushoverUserKey, setPushoverUserKey] = useState(taskReminderPreferences.pushoverUserKey);
  const [reminderTimeZone, setReminderTimeZone] = useState(taskReminderPreferences.timeZone);
  const [reminderHour, setReminderHour] = useState(taskReminderPreferences.hour);
  const [isReminderPending, startReminderTransition] = useTransition();
  const [isReminderTestPending, startReminderTestTransition] = useTransition();
  const [reminderMessage, setReminderMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReminderSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setReminderMessage(null);
    startReminderTransition(async () => {
      try {
        await updateTaskReminderPreferencesAction({
          enabled: reminderEnabled,
          pushoverUserKey,
          timeZone: reminderTimeZone,
          hour: reminderHour,
        });
        setReminderMessage({ type: "success", text: "Reminder settings saved" });
      } catch (error) {
        setReminderMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to save reminder settings",
        });
      }
    });
  };

  const handleReminderTest = () => {
    setReminderMessage(null);
    startReminderTestTransition(async () => {
      try {
        await sendTestTaskReminderAction(pushoverUserKey);
        setReminderMessage({
          type: "success",
          text: "Test notification sent",
        });
      } catch (error) {
        setReminderMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to send test notification",
        });
      }
    });
  };

  const handleGenerateApiKey = () => {
    setApiKeyMessage(null);
    startApiKeyTransition(async () => {
      try {
        const newKey = await generateApiKeyAction();
        setCurrentApiKey(newKey);
        setIsApiKeyVisible(true);
        setApiKeyMessage({ type: "success", text: currentApiKey ? "API key regenerated" : "API key generated" });
      } catch {
        setApiKeyMessage({ type: "error", text: "Failed to generate API key" });
      }
    });
  };

  const handleRevokeApiKey = () => {
    setApiKeyMessage(null);
    startApiKeyTransition(async () => {
      try {
        await revokeApiKeyAction();
        setCurrentApiKey(null);
        setIsApiKeyVisible(false);
        setApiKeyMessage({ type: "success", text: "API key revoked" });
      } catch {
        setApiKeyMessage({ type: "error", text: "Failed to revoke API key" });
      }
    });
  };

  const handleCopyApiKey = async () => {
    if (!currentApiKey) return;
    await navigator.clipboard.writeText(currentApiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const maskedKey = currentApiKey
    ? "•".repeat(currentApiKey.length - 8) + currentApiKey.slice(-8)
    : null;

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const trimmedName = name.trim();
        await updateUserNameAction(trimmedName);
        // Update local state to match server's trimmed value
        setName(trimmedName);
        // Refresh the page to get updated session data
        router.refresh();
        setMessage({
          type: "success",
          text: "Name updated successfully",
        });
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to update name",
        });
      }
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    startPasswordTransition(async () => {
      try {
        await changePasswordAction(currentPassword, newPassword);
        // Clear form on success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully",
        });
      } catch (error) {
        setPasswordMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to change password",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Section */}
      <SectionPanel title="Profile Information">
        {/* Email (read-only) */}
        <div className="mb-4">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user.email || ""}
            disabled
            className="mt-1 bg-gray-50 dark:bg-gray-800"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email cannot be changed
          </p>
        </div>

        {/* Name (editable) */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
              disabled={isPending}
            />
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || name.trim() === user.name || name.trim().length === 0}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </SectionPanel>

      <SectionPanel
        title="Task Reminders"
        description="Receive a daily Pushover notification when you have tasks due today or overdue."
      >
        <form onSubmit={handleReminderSubmit} className="space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(event) => setReminderEnabled(event.target.checked)}
              disabled={isReminderPending}
              className="h-4 w-4"
            />
            Enable daily task reminders
          </label>

          <div>
            <Label htmlFor="pushoverUserKey">Pushover user key</Label>
            <Input
              id="pushoverUserKey"
              type="password"
              value={pushoverUserKey}
              onChange={(event) => setPushoverUserKey(event.target.value)}
              placeholder="Your Pushover user key"
              className="mt-1 font-mono"
              disabled={isReminderPending}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Find this key on your Pushover dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="reminderTimeZone">Timezone</Label>
              <Input
                id="reminderTimeZone"
                value={reminderTimeZone}
                onChange={(event) => setReminderTimeZone(event.target.value)}
                placeholder="Europe/London"
                className="mt-1"
                disabled={isReminderPending}
              />
            </div>
            <div>
              <Label htmlFor="reminderHour">Hour of day</Label>
              <Input
                id="reminderHour"
                type="number"
                min={0}
                max={23}
                value={reminderHour}
                onChange={(event) => setReminderHour(Number(event.target.value))}
                className="mt-1"
                disabled={isReminderPending}
              />
            </div>
          </div>

          {reminderMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                reminderMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}
            >
              {reminderMessage.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={isReminderPending || isReminderTestPending}
            >
              {isReminderPending ? "Saving..." : "Save Reminder Settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReminderTest}
              disabled={
                isReminderPending ||
                isReminderTestPending ||
                !pushoverUserKey.trim()
              }
            >
              {isReminderTestPending ? "Sending..." : "Send Test Notification"}
            </Button>
          </div>
        </form>
      </SectionPanel>

      {/* Usage & Limits Section */}
      <SectionPanel title="Usage & Limits">

        <div className="space-y-4">
          {/* Tasks Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">Tasks</Label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {usageCounts.tasksCount.toLocaleString()} {limits.maxTasks === Infinity ? "" : `/ ${limits.maxTasks.toLocaleString()}`}
              </span>
            </div>
            {limits.maxTasks !== Infinity && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (usageCounts.tasksCount / limits.maxTasks) >= 0.9
                      ? "bg-red-500"
                      : (usageCounts.tasksCount / limits.maxTasks) >= 0.7
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min((usageCounts.tasksCount / limits.maxTasks) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
            {limits.maxTasks === Infinity && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlimited</p>
            )}
          </div>

          {/* Contexts Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">Contexts</Label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {usageCounts.contextsCount.toLocaleString()} {limits.maxContexts === Infinity ? "" : `/ ${limits.maxContexts.toLocaleString()}`}
              </span>
            </div>
            {limits.maxContexts !== Infinity && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (usageCounts.contextsCount / limits.maxContexts) >= 0.9
                      ? "bg-red-500"
                      : (usageCounts.contextsCount / limits.maxContexts) >= 0.7
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min((usageCounts.contextsCount / limits.maxContexts) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
            {limits.maxContexts === Infinity && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlimited</p>
            )}
          </div>
        </div>
      </SectionPanel>

      {/* Security Section */}
      <SectionPanel title="Security">

        <form onSubmit={handlePasswordChange}>
          {/* Current Password */}
          <div className="mb-4">
            <Label
              htmlFor="currentPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1"
              disabled={isPasswordPending}
            />
          </div>

          {/* New Password */}
          <div className="mb-4">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1"
              disabled={isPasswordPending}
            />
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-medium">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>At least 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="mb-4">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
              disabled={isPasswordPending}
            />
          </div>

          {/* Password Success/Error Message */}
          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                passwordMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isPasswordPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {isPasswordPending ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </SectionPanel>

      {/* API Access Section */}
      <SectionPanel title="API Access" description="Use this key to access your tasks from external apps (e.g. an e-ink dashboard). Keep it secret — it provides read access to your task data.">

        {currentApiKey ? (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">API Key</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  readOnly
                  value={isApiKeyVisible ? currentApiKey : (maskedKey ?? "")}
                  className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsApiKeyVisible((v) => !v)}
                  title={isApiKeyVisible ? "Hide key" : "Show key"}
                >
                  {isApiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKey}
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use as: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Authorization: Bearer &lt;key&gt;</code>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateApiKey}
                disabled={isApiKeyPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isApiKeyPending ? "Regenerating..." : "Regenerate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRevokeApiKey}
                disabled={isApiKeyPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Revoke
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleGenerateApiKey}
            disabled={isApiKeyPending}
          >
            {isApiKeyPending ? "Generating..." : "Generate API Key"}
          </Button>
        )}

        {apiKeyMessage && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${
              apiKeyMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {apiKeyMessage.text}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
