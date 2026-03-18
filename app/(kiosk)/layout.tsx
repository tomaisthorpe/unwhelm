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
    <div className="dark min-h-screen bg-gray-950 flex flex-col overflow-hidden">
      <div className="bg-gray-900 shadow-sm px-4 py-4 flex items-center">
        <Link href="/kiosk" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/unwhelm.svg" alt="unwhelm" width={32} height={32} />
          <span className="text-2xl font-bold font-brand text-gray-100">unwhelm</span>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
