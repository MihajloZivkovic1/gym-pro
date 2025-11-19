// app/auth/callback/page.tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Redirect based on role
    switch (session.user.role) {
      case "ADMIN":
        router.push("/admin");
        break;
      case "STAFF":
        router.push("/staff/dashboard");
        break;
      case "MEMBER":
        router.push(`/member/${session.user.id}`);
        break;
      default:
        router.push("/auth/login");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}