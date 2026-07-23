"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Post-login redirect: first-time users -> onboarding, returning users -> dashboard
 */
export default function AuthRedirectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/try");
      return;
    }

    const completed =
      typeof window !== "undefined" &&
      (localStorage.getItem(`onboarding_${user.id}`) === "true" ||
        localStorage.getItem("onboarding_completed") === "true");
    if (completed) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [user, isLoaded, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAF8]">
      <div className="text-[#4A5E4A]">加载中...</div>
    </div>
  );
}
