"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

/**
 * 问卷页 /onboarding 不包裹 ClerkProvider，避免 Clerk 注入的 DOM 阻挡点击。
 * 其他页面正常使用 ClerkProvider。
 */
export default function ClerkLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding";

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      allowedRedirectOrigins={[
        "https://focuspal-ten.vercel.app",
        "https://focuspal.vercel.app",
        "http://localhost:3000",
      ]}
      afterSignInUrl="/auth-redirect"
      afterSignUpUrl="/auth-redirect"
      appearance={{
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
          termsPageUrl: "https://clerk.com/terms",
        },
        variables: {
          colorPrimary: "#5DB896",
          colorText: "#1A2E1A",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
