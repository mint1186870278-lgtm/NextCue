import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

/**
 * 邮件登录页：从弹窗选择「用邮件登录」后跳转至此，显示 Clerk 登录表单
 * 登录完成后跳转 /auth-redirect → 问卷或主页面
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7FAF8] px-4 py-8">
      <div className="mb-6">
        <Link href="/try" className="text-sm text-[#4A5E4A] hover:text-[#1A2E1A] hover:underline">
          ← 返回首页
        </Link>
      </div>
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/auth-redirect"
        fallbackRedirectUrl="/auth-redirect"
      />
    </div>
  );
}
