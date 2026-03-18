"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sign Out</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to sign out?
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Confirm Sign Out</CardTitle>
            <CardDescription>
              You&apos;ll need to sign in again to access your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
