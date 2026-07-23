"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const TEST_ACCOUNTS = [
  { clerkId: "user_test_2months", email: "alex@test.com", name: "Alex Chen", duration: "2个月", tasks: 20, conversations: 15 },
  { clerkId: "user_test_7months", email: "jordan@test.com", name: "Jordan Smith", duration: "7个月", tasks: 100, conversations: 50 },
  { clerkId: "user_test_1year", email: "sam@test.com", name: "Sam Wilson", duration: "1年", tasks: 200, conversations: 120 },
];

export default function SignInPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !setActive || !email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/auth-redirect");
        return;
      }
      if (result.status === "needs_second_factor") {
        setError("需要二次验证，请使用邮箱验证码或改用其他登录方式");
        return;
      }
      setError("登录未完成，请重试");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errors" in err
        ? (err as { errors: Array<{ message?: string }> }).errors?.[0]?.message
        : "邮箱或密码错误，请检查后重试";
      setError(msg || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7FAF8] px-4 py-8">
      <div className="mb-6 w-full max-w-[320px]">
        <Link
          href="/try"
          className="text-sm text-[#4A5E4A] hover:text-[#1A2E1A] hover:underline"
        >
          ← 返回首页
        </Link>
      </div>
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-lg font-bold text-[#1A2E1A]">账户密码登录</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4A5E4A]">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full rounded-xl border border-[#1A2E1A]/10 bg-white px-4 py-3 text-[#1A2E1A] outline-none focus:border-[#5DB896]"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4A5E4A]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full rounded-xl border border-[#1A2E1A]/10 bg-white px-4 py-3 text-[#1A2E1A] outline-none focus:border-[#5DB896]"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#5DB896] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-[#4A5E4A] hover:text-[#1A2E1A]">
            测试账户信息
          </summary>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#1A2E1A]/10 bg-[#F7FAF8] p-3">
            <table className="w-full min-w-[320px] text-xs">
              <thead>
                <tr className="border-b border-[#1A2E1A]/10">
                  <th className="py-2 text-left font-medium text-[#4A5E4A]">Clerk ID</th>
                  <th className="py-2 text-left font-medium text-[#4A5E4A]">邮箱</th>
                  <th className="py-2 text-left font-medium text-[#4A5E4A]">姓名</th>
                  <th className="py-2 text-left font-medium text-[#4A5E4A]">使用时长</th>
                </tr>
              </thead>
              <tbody>
                {TEST_ACCOUNTS.map((acc) => (
                  <tr key={acc.email} className="border-b border-[#1A2E1A]/5 last:border-0">
                    <td className="py-2 text-[#8A9A8A] font-mono text-[10px]">{acc.clerkId}</td>
                    <td className="py-2 text-[#1A2E1A]">{acc.email}</td>
                    <td className="py-2 text-[#4A5E4A]">{acc.name}</td>
                    <td className="py-2 text-[#4A5E4A]">{acc.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[#8A9A8A]">密码请向团队获取</p>
          </div>
        </details>
      </div>
    </div>
  );
}
