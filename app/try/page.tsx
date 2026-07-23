"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Apple, X } from "lucide-react";

export default function TryPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();

  const handleOAuth = (strategy: "oauth_apple" | "oauth_google") => {
    if (!isSignInLoaded || !signIn || isSignedIn) return;
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/auth-redirect",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7FAF8] font-sans text-[#1A2E1A]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#D2EDDA] via-[#E6F4EA] to-[#F7FAF8]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center py-6 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex w-full max-w-[min(400px,100%)] flex-col items-center gap-8 mx-auto">
          {/* Phone Mockup */}
          <div className="relative flex items-center justify-center w-full shrink-0">
            <div className="relative w-[min(180px,42vw)] aspect-[71.6/147.6] shrink-0">
              <div className="absolute inset-0 rounded-[32px] border-[8px] border-[#1a1a1a] bg-transparent shadow-2xl ring-1 ring-white/10 z-20 pointer-events-none" />
              <div className="absolute inset-[8px] rounded-[24px] overflow-hidden bg-white z-10">
                <div className="relative w-full h-full bg-black">
                  <img src="/demo.png" alt="App" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white rounded-full z-50 mix-blend-difference" />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[320px] flex flex-col items-center gap-6 z-20">
            <h1 className="text-center text-3xl font-bold leading-tight tracking-tight text-[#1A2E1A] drop-shadow-sm">
              一站式规划<br />与效率提升工具
            </h1>

            <Link
              href="/onboarding"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5DB896] py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              开始尝试
            </Link>
            <button
              onClick={() => setShowLoginModal(true)}
              className="relative z-30 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-bold text-[#1A2E1A] border border-[#1A2E1A]/20 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            >
              登录
            </button>
          </div>
        </div>
      </div>

      {/* 登录弹窗：点击登录后立即弹出 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:bg-transparent"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1A2E1A]">选择登录方式</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="rounded-full p-1 text-[#4A5E4A] hover:bg-[#F0F0F0]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {isLoaded && isSignedIn ? (
                <Link
                  href="/auth-redirect"
                  className="flex w-full items-center justify-center rounded-full bg-[#5DB896] py-3.5 text-sm font-bold text-white"
                  onClick={() => setShowLoginModal(false)}
                >
                  已登录，进入应用
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => handleOAuth("oauth_apple")}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1A2E1A] py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Apple size={18} />
                    通过 Apple 继续
                  </button>
                  <button
                    onClick={() => handleOAuth("oauth_google")}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-bold text-[#1A2E1A] border border-[#1A2E1A]/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    使用 Google 帐号继续
                  </button>
                  <Link
                    href="/sign-in"
                    className="flex w-full items-center justify-center rounded-full bg-white py-3.5 text-sm font-bold text-[#1A2E1A] border border-[#1A2E1A]/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setShowLoginModal(false)}
                  >
                    用邮件登录
                  </Link>
                  <Link
                    href="/sign-in-password"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-bold text-[#1A2E1A] border border-[#1A2E1A]/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setShowLoginModal(false)}
                  >
                    账户密码登录
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
