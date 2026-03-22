import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignInForm from "./signin-form";

export default async function SignIn() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/tasks");

  // Check server-side environment variable at runtime
  const showDemoUser = process.env.ENABLE_DEMO_USER === "true";

  return (
    <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to manage your tasks
          </p>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Loading...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          }
        >
          <SignInForm showDemoUser={showDemoUser} />
        </Suspense>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
    </div>
  );
}
