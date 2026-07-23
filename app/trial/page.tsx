"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 7天试用页暂时隐藏，直接跳转到 Dashboard
export default function TrialPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center bg-[#F7FAF8]">
      <p className="text-[#4A5E4A]">跳转中...</p>
    </div>
  );
}
