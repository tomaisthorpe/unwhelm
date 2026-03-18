import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default async function KioskLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white shadow-sm px-3 py-2 flex items-center">
        <Link href="/kiosk" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/unwhelm.svg" alt="unwhelm" width={20} height={20} />
          <span className="text-sm font-semibold font-brand text-gray-900">unwhelm</span>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
